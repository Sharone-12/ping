import { groqJSON } from "@/lib/groq";
import type { FormField } from "@/lib/google-form";

export interface MappedField extends FormField {
  value: string | null;
  confidence: "high" | "medium" | "low";
  needs_user_input: boolean;
  unsupported: boolean;
}

export interface AgentProfile {
  full_name: string | null;
  email: string | null;
  department: string | null;
  year: number | null;
  phone: string | null;
  registration_number: string | null;
  section: string | null;
  college: string;
}

const SYSTEM_PROMPT = `You are a form-filling assistant for a college event registration app. You are given a student's profile and the fields of a registration form. Map each field to the correct value from the profile.

Rules:
- "Name", "Your Name", "Participant Name", "Full Name", "Student Name" map to full_name.
- "Department", "Branch", "Dept", "Stream" map to department.
- "Year", "Year of Study", "Current Year" map to year.
- "Email", "Email ID", "Mail ID", "College Email" map to email.
- "Phone", "Mobile", "Contact Number", "WhatsApp Number" map to phone.
- "Register Number", "Roll No", "Reg No", "Registration Number", "University Number" map to registration_number.
- "Section" maps to section. "College", "Institution", "College Name" map to college.
- For radio, dropdown or checkbox fields you MUST return one of the given options, copied exactly. Choose the option that best matches the profile. If none matches, set value to null and needs_user_input to true.
- If a field asks for something not in the profile (an essay, team name, project idea, a preference, "why do you want to attend"), set value to null and needs_user_input to true.
- CRITICAL — only fill fields that are about THIS student. Team forms repeat the same questions for each member, marked with things like "(M2)", "(M3)", "Member 2", "Participant 3", "Teammate", or a number. Fill only the first person's set — the one marked lead, member 1, M1, or unmarked. For every other member, set value to null and needs_user_input to true. Putting the same student's name and email in every member slot is always wrong.
- If the field type is "file", set value to null and unsupported to true.
- Never invent a phone number, roll number or any personal detail that is not in the profile. If the profile value is missing, set value to null and needs_user_input to true.
- confidence is "high" for a direct profile match, "medium" for an inferred one, "low" for a guess.

Respond ONLY with valid JSON in this exact shape:
{"fields": [{"entry_id": "entry.123", "value": "...", "confidence": "high", "needs_user_input": false, "unsupported": false}]}`;

/** Fields the agent must never fill automatically, regardless of the model. */
const PAYMENT_PATTERN =
  /\b(payment|paid|amount|fee|upi|transaction|razorpay|paytm|gpay|screenshot of payment)\b/i;

export function detectsPayment(fields: FormField[]): boolean {
  return fields.some((f) => PAYMENT_PATTERN.test(f.label));
}

export async function mapFieldsToProfile(
  fields: FormField[],
  profile: AgentProfile,
): Promise<MappedField[]> {
  const compact = fields.map((f) => ({
    entry_id: f.entry_id,
    label: f.label,
    type: f.type,
    required: f.required,
    options: f.options,
  }));

  let mapped: Record<string, Partial<MappedField>> = {};

  try {
    const result = await groqJSON<{ fields?: Partial<MappedField>[] }>({
      system: SYSTEM_PROMPT,
      user: JSON.stringify({ profile, fields: compact }),
    });
    for (const f of result.fields ?? []) {
      if (f.entry_id) mapped[f.entry_id] = f;
    }
  } catch {
    // Model unavailable — fall through to an all-manual preview rather than
    // failing the whole registration.
    mapped = {};
  }

  return fields.map((field) => {
    const m = mapped[field.entry_id];
    const unsupported = field.type === "file" || m?.unsupported === true;

    let value = typeof m?.value === "string" ? m.value.trim() : null;
    if (!value) value = null;

    // Never let the model invent an option that is not on the form.
    if (value && field.options && !field.options.includes(value)) {
      const ci = field.options.find(
        (o) => o.toLowerCase() === value!.toLowerCase(),
      );
      value = ci ?? null;
    }

    return {
      ...field,
      value: unsupported ? null : value,
      confidence: m?.confidence ?? "low",
      needs_user_input: unsupported ? false : value === null,
      unsupported,
    };
  });
}
