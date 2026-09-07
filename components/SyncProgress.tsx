"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SyncState } from "@/lib/use-email-sync";

/** Shared progress readout for both the manual and automatic sync. */
export function SyncProgress({
  state,
  floating = false,
  onDismiss,
}: {
  state: SyncState;
  floating?: boolean;
  onDismiss?: () => void;
}) {
  if (state.phase === "idle") return null;

  const pct =
    state.total > 0 ? Math.round((state.done / state.total) * 100) : 0;
  const failed = state.phase === "error";

  const body = (
    <div
      className={
        "rounded-card border border-line bg-white p-4 " +
        (floating ? "w-[320px] shadow-lift" : "shadow-card")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13px] font-bold text-ink">
            {state.phase === "running" ? (
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-mint-ink" />
            ) : null}
            {failed ? "Sync failed" : "Reading your campus email"}
          </p>
          <p
            className={
              "mt-1 text-[12.5px] leading-snug " +
              (failed ? "text-alert-ink" : "text-ink-soft")
            }
          >
            {state.error ?? state.status}
          </p>
        </div>
        {onDismiss && state.phase !== "running" ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-full px-2 text-[15px] leading-none text-ink-muted transition-colors hover:text-ink"
          >
            ×
          </button>
        ) : null}
      </div>

      {state.phase === "running" && state.total > 0 ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-deep">
          <motion.div
            className="h-full rounded-full bg-ink"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      ) : null}

      {state.titles.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          <AnimatePresence initial={false}>
            {state.titles.map((t) => (
              <motion.li
                key={t}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 truncate text-[12px] text-ink-soft"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint-ink" />
                <span className="truncate">{t}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : null}
    </div>
  );

  if (!floating) return body;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-5 sm:bottom-6 sm:right-6 sm:left-auto sm:justify-end sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="pointer-events-auto"
      >
        {body}
      </motion.div>
    </div>
  );
}
