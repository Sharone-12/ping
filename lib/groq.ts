const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Groq's Llama 3.x instruct models were retired; gpt-oss-20b is the current
 * open-weight model on the platform and returns strict JSON reliably at ~1s
 * per email. Override with GROQ_MODEL if that changes again.
 */
export const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";

export class GroqError extends Error {}

const MAX_RETRIES = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function groqJSON<T>({
  system,
  user,
  signal,
}: {
  system: string;
  user: string;
  signal?: AbortSignal;
}): Promise<T> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new GroqError("GROQ_API_KEY is not set.");

  let res: Response | null = null;

  // Free-tier rate limits bite once a real inbox is being read. Back off and
  // retry rather than dropping the email on the floor.
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    res = await callGroq(key, system, user, signal);
    if (res.status !== 429) break;

    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(8000, 2 ** attempt * 500);
    if (attempt === MAX_RETRIES) break;
    await sleep(waitMs);
  }

  if (!res) throw new GroqError("Groq request never ran.");
  return readGroqJSON<T>(res);
}

function callGroq(
  key: string,
  system: string,
  user: string,
  signal?: AbortSignal,
) {
  return fetch(GROQ_URL, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
}

async function readGroqJSON<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new GroqError(`Groq ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? "";

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Salvage a JSON object if the model wrapped it in prose or fences.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* fall through */
      }
    }
    throw new GroqError(`Model did not return JSON: ${raw.slice(0, 160)}`);
  }
}
