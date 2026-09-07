import { createClient } from "@/lib/supabase/server";
import type { CampusEvent, Project } from "@/types";

/** Active events, soonest first. Real data only — no placeholder fallback. */
export async function getEvents(): Promise<{ events: CampusEvent[] }> {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .order("date_start", { ascending: true, nullsFirst: false });

  return { events: (data ?? []) as CampusEvent[] };
}

export async function getEventById(
  id: string,
): Promise<{ event: CampusEvent | null }> {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { event: (data as CampusEvent) ?? null };
}

export async function getSavedEventIds(): Promise<Set<string>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("saved_events")
    .select("event_id")
    .eq("user_id", user.id);

  return new Set((data ?? []).map((r) => r.event_id as string));
}

/** Every published project, newest first. */
export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as Project[];
}

export async function getRegisteredEventIds(): Promise<Set<string>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", user.id);

  return new Set((data ?? []).map((r) => r.event_id as string));
}

/** Total XP earned from registrations. */
export async function getTotalXp(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("event_registrations")
    .select("xp_awarded")
    .eq("user_id", user.id);

  return (data ?? []).reduce((sum, r) => sum + (r.xp_awarded ?? 0), 0);
}
