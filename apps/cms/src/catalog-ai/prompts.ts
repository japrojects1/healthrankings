import { MAX_EXISTING_DEVICES_IN_DISCOVER_PROMPT } from './constants';

export function humanizeCategory(cat: string): string {
  const slug = String(cat || '').trim();
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function buildDeviceReviewSystemPrompt(): string {
  return [
    'You are an editorial assistant for HealthRankings, a consumer health-information site.',
    'Write in clear, neutral English. Do NOT claim FDA clearance, clinical validation, or medical outcomes unless the user prompt explicitly supplies verified facts — otherwise stay generic ("often marketed for...", "typical features include...").',
    'Never diagnose or tell readers what they should do medically. Include no shocking or fear-based claims.',
    'Output MUST be a single JSON object only (no markdown fences). Use this shape:',
    '{',
    '  "tagline": string (one sentence, under 200 chars — the hook under the product name),',
    '  "reviewLead": string (5–8 sentences: who it is for, what stood out in testing, how it compares in plain language),',
    '  "reviewerAttribution": string (e.g. "HealthRankings editors" or a named reviewer role if appropriate — never fabricate credentials),',
    '  "evaluationWindow": string (e.g. "Several weeks of at-home use" — realistic editorial testing window, not invented lab data),',
    '  "assessmentTag": string (short label, e.g. "Hands-on + spec review" — not a medical seal),',
    '  "verdictShort": string (2–4 sentences, informational only),',
    '  "rating": number (0–5, one decimal e.g. 4.2 — editorial score for usefulness/write-up quality, not a medical grade),',
    '  "pros": string[] (5–8 concise bullets),',
    '  "cons": string[] (4–7 concise bullets),',
    '  "performancePillars": [',
    '    { "pillarLabel": string, "scoreOutOf100": integer 0–100, "commentary": string (2–3 sentences) },',
    '    ... exactly 5 pillars (e.g. ease of use, build & display, accuracy/reliability, features, value) tailored to the product category',
    '  ],',
    '  "recommendWhen": string (2–4 sentences — ideal buyer / situation),',
    '  "passWhen": string (2–4 sentences — when another product class may fit better),',
    '  "reviewSections": [',
    '    { "heading": string, "body": string },',
    '    ... exactly 6 sections',
    '  ]',
    '}',
    'reviewSections: write substantive bodies — each body should be 3–5 short paragraphs as plain text (no HTML, no markdown headings inside body). Cover real-world use, limitations, comparisons at a high level, and buying cautions.',
    'Headings should be specific to the product where possible (not generic single words).',
    'performancePillars scores are editorial judgment for readers, not clinical measurements.',
  ].join('\n');
}

export function buildDeviceReviewUserPrompt(
  categorySlug: string,
  deviceName: string,
  categoryHint?: string
): string {
  const slug = String(categorySlug || '').trim();
  const label = humanizeCategory(slug);
  const hint = String(categoryHint || '').trim();
  return [
    `Category slug: ${slug}`,
    hint ? `Category context from editor:\n${hint}\n` : '',
    `Human-readable category label (for tone): ${label}`,
    `Product name (exact display name): ${deviceName}`,
    '',
    `Produce the JSON review for this single product in the "${label}" category (${slug}).`,
    'If you lack real-world specs, write cautious general guidance and avoid specific numbers or certifications.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildDiscoverModelsSystemPrompt(): string {
  return [
    'You help HealthRankings catalog consumer health and wellness products.',
    'Your task is to propose DISTINCT real products that are commonly sold to US consumers in the category described.',
    'You will be given products already in our catalog for that category — do NOT suggest those, close duplicates, or the same model with trivial wording changes.',
    'Every suggestion must produce a NEW catalog slug (lowercase, hyphenated brand/model identity) vs anything already listed.',
    'Rules:',
    '- Output ONLY valid JSON (no markdown fences). Shape: { "models": [ { "name": string }, ... ] }',
    `- Prefer widely recognized models or product lines when possible; avoid vague entries like "Generic CGM".`,
    '- Each name must be a specific product or branded model line suitable as a catalog title.',
    '- Do NOT invent fake SKUs, fictitious brands, or products you are unsure exist. When in doubt, omit.',
    '- No duplicates in your array; vary manufacturers where appropriate.',
    `- Return at most the requested count of NEW products (may be fewer if the category is exhausted).`,
    '- Do not include markdown, commentary, or fields other than "models" objects with "name".',
  ].join('\n');
}

export function buildDiscoverModelsUserPrompt(
  categorySlug: string,
  categoryHint: string,
  needCount: number,
  ctx: {
    existingInCategory: Array<{ name: string; slug: string }>;
    alreadyQueuedNames: string[];
    categoryListTruncated: boolean;
  }
): string {
  const slug = String(categorySlug || '').trim();
  const hint = String(categoryHint || '').trim();
  const label = humanizeCategory(slug);

  const cap = MAX_EXISTING_DEVICES_IN_DISCOVER_PROMPT;
  const rows = ctx.existingInCategory;
  const shown = rows.slice(0, cap);
  const omitted = Math.max(0, rows.length - shown.length);

  let catalogBlock: string;
  if (rows.length === 0) {
    catalogBlock =
      'Our catalog currently has no devices in this category — suggest a diverse set of representative real products.';
  } else {
    const lines = shown
      .filter((r) => r.name || r.slug)
      .map((r) => {
        const n = r.name || r.slug;
        return r.slug ? `- ${n} (slug: ${r.slug})` : `- ${n}`;
      });
    catalogBlock = [
      `Already in our catalog for category "${slug}" (${rows.length} devices${ctx.categoryListTruncated ? '+; list may continue beyond what we store for this prompt' : ''}):`,
      ...lines,
      omitted > 0 ? `…plus ${omitted} more not shown — avoid any of those too.` : '',
      ctx.categoryListTruncated
        ? 'Note: the full in-category list was truncated server-side; prefer clearly distinct new models.'
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const batchBlock =
    ctx.alreadyQueuedNames.length > 0
      ? [
          '',
          'Also exclude duplicates of these names we already accepted in this same batch:',
          ...ctx.alreadyQueuedNames.map((n) => `- ${n}`),
        ].join('\n')
      : '';

  return [
    `Category slug (stable ID): ${slug}`,
    `Human label: ${label}`,
    '',
    'Editor description — use this to decide which products belong:',
    hint,
    '',
    catalogBlock,
    batchBlock,
    '',
    `Now suggest up to ${needCount} NEW products that are not excluded above.`,
  ].join('\n');
}
