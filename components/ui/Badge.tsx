import { cn } from "@/lib/utils";
import type { EventType } from "@/types";

type Variant =
  | "neutral"
  | "butter"
  | "mint"
  | "sky"
  | "lilac"
  | "peach"
  | "blush"
  | "alert"
  | "outline";

const VARIANTS: Record<Variant, string> = {
  neutral: "bg-paper-deep text-ink-soft",
  butter: "bg-butter text-butter-ink",
  mint: "bg-mint text-mint-ink",
  sky: "bg-sky text-sky-ink",
  lilac: "bg-lilac text-lilac-ink",
  peach: "bg-peach text-peach-ink",
  blush: "bg-blush text-blush-ink",
  alert: "bg-alert text-alert-ink",
  outline: "border border-line bg-white text-ink-soft",
};

/** Each event type gets a fixed pastel so the feed is scannable by colour. */
export const EVENT_TYPE_VARIANT: Record<EventType, Variant> = {
  hackathon: "butter",
  workshop: "mint",
  seminar: "sky",
  fest: "lilac",
  competition: "peach",
  "guest-lecture": "blush",
  other: "neutral",
};

/** Tint used when an event's own card is coloured, not just its chip. */
export const EVENT_TYPE_TINT: Record<EventType, string> = {
  hackathon: "bg-butter",
  workshop: "bg-mint",
  seminar: "bg-sky",
  fest: "bg-lilac",
  competition: "bg-peach",
  "guest-lecture": "bg-blush",
  other: "bg-paper-deep",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
