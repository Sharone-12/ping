import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiSearch } from "@/lib/ai-search";
import type { CampusEvent } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query: string;
  try {
    const body = (await request.json()) as { query?: string };
    query = (body.query ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json(
      { error: "A question is required" },
      { status: 400 },
    );
  }
  if (query.length > 400) {
    return NextResponse.json(
      { error: "That question is too long" },
      { status: 400 },
    );
  }

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .order("date_start", { ascending: true, nullsFirst: false });

  const events = (data ?? []) as CampusEvent[];

  try {
    const result = await aiSearch(query, events);
    const byId = new Map(events.map((e) => [e.id, e]));
    return NextResponse.json({
      answer: result.answer,
      no_results: result.no_results,
      events: result.event_ids
        .map((id) => byId.get(id))
        .filter((e): e is CampusEvent => Boolean(e)),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Search is unavailable right now.",
      },
      { status: 502 },
    );
  }
}
