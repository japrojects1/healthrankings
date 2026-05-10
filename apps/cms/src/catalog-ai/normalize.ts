export function sectionBodyToString(text: unknown): string {
  const t = String(text ?? '').trim();
  return t.length ? t : '.';
}

export function clampRating(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const clamped = Math.min(5, Math.max(0, n));
  return Math.round(clamped * 10) / 10;
}

export function toStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    const s = String(item ?? '').trim();
    if (s) out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function normalizeReviewSections(
  sections: unknown,
  productName: string
): Array<{ heading: string; body: string }> {
  const raw = Array.isArray(sections) ? sections : [];
  const mapped = raw.map((s: any) => ({
    heading: String(s?.heading ?? '').trim() || '',
    body: sectionBodyToString(s?.body),
  }));
  while (mapped.length < 4) {
    mapped.push({
      heading: '',
      body: sectionBodyToString(
        'Details can be expanded after editorial review — this draft was generated automatically.'
      ),
    });
  }
  const four = mapped.slice(0, 4);
  const defaultHeadings = [
    `Overview — ${productName}`,
    'Accuracy & usability',
    'Features & everyday use',
    'Value & who it suits',
  ];
  return four.map((s, i) => ({
    heading: s.heading || defaultHeadings[i] || `Section ${i + 1}`,
    body: s.body,
  }));
}
