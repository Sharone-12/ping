"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type SyncPhase = "idle" | "running" | "done" | "skipped" | "error";

export interface SyncState {
  phase: SyncPhase;
  status: string;
  done: number;
  total: number;
  found: number;
  titles: string[];
  error: string | null;
}

const INITIAL: SyncState = {
  phase: "idle",
  status: "",
  done: 0,
  total: 0,
  found: 0,
  titles: [],
  error: null,
};

/**
 * Consumes the /api/emails/sync event stream. Shared by the manual button and
 * the automatic login sync so both render identical progress.
 */
export function useEmailSync() {
  const router = useRouter();
  const [state, setState] = useState<SyncState>(INITIAL);
  const running = useRef(false);

  const run = useCallback(
    async (force: boolean) => {
      // React re-runs effects in dev StrictMode; the server throttle is the
      // real guard, but this keeps the UI from flashing twice.
      if (running.current) return;
      running.current = true;
      setState({ ...INITIAL, phase: "running", status: "Starting…" });

      let res: Response;
      try {
        res = await fetch("/api/emails/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force }),
        });
      } catch {
        running.current = false;
        setState((s) => ({
          ...s,
          phase: "error",
          error: "Could not reach the server.",
        }));
        return;
      }

      if (!res.ok || !res.body) {
        running.current = false;
        setState((s) => ({
          ...s,
          phase: "error",
          error: res.status === 401 ? "Your session expired." : "Sync failed.",
        }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          let msg: Record<string, unknown>;
          try {
            msg = JSON.parse(chunk.slice(6));
          } catch {
            continue;
          }

          setState((s) => {
            switch (msg.type) {
              case "status":
                return { ...s, status: String(msg.message) };
              case "progress":
                return {
                  ...s,
                  done: Number(msg.done),
                  total: Number(msg.total),
                  found: Number(msg.found),
                  status: `Reading email ${msg.done} of ${msg.total}…`,
                };
              case "event":
                return {
                  ...s,
                  titles: [...s.titles, String(msg.title)].slice(-4),
                };
              case "skipped":
                return { ...s, phase: "skipped", status: String(msg.message) };
              case "done":
                return {
                  ...s,
                  phase: "done",
                  status:
                    Number(msg.found) > 0
                      ? `Found ${msg.found} event${msg.found === 1 ? "" : "s"} from ${msg.scanned} new email${msg.scanned === 1 ? "" : "s"}.`
                      : `No new events in ${msg.scanned} email${msg.scanned === 1 ? "" : "s"}.`,
                };
              case "error":
                return { ...s, phase: "error", error: String(msg.message) };
              default:
                return s;
            }
          });

          if (msg.type === "done" && Number(msg.found) > 0) router.refresh();
        }
      }

      running.current = false;
    },
    [router],
  );

  return { state, run, reset: () => setState(INITIAL) };
}
