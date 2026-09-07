import { FeedClient } from "./FeedClient";
import { AutoSync } from "@/components/AutoSync";
import { getEvents, getRegisteredEventIds, getSavedEventIds } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function FeedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ events }, savedIds, registeredIds, profileResult] =
    await Promise.all([
      getEvents(),
      getSavedEventIds(),
      getRegisteredEventIds(),
      supabase
        .from("users")
        .select("department, interests, gmail_connected, last_synced_at")
        .eq("id", user!.id)
        .single(),
    ]);

  const profile = profileResult.data;
  // Server enforces the real throttle; this just avoids a pointless request.
  const lastSynced = profile?.last_synced_at
    ? new Date(profile.last_synced_at).getTime()
    : 0;
  const due =
    Boolean(profile?.gmail_connected) &&
    Date.now() - lastSynced > 30 * 60 * 1000;

  return (
    <>
      <AutoSync due={due} />
      <FeedClient
        events={events}
        savedIds={Array.from(savedIds)}
        registeredIds={Array.from(registeredIds)}
        department={profile?.department ?? null}
        interests={profile?.interests ?? []}
      />
    </>
  );
}
