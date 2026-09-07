"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyScene } from "@/components/illustrations/EmptyScene";
import { FilterPills, type PillOption } from "@/components/ui/FilterPills";
import { SearchBar } from "@/components/ui/SearchBar";
import { projectMatchScore } from "@/lib/project-match";
import type { Project } from "@/types";

const FILTERS: PillOption[] = [
  { value: "for-me", label: "For me" },
  { value: "all", label: "All" },
  { value: "looking-for-team", label: "Looking for team" },
  { value: "ai", label: "AI/ML" },
  { value: "web-dev", label: "Web Dev" },
];

export function ProjectsClient({
  projects,
  interests,
}: {
  projects: Project[];
  interests: string[];
}) {
  const [filter, setFilter] = useState("for-me");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchesSearch = (p: Project) =>
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.ai_summary ?? "").toLowerCase().includes(q) ||
      p.tech_stack.some((t) => t.toLowerCase().includes(q)) ||
      p.tags.some((t) => t.toLowerCase().includes(q));

    // "For me" ranks, it never hides — a weak tag guess must not bury a project.
    if (filter === "for-me") {
      return [...projects]
        .filter(matchesSearch)
        .sort(
          (a, b) =>
            projectMatchScore(b, interests) - projectMatchScore(a, interests),
        );
    }

    return projects.filter((p) => {
      if (!matchesSearch(p)) return false;
      if (filter === "all") return true;
      if (filter === "looking-for-team") return p.looking_for.length > 0;
      return p.tags.includes(filter);
    });
  }, [projects, filter, query, interests]);

  const nothingPublished = projects.length === 0;

  return (
    <main className="mx-auto max-w-shell px-6 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em] text-ink sm:text-[40px]">
            Project Showcase
          </h1>
          <p className="mt-2 text-[14px] text-ink-soft sm:text-[15px]">
            What students across LICET are building right now.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          + Add Project
        </Link>
      </div>

      {nothingPublished ? (
        <div className="mt-9 flex flex-col items-center rounded-card border border-line bg-white px-6 py-14 text-center">
          <EmptyScene className="h-32 w-auto" />
          <p className="mt-5 text-[18px] font-extrabold tracking-[-0.02em] text-ink">
            No projects yet
          </p>
          <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-soft">
            Be the first. Publish what you are building and let the AI write the
            summary and tags for you.
          </p>
          <Link
            href="/projects/new"
            className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            Add your project
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-7 max-w-2xl">
            <SearchBar
              placeholder="Search projects…"
              value={query}
              onChange={setQuery}
            />
          </div>

          <div className="mt-5">
            <FilterPills
              options={FILTERS}
              active={filter}
              onChange={setFilter}
            />
          </div>

          {visible.length > 0 ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          ) : (
            <div className="mt-7 flex flex-col items-center rounded-card border border-line bg-white px-6 py-12 text-center">
              <EmptyScene className="h-28 w-auto" />
              <p className="mt-4 text-[15px] font-bold text-ink">No matches</p>
              <p className="mt-1 text-[13.5px] text-ink-soft">
                Try a different filter or search term.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
