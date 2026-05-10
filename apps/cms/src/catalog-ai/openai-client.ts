export type ChatJsonResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Calls OpenAI Chat Completions with JSON mode. Server-side only — never expose API key to browsers.
 */
export async function openAiChatJson<T = unknown>(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<ChatJsonResult<T>> {
  const key = opts.apiKey.trim();
  if (!key) return { ok: false as const, error: 'OPENAI_API_KEY is empty' };

  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.55,
      }),
    });
  } catch (e: any) {
    return { ok: false as const, error: e?.message || 'OpenAI fetch failed' };
  }

  const rawText = await res.text();
  let raw: any;
  try {
    raw = rawText ? JSON.parse(rawText) : {};
  } catch {
    return { ok: false as const, error: `OpenAI non-JSON response (${res.status}): ${rawText.slice(0, 200)}` };
  }

  if (!res.ok) {
    const msg = raw?.error?.message || rawText.slice(0, 400);
    return { ok: false as const, error: `OpenAI HTTP ${res.status}: ${msg}` };
  }

  const content = raw?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    return { ok: false as const, error: 'OpenAI returned empty message content' };
  }

  try {
    const data = JSON.parse(content) as T;
    return { ok: true as const, data };
  } catch {
    return { ok: false as const, error: `OpenAI content was not valid JSON: ${content.slice(0, 240)}` };
  }
}
