"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ToggleSaveResult {
  saved: boolean;
  error?: string;
}

/** Toggle a bookmark for the signed-in user. Returns the resulting state. */
export async function toggleSaveEvent(
  eventId: string,
  currentlySaved: boolean,
): Promise<ToggleSaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { saved: currentlySaved, error: "Not signed in." };

  if (currentlySaved) {
    const { error } = await supabase
      .from("saved_events")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", eventId);

    if (error) return { saved: true, error: error.message };
    revalidatePath("/feed");
    revalidatePath("/profile");
    return { saved: false };
  }

  const { error } = await supabase
    .from("saved_events")
    .insert({ user_id: user.id, event_id: eventId });

  if (error) {
    // 23503 = foreign key violation: the event row does not exist yet, which
    // happens when supabase/seed.sql has not been run.
    const message =
      error.code === "23503"
        ? "Run supabase/seed.sql so events exist in the database."
        : error.message;
    return { saved: false, error: message };
  }

  revalidatePath("/feed");
  revalidatePath("/profile");
  return { saved: true };
}
