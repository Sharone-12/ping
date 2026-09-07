import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
      <div>
        <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          404
        </p>
        <h1 className="mt-4 text-[30px] font-extrabold tracking-tight text-ink">
          Nothing here.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          That page does not exist, or the event has been taken down.
        </p>
        <Link
          href="/feed"
          className="mt-7 inline-flex rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:opacity-85"
        >
          Back to the feed
        </Link>
      </div>
    </main>
  );
}
