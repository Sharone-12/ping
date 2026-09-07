"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PillOption {
  value: string;
  label: string;
}

export function FilterPills({
  options,
  active,
  onChange,
  className,
}: {
  options: PillOption[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter events"
      className={cn(
        "no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0",
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === active;
        return (
          <motion.button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold",
              "transition-colors focus-visible:outline focus-visible:outline-2",
              "focus-visible:outline-offset-2 focus-visible:outline-ink",
              isActive
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink-soft hover:border-ink-muted hover:text-ink",
            )}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}
