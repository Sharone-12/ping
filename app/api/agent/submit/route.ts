import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildPrefilledUrl,
  isGoogleForm,
  submitGoogleForm,
} from "@/lib/google-form";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const XP_PER_REGISTRATION = 50;

interface SubmitBody {
  event_id?: string;
  form_url?: string;
  fields?: { entry_id: string; value: string | string[] }[];
  /** "auto" submits the form; "prefill" opens it filled; "manual" only records. */
  method?: "auto" | "prefill" | "manual";
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { event_id, form_url, fields = [], method = "auto" } = body;
  if (!event_id) {
    return NextResponse.json(
      { error: "event_id is required" },
      { status: 400 },
    );
  }

  let prefillUrl: string | null = null;
  let submitted = false;

  if (method === "auto" || method === "prefill") {
    if (!form_url || !isGoogleForm(form_url)) {
      return NextResponse.json(
        { error: "A Google Form URL is required." },
        { status: 400 },
      );
    }

    if (method === "auto") {
      const result = await submitGoogleForm(form_url, fields);
      if (!result.ok) {
        // Submission failed. Hand back a pre-filled link so the user still has
        // a one-click path instead of a dead end, and record nothing — the
        // registration did not happen.
        return NextResponse.json(
          {
            success: false,
            error: result.message,
            prefill_url: buildPrefilledUrl(form_url, fields),
          },
          { status: 502 },
        );
      }
      submitted = true;
    } else {
      prefillUrl = buildPrefilledUrl(form_url, fields);
    }
  }

  const { error } = await supabase.from("event_registrations").upsert(
    {
      user_id: user.id,
      event_id,
      status: "registered",
      registered_via: method === "manual" ? "manual" : "agent",
      xp_awarded: XP_PER_REGISTRATION,
    },
    { onConflict: "user_id,event_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    submitted,
    prefill_url: prefillUrl,
    xp_earned: XP_PER_REGISTRATION,
    message: submitted
      ? "Submitted — Google confirmed your response was recorded."
      : method === "prefill"
        ? "Form pre-filled. Press Submit on the form to finish."
        : "Marked as registered.",
  });
}
