import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where to send the user back to. Derived from the request rather than an env
 * var so dev on any port, Vercel preview URLs, and production all work without
 * configuration. Behind a proxy the forwarded headers carry the real host.
 */
function resolveBase(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

/**
 * True when the granted scopes include Gmail read access. Never throws — a
 * failure here must not break sign-in, it just leaves Gmail marked unconnected.
 */
async function hasGmailScope(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return false;
    const info = (await res.json()) as { scope?: string };
    return (
      typeof info.scope === "string" && info.scope.includes("gmail.readonly")
    );
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error");

  const base = resolveBase(request);

  if (oauthError) {
    return NextResponse.redirect(
      `${base}/?error=${encodeURIComponent(oauthError)}`,
    );
  }
  if (!code) {
    return NextResponse.redirect(`${base}/?error=missing_code`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      `${base}/?error=${encodeURIComponent(error?.message ?? "auth_failed")}`,
    );
  }

  const { user, provider_token, provider_refresh_token } = data.session;

  // A plain login also returns a provider_token (for email/profile), so the
  // token's presence says nothing about Gmail. Ask Google what was actually
  // granted before claiming the mailbox is connected.
  const gmailGranted = provider_token
    ? await hasGmailScope(provider_token)
    : false;

  const profile: Record<string, unknown> = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata.full_name ?? user.user_metadata.name ?? null,
    avatar_url:
      user.user_metadata.avatar_url ?? user.user_metadata.picture ?? null,
  };

  if (gmailGranted) {
    profile.gmail_access_token = provider_token;
    profile.gmail_connected = true;
    // Google returns the refresh token only on a fresh consent, so persist it
    // whenever one shows up and never overwrite a stored one with null.
    if (provider_refresh_token) {
      profile.gmail_refresh_token = provider_refresh_token;
    }
  }

  const { error: upsertError } = await supabase
    .from("users")
    .upsert(profile, { onConflict: "id" });

  if (upsertError) {
    return NextResponse.redirect(
      `${base}/?error=${encodeURIComponent(`profile: ${upsertError.message}`)}`,
    );
  }

  const { data: row } = await supabase
    .from("users")
    .select("onboarded")
    .eq("id", user.id)
    .single();

  if (!row?.onboarded) {
    return NextResponse.redirect(`${base}/onboarding`);
  }
  return NextResponse.redirect(
    `${base}${next && next.startsWith("/") ? next : "/feed"}`,
  );
}
