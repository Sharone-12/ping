import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types";

const STATUS_LABEL: Record<Project["status"], string> = {
  active: "In progress",
  completed: "Complete",
  "looking-for-team": "Looking for team",
};

const TINTS = [
  "#FBEFB8",
  "#D4F0DF",
  "#DAE7FB",
  "#E8DCFA",
  "#FBE0D2",
  "#FBDDE8",
];

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!data) notFound();
  const project = data as Project;

  // Stable tint per project so the detail page matches its card in the grid.
  const tint =
    TINTS[
      Math.abs(project.id.split("").reduce((n, c) => n + c.charCodeAt(0), 0)) %
        TINTS.length
    ];

  return (
    <PageTransition>
      <main className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          <span aria-hidden="true">←</span> Back to projects
        </Link>

        <div
          className="mt-6 grid h-36 place-items-center rounded-card border border-line"
          style={{ backgroundColor: tint }}
          aria-hidden="true"
        >
          <span className="text-[46px] font-extrabold leading-none tracking-[-0.03em] text-ink/60">
            {project.title.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge variant={project.status === "completed" ? "mint" : "neutral"}>
            {STATUS_LABEL[project.status]}
          </Badge>
          {project.looking_for.map((role) => (
            <Badge key={role} variant="lilac">
              Looking for: {role}
            </Badge>
          ))}
        </div>

        <h1 className="mt-4 text-[32px] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[42px]">
          {project.title}
        </h1>

        {project.ai_summary ? (
          <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
            {project.ai_summary}
          </p>
        ) : null}

        {project.description ? (
          <p className="mt-6 whitespace-pre-line text-[15px] leading-[1.75] text-ink-soft">
            {project.description}
          </p>
        ) : null}

        {project.tech_stack.length > 0 ? (
          <div className="mt-7">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-muted">
              Built with
            </h2>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {project.tech_stack.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {project.tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        ) : null}

        {project.github_url || project.demo_url ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {project.demo_url ? (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-ink px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-85"
              >
                View live demo
              </a>
            ) : null}
            {project.github_url ? (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-line bg-white px-6 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:border-ink-muted"
              >
                View source
              </a>
            ) : null}
          </div>
        ) : null}
      </main>
    </PageTransition>
  );
}
