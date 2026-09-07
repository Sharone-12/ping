"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toggleSaveEvent } from "@/app/actions/events";
import { cn } from "@/lib/utils";

export function SaveButton({
  eventId,
  initialSaved,
  size = "sm",
}: {
  eventId: string;
  initialSaved: boolean;
  size?: "sm" | "lg";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    // Cards wrap this button in a link.
    e.preventDefault();
    e.stopPropagation();

    const optimistic = !saved;
    setSaved(optimistic);
    setError(null);

    startTransition(async () => {
      const result = await toggleSaveEvent(eventId, saved);
      setSaved(result.saved);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={pending}
        whileTap={{ scale: 0.9 }}
        aria-pressed={saved}
        aria-label={saved ? "Remove bookmark" : "Save event"}
        title={error ?? (saved ? "Saved" : "Save event")}
        className={cn(
          "grid place-items-center rounded-full border transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          size === "lg" ? "h-11 w-11" : "h-9 w-9",
          saved
            ? "border-ink bg-ink text-white"
            : "border-line bg-white text-ink-muted hover:border-ink-muted hover:text-ink",
        )}
      >
        <svg
          width={size === "lg" ? 20 : 17}
          height={size === "lg" ? 20 : 17}
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4.5L5 20V5a1 1 0 0 1 1-1z" />
        </svg>
      </motion.button>
      {error ? (
        <p className="absolute right-0 top-full z-10 mt-1 w-52 rounded-soft bg-alert px-2.5 py-1.5 text-[11px] font-medium leading-snug text-alert-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
