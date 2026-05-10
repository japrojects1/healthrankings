export type LlmJsonResult<T> = { ok: true; data: T } | { ok: false; error: string };

function stripMarkdownJsonFence(text: string): string {
  const t = text.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (m) return m[1].trim();
  return t;
}

/**
 * Anthropic Messages API — server-side only. Returns parsed JSON from the assistant text block.
 * @see https://docs.anthropic.com/en/api/messages
 */
export async function anthropicMessagesJson<T = unknown>(opts: {
  apiKey: string;
  model: string;
  apiVersion?: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<LlmJsonResult<T>> {
  const key = opts.apiKey.trim();
  if (!key) return { ok: false, error: 'ANTHROPIC_API_KEY is empty' };

  const apiVersion = String(opts.apiVersion || process.env.ANTHROPIC_API_VERSION || '2023-06-01').trim();
  const maxTokens = Math.min(Math.max(opts.maxTokens ?? 8192, 256), 8192);

  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': apiVersion,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: maxTokens,
        system: opts.system,
        messages: [{ role: 'user', content: opts.user }],
      }),
    });
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Anthropic fetch failed' };
  }

  const rawText = await res.text();
  let raw: any;
  try {
    raw = rawText ? JSON.parse(rawText) : {};
  } catch {
    return { ok: false, error: `Anthropic non-JSON response (${res.status}): ${rawText.slice(0, 200)}` };
  }

  if (!res.ok) {
    const msg = raw?.error?.message || rawText.slice(0, 400);
    return { ok: false, error: `Anthropic HTTP ${res.status}: ${msg}` };
  }

  const blocks = raw?.content;
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { ok: false, error: 'Anthropic returned empty content' };
  }

  const textBlock = blocks.find((b: any) => b?.type === 'text');
  const content = textBlock?.text;
  if (typeof content !== 'string' || !content.trim()) {
    return { ok: false, error: 'Anthropic returned no text block' };
  }

  const jsonSlice = stripMarkdownJsonFence(content);

  try {
    const data = JSON.parse(jsonSlice) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: `Anthropic content was not valid JSON: ${jsonSlice.slice(0, 240)}` };
  }
}
