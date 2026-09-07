export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Campus timezone. Every date calculation and every rendered date is pinned to
 * it — the server runs in UTC and the browser in IST, so relying on the
 * runtime's local zone gives different answers on each and can render an
 * evening event on the wrong day.
 */
export const CAMPUS_TZ = "Asia/Kolkata";

/** The IST calendar day for an instant, as YYYY-MM-DD. */
function istDayKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: CAMPUS_TZ });
}

function istDayNumber(date: Date): number {
  const [y, m, d] = istDayKey(date).split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** Whole IST days from today until `iso`. Negative once the date has passed. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  return istDayNumber(target) - istDayNumber(new Date());
}

/** "Sep 10" or "Sep 10 – 11" / "Sep 30 – Oct 2" for multi-day events. */
export function formatDateRange(
  start: string | null,
  end: string | null,
): string {
  if (!start) return "Date TBA";
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return "Date TBA";

  const month: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    timeZone: CAMPUS_TZ,
  };
  const startLabel = s.toLocaleDateString("en-US", month);
  if (!end) return startLabel;

  const e = new Date(end);
  if (Number.isNaN(e.getTime()) || istDayKey(e) === istDayKey(s)) {
    return startLabel;
  }
  const sameMonth =
    s.toLocaleDateString("en-CA", { timeZone: CAMPUS_TZ }).slice(0, 7) ===
    e.toLocaleDateString("en-CA", { timeZone: CAMPUS_TZ }).slice(0, 7);
  const endLabel = sameMonth
    ? e.toLocaleDateString("en-US", { day: "numeric", timeZone: CAMPUS_TZ })
    : e.toLocaleDateString("en-US", month);
  return `${startLabel} – ${endLabel}`;
}

export function formatFullDate(iso: string | null): string {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: CAMPUS_TZ,
  });
}

/** Human deadline copy, or null when there is nothing urgent to say. */
export function deadlineLabel(iso: string | null): string | null {
  const days = daysUntil(iso);
  if (days === null) return null;
  if (days < 0) return "Registration closed";
  if (days === 0) return "Registration closes today";
  if (days === 1) return "Registration closes tomorrow";
  return `Registration closes in ${days} days`;
}

export function isThisWeek(iso: string | null): boolean {
  const days = daysUntil(iso);
  return days !== null && days >= 0 && days <= 7;
}

/**
 * An event is past once its last day is over. Multi-day events use date_end,
 * so a fest running Oct 5-7 is not "past" on Oct 6.
 */
export function isPast(start: string | null, end: string | null): boolean {
  const days = daysUntil(end ?? start);
  return days !== null && days < 0;
}

/** Start time in campus time, e.g. "10:15 am". Null when none was parsed. */
export function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  // Midnight campus time means the announcement gave a date but no time.
  const hm = d.toLocaleTimeString("en-GB", {
    timeZone: CAMPUS_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
  if (hm === "00:00") return null;

  return d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: CAMPUS_TZ,
    })
    .toLowerCase();
}

/** Whole days since a date passed. Null when it has not. */
export function daysSince(iso: string | null): number | null {
  const days = daysUntil(iso);
  return days === null || days > 0 ? null : Math.abs(days);
}

export function endedLabel(start: string | null, end: string | null): string {
  const days = daysSince(end ?? start);
  if (days === null) return "Ended";
  if (days === 0) return "Ended today";
  if (days === 1) return "Ended yesterday";
  if (days < 7) return `Ended ${days} days ago`;
  if (days < 14) return "Ended last week";
  return `Ended ${Math.floor(days / 7)} weeks ago`;
}
