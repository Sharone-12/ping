import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarIcon,
  ClockIcon,
  EventTypeIcon,
  PinIcon,
  TagIcon,
  UsersIcon,
} from "@/components/Icons";
import { Badge, EVENT_TYPE_VARIANT } from "@/components/ui/Badge";
import { PageTransition } from "@/components/PageTransition";
import { RegisterButton } from "@/components/RegisterButton";
import { SaveButton } from "@/components/SaveButton";
import { googleCalendarUrl } from "@/lib/calendar";
import { getEventById, getSavedEventIds } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import {
  cn,
  daysUntil,
  deadlineLabel,
  formatFullDate,
  formatTime,
} from "@/lib/utils";
import { EVENT_TYPE_META } from "@/types";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ event }, savedIds, registration] = await Promise.all([
    getEventById(params.id),
    getSavedEventIds(),
    user
      ? supabase
          .from("event_registrations")
          .select("id")
          .eq("user_id", user.id)
          .eq("event_id", params.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!event) notFound();

  const meta = EVENT_TYPE_META[event.event_type] ?? EVENT_TYPE_META.other;
  const deadline = deadlineLabel(event.registration_deadline);
  const daysLeft = daysUntil(event.registration_deadline);
  const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

  const calendarUrl = googleCalendarUrl(event);

  const facts = [
    {
      label: "Date",
      value: [formatFullDate(event.date_start), formatTime(event.date_start)]
        .filter(Boolean)
        .join(" · "),
      Icon: CalendarIcon,
    },
    { label: "Venue", value: event.venue ?? "To be announced", Icon: PinIcon },
    { label: "Department", value: event.department ?? "All", Icon: TagIcon },
    {
      label: "Team size",
      value: event.team_size ?? "Not specified",
      Icon: UsersIcon,
    },
  ];

  return (
    <PageTransition>
      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            <span aria-hidden="true">←</span> Back
          </Link>
          <SaveButton
            eventId={event.id}
            initialSaved={savedIds.has(event.id)}
            size="lg"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant={EVENT_TYPE_VARIANT[event.event_type] ?? "neutral"}>
            <EventTypeIcon type={event.event_type} />
            {meta.label}
          </Badge>
          {event.department ? (
            <Badge variant="outline">{event.department}</Badge>
          ) : null}
        </div>

        <h1 className="mt-4 text-[34px] font-extrabold leading-[1.06] tracking-[-0.03em] text-ink sm:text-[46px]">
          {event.title}
        </h1>

        <dl className="mt-7 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-paper-deep px-5 py-4">
              <dt className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                <fact.Icon size={14} />
                {fact.label}
              </dt>
              <dd className="mt-1 text-[15px] font-semibold text-ink">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        {deadline ? (
          <p
            className={cn(
              "mt-4 rounded-card border px-5 py-3.5 text-[14px] font-semibold",
              urgent
                ? "border-transparent bg-alert text-alert-ink"
                : "border-line bg-white text-ink-soft",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <ClockIcon size={15} />
              {deadline}
            </span>
          </p>
        ) : null}

        {event.description ? (
          <p className="mt-7 text-[15px] leading-[1.75] text-ink-soft sm:text-base">
            {event.description}
          </p>
        ) : null}

        {event.tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <RegisterButton
            eventId={event.id}
            eventTitle={event.title}
            hasLink={Boolean(event.registration_link)}
            alreadyRegistered={Boolean(registration.data)}
          />
          {calendarUrl ? (
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:border-ink-muted"
            >
              <CalendarIcon size={16} /> Add to Google Calendar
            </a>
          ) : (
            <span
              title="This event has no date yet"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 text-[15px] font-semibold text-ink-muted"
            >
              <CalendarIcon size={16} /> No date to add
            </span>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
