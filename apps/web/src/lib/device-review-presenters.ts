/**
 * Pure presentation helpers for the rich device review page
 * (apps/web/src/components/device/DeviceReviewRich.tsx). Mirrors the structural
 * density of MedGrade-style reviews while staying anchored to whatever data we
 * actually have in Strapi — every helper degrades gracefully when fields are
 * missing.
 */

import type {
  Device,
  PerformancePillar,
  PerformanceScore,
  SpecRow,
} from "./strapi";
import { canonicalMetric, isOxiline } from "./top5-presenters";

export type EvidenceLevel = "Strong" | "Moderate" | "Limited";

export type TrustBadge = {
  label: string;
  kind: "medical" | "tech" | "value" | "house";
};

export type ClinicalSummary = {
  scoreOutOf100: number | null;
  scoreOutOf10: number | null;
  band: string | null;
  priceLabel: string | null;
  hsaFsa: "Usually Eligible" | "Likely Eligible" | "Check with provider";
  evidence: EvidenceLevel;
  testingWindow: string | null;
};

export type RealWorldCard = {
  title: string;
  body: string;
  iconKey: "routine" | "learning" | "maintenance" | "portability" | "manual" | "general";
};

export type RankedSibling = {
  rank: number;
  name: string;
  slug: string;
  score10: number | null;
  isCurrent: boolean;
};

const SCORE_DEFAULTS = { warn: 6.5, ok: 7.5, strong: 8.5 } as const;

/** Convert Strapi rating (0-5) to display score (0-10), rounded to 1 decimal. */
export function ratingToScore10(rating: number | null | undefined): number | null {
  if (rating == null || Number.isNaN(Number(rating))) return null;
  const s = Math.round(Number(rating) * 2 * 10) / 10;
  return Number.isFinite(s) ? s : null;
}

export function scoreToPercent(scoreOutOf10: number | null | undefined): number | null {
  if (scoreOutOf10 == null || !Number.isFinite(scoreOutOf10)) return null;
  return Math.max(0, Math.min(100, Math.round(scoreOutOf10 * 10)));
}

export function scoreBand(score10: number | null): string | null {
  if (score10 == null) return null;
  if (score10 >= SCORE_DEFAULTS.strong) return "Excellent";
  if (score10 >= SCORE_DEFAULTS.ok) return "Strong pick";
  if (score10 >= SCORE_DEFAULTS.warn) return "Above average";
  if (score10 >= 5.5) return "Average";
  return "Entry level";
}

/**
 * Infer the depth/quality of evidence from the data we collected. Devices with
 * many performance scores, an evaluation window, and tagline/verdict copy
 * have "Strong" evidence; partial data is "Moderate"; very thin profiles are
 * "Limited".
 */
export function inferEvidence(device: Device): EvidenceLevel {
  let score = 0;
  const metrics = device.performanceScores?.length ?? 0;
  if (metrics >= 5) score += 3;
  else if (metrics >= 3) score += 2;
  else if (metrics >= 1) score += 1;
  if ((device.performancePillars?.length ?? 0) >= 3) score += 1;
  if ((device.specs?.length ?? 0) >= 5) score += 1;
  if (device.evaluationWindow?.trim()) score += 1;
  if (device.reviewLead?.trim() && device.reviewLead.trim().length > 200) score += 1;
  if ((device.reviewSections?.length ?? 0) >= 2) score += 1;
  if (score >= 6) return "Strong";
  if (score >= 3) return "Moderate";
  return "Limited";
}

/** Heuristic HSA/FSA detection — checks specs + verdict for HSA/FSA mentions. */
export function inferHsaFsa(device: Device): ClinicalSummary["hsaFsa"] {
  const text = [
    device.verdictShort ?? "",
    device.tagline ?? "",
    device.reviewLead ?? "",
    ...(device.pros ?? []),
    ...(device.specs ?? []).map((s) => `${s.key} ${s.value}`),
  ]
    .join(" ")
    .toLowerCase();
  if (/hsa[\s/-]?fsa\s*eligible/.test(text)) return "Usually Eligible";
  if (/\bhsa\b|\bfsa\b/.test(text)) return "Likely Eligible";
  // Most regulated medical devices in our catalog (BP monitors, oximeters,
  // glucometers, body comp scales) are FSA-eligible by default.
  if (
    [
      "blood-pressure-monitors",
      "pulse-oximeters",
      "thermometers",
      "glucometers-cgm",
      "body-composition-scales",
    ].includes((device.category || "").toLowerCase())
  ) {
    return "Likely Eligible";
  }
  return "Check with provider";
}

