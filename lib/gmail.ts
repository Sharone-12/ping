/** Minimal Gmail REST client — no googleapis dependency needed for read-only. */

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";

export class GmailError extends Error {
  constructor(
    message: string,
    readonly needsReconnect = false,
  ) {
    super(message);
  }
}

interface GmailPart {
  mimeType?: string;
  filename?: string;
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
}

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

/**
 * Exchange the stored refresh token for a fresh access token. Google issues
 * access tokens valid ~1 hour and Supabase does not refresh provider tokens,
 * so this is the only way a sync works after the sign-in session is gone.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new GmailError(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set on the server.",
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    // invalid_grant means the token was revoked or expired — while the app is
    // in Testing status Google expires refresh tokens after 7 days.
    const needsReconnect = body.includes("invalid_grant");
    throw new GmailError(
      needsReconnect
        ? "Gmail authorisation expired. Reconnect Gmail on your profile."
        : `Token refresh failed: ${body.slice(0, 160)}`,
      needsReconnect,
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

/** Gmail search restricted to plausible event mail from the last 60 days. */
export const EVENT_QUERY = [
  "newer_than:60d",
  "-in:chats",
  "(from:licet.ac.in OR",
  "subject:(hackathon OR workshop OR seminar OR symposium OR fest OR",
  "competition OR contest OR webinar OR registration OR event OR lecture))",
].join(" ");

/**
 * All matching message ids, following Gmail's pagination. The previous 60-item
 * cap silently ignored most of a real inbox — a query that matches 181 messages
 * must not stop at a third of them.
 */
export async function listMessageIds(
  accessToken: string,
  max = 400,
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: EVENT_QUERY,
      maxResults: String(Math.min(500, max - ids.length)),
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${GMAIL}/messages?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401 || res.status === 403) {
      throw new GmailError(
        "Gmail access was refused. Reconnect Gmail on your profile.",
        true,
      );
    }
    if (!res.ok) throw new GmailError(`Gmail list failed: ${res.status}`);

    const data = (await res.json()) as {
      messages?: { id: string }[];
      nextPageToken?: string;
    };
    ids.push(...(data.messages ?? []).map((m) => m.id));
    pageToken = data.nextPageToken;
  } while (pageToken && ids.length < max);

  return ids.slice(0, max);
}

export async function getMessage(
  accessToken: string,
  id: string,
): Promise<GmailMessage | null> {
  const res = await fetch(`${GMAIL}/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    payload?: GmailPart & { headers?: { name: string; value: string }[] };
  };
  const payload = data.payload;
  if (!payload) return null;

  const header = (name: string) =>
    payload.headers?.find((h) => h.name.toLowerCase() === name)?.value ?? "";

  return {
    id,
    subject: header("subject"),
    from: header("from"),
    date: header("date"),
    body: extractBody(payload).slice(0, 6000),
  };
}

/** Prefer text/plain; fall back to stripped HTML. Skips attachments. */
function extractBody(part: GmailPart): string {
  if (part.filename) return "";

  if (part.mimeType === "text/plain" && part.body?.data) {
    return decode(part.body.data);
  }

  if (part.parts?.length) {
    const plain = part.parts
      .map((p) => (p.mimeType === "text/plain" ? extractBody(p) : ""))
      .filter(Boolean)
      .join("\n");
    if (plain.trim()) return plain;

    return part.parts.map(extractBody).filter(Boolean).join("\n");
  }

  if (part.mimeType === "text/html" && part.body?.data) {
    return stripHtml(decode(part.body.data));
  }

  return "";
}

function decode(b64url: string): string {
  try {
    return Buffer.from(
      b64url.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
  } catch {
    return "";
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
