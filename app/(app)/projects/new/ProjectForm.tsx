"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { createProject } from "@/app/actions/projects";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "active", label: "In progress" },
  { value: "looking-for-team", label: "Looking for team" },
  { value: "completed", label: "Complete" },
] as const;

export function ProjectForm() {
  const [state, formAction] = useFormState(createProject, {});
  const [status, setStatus] = useState<string>("active");

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <input type="hidden" name="status" value={status} />

      <Field
        label="Title"
        hint="What is it called?"
        name="title"
        placeholder="FailSafe AI"
        required
      />

      <div>
        <label
          htmlFor="description"
          className="text-[13px] font-bold tracking-[-0.01em] text-ink"
        >
          What does it do?
        </label>
        <p className="mt-0.5 text-[12.5px] text-ink-soft">
          A couple of sentences in your own words. The summary and tags on your
          card are generated from this.
        </p>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="A multi-agent system that reviews a codebase for security issues before code reaches production…"
          className="mt-2 w-full resize-y rounded-soft border border-line bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-muted focus:border-ink-muted"
        />
      </div>

      <Field
        label="Tech stack"
        hint="Comma separated."
        name="tech_stack"
        placeholder="Python, LangGraph, FastAPI"
      />

      <div>
        <span className="text-[13px] font-bold tracking-[-0.01em] text-ink">
          Status
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              aria-pressed={status === s.value}
              className={cn(
                "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
                status === s.value
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink-soft hover:border-ink-muted hover:text-ink",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Field
        label="Looking for"
        hint="Roles you need. Comma separated — leave blank if none."
        name="looking_for"
        placeholder="Frontend Dev, Designer"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="GitHub"
          hint="Optional."
          name="github_url"
          placeholder="https://github.com/you/project"
          type="url"
        />
        <Field
          label="Live demo"
          hint="Optional."
          name="demo_url"
          placeholder="https://project.example.com"
          type="url"
        />
      </div>

      {state.error ? (
        <p className="rounded-soft bg-alert px-4 py-3 text-[13px] font-medium text-alert-ink">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 border-t border-line pt-6">
        <Submit />
        <Link
          href="/projects"
          className="text-[13px] font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
    >
      {pending ? "Summarising with AI…" : "Publish project"}
    </button>
  );
}

function Field({
  label,
  hint,
  name,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  hint: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="text-[13px] font-bold tracking-[-0.01em] text-ink"
      >
        {label}
        {required ? <span className="text-alert-ink"> *</span> : null}
      </label>
      <p className="mt-0.5 text-[12.5px] text-ink-soft">{hint}</p>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-soft border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted focus:border-ink-muted"
      />
    </div>
  );
}
