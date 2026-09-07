"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:opacity-85",
  secondary: "bg-white text-ink border border-line hover:border-ink-muted",
  ghost: "bg-transparent text-ink-soft hover:text-ink hover:bg-paper-deep",
};

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ComponentProps<typeof motion.button> & { variant?: Variant }) {
  return (
    <motion.button
      type={type}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold",
        "transition-colors disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