export function inferTrustBadges(device: Device): TrustBadge[] {
  const text = [
    ...(device.pros ?? []),
    ...(device.specs ?? []).map((s) => `${s.key}: ${s.value}`),
    device.verdictShort ?? "",
    device.tagline ?? "",
    device.reviewLead ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const out: TrustBadge[] = [];
  if (isOxiline(device)) out.push({ label: "HealthRankings #1 Pick", kind: "house" });
  if (/\bfda\b|510\(k\)|fda[- ]cleared/.test(text)) out.push({ label: "FDA Cleared", kind: "medical" });
  if (/\baha\b|american heart/.test(text)) out.push({ label: "AHA Validated", kind: "medical" });
  if (/\baami\b|ansi\/aami/.test(text)) out.push({ label: "AAMI Standard", kind: "medical" });
  if (/\besh\b|european society of hyper/.test(text)) {
    out.push({ label: "ESH Validated", kind: "medical" });
  }
  if (/\bbhs\b|british hyper/.test(text)) out.push({ label: "BHS Validated", kind: "medical" });
  if (/clinical(ly)?[- ]validated|clinical(ly)?[- ]proven/.test(text)) {
    if (!out.some((b) => /Validated/.test(b.label))) {
      out.push({ label: "Clinically Validated", kind: "medical" });
    }
  }
  if (/hsa[\/ ]?fsa|hsa[/ ]eligible|fsa[/ ]eligible/.test(text)) {
    out.push({ label: "HSA/FSA Eligible", kind: "value" });
  }
  if (/bluetooth|wi-?fi/.test(text)) out.push({ label: "Connected", kind: "tech" });
  if (/lifetime warranty/.test(text)) out.push({ label: "Lifetime Warranty", kind: "value" });
  return out.slice(0, 5);
}

export function buildClinicalSummary(device: Device): ClinicalSummary {
  const score10 = ratingToScore10(device.rating);
  return {
    scoreOutOf100: score10 != null ? Math.round(score10 * 10) : null,
    scoreOutOf10: score10,
    band: scoreBand(score10),
    priceLabel: device.priceText?.trim() || null,
    hsaFsa: inferHsaFsa(device),
    evidence: inferEvidence(device),
    testingWindow: device.evaluationWindow?.trim() || null,
  };
}

/**
 * Pair each performance metric with its matching pillar commentary (if any),
 * so the rendered metric grid can show a score AND a one-paragraph rationale.
 * Order follows the canonical metric priority used elsewhere in the site.
 */
const METRIC_PRIORITY = [
  "Accuracy",
  "Cuff Comfort",
  "Ease of Use",
  "App & Sync",
  "Build Quality",
  "Battery",
  "Display",
  "Memory & Data",
  "Value",
  "Portability",
  "EKG / Rhythm",
];

export type MetricRow = {
  label: string;
  score10: number;
  percent: number;
  commentary: string | null;
};

function findPillarFor(label: string, pillars: PerformancePillar[]): PerformancePillar | undefined {
  const c = canonicalMetric(label);
  return pillars.find((p) => {
    const pc = canonicalMetric(p.pillarLabel);
    return pc === c || p.pillarLabel.toLowerCase() === label.toLowerCase();
  });
}

export function buildMetricRows(device: Device): MetricRow[] {
  const scores: PerformanceScore[] = device.performanceScores ?? [];
  if (scores.length === 0) {
    // Fall back to pillars only.
    return (device.performancePillars ?? []).slice(0, 6).map((p) => ({
      label: p.pillarLabel,
      score10: Math.round(p.scoreOutOf100 / 10),
      percent: p.scoreOutOf100,
      commentary: p.commentary,
    }));
  }
  const pillars = device.performancePillars ?? [];
  const seen = new Set<string>();
  const out: MetricRow[] = [];
  for (const s of scores) {
    const canon = canonicalMetric(s.label) || s.label;
    if (seen.has(canon)) continue;
    seen.add(canon);
    const pillar = findPillarFor(s.label, pillars);
    out.push({
      label: canon,
      score10: Math.round(s.score * 10) / 10,
      percent: scoreToPercent(s.score) ?? Math.round(s.score * 10),
      commentary: pillar?.commentary || null,
    });
  }
  out.sort((a, b) => {
    const ia = METRIC_PRIORITY.indexOf(a.label);
    const ib = METRIC_PRIORITY.indexOf(b.label);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return b.score10 - a.score10;
  });
  return out.slice(0, 8);
}

/**
 * Build the four "Real-World Usage" sub-cards. Maps any free-form pillar
 * commentary that mentions everyday-use concepts into the appropriate slot,
 * with safe defaults derived from pros/specs when commentary isn't available.
 */
export function buildRealWorldCards(device: Device): RealWorldCard[] {
  const pillars = device.performancePillars ?? [];
  const pickByPillar = (rx: RegExp): string | null => {
    const p = pillars.find((p) => rx.test(p.pillarLabel) || rx.test(p.commentary));
    return p?.commentary ?? null;
  };
  const text = [
    ...(device.pros ?? []),
    ...(device.specs ?? []).map((s) => `${s.key}: ${s.value}`),
    device.verdictShort ?? "",
    device.tagline ?? "",
  ].join(" ");

  const learning =
    pickByPillar(/learning|onboarding|setup|ease/i) ||
    (/(one[-\s]touch|one[-\s]button|simple)/i.test(text)
      ? "Set-up is straightforward — most readers are comfortable after a single calibration session."
      : "Plan a short learning curve to get a feel for the device's prompts and ideal positioning.");

  const maintenance =
    pickByPillar(/maintenance|cleaning|calibration|cuff/i) ||
    (/(replaceable|swap|cleaning|wipe)/i.test(text)
      ? "Routine wipe-downs and the occasional accessory swap are all this device needs."
      : "Keep the unit clean and store it in a dry case to preserve accuracy long-term.");

  const portability =
    pickByPillar(/portab|travel|pocket|compact|case/i) ||
    (/(case|travel|pocket|portable|compact)/i.test(text)
      ? "Compact enough for travel — many shoppers fit it directly into a carry-on or work bag."
      : "Best kept on a counter or shelf at home; not engineered for daily commuting.");

  const manual =
    pickByPillar(/(manual|offline|standalone|paper|print)/i) ||
    (/(manual|offline|standalone|works without|no app required)/i.test(text)
      ? "Works fully offline — every key reading is visible on the device itself, no phone required."
      : "App access unlocks history and trend tracking, but on-device readouts cover daily use.");

  return [
    {
      title: "Daily routine",
      body:
        pickByPillar(/(routine|daily|use|comfort)/i) ||
        device.tagline ||
        "Designed to slot into a typical morning health-check routine without friction.",
      iconKey: "routine",
    },
    { title: "Learning curve", body: learning, iconKey: "learning" },
    { title: "Maintenance", body: maintenance, iconKey: "maintenance" },
    { title: "Portability", body: portability, iconKey: "portability" },
    { title: "Manual / offline use", body: manual, iconKey: "manual" },
  ];
}

/** Convert "$99" or "$99.00" or "$99–$129" style price labels to a numeric primary value. */
export function parsePriceNumber(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Bullet list helper that strips empties + common HTML residue. */
export function cleanBulletList(items: string[] | null | undefined): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((i) => (i ?? "").toString().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Pull out the most distinctive specs (max 8) for a tight summary table on the
 * review page. We keep an explicit priority and skip noisy editorial fields
 * like "Verdict" or "Score" that get rendered elsewhere.
 */
const SPEC_PRIORITY = [
  "Cuff Size",
  "Cuff Range",
  "Memory",
  "Storage",
  "Bluetooth",
  "Wi-Fi",
  "Connectivity",
  "AFib Detection",
  "Arrhythmia Detection",
  "Validated",
  "Validation",
  "EKG",
  "ECG",
  "Display",
  "Power",
  "Power Source",
  "Battery",
  "Battery Life",
  "Warranty",
  "Users",
  "App",
  "Weight",
  "Dimensions",
];
const SPEC_SKIP = new Set([
  "Price",
  "Overall Score",
  "HealthRankings Rank",
  "Ranking",
  "Score",
  "Rank",
  "Verdict",
  "Our Verdict",
]);

export function buildSpecRows(device: Device): SpecRow[] {
  const all = (device.specs ?? []).filter((s) => !SPEC_SKIP.has(s.key));
  return [...all].sort((a, b) => {
    const ia = SPEC_PRIORITY.indexOf(a.key);
    const ib = SPEC_PRIORITY.indexOf(b.key);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.key.localeCompare(b.key);
  });
}
