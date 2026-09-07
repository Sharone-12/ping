"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EventCard } from "@/components/EventCard";
import { FilterPills, type PillOption } from "@/components/ui/FilterPills";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyScene } from "@/components/illustrations/EmptyScene";
import { FeedStats } from "@/components/FeedStats";
import { daysSince, isPast, isThisWeek } from "@/lib/utils";
import { relevanceScore } from "@/lib/scoring";
import type { CampusEvent } from "@/types";

/** "Recently ended" means the last week — older events drop off the feed. */
const PAST_WINDOW_DAYS = 7;

const FILTERS: PillOption[] = [
  { value: "for-you", label: "For You" },
  { value: "all", label: "All" },
  { value: "hackathon", label: "Hackathons" },
  { value: "workshop", label: "Workshops" },
  { value: "seminar", label: "Seminars" },
  { value: "fest", label: "Fests" },
  { value: "competition", label: "Competitions" },
];

export function FeedClient({
  events,
  savedIds,
  registeredIds = [],
  department,
  interests,
}: {
  events: CampusEvent[];
  savedIds: string[];
  registeredIds?: string[];
  department: string | null;
  interests: string[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("for-you");
  const [query, setQuery] = useState("");
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const registered = useMemo(() => new Set(registeredIds), [registeredIds]);

  const visible = useMemo(() => {
    // "For You" reorders, it never hides — a bad heuristic must not be able to
    // make a real event disappear. Only the type pills actually filter.
    if (filter === "for-you") {
      return [...events].sort(
        (a, b) =>
          relevanceScore(b, department, interests) -
          relevanceScore(a, department, interests),
      );
    }
    if (filter === "all") return events;
    return events.filter((e) => e.event_type === filter);
  }, [events, filter, department, interests]);

  const noEventsAtAll = events.length === 0;

  const past = visible
    .filter((e) => {
      if (!isPast(e.date_start, e.date_end)) return false;
      const age = daysSince(e.date_end ?? e.date_start);
      return age !== null && age <= PAST_WINDOW_DAYS;
    })
    .sort((a, b) =>
      (b.date_end ?? b.date_start ?? "").localeCompare(
        a.date_end ?? a.date_start ?? "",
      ),
    );

  const live = visible.filter((e) => !isPast(e.date_start, e.date_end));
  const thisWeek = live.filter((e) => isThisWeek(e.date_start));
  const upcoming = live.filter((e) => !isThisWeek(e.date_start));

  return (
    <>
      <section className="mx-auto max-w-shell px-6 pt-12 sm:pt-16">
        <h1 className="text-[30px] font-extrabold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[42px]">
          Everything happening at LICET
        </h1>
        <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-soft sm:text-[15.5px]">
          Parsed from campus email, sorted by what is closest.
        </p>
        <div className="mt-7 max-w-2xl">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={() => {
              const q = query.trim();
              // Typing here jumps straight to the answer rather than making the
              // student retype the question on the search page.
              router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
            }}
          />
        </div>

        <div className="mt-5">
          <FeedStats events={events} savedCount={savedIds.length} />
        </div>
      </section>

      {noEventsAtAll ? null : (
        <div className="mx-auto max-w-shell px-6 pt-7">
          <FilterPills options={FILTERS} active={filter} onChange={setFilter} />
        </div>
      )}

      <div className="mx-auto max-w-shell space-y-11 px-6 py-10">
        {noEventsAtAll ? (
          <div className="flex flex-col items-center rounded-card border border-line bg-white px-6 py-14 text-center">
            <EmptyScene className="h-32 w-auto" />
            <p className="mt-5 text-[18px] font-extrabold tracking-[-0.02em] text-ink">
              No events yet
            </p>
            <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-soft">
              Connect Gmail and run a sync — LICET Pulse will read your campus
              email and pull every event out of it.
            </p>
            <Link
              href="/profile"
              className="mt-6 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
            >
              Go to Profile
            </Link>
          </div>
        ) : null}

        {thisWeek.length > 0 ? (
          <Section label="Happening this week" count={thisWeek.length} stacked>
            {thisWeek.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                saved={saved.has(event.id)}
                registered={registered.has(event.id)}
                index={i}
                wide
              />
            ))}
          </Section>
        ) : null}

        {upcoming.length > 0 ? (
          <Section label="Upcoming" count={upcoming.length}>
            {upcoming.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                saved={saved.has(event.id)}
                registered={registered.has(event.id)}
                index={i}
              />
            ))}
          </Section>
        ) : null}

        {past.length > 0 ? (
          <Section label="Recently ended" count={past.length}>
            {past.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                saved={saved.has(event.id)}
                registered={registered.has(event.id)}
                index={i}
                past
              />
            ))}
          </Section>
        ) : null}

        {visible.length === 0 ? (
          <div className="flex flex-col items-center rounded-card border border-line bg-white px-6 py-12 text-center">
            <EmptyScene className="h-28 w-auto" />
            <p className="mt-4 text-[15px] font-bold text-ink">
              Nothing here yet
            </p>
            <p className="mt-1 text-[13.5px] text-ink-soft">
              Try another filter, or sync your inbox for new events.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

function Section({
  label,
  count,
  children,
  stacked = false,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
  /** Full-width rows instead of a grid, so a short section leaves no holes. */
  stacked?: boolean;
}) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink">
          {label}
        </h2>
        <span className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-paper-tint px-1.5 text-[11.5px] font-bold text-ink-soft">
          {count}
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>
      <div
        className={
          stacked
            ? "mt-4 flex flex-col gap-4"
            : "mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        }
      >
        {children}
      </div>
    </section>
  );
}
