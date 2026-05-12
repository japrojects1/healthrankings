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
  while (mapped.length < 6) {
    mapped.push({
      heading: '',
      body: sectionBodyToString(
        'Editors can expand this subsection with hands-on notes, measurements, and sourcing.'
      ),
    });
  }
  const six = mapped.slice(0, 6);
  const defaultHeadings = [
    `What you are buying — ${productName}`,
    'How we evaluated it',
    'Setup, handling & daily use',
    'Accuracy, specs & what to trust',
    'Price, warranty & support',
    'Bottom line for shoppers',
  ];
  return six.map((s, i) => ({
    heading: s.heading || defaultHeadings[i] || `Section ${i + 1}`,
    body: s.body,
  }));
}

export type PerformancePillarInput = {
  pillarLabel: string;
  scoreOutOf100: number;
  commentary: string;
};

/** AI → Strapi component rows; max 6 pillars. */
export function normalizePerformancePillars(value: unknown): PerformancePillarInput[] {
  const raw = Array.isArray(value) ? value : [];
  const out: PerformancePillarInput[] = [];
  for (const p of raw.slice(0, 6)) {
    const pillarLabel = String((p as any)?.pillarLabel ?? (p as any)?.label ?? '').trim();
    let score = Number((p as any)?.scoreOutOf100 ?? (p as any)?.score100);
    if (!Number.isFinite(score)) score = 0;
    score = Math.round(Math.min(100, Math.max(0, score)));
    const commentary = sectionBodyToString((p as any)?.commentary ?? (p as any)?.notes);
    if (!pillarLabel) continue;
    out.push({ pillarLabel, scoreOutOf100: score, commentary });
  }
  return out;
}
