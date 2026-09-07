/**
 * Google Form reader.
 *
 * Google embeds the whole form definition in a `FB_PUBLIC_LOAD_DATA_` script as
 * a positional array. That shape is undocumented and Google can change it, so
 * every access here is defensive and failures are reported with a reason rather
 * than thrown — the UI falls back to "open the form yourself".
 */

export type FieldType =
  | "text"
  | "paragraph"
  | "radio"
  | "dropdown"
  | "checkbox"
  | "linear"
  | "grid"
  | "date"
  | "time"
  | "file"
  | "unknown";

const TYPE_MAP: Record<number, FieldType> = {
  0: "text",
  1: "paragraph",
  2: "radio",
  3: "dropdown",
  4: "checkbox",
  5: "linear",
  7: "grid",
  9: "date",
  10: "time",
  13: "file",
};

export interface FormField {
  entry_id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[] | null;
}

export type FormFailure =
  | "not_a_google_form"
  | "closed"
  | "needs_signin"
  | "unreadable"
  | "fetch_failed";

export type FormReadResult =
  | { ok: true; formUrl: string; title: string | null; fields: FormField[] }
  | { ok: false; reason: FormFailure; formUrl: string; message: string };

export function isGoogleForm(url: string | null | undefined): boolean {
  if (!url) return false;
  return /(?:docs\.google\.com\/forms|forms\.gle)/i.test(url);
}

/** Normalises forms.gle short links and /edit or /closedform variants. */
function toViewform(finalUrl: string): string {
  return finalUrl
    .replace(/\?.*$/, "")
    .replace(/\/(closedform|edit|viewanalytics)\/?$/, "/viewform");
}

export async function readGoogleForm(url: string): Promise<FormReadResult> {
  if (!isGoogleForm(url)) {
    return {
      ok: false,
      reason: "not_a_google_form",
      formUrl: url,
      message: "This registration link is not a Google Form.",
    };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LICETPulse/1.0)" },
    });
  } catch {
    return {
      ok: false,
      reason: "fetch_failed",
      formUrl: url,
      message: "Could not reach the form.",
    };
  }

  const finalUrl = res.url || url;
  const html = await res.text();

  if (
    /\/closedform/i.test(finalUrl) ||
    /no longer accepting responses/i.test(html)
  ) {
    return {
      ok: false,
      reason: "closed",
      formUrl: toViewform(finalUrl),
      message: "Registration is closed for this event.",
    };
  }

  if (/accounts\.google\.com|ServiceLogin/i.test(finalUrl)) {
    return {
      ok: false,
      reason: "needs_signin",
      formUrl: toViewform(finalUrl),
      message: "This form requires a Google sign-in. Opening it for you.",
    };
  }

  const match = html.match(
    /FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]*?);\s*<\/script>/,
  );
  if (!match) {
    return {
      ok: false,
      reason: "unreadable",
      formUrl: toViewform(finalUrl),
      message: "Could not read this form's fields.",
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return {
      ok: false,
      reason: "unreadable",
      formUrl: toViewform(finalUrl),
      message: "Could not read this form's fields.",
    };
  }

  const fields = extractFields(data);
  if (fields.length === 0) {
    return {
      ok: false,
      reason: "unreadable",
      formUrl: toViewform(finalUrl),
      message: "No fillable fields found on this form.",
    };
  }

  return {
    ok: true,
    formUrl: toViewform(finalUrl),
    title: readTitle(data),
    fields,
  };
}

function readTitle(data: unknown): string | null {
  const root = data as unknown[];
  const section = root?.[1] as unknown[] | undefined;
  const title = section?.[8];
  return typeof title === "string" && title.trim() ? title : null;
}

/**
 * `data[1][1]` is the question list. Each question is roughly
 * `[id, label, help, typeEnum, entries]`, where `entries` is an array because a
 * single grid question owns several entry ids. Each entry is
 * `[entryId, options, required]`.
 */
function extractFields(data: unknown): FormField[] {
  const root = data as unknown[];
  const section = root?.[1] as unknown[] | undefined;
  const questions = section?.[1];
  if (!Array.isArray(questions)) return [];

  const out: FormField[] = [];

  for (const q of questions) {
    if (!Array.isArray(q)) continue;

    const label = typeof q[1] === "string" ? q[1] : "";
    const typeEnum = typeof q[3] === "number" ? q[3] : -1;
    const type = TYPE_MAP[typeEnum] ?? "unknown";
    const entries = q[4];
    if (!Array.isArray(entries)) continue;

    for (const entry of entries) {
      if (!Array.isArray(entry)) continue;
      const entryId = entry[0];
      if (entryId === undefined || entryId === null) continue;

      const rawOptions = entry[1];
      const options = Array.isArray(rawOptions)
        ? rawOptions
            .map((o) => (Array.isArray(o) ? o[0] : o))
            .filter((o): o is string => typeof o === "string" && o.length > 0)
        : null;

      out.push({
        entry_id: `entry.${entryId}`,
        label: label || "Untitled question",
        type,
        required: entry[2] === 1,
        options: options && options.length ? options : null,
      });
    }
  }

  return out;
}

/**
 * Google's documented prefill format: `?usp=pp_url&entry.123=value`.
 * Checkbox answers repeat the same key once per selected option.
 */
export function buildPrefilledUrl(
  formUrl: string,
  values: { entry_id: string; value: string | string[] }[],
): string {
  const url = new URL(formUrl);
  url.search = "";
  url.searchParams.set("usp", "pp_url");

  for (const { entry_id, value } of values) {
    const list = Array.isArray(value) ? value : [value];
    for (const item of list) {
      if (typeof item === "string" && item.trim()) {
        url.searchParams.append(entry_id, item);
      }
    }
  }

  return url.toString();
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Submits a Google Form directly.
 *
 * Forms accept a plain form-encoded POST to /formResponse, so this needs no
 * headless browser. Success is confirmed by Google's own "response has been
 * recorded" page — a 200 alone is not proof, since Google returns 200 for a
 * rejected submission too.
 */
export async function submitGoogleForm(
  formUrl: string,
  values: { entry_id: string; value: string | string[] }[],
): Promise<SubmitResult> {
  const id = formUrl.match(/\/forms\/d\/e\/([^/]+)/)?.[1];
  if (!id) return { ok: false, message: "Could not identify the form." };

  const body = new URLSearchParams();
  for (const { entry_id, value } of values) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (typeof item === "string" && item.trim()) body.append(entry_id, item);
    }
  }
  body.append("fvv", "1");
  body.append("pageHistory", "0");
  body.append("fbzx", String(-1 * Math.floor(Math.random() * 1e18)));

  let res: Response;
  try {
    res = await fetch(
      `https://docs.google.com/forms/d/e/${id}/formResponse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (compatible; LICETPulse/1.0)",
        },
        body,
        redirect: "follow",
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, message: "Could not reach Google to submit the form." };
  }

  const html = await res.text();

  if (/no longer accepting responses/i.test(html)) {
    return { ok: false, message: "Registration closed before this was sent." };
  }
  if (!/response has been recorded/i.test(html)) {
    return {
      ok: false,
      message: "Google did not confirm the submission.",
    };
  }

  return { ok: true };
}
