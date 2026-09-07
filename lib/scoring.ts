import { departmentMatches, type CampusEvent } from "@/types";
import { daysUntil } from "@/lib/utils";

/**
 * Relevance score used to ORDER the For You feed. It never removes an event —
 * a heuristic that hides a real hackathon because the department string did not
 * match is worse than showing it low in the list.
 */
export function relevanceScore(
  event: CampusEvent,
  department: string | null,
  interests: string[],
): number {
  let score = 0;

  if (departmentMatches(department, event.department)) score += 5;
  if (!event.department || event.department === "ALL") score += 3;

  // Interest overlap, matched loosely: "AI/ML" should hit an "ml" tag.
  const wanted = interests.map((i) => i.toLowerCase());
  const haystack = [
    ...event.tags.map((t) => t.toLowerCase()),
    event.event_type,
    event.title.toLowerCase(),
  ];
  for (const want of wanted) {
    const parts = want.split(/[/\s]+/).filter((p) => p.length > 2);
    if (
      parts.some((p) => haystack.some((h) => h.includes(p) || p.includes(h)))
    ) {
      score += 3;
    }
  }

  const days = daysUntil(event.date_start);
  if (days !== null) {
    if (days < 0)
      score -= 4; // finished events sink, but stay visible
    else if (days <= 7) score += 4;
    else if (days <= 14) score += 2;
    else if (days <= 30) score += 1;
  }

  const deadline = daysUntil(event.registration_deadline);
  if (deadline !== null && deadline >= 0) {
    if (deadline <= 3) score += 5;
    else if (deadline <= 7) score += 3;
  }

  return score;
}
