import Link from "next/link";
import { PageTransition } from "@/components/PageTransition";
import { ProjectForm } from "./ProjectForm";

export default function NewProjectPage() {
  return (
    <PageTransition>
      <main className="mx-auto max-w-2xl px-6 py-8 sm:py-12">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          <span aria-hidden="true">←</span> Back to projects
        </Link>

        <h1 className="mt-5 text-[32px] font-extrabold tracking-[-0.03em] text-ink sm:text-[40px]">
          Add your project
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
          Publish what you are building so other students can find it — and find
          you.
        </p>

        <ProjectForm />
      </main>
    </PageTransition>
  );
}
