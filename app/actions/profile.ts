"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SaveProfileState {
  error?: string;
  saved?: boolean;
}

/** Persists the onboarding answers, then sends the user to the feed. */
export async function completeOnboarding(
  _prev: SaveProfileState,
  formData: FormData,
): Promise<SaveProfileState> {
  const department = String(formData.get("department") ?? "").trim();
  const yearRaw = String(formData.get("year") ?? "").trim();
  const interests = formData.getAll("interests").map(String).filter(Boolean);

  if (!department) return { error: "Pick your department to continue." };

  const year = Number(yearRaw);
  if (!Number.isInteger(year) || year < 1 || year > 4) {
    return { error: "Pick your year to continue." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const clean = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v.length ? v : null;
  };

  const { error } = await supabase
    .from("users")
    .update({
      department,
      year,
      interests,
      phone: clean("phone"),
      registration_number: clean("registration_number"),
      section: clean("section"),
      onboarded: true,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/feed");
  revalidatePath("/profile");
  redirect("/feed");
}

/** Used by the profile page's Edit control. */
export async function updateInterests(
  _prev: SaveProfileState,
  formData: FormData,
): Promise<SaveProfileState> {
  const department = String(formData.get("department") ?? "").trim();
  const year = Number(String(formData.get("year") ?? ""));
  const interests = formData.getAll("interests").map(String).filter(Boolean);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const patch: Record<string, unknown> = { interests };
  if (department) patch.department = department;
  if (Number.isInteger(year) && year >= 1 && year <= 4) patch.year = year;

  const { error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/feed");
  return {};
}

/** Phone / roll number / section — the fields the registration agent needs. */
export async function updateRegistrationDetails(
  _prev: SaveProfileState,
  formData: FormData,
): Promise<SaveProfileState> {
  const clean = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v.length ? v : null;
  };

  const phone = clean("phone");
  if (phone && !/^[\d+\-\s()]{6,20}$/.test(phone)) {
    return { error: "That phone number does not look right." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const patch: Record<string, unknown> = {
    phone,
    registration_number: clean("registration_number"),
    section: clean("section"),
  };

  // Google supplies a display name like "ANTONY THOMAS SHARONE A 28AD" with a
  // batch code appended. Let the student set what actually goes on forms.
  const fullName = clean("full_name");
  if (fullName) patch.full_name = fullName;

  const department = clean("department");
  if (department) patch.department = department;

  const year = Number(String(formData.get("year") ?? ""));
  if (Number.isInteger(year) && year >= 1 && year <= 4) patch.year = year;

  const { error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { saved: true };
}
