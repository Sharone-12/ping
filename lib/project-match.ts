import type { Project } from "@/types";

/**
 * How well a project fits a student. Used to ORDER the showcase, never to hide
 * projects — same rule as the event feed.
 */
export function projectMatchScore(
  project: Project,
  interests: string[],
): number {
  let score = 0;

  const wanted = interests.map((i) => i.toLowerCase());
  const haystack = [
    ...project.tags.map((t) => t.toLowerCase()),
    ...project.tech_stack.map((t) => t.toLowerCase()),
  ];

  for (const want of wanted) {
    const parts = want.split(/[/\s]+/).filter((p) => p.length > 2);
    if (
      parts.some((p) => haystack.some((h) => h.includes(p) || p.includes(h)))
    ) {
      score += 3;
    }
  }

  // Teams actively looking for people are the ones worth surfacing.
  if (project.looking_for.length > 0) score += 4;
  if (project.status === "completed") score -= 2;

  return score;
}
