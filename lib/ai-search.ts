import { groqJSON } from "@/lib/groq";
import { CAMPUS_TZ } from "@/lib/utils";
import type { CampusEvent } from "@/types";

export interface SearchResult {
  answer: string;
  event_ids: string[];
  no_results: boolean;
}

const SYSTEM_PROMPT = `You are a campus event search assistant for LICET students. You are given today's date, a list of campus events, and a student's question. Find the events that genuinely answer the question.

Rules:
- Only return ids that appear in the EVENTS list. Never invent an id.
- Judge relevance on meaning, not keywords: "anything with free food" should match events that mention refreshments; "ML stuff" should match machine learning workshops.
- Respect time words in the question ("this week", "this month", "next month", "past") using the given date.
- If the student asks about something with no matching event, set no_results true, return an empty list, and say plainly that nothing matches. Do not pad the answer with unrelated events.
- The answer is 1-3 sentences, conversational, and mentions specifics (dates, venues, prizes) when they are in the data. Never invent details that are not in the events.

Respond ONLY with valid JSON:
{"answer": "...", "event_ids": ["..."], "no_results": false}`;

/**
 * Dates are handed to the model already rendered in campus time. Passing raw
 * UTC ISO strings made it report a 10:15 am workshop as 4:45 am.
 */
function inCampusTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    timeZone: CAMPUS_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Trimmed to keep the prompt small — the model only needs what it reasons over. */
function compact(events: CampusEvent[]) {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.event_type,
    department: e.department,
    starts: inCampusTime(e.date_start),
    ends: inCampusTime(e.date_end),
    deadline: inCampusTime(e.registration_deadline),
    venue: e.venue,
    tags: e.tags,
    team_size: e.team_size,
    summary: e.description?.slice(0, 240) ?? null,
    has_registration_link: Boolean(e.registration_link),
  }));
}

export async function aiSearch(
  query: string,
  events: CampusEvent[],
): Promise<SearchResult> {
  if (events.length === 0) {
    return {
      answer:
        "There are no events in the feed yet. Sync your inbox and ask me again.",
      event_ids: [],
      no_results: true,
    };
  }

  const payload = {
    today: new Date().toLocaleDateString("en-GB", {
      timeZone: CAMPUS_TZ,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    timezone: "All times are India Standard Time.",
    question: query,
    events: compact(events),
  };

  const result = await groqJSON<Partial<SearchResult>>({
    system: SYSTEM_PROMPT,
    user: JSON.stringify(payload),
  });

  // Never trust ids back from the model — intersect with what we sent.
  const known = new Set(events.map((e) => e.id));
  const ids = Array.isArray(result.event_ids)
    ? result.event_ids.filter((id) => typeof id === "string" && known.has(id))
    : [];

  return {
    answer:
      typeof result.answer === "string" && result.answer.trim()
        ? result.answer.trim()
        : "Here is what I found.",
    event_ids: ids,
    no_results: result.no_results === true || ids.length === 0,
  };
}
