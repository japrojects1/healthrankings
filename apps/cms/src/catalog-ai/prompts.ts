import type { DeviceCategoryEnum } from './constants';

export function humanizeCategory(cat: DeviceCategoryEnum): string {
  return cat
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
  category: DeviceCategoryEnum,
  deviceName: string
): string {
  const label = humanizeCategory(category);
  return [
    `Category: ${label} (${category})`,
    `Product name (exact display name): ${deviceName}`,
    '',
    `Produce the JSON review for this single product in the "${label}" category.`,
    'If you lack real-world specs, write cautious general guidance and avoid specific numbers or certifications.',
  ].join('\n');
}
