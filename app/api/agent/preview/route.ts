import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isGoogleForm, readGoogleForm } from "@/lib/google-form";
import { detectsPayment, mapFieldsToProfile } from "@/lib/form-mapper";

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

  let eventId: string;
  try {
    const body = (await request.json()) as { event_id?: string };
    if (!body.event_id) throw new Error("missing");
    eventId = body.event_id;
  } catch {
    return NextResponse.json(
      { error: "event_id is required" },
      { status: 400 },
    );
  }

  const [{ data: event }, { data: profile }, { data: existing }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, title, registration_link")
        .eq("id", eventId)
        .maybeSingle(),
      supabase
        .from("users")
        .select(
          "full_name, email, department, year, phone, registration_number, section",
        )
        .eq("id", user.id)
        .single(),
      supabase
        .from("event_registrations")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .maybeSingle(),
    ]);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (existing) {
    return NextResponse.json({
      status: "already_registered",
      message: "You have already registered for this event.",
    });
  }

  const link = event.registration_link;
  if (!link) {
    return NextResponse.json({
      status: "no_link",
      message: "No registration link was found in the announcement.",
    });
  }

  if (!isGoogleForm(link)) {
    return NextResponse.json({
      status: "manual",
      form_url: link,
      message: "This registration is not a Google Form — opening it for you.",
    });
  }

  const form = await readGoogleForm(link);
  if (!form.ok) {
    return NextResponse.json({
      status: form.reason === "closed" ? "closed" : "manual",
      form_url: form.formUrl,
      message: form.message,
    });
  }

  // Payment forms are never auto-filled or auto-submitted.
  if (detectsPayment(form.fields)) {
    return NextResponse.json({
      status: "payment",
      form_url: form.formUrl,
      message:
        "This form involves a payment. Opening it so you can complete it yourself.",
    });
  }

  const mapped = await mapFieldsToProfile(form.fields, {
    full_name: profile?.full_name ?? null,
    email: profile?.email ?? user.email ?? null,
    department: profile?.department ?? null,
    year: profile?.year ?? null,
    phone: profile?.phone ?? null,
    registration_number: profile?.registration_number ?? null,
    section: profile?.section ?? null,
    college: "Loyola-ICAM College of Engineering and Technology (LICET)",
  });

  return NextResponse.json({
    status: "ready",
    event: { id: event.id, title: event.title },
    form_url: form.formUrl,
    form_title: form.title,
    fields: mapped,
  });
}
