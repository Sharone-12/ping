import type { CampusEvent } from "@/types";

/** Google Calendar wants basic-format UTC: 20260907T083000Z */
function toGoogleStamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * "Add to Google Calendar" link. Uses Google's TEMPLATE render URL, so there is
 * no Calendar API scope or server call involved — the user lands on a prefilled
 * event they can save. Returns null when the event has no usable start date.
 */
export function googleCalendarUrl(event: CampusEvent): string | null {
  if (!event.date_start) return null;

  const start = new Date(event.date_start);
  if (Number.isNaN(start.getTime())) return null;

  // Default to a 2-hour block when the announcement gave no end time.
  const end = event.date_end ? new Date(event.date_end) : null;
  const finish =
    end && !Number.isNaN(end.getTime()) && end > start
      ? end
      : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const details: string[] = [];
  if (event.description) details.push(event.description);
  if (event.registration_link) {
    details.push(`Register: ${event.registration_link}`);
  }
  if (event.registration_deadline) {
    const d = new Date(event.registration_deadline);
    if (!Number.isNaN(d.getTime())) {
      details.push(`Registration closes: ${d.toLocaleString("en-IN")}`);
    }
  }
  details.push("Added from LICET Pulse");

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  url.searchParams.set(
    "dates",
    `${toGoogleStamp(start)}/${toGoogleStamp(finish)}`,
  );
  url.searchParams.set("details", details.join("\n\n"));
  if (event.venue) url.searchParams.set("location", event.venue);

  return url.toString();
}
