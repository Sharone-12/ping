"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The dominant element on the feed — bold outline, generous height, dark icon
 * chip. Renders as a button when `asButton` is set (feed → /search) and as a
 * real input otherwise.
 */
export function SearchBar({
  placeholder = 'Ask anything… "hackathons this month?"',
  asButton = false,
  onClick,
  value,
  onChange,
  onSubmit,
  autoFocus = false,
  className,
}: {
  placeholder?: string;
  asButton?: boolean;
  onClick?: () => void;
  value?: string;
  onChange?: (v: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const shell = cn(
    "flex w-full items-center gap-3 rounded-full border border-line bg-white",
    "py-2.5 pl-3 pr-2.5 sm:py-3 sm:pl-4 sm:pr-3",
    className,
  );

  const iconChip = (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper-deep text-ink sm:h-11 sm:w-11"
    >
      <SearchGlyph />
    </span>
  );

  if (asButton) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.995 }}
        transition={{ duration: 0.18 }}
        className={cn(
          shell,
          "text-left shadow-soft transition-shadow hover:shadow-lift",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        )}
      >
        {iconChip}
        <span className="truncate text-[15px] text-ink-soft sm:text-[17px]">
          {placeholder}
        </span>
      </motion.button>
    );
  }

  // Deliberately not a <form>: before React hydrates, pressing Enter in a form
  // triggers a native submit that reloads the page and throws the query away.
  return (
    <div className={cn(shell, "shadow-soft")}>
      {iconChip}
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted sm:text-[17px]"
      />
      {onSubmit ? (
        <button
          type="button"
          onClick={() => onSubmit()}
          aria-label="Search"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white transition-opacity hover:opacity-85 sm:h-11 sm:w-11"
        >
          <span aria-hidden="true" className="text-[17px] leading-none">
            →
          </span>
        </button>
      ) : null}
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
