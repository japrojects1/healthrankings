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
    '  "verdictShort": string (2–4 sentences, informational only),',
    '  "rating": number (0–5, one decimal e.g. 4.2 — editorial score for usefulness/write-up quality, not a medical grade),',
    '  "pros": string[] (4–6 short bullets),',
    '  "cons": string[] (3–5 short bullets),',
    '  "reviewSections": [',
    '    { "heading": string, "body": string },',
    '    ... exactly 4 sections',
    '  ]',
    '}',
    'Section headings should be useful for shoppers: e.g. "Overview", "Accuracy & usability", "Features & everyday use", "Value & who it suits".',
    'Each section body: 2–4 short paragraphs as plain text (no HTML). No markdown headings inside body.',
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
    'Rules:',
    '- Output ONLY valid JSON (no markdown fences). Shape: { "models": [ { "name": string }, ... ] }',
    `- Prefer widely recognized models or product lines when possible; avoid vague entries like "Generic CGM".`,
    '- Each name must be a specific product or branded model line suitable as a catalog title.',
    '- Do NOT invent fake SKUs, fictitious brands, or products you are unsure exist. When in doubt, omit.',
    '- No duplicates; vary manufacturers where appropriate.',
    '- Return at most the requested count; fewer is fine if the category is niche.',
    '- Do not include markdown, commentary, or fields other than "models" objects with "name".',
  ].join('\n');
}

export function buildDiscoverModelsUserPrompt(
  categorySlug: string,
  categoryHint: string,
  maxCount: number
): string {
  const slug = String(categorySlug || '').trim();
  const hint = String(categoryHint || '').trim();
  const label = humanizeCategory(slug);
  return [
    `Category slug (stable ID): ${slug}`,
    `Human label: ${label}`,
    '',
    'Editor description — use this to decide which products belong:',
    hint,
    '',
    `List up to ${maxCount} products for this category only.`,
  ].join('\n');
}
