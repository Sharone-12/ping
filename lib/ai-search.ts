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
- The answer is AT MOST 2 sentences and 45 words. Plain prose only.
- NEVER use bullet points, dashes, numbered lists, markdown, asterisks or line breaks in the answer. It is one short paragraph.
- Do NOT list the events or repeat their dates and venues — the matching event cards are shown to the student directly beneath your answer. Summarise instead: say how many there are and what stands out.
- Good: "There are four hackathons coming up. The closest is IETE Inception today, and PulseHack on 20 September has a Rs 25,000 prize pool."
- Bad: any answer containing "-", "*", or a list of every event.

Each event is given with short keys: id, t=title, k=kind, d=department, s=starts, e=ends, dl=registration deadline, v=venue, g=tags, x=summary.

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

  const date = d.toLocaleDateString("en-GB", {
    timeZone: CAMPUS_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Midnight campus time means no time was given in the announcement, so do
  // not hand the model a "12:00 am" it will faithfully repeat back.
  const hm = d.toLocaleTimeString("en-GB", {
    timeZone: CAMPUS_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
  if (hm === "00:00") return date;

  const time = d.toLocaleTimeString("en-US", {
    timeZone: CAMPUS_TZ,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

/** Belt and braces: the prompt forbids markdown, this removes it anyway. */
function plainProse(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^[\s]*[-*\u2022]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Kept deliberately small. Groq's free tier allows 8,000 tokens per minute and
 * a full-fat payload of every event burned ~4,000 of them per search, so two
 * questions in a row hit the limit and stalled behind backoff. Short keys and a
 * clipped summary cut that by roughly two thirds.
 */
function compact(events: CampusEvent[]) {
  return events.map((e) => ({
    id: e.id,
    t: e.title,
    k: e.event_type,
    d: e.department ?? undefined,
    s: inCampusTime(e.date_start) ?? undefined,
    e: inCampusTime(e.date_end) ?? undefined,
    dl: inCampusTime(e.registration_deadline) ?? undefined,
    v: e.venue ?? undefined,
    g: e.tags.length ? e.tags : undefined,
    x: e.description?.slice(0, 90) ?? undefined,
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
    maxTokens: 1500,
  });

  // Never trust ids back from the model — intersect with what we sent.
  const known = new Set(events.map((e) => e.id));
  const ids = Array.isArray(result.event_ids)
    ? result.event_ids.filter((id) => typeof id === "string" && known.has(id))
    : [];

  return {
    answer:
      typeof result.answer === "string" && result.answer.trim()
        ? plainProse(result.answer)
        : "Here is what I found.",
    event_ids: ids,
    no_results: result.no_results === true || ids.length === 0,
  };
}
