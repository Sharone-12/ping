import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();

  const forwardedHost = request.headers.get("x-forwarded-host");
  const base = forwardedHost
    ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${forwardedHost}`
    : new URL(request.url).origin;

  return NextResponse.redirect(base, { status: 303 });
}
