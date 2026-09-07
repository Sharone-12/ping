"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
      <div>
        <h1 className="text-[30px] font-extrabold tracking-tight text-ink">
          Something broke.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:opacity-85"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
