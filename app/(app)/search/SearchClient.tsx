"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AIAnswerCard } from "@/components/AIAnswerCard";
import { EventCard } from "@/components/EventCard";
import { EmptyScene } from "@/components/illustrations/EmptyScene";
import { SearchBar } from "@/components/ui/SearchBar";
import { isPast } from "@/lib/utils";
import type { CampusEvent } from "@/types";

const SUGGESTIONS = [
  "Any ML workshops coming up?",
  "Hackathons with cash prizes",
  "What is happening this week?",
  "Beginner-friendly events",
  "Anything from my department?",
];

type Phase = "idle" | "searching" | "done" | "error";

export function SearchClient({ savedIds }: { savedIds: string[] }) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<CampusEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [asked, setAsked] = useState("");
  const saved = new Set(savedIds);

  async function run(q: string) {
    const text = q.trim();
    if (!text || phase === "searching") return;

    setQuery(text);
    setAsked(text);
    setPhase("searching");
    setError(null);
    setResults([]);
    setAnswer("");

    try {
      const res = await fetch("/api/events/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = (await res.json()) as {
        answer?: string;
        events?: CampusEvent[];
        error?: string;
      };
      if (!res.ok) {
        setPhase("error");
        setError(data.error ?? "Search failed.");
        return;
      }
      setAnswer(data.answer ?? "");
      setResults(data.events ?? []);
      setPhase("done");
    } catch {
      setPhase("error");
      setError("Could not reach the server.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <span aria-hidden="true">←</span> Back
      </Link>

      <h1 className="mt-5 text-[32px] font-extrabold tracking-[-0.03em] text-ink sm:text-[40px]">
        AI Search
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
        Ask in plain English. Every campus event is searched by meaning, not
        keywords.
      </p>

      <div className="mt-6">
        <SearchBar
          autoFocus
          value={query}
          onChange={setQuery}
          onSubmit={() => run(query)}
        />
      </div>

      <div className="no-scrollbar -mx-6 mt-4 flex gap-2 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:px-0">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => run(s)}
            className="shrink-0 whitespace-nowrap rounded-full border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:border-ink-muted"
          >
            {s}
          </button>
        ))}
      </div>

      {phase === "searching" ? (
        <section className="mt-9">
          <p className="text-[13px] font-semibold text-ink-muted">
            Searching for “{asked}”
          </p>
          <div className="mt-3.5 rounded-card border border-line bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-mint-ink" />
              <p className="text-[13.5px] font-semibold text-ink">
                Reading every event…
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-deep">
              <motion.div
                className="h-full w-1/3 rounded-full bg-ink"
                animate={{ x: ["-100%", "300%"] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>
        </section>
      ) : null}

      {phase === "error" ? (
        <p className="mt-8 rounded-card bg-alert px-5 py-4 text-[13.5px] font-medium text-alert-ink">
          {error}
        </p>
      ) : null}

      {phase === "done" ? (
        <section className="mt-9">
          <p className="text-[13px] font-semibold text-ink-muted">
            Results for “{asked}”
          </p>

          <div className="mt-3.5">
            <AIAnswerCard answer={answer} />
          </div>

          {results.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {results.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  saved={saved.has(event.id)}
                  index={i}
                  past={isPast(event.date_start, event.date_end)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center rounded-card border border-line bg-white px-6 py-10 text-center">
              <EmptyScene className="h-24 w-auto" />
              <p className="mt-4 text-[13.5px] text-ink-soft">
                Nothing matched. Try asking a different way.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
