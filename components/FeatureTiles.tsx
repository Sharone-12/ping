import { Badge } from "@/components/ui/Badge";

/**
 * Landing feature tiles: coloured panels each holding a compact preview of the
 * real UI. Previews sit fully inside their tile — nothing is clipped. Marketing
 * surface only; app screens stay neutral so category pastels keep their meaning.
 */
export function FeatureTiles() {
  return (
    <div className="px-6 pb-8">
      <div className="mx-auto grid w-full max-w-shell gap-4 sm:grid-cols-3">
        <Tile
          bg="bg-butter"
          title="Inbox becomes a feed"
          body="Buried announcements become structured, dated cards."
        >
          <InboxWidget />
        </Tile>

        <Tile
          bg="bg-mint"
          title="Ask in plain English"
          body="Real answers with the matching events, not keyword soup."
        >
          <SearchWidget />
        </Tile>

        <Tile
          bg="bg-lilac"
          title="Find your team"
          body="Publish what you build and find the people who fill your gaps."
        >
          <TeamWidget />
        </Tile>
      </div>
    </div>
  );
}

function Tile({
  bg,
  title,
  body,
  children,
}: {
  bg: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`landing-tile flex flex-col rounded-card ${bg} p-5`}>
      <h2 className="landing-tile-title text-[17px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
        {title}
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-snug text-ink/65">{body}</p>
      <div className="mt-auto pt-4" aria-hidden="true">
        {children}
      </div>
    </article>
  );
}

function InboxWidget() {
  return (
    <div className="space-y-1.5">
      <div className="truncate rounded-lg bg-white/55 px-2.5 py-1.5 text-[10px] font-medium text-ink/45">
        Re: Circular 44 — attendance
      </div>
      <div className="rounded-xl border border-line bg-white px-3 py-2.5 shadow-soft">
        <span className="rounded-full bg-mint px-2 py-0.5 text-[9.5px] font-bold text-mint-ink">
          Workshop
        </span>
        <p className="mt-1.5 truncate text-[11.5px] font-extrabold leading-tight text-ink">
          Google DSC ML Workshop
        </p>
        <p className="mt-0.5 text-[10px] font-semibold text-ink-muted">
          Sep 12 · CS Lab 3
        </p>
      </div>
    </div>
  );
}

function SearchWidget() {
  return (
    <div className="space-y-1.5">
      <div className="truncate rounded-full border border-line bg-white px-3 py-1.5 text-[10.5px] font-medium text-ink/70">
        any hackathons with prizes?
      </div>
      <div className="rounded-xl border border-line bg-white p-2.5 shadow-soft">
        <div className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-lilac" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">
            AI answer
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-ink/75">
          Two coming up — Inter-College Hackathon (₹50K) and the Cybersecurity
          CTF.
        </p>
      </div>
    </div>
  );
}

function TeamWidget() {
  return (
    <div className="rounded-xl border border-line bg-white p-3 shadow-soft">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-butter text-[15px] font-extrabold text-ink/60">
          F
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11.5px] font-extrabold text-ink">
            FailSafe AI
          </p>
          <p className="truncate text-[9.5px] font-medium text-ink-muted">
            Python · LangGraph
          </p>
        </div>
      </div>
      <div className="mt-2.5">
        <Badge variant="peach" className="text-[9.5px]">
          Looking for: Frontend Dev
        </Badge>
      </div>
    </div>
  );
}
