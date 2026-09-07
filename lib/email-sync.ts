import type { SupabaseClient } from "@supabase/supabase-js";
import {
  GmailError,
  getMessage,
  listMessageIds,
  refreshAccessToken,
} from "@/lib/gmail";
import { looksLikeEvent, parseEmail, toEventRow } from "@/lib/email-parser";

/** Auto-sync re-reads an inbox at most this often. */
export const THROTTLE_MS = 30 * 60 * 1000;

const CONCURRENCY = 4;

export interface SyncHandlers {
  onStatus?: (message: string) => void;
  onProgress?: (done: number, total: number, found: number) => void;
  onEvent?: (title: string) => void;
}

export interface SyncOutcome {
  found: number;
  scanned: number;
  skipped: number;
  throttled?: boolean;
  error?: string;
  needsReconnect?: boolean;
}

const EMPTY: SyncOutcome = { found: 0, scanned: 0, skipped: 0 };

/**
 * Reads one user's inbox and writes any events it finds.
 *
 * `db` is scoped to the user (RLS applies) for the interactive path, or the
 * service client for cron. `admin` always bypasses RLS because events are
 * campus-wide and deliberately not user-writable.
 */
export async function syncUserInbox({
  userId,
  db,
  admin,
  force,
  handlers = {},
}: {
  userId: string;
  db: SupabaseClient;
  admin: SupabaseClient;
  force: boolean;
  handlers?: SyncHandlers;
}): Promise<SyncOutcome> {
  const { onStatus, onProgress, onEvent } = handlers;

  const { data: profile } = await db
    .from("users")
    .select(
      "gmail_refresh_token, gmail_access_token, gmail_token_expires_at, last_synced_at",
    )
    .eq("id", userId)
    .single();

  if (!profile?.gmail_refresh_token) {
    return {
      ...EMPTY,
      error: "Gmail is not connected yet.",
      needsReconnect: true,
    };
  }

  if (!force && profile.last_synced_at) {
    const age = Date.now() - new Date(profile.last_synced_at).getTime();
    if (age < THROTTLE_MS) return { ...EMPTY, throttled: true };
  }

  onStatus?.("Authorising with Gmail…");

  let accessToken: string;
  try {
    const stored = profile.gmail_access_token;
    const expiresAt = profile.gmail_token_expires_at;
    const stillValid =
      stored &&
      expiresAt &&
      new Date(expiresAt).getTime() > Date.now() + 60_000;

    if (stillValid) {
      accessToken = stored;
    } else {
      const refreshed = await refreshAccessToken(profile.gmail_refresh_token);
      accessToken = refreshed.accessToken;
      await db
        .from("users")
        .update({
          gmail_access_token: refreshed.accessToken,
          gmail_token_expires_at: refreshed.expiresAt,
        })
        .eq("id", userId);
    }
  } catch (err) {
    return {
      ...EMPTY,
      error: err instanceof Error ? err.message : "Could not authorise Gmail.",
      needsReconnect: err instanceof GmailError ? err.needsReconnect : false,
    };
  }

  let ids: string[];
  try {
    onStatus?.("Searching your inbox…");
    ids = await listMessageIds(accessToken);
  } catch (err) {
    return {
      ...EMPTY,
      error: err instanceof Error ? err.message : "Could not search Gmail.",
      needsReconnect: err instanceof GmailError ? err.needsReconnect : false,
    };
  }

  const { data: seen } = await db
    .from("processed_emails")
    .select("gmail_message_id")
    .eq("user_id", userId);
  const seenIds = new Set(
    (seen ?? []).map((r) => r.gmail_message_id as string),
  );

  const fresh = ids.filter((id) => !seenIds.has(id));
  const skipped = ids.length - fresh.length;

  onStatus?.(`${ids.length} matching emails · ${fresh.length} new to read`);

  let done = 0;
  let found = 0;

  for (let i = 0; i < fresh.length; i += CONCURRENCY) {
    const batch = fresh.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (id) => {
        let isEvent = false;
        let eventId: string | null = null;

        try {
          const message = await getMessage(accessToken, id);

          if (message && looksLikeEvent(message)) {
            const parsed = await parseEmail(message);

            if (parsed.is_event) {
              const row = toEventRow(parsed, id);
              if (row) {
                const { data: inserted } = await admin
                  .from("events")
                  .upsert(row, { onConflict: "dedup_key" })
                  .select("id")
                  .single();

                isEvent = true;
                eventId = (inserted?.id as string) ?? null;
                found += 1;
                onEvent?.(row.title);
              }
            }
          }
        } catch {
          // One bad email must never abort the whole sync.
        }

        await db.from("processed_emails").upsert(
          {
            user_id: userId,
            gmail_message_id: id,
            is_event: isEvent,
            event_id: eventId,
          },
          { onConflict: "user_id,gmail_message_id" },
        );

        done += 1;
        onProgress?.(done, fresh.length, found);
      }),
    );
  }

  await db
    .from("users")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", userId);

  return { found, scanned: fresh.length, skipped };
}
