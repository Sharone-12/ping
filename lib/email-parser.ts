import { groqJSON } from "@/lib/groq";
import type { GmailMessage } from "@/lib/gmail";
import type { EventType } from "@/types";

const EVENT_TYPES: EventType[] = [
  "hackathon",
  "workshop",
  "seminar",
  "fest",
  "competition",
  "guest-lecture",
  "other",
];

const SYSTEM_PROMPT = `You are an event extraction assistant for a college campus app. Given a college email, extract event details as JSON.

If the email is NOT about a specific campus event (academic circular, attendance notice, exam timetable, fee reminder, newsletter, promotional spam), return exactly: {"is_event": false}

If it IS about an event, return:
{
  "is_event": true,
  "title": "concise event name, no marketing filler",
  "description": "2-3 sentence factual summary",
  "event_type": "hackathon|workshop|seminar|fest|competition|guest-lecture|other",
  "date_start": "ISO 8601 date or datetime, or null",
  "date_end": "ISO 8601 date or datetime, or null",
  "registration_deadline": "ISO 8601 date or datetime, or null",
  "venue": "location or null",
  "registration_link": "URL or null",
  "department": "AI&DS|ECE|EEE|MECHANICAL|CSE|IT|CIVIL|ALL or null",
  "team_size": "short string like '2-4 members' or 'Individual', or null",
  "tags": ["3-5 lowercase topic tags"]
}

Rules:
- Never invent dates. If a date is not stated, use null.
- Resolve relative dates using the email's sent date, given below.
- Respond ONLY with valid JSON. No markdown, no explanation.`;

export interface ParsedEvent {
  is_event: boolean;
  title?: string;
  description?: string | null;
  event_type?: string;
  date_start?: string | null;
  date_end?: string | null;
  registration_deadline?: string | null;
  venue?: string | null;
  registration_link?: string | null;
  department?: string | null;
  team_size?: string | null;
  tags?: string[];
}

export async function parseEmail(
  message: GmailMessage,
  signal?: AbortSignal,
): Promise<ParsedEvent> {
  const user = [
    `Email sent date: ${message.date || "unknown"}`,
    `From: ${message.from}`,
    `Subject: ${message.subject}`,
    "",
    message.body,
  ].join("\n");

  return groqJSON<ParsedEvent>({ system: SYSTEM_PROMPT, user, signal });
}

/** Coerce loose model output into a row the events table will accept. */
export function toEventRow(parsed: ParsedEvent, sourceEmailId: string) {
  const title = (parsed.title ?? "").trim();
  if (!title) return null;

  const type = EVENT_TYPES.includes(parsed.event_type as EventType)
    ? (parsed.event_type as EventType)
    : "other";

  const dateStart = toISO(parsed.date_start);

  return {
    title,
    description: parsed.description?.trim() || null,
    event_type: type,
    department: parsed.department?.trim() || null,
    date_start: dateStart,
    date_end: toISO(parsed.date_end),
    registration_deadline: toISO(parsed.registration_deadline),
    venue: parsed.venue?.trim() || null,
    registration_link: isHttpUrl(parsed.registration_link)
      ? parsed.registration_link!.trim()
      : null,
    team_size: parsed.team_size?.trim() || null,
    tags: Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t) => typeof t === "string" && t.trim())
          .slice(0, 6)
          .map((t) => t.trim().toLowerCase())
      : [],
    source_email_id: sourceEmailId,
    dedup_key: dedupKey(title, dateStart),
    is_active: true,
  };
}

/**
 * Two emails about the same event (an announcement and its reminder) should
 * collapse into one row. Keyed on a normalised title plus the start day.
 */
export function dedupKey(title: string, dateStart: string | null): string {
  const norm = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|of|for|and|on|at|in|to|by|20\d\d)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const day = dateStart ? dateStart.slice(0, 10) : "nodate";
  return `${norm}|${day}`;
}

function toISO(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // Guard against the model hallucinating far-future or past dates.
  const year = d.getUTCFullYear();
  if (year < 2020 || year > 2100) return null;
  return d.toISOString();
}

function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Cheap pre-filter so obvious non-events never cost an LLM call. */
const NEGATIVE =
  /\b(attendance|fee\s*payment|exam\s*time\s*table|hall\s*ticket|result[s]?\s*published|holiday\s*list|unsubscribe|invoice|salary)\b/i;
const POSITIVE =
  /\b(hackathon|workshop|seminar|symposium|fest|competition|contest|webinar|register|registration|guest\s*lecture|bootcamp|event)\b/i;

export function looksLikeEvent(message: GmailMessage): boolean {
  const haystack = `${message.subject} ${message.body.slice(0, 1200)}`;
  if (NEGATIVE.test(haystack) && !POSITIVE.test(message.subject)) return false;
  return POSITIVE.test(haystack);
}
