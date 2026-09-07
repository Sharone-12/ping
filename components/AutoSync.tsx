"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SyncProgress } from "@/components/SyncProgress";
import { useEmailSync } from "@/lib/use-email-sync";

/**
 * Reads the inbox automatically when the feed loads, at most once per throttle
 * window. The window is enforced by the API; `due` only avoids a pointless
 * round trip. Renders nothing until a sync actually starts.
 */
export function AutoSync({ due }: { due: boolean }) {
  const { state, run, reset } = useEmailSync();
  const [dismissed, setDismissed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!due || started.current) return;
    started.current = true;
    void run(false);
  }, [due, run]);

  // Quiet by default: a throttled run, or a completed run that found nothing,
  // shows no UI at all. Only new events or a real error are worth interrupting
  // someone for.
  const foundNothing = state.phase === "done" && state.titles.length === 0;
  if (state.phase === "skipped" || foundNothing || dismissed) return null;

  return (
    <AnimatePresence>
      <SyncProgress
        state={state}
        floating
        onDismiss={() => {
          setDismissed(true);
          reset();
        }}
      />
    </AnimatePresence>
  );
}
