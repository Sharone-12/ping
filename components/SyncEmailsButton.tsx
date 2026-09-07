"use client";

import { motion } from "framer-motion";
import { RefreshIcon } from "@/components/Icons";
import { SyncProgress } from "@/components/SyncProgress";
import { useEmailSync } from "@/lib/use-email-sync";

export function SyncEmailsButton({ connected }: { connected: boolean }) {
  const { state, run } = useEmailSync();
  const running = state.phase === "running";

  return (
    <div className="w-full">
      <motion.button
        type="button"
        onClick={() => run(true)}
        disabled={!connected || running}
        whileTap={{ scale: 0.99 }}
        title={connected ? undefined : "Connect Gmail first"}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        <RefreshIcon size={15} />
        {running ? "Syncing…" : "Sync Emails Now"}
      </motion.button>

      {state.phase !== "idle" ? (
        <div className="mt-3">
          <SyncProgress state={state} />
        </div>
      ) : null}
    </div>
  );
}
