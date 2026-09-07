"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckIcon, ClockIcon, EventTypeIcon } from "@/components/Icons";
import {
  Badge,
  EVENT_TYPE_TINT,
  EVENT_TYPE_VARIANT,
} from "@/components/ui/Badge";
import { SaveButton } from "@/components/SaveButton";
import { EVENT_TYPE_META, type CampusEvent } from "@/types";
import {
  cn,
  daysUntil,
  deadlineLabel,
  endedLabel,
  formatDateRange,
} from "@/lib/utils";

export function EventCard({
  event,
  saved,
  index = 0,
  wide = false,
  past = false,
  registered = false,
}: {
  event: CampusEvent;
  saved: boolean;
  index?: number;
  /** Horizontal layout for featured rows, where a grid would leave holes. */
  wide?: boolean;
  /** Already happened — de-emphasised, deadline swapped for an ended label. */
  past?: boolean;
  /** The user has registered through the agent. */
  registered?: boolean;
}) {
  const meta = EVENT_TYPE_META[event.event_type] ?? EVENT_TYPE_META.other;
  const deadline = deadlineLabel(event.registration_deadline);
  const daysLeft = daysUntil(event.registration_deadline);
  const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
  const tint = EVENT_TYPE_TINT[event.event_type] ?? "bg-paper-deep";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.045, 0.3) }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative rounded-card transition-shadow",
        past && "opacity-70 hover:opacity-100",
        wide
          ? `flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 ${tint}`
          : "flex h-full flex-col border border-line bg-white p-5 shadow-card hover:shadow-lift",
      )}
    >
      <div className={cn(wide && "min-w-0 flex-1")}>
        <div className="flex items-start justify-between gap-3">
          <Badge
            variant={
              wide
                ? "neutral"
                : (EVENT_TYPE_VARIANT[event.event_type] ?? "neutral")
            }
            className={wide ? "bg-white/75 text-ink" : undefined}
          >
            <EventTypeIcon type={event.event_type} size={13} />
            {meta.label}
          </Badge>
          <div className="flex shrink-0 items-center gap-2">
            {registered ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-mint-ink">
                <CheckIcon size={11} /> Registered
              </span>
            ) : null}
            <SaveButton eventId={event.id} initialSaved={saved} />
          </div>
        </div>

        <h3
          className={cn(
            "mt-3.5 font-extrabold leading-[1.22] tracking-[-0.02em] text-ink",
            wide ? "text-[22px] sm:text-[25px]" : "text-[19px]",
          )}
        >
          <Link
            href={`/events/${event.id}`}
            className="before:absolute before:inset-0 before:content-['']"
          >
            {event.title}
          </Link>
        </h3>

        <p
          className={cn(
            "mt-1.5 text-[13px] font-medium",
            wide ? "text-ink/55" : "text-ink-muted",
          )}
        >
          {event.venue ?? "Venue TBA"}
          {event.department ? `, ${event.department}` : ""}
        </p>

        {event.description ? (
          <p
            className={cn(
              "mt-3 line-clamp-2 text-[13.5px] leading-relaxed",
              wide ? "max-w-2xl text-ink/70 sm:text-[14.5px]" : "text-ink-soft",
            )}
          >
            {event.description}
          </p>
        ) : null}

        {event.tags.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {event.tags.slice(0, wide ? 5 : 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={
                  wide
                    ? "border-transparent bg-white/70 text-ink/70"
                    : undefined
                }
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "flex items-end justify-between gap-3",
          wide
            ? "shrink-0 rounded-xl bg-white p-4 shadow-soft sm:w-44 sm:flex-col sm:items-start"
            : "mt-5 border-t border-line pt-4",
        )}
      >
        <span
          className={cn(
            "font-extrabold tracking-[-0.01em] text-ink",
            wide ? "text-[19px]" : "text-[15px]",
          )}
        >
          {formatDateRange(event.date_start, event.date_end)}
        </span>
        {past ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-paper-deep px-2.5 py-1 text-[11.5px] font-semibold text-ink-muted",
              wide && "sm:mt-2",
            )}
          >
            {endedLabel(event.date_start, event.date_end)}
          </span>
        ) : deadline ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
              wide && "sm:mt-2",
              urgent
                ? "bg-alert text-alert-ink"
                : "bg-paper-deep text-ink-soft",
            )}
          >
            <ClockIcon size={12} />
            {urgent && daysLeft !== null
              ? daysLeft === 0
                ? "Closes today"
                : `${daysLeft}d left`
              : deadline.replace("Registration closes in ", "")}
          </span>
        ) : null}
      </div>
    </motion.article>
  );
}
