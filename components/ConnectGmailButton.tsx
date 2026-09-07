"use client";

import { useState } from "react";
import { CheckIcon, MailIcon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/client";

/**
 * Opt-in Gmail authorisation, kept separate from login.
 *
 * gmail.readonly is a Google *restricted* scope: until the app passes OAuth
 * verification and a CASA security assessment, only accounts listed as test
 * users in the Google Cloud consent screen can grant it. Keeping it out of the
 * login request is what lets everyone else sign in normally.
 */
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export function ConnectGmailButton({ connected }: { connected: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/profile");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        scopes: GMAIL_SCOPE,
        // offline + consent are what make Google return a refresh token, the
        // only way a later sync can run without the user present.
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  if (connected) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-transparent bg-mint px-5 py-2.5 text-[13px] font-semibold text-mint-ink">
        <CheckIcon size={14} /> Gmail connected
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1.5">
      <button
        type="button"
        onClick={connect}
        disabled={loading}
        className="rounded-full border border-line bg-white px-5 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-ink-muted disabled:opacity-60"
      >
        <span className="inline-flex items-center gap-2">
          <MailIcon size={15} />
          {loading ? "Redirecting…" : "Connect Gmail"}
        </span>
      </button>
      {error ? (
        <span className="text-[12px] font-medium text-alert-ink">{error}</span>
      ) : null}
    </span>
  );
}
