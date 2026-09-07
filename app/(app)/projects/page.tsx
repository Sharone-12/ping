import { ProjectsClient } from "./ProjectsClient";
import { getProjects } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [projects, profile] = await Promise.all([
    getProjects(),
    user
      ? supabase.from("users").select("interests").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <ProjectsClient
      projects={projects}
      interests={profile.data?.interests ?? []}
    />
  );
}
