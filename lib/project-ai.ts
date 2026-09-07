import { groqJSON } from "@/lib/groq";

export interface ProjectMeta {
  ai_summary: string;
  tags: string[];
}

const SYSTEM_PROMPT = `You summarise student projects for a campus showcase.

Given a project title, the author's own description, and their tech stack, return:
- ai_summary: ONE sentence, max 24 words, factual, describing what the project does. No marketing language, no "this project aims to".
- tags: 3-5 lowercase topic tags drawn from what the project actually is (e.g. "ai", "web-dev", "security", "mobile", "iot", "blockchain", "data-science", "games", "systems", "design"). Use hyphens, never spaces.

Never invent capabilities the description does not mention.

Respond ONLY with valid JSON: {"ai_summary": "...", "tags": ["...", "..."]}`;

/** Falls back to the author's own words if the model is unavailable. */
export async function generateProjectMeta(
  title: string,
  description: string,
  techStack: string[],
): Promise<ProjectMeta> {
  const fallback: ProjectMeta = {
    ai_summary: description.slice(0, 160),
    tags: techStack
      .slice(0, 4)
      .map((t) => t.toLowerCase().replace(/\s+/g, "-")),
  };

  try {
    const result = await groqJSON<Partial<ProjectMeta>>({
      system: SYSTEM_PROMPT,
      user: JSON.stringify({ title, description, tech_stack: techStack }),
    });

    const summary =
      typeof result.ai_summary === "string" && result.ai_summary.trim()
        ? result.ai_summary.trim()
        : fallback.ai_summary;

    const tags = Array.isArray(result.tags)
      ? result.tags
          .filter(
            (t): t is string => typeof t === "string" && t.trim().length > 0,
          )
          .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
          .slice(0, 5)
      : fallback.tags;

    return { ai_summary: summary, tags: tags.length ? tags : fallback.tags };
  } catch {
    return fallback;
  }
}
