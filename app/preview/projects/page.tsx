import { notFound } from "next/navigation";
import { ProjectsClient } from "@/app/(app)/projects/ProjectsClient";
import { TopBar } from "@/components/TopBar";
import { PREVIEW_PROJECTS } from "@/lib/preview-project-fixtures";

/** Dev-only design harness. See app/preview/page.tsx. */
export default function PreviewProjectsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-dvh">
      <TopBar avatarUrl={null} fullName="Sharone" />
      <ProjectsClient
        projects={PREVIEW_PROJECTS}
        interests={["Hackathons", "AI/ML", "Web Dev"]}
      />
    </div>
  );
}
