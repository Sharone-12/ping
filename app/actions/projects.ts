"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateProjectMeta } from "@/lib/project-ai";

export interface ProjectFormState {
  error?: string;
}

/** Comma or newline separated input into a clean, capped list. */
function toList(value: FormDataEntryValue | null, max = 8): string[] {
  return String(value ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createProject(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (title.length < 3) return { error: "Give your project a title." };
  if (description.length < 20) {
    return { error: "Describe the project in a sentence or two." };
  }

  const techStack = toList(formData.get("tech_stack"));
  const lookingFor = toList(formData.get("looking_for"), 5);
  const status = String(formData.get("status") ?? "active");
  const githubUrl = String(formData.get("github_url") ?? "").trim();
  const demoUrl = String(formData.get("demo_url") ?? "").trim();

  if (githubUrl && !isHttpUrl(githubUrl)) {
    return { error: "That GitHub link does not look like a URL." };
  }
  if (demoUrl && !isHttpUrl(demoUrl)) {
    return { error: "That demo link does not look like a URL." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const meta = await generateProjectMeta(title, description, techStack);

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    title,
    description,
    ai_summary: meta.ai_summary,
    tags: meta.tags,
    tech_stack: techStack,
    looking_for: lookingFor,
    github_url: githubUrl || null,
    demo_url: demoUrl || null,
    status: ["active", "completed", "looking-for-team"].includes(status)
      ? status
      : "active",
  });

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath("/profile");
  redirect("/projects");
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS also enforces ownership; this keeps the intent obvious at the call site.
  await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  revalidatePath("/projects");
  revalidatePath("/profile");
}
