import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncUserInbox } from "@/lib/email-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Scheduled inbox sync for every connected account, so the feed is already
 * current when anyone arrives. Events are campus-wide, so one account syncing
 * keeps the feed fresh for the whole college.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without that secret
 * set this endpoint refuses to run at all rather than sitting open.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: users, error } = await admin
    .from("users")
    .select("id, email")
    .not("gmail_refresh_token", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: {
    user: string;
    found?: number;
    scanned?: number;
    throttled?: boolean;
    error?: string;
  }[] = [];

  // Sequential on purpose: each user's sync is already internally concurrent,
  // and running several at once would trip Groq's rate limit.
  for (const u of users ?? []) {
    const outcome = await syncUserInbox({
      userId: u.id as string,
      db: admin,
      admin,
      force: false,
    });

    results.push({
      user: (u.email as string) ?? (u.id as string),
      ...(outcome.throttled
        ? { throttled: true }
        : outcome.error
          ? { error: outcome.error }
          : { found: outcome.found, scanned: outcome.scanned }),
    });
  }

  return NextResponse.json({
    ran_at: new Date().toISOString(),
    accounts: results.length,
    total_events_found: results.reduce((n, r) => n + (r.found ?? 0), 0),
    results,
  });
}
