import Link from "next/link";
import { HeroScene } from "@/components/illustrations/HeroScene";
import { FeatureTiles } from "@/components/FeatureTiles";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

/**
 * Single-screen landing: header / hero / feature strip fill exactly 100dvh on
 * large viewports with nothing below the fold. Small screens fall back to
 * normal document flow, since this content cannot fit a phone without
 * shrinking it past legibility.
 */
export default function LandingPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <div className="landing-fixed flex min-h-dvh flex-col">
      <header className="shrink-0 border-b border-line">
        <div className="mx-auto flex h-16 max-w-shell items-center justify-between px-6">
          <span className="text-[15px] font-extrabold tracking-[-0.02em] text-ink">
            LICET Pulse
          </span>
          <Link
            href="#hero"
            className="text-[13px] font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main
        id="hero"
        className="flex min-h-0 flex-1 items-center px-6 py-12 lg:py-4"
      >
        <div className="mx-auto grid w-full max-w-shell items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-xl">
            <h1 className="landing-title text-[36px] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink sm:text-[46px]">
              Never miss a campus event again.
            </h1>
            <p className="landing-sub mt-4 max-w-lg text-[15.5px] leading-[1.55] text-ink-soft">
              Hackathons, workshops and deadlines arrive as bulk email and get
              buried within a day. LICET Pulse reads them for you and turns them
              into one feed you can actually search.
            </p>

            {searchParams.error ? (
              <p className="mt-6 max-w-md rounded-soft bg-alert px-4 py-3 text-[13px] font-medium text-alert-ink">
                {searchParams.error}
              </p>
            ) : null}

            <div className="mt-7 flex flex-col items-start gap-3">
              <GoogleSignInButton next={searchParams.next} />
              <p className="text-[12.5px] text-ink-muted">
                Any Google account · takes one click
              </p>
            </div>
          </div>

          <HeroScene className="landing-art mx-auto hidden h-auto lg:block" />
        </div>
      </main>

      <section className="shrink-0">
        <FeatureTiles />
      </section>
    </div>
  );
}
