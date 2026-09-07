import {
  CalendarIcon,
  ClockIcon,
  SparkIcon,
  TagIcon,
} from "@/components/Icons";
import type { CampusEvent } from "@/types";
import { daysUntil, isPast, isThisWeek } from "@/lib/utils";

/**
 * Pastel stat strip under the search bar. Carries the landing's tile language
 * into the app without tinting every card, which would drown out the category
 * chips the feed relies on for scanning.
 */
export function FeedStats({
  events,
  savedCount,
}: {
  events: CampusEvent[];
  savedCount: number;
}) {
  const live = events.filter((e) => !isPast(e.date_start, e.date_end));
  const thisWeek = live.filter((e) => isThisWeek(e.date_start)).length;
  const closingSoon = live.filter((e) => {
    const d = daysUntil(e.registration_deadline);
    return d !== null && d >= 0 && d <= 3;
  }).length;

  const stats = [
    { label: "Live events", value: live.length, bg: "bg-sky", Icon: TagIcon },
    { label: "This week", value: thisWeek, bg: "bg-mint", Icon: CalendarIcon },
    {
      label: "Closing soon",
      value: closingSoon,
      bg: "bg-peach",
      Icon: ClockIcon,
    },
    { label: "Saved", value: savedCount, bg: "bg-lilac", Icon: SparkIcon },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center justify-between gap-3 rounded-soft ${stat.bg} px-4 py-3`}
        >
          <div>
            <p className="text-[22px] font-extrabold leading-none tracking-[-0.02em] text-ink">
              {stat.value}
            </p>
            <p className="mt-1.5 text-[12px] font-semibold text-ink/60">
              {stat.label}
            </p>
          </div>
          <span className="text-ink/35">
            <stat.Icon size={18} />
          </span>
        </div>
      ))}
    </div>
  );
}
