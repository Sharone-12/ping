import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncUserInbox, THROTTLE_MS } from "@/lib/email-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Progress =
  | { type: "status"; message: string }
  | { type: "progress"; done: number; total: number; found: number }
  | { type: "event"; title: string }
  | { type: "done"; found: number; scanned: number; skipped: number }
  | { type: "skipped"; message: string }
  | { type: "error"; message: string; needsReconnect?: boolean };

export async function POST(request: Request) {
  // The throttle is enforced server-side so a stray re-render or a second tab
  // cannot trigger a duplicate inbox read.
  let force = false;
  try {
    const body = (await request.json()) as { force?: boolean };
    force = body?.force === true;
  } catch {
    /* no body — treat as an automatic run */
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (p: Progress) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(p)}\n\n`));

      try {
        const outcome = await syncUserInbox({
          userId: user.id,
          db: supabase,
          admin: createAdminClient(),
          force,
          handlers: {
            onStatus: (message) => send({ type: "status", message }),
            onProgress: (done, total, found) =>
              send({ type: "progress", done, total, found }),
            onEvent: (title) => send({ type: "event", title }),
          },
        });

        if (outcome.throttled) {
          send({
            type: "skipped",
            message: `Inbox already read recently. Next auto-sync in ${Math.max(
              1,
              Math.round(THROTTLE_MS / 60000),
            )} min.`,
          });
        } else if (outcome.error) {
          send({
            type: "error",
            message: outcome.error,
            needsReconnect: outcome.needsReconnect,
          });
        } else {
          send({
            type: "done",
            found: outcome.found,
            scanned: outcome.scanned,
            skipped: outcome.skipped,
          });
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Sync failed.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
