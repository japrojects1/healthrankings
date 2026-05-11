/**
 * OpenAI Images API (DALL·E) — server-side only. Used for optional article hero assets.
 * @see https://platform.openai.com/docs/api-reference/images/create
 */

export function buildArticleHeroVisualPrompt(
  title: string,
  subtitle?: string,
  brief?: string
): string {
  const theme = [title, subtitle, brief].filter(Boolean).join(' — ').slice(0, 900);
  return [
    'Create one wide editorial hero image for an independent consumer health website.',
    'Visual style: modern, clean, calm, soft natural light; cool neutrals with subtle green or blue accents.',
    'Use abstract shapes, gentle gradients, symbolic wellness motifs (e.g. heart rhythm line, leaves, soft geometry).',
    'Do not depict recognizable real people, faces, hands holding products, clinicians, or patients.',
    'No brand logos, no medicine packaging with readable text, no drug names, no company marks.',
    'No text, letters, numbers, watermarks, or UI mockups anywhere in the image.',
    'Theme inspiration (do not render as text in the image):',
    theme,
  ].join(' ');
}

export async function generateHeroImagePngWithOpenAI(opts: {
  apiKey: string;
  visualPrompt: string;
  model?: string;
}): Promise<
  | { ok: true; buffer: Buffer; mimeHint?: string; revisedPrompt?: string }
  | { ok: false; error: string }
> {
  const key = opts.apiKey.trim();
  if (!key) return { ok: false, error: 'OPENAI_API_KEY is empty' };

  const model =
    String(opts.model || process.env.OPENAI_IMAGE_MODEL || 'dall-e-3').trim() || 'dall-e-3';

  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: opts.visualPrompt.slice(0, 3500),
        n: 1,
        size: '1792x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    });
  } catch (e: any) {
    return { ok: false, error: e?.message || 'OpenAI image request failed' };
  }

  const rawText = await res.text();
  let raw: any;
  try {
    raw = rawText ? JSON.parse(rawText) : {};
  } catch {
    return { ok: false, error: `OpenAI image non-JSON (${res.status}): ${rawText.slice(0, 200)}` };
  }

  if (!res.ok) {
    const msg = raw?.error?.message || rawText.slice(0, 400);
    return { ok: false, error: `OpenAI image HTTP ${res.status}: ${msg}` };
  }

  const url = raw?.data?.[0]?.url;
  if (typeof url !== 'string' || !url.trim()) {
    return { ok: false, error: 'OpenAI image response had no URL' };
  }

  let imgRes: Response;
  try {
    imgRes = await fetch(url);
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Failed to download generated image' };
  }
  if (!imgRes.ok) {
    return { ok: false, error: `Image download HTTP ${imgRes.status}` };
  }

  const ct = String(imgRes.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const mimeHint =
    ct === 'image/jpeg' || ct === 'image/png' || ct === 'image/webp' ? ct : undefined;

  const buf = Buffer.from(await imgRes.arrayBuffer());
  if (buf.length < 500) {
    return { ok: false, error: 'Downloaded image was unexpectedly small' };
  }

  const revised = raw?.data?.[0]?.revised_prompt;
  return {
    ok: true,
    buffer: buf,
    mimeHint,
    revisedPrompt: typeof revised === 'string' ? revised : undefined,
  };
}
