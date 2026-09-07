"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import type { Project } from "@/types";

/** Warm flat tints stand in for project imagery until uploads exist. */
const TINTS = [
  "#FBEFB8",
  "#D4F0DF",
  "#DAE7FB",
  "#E8DCFA",
  "#FBE0D2",
  "#FBDDE8",
];

const STATUS_LABEL: Record<Project["status"], string> = {
  active: "In progress",
  completed: "Complete",
  "looking-for-team": "Looking for team",
};

export function ProjectCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const tint = TINTS[index % TINTS.length];
  const monogram = project.title.charAt(0).toUpperCase();
  const wantsPeople = project.looking_for.length > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -3 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-shadow hover:shadow-lift"
    >
      <div
        className="grid h-28 place-items-center border-b border-line"
        style={{ backgroundColor: tint }}
        aria-hidden="true"
      >
        <span className="text-[34px] font-extrabold leading-none tracking-[-0.03em] text-ink/60">
          {monogram}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[17px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
          <Link
            href={`/projects/${project.id}`}
            className="before:absolute before:inset-0 before:content-['']"
          >
            {project.title}
          </Link>
        </h3>
        {project.ai_summary ? (
          <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-soft">
            {project.ai_summary}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tech_stack.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="outline">
              {tech}
            </Badge>
          ))}
        </div>

        <div className="mt-auto pt-3.5">
          {wantsPeople ? (
            <Badge variant="lilac">
              Looking for: {project.looking_for.join(", ")}
            </Badge>
          ) : (
            <Badge
              variant={project.status === "completed" ? "mint" : "neutral"}
            >
              {STATUS_LABEL[project.status]}
            </Badge>
          )}
        </div>
      </div>
    </motion.article>
  );
}
