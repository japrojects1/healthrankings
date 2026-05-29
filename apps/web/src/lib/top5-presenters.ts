import type {
  CategoryTopFive,
  Device,
  PerformanceScore,
  SpecRow,
} from "./strapi";

/**
 * Pure presentation helpers for the rich Top-5 page.
 * Mirror the v3 static-page generator (scripts/rebuild-top5-pages-v3.js)
 * so the Strapi-driven page renders the same layout & sections.
 */

export type EnrichedDevice = Device & {
  rank: number;
  /** 0-10 score for the rich page (Strapi rating is 0-5). */
  score10: number;
  /** Numeric price (best effort) used for "Best Value" + sorting. */
  priceNum: number | null;
  /** Display price string; falls back to priceText. */
  priceLabel: string | null;
  /** Canonicalized + deduped per-metric scores. */
  metrics: PerformanceScore[];
  /** Trust badges inferred from specs/pros/verdict. */
  badges: TrustBadge[];
};

export type TrustBadge = {
  label: string;
  kind: "medical" | "tech" | "value";
};

export type CategoryWinner = {
  title: string;
  device: EnrichedDevice;
  metric: string;
};

export type Persona = {
  title: string;
  why: string;
  device: EnrichedDevice;
};

const METRIC_PRIORITY = [
  "Accuracy",
  "Ease of Use",
  "Cuff Comfort",
  "App & Sync",
  "Build Quality",
  "Display",
  "Battery",
  "Value",
  "Memory & Data",
  "Portability",
  "EKG / Rhythm",
];

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

export function canonicalMetric(label: string): string | null {
  const l = (label || "").trim().toLowerCase();
  if (!l) return null;
  if (/accuracy|precision/.test(l)) return "Accuracy";
  if (/cuff comfort|comfort/.test(l)) return "Cuff Comfort";
  if (/ease of use|usability|^ease$/.test(l)) return "Ease of Use";
  if (/app|sync|connectiv|smart features/.test(l)) return "App & Sync";
  if (/build quality|^build$|durability|construction/.test(l)) return "Build Quality";
  if (/display|screen/.test(l)) return "Display";
  if (/battery|power management/.test(l)) return "Battery";
  if (/value|cost/.test(l)) return "Value";
  if (/portab|travel|compact/.test(l)) return "Portability";
  if (/memory|data/.test(l)) return "Memory & Data";
  if (/design|aesthetic|look/.test(l)) return null;
  if (/apple health|google fit|integration/.test(l)) return null;
  if (/ekg|ecg|rhythm/.test(l)) return "EKG / Rhythm";
  return label.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function canonicalizeMetrics(scores: PerformanceScore[] | null | undefined): PerformanceScore[] {
  if (!scores?.length) return [];
  const seen = new Map<string, PerformanceScore>();
  for (const m of scores) {
    const c = canonicalMetric(m.label);
    if (!c) continue;
    const cur = seen.get(c);
    if (!cur || m.score > cur.score) {
      seen.set(c, { label: c, score: m.score, width: m.width });
    }
  }
  return [...seen.values()];
}

export function ratingToScore10(rating: number | null | undefined): number {
  if (rating == null || Number.isNaN(Number(rating))) return 0;
  const n = Number(rating);
  // Strapi rating is 0-5; UI is 0-10. Round to 1 decimal.
  return Math.round(n * 2 * 10) / 10;
}

function parsePrice(text: string | null | undefined): { num: number | null; label: string | null } {
  if (!text) return { num: null, label: null };
  const m = text.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  if (!m) return { num: null, label: text };
  const n = Number(m[1].replace(/,/g, ""));
  return { num: Number.isFinite(n) ? n : null, label: text };
}

export function inferTrustBadges(d: Device): TrustBadge[] {
  const text = [
    ...(d.pros || []),
    ...(d.specs || []).map((s) => `${s.key}: ${s.value}`),
    d.verdictShort || "",
    d.tagline || "",
  ]
    .join(" ")
    .toLowerCase();

  const out: TrustBadge[] = [];
  if (/\bfda\b|510\(k\)|fda[- ]cleared/.test(text)) out.push({ label: "FDA Cleared", kind: "medical" });
  if (/\baha\b|american heart/.test(text)) out.push({ label: "AHA Validated", kind: "medical" });
  if (/\baami\b|ansi\/aami/.test(text)) out.push({ label: "AAMI Standard", kind: "medical" });
  if (/\besh\b|european society of hyper/.test(text)) out.push({ label: "ESH Validated", kind: "medical" });
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
  return out.slice(0, 3);
}

export function enrichDevices(top5: CategoryTopFive): EnrichedDevice[] {
  const list: EnrichedDevice[] = [];
  for (const e of top5.entries || []) {
    if (!e.device?.slug) continue;
    const d = e.device;
    const score10 = ratingToScore10(d.rating);
    const price = parsePrice(d.priceText || null);
    const metrics = canonicalizeMetrics(d.performanceScores);
    list.push({
      ...d,
      rank: e.rank,
      score10,
      priceNum: price.num,
      priceLabel: price.label,
      metrics,
      badges: inferTrustBadges(d),
    });
  }
  list.sort((a, b) => a.rank - b.rank);
  return list;
}

export function pickCategoryWinners(devices: EnrichedDevice[]): CategoryWinner[] {
  if (devices.length === 0) return [];
  const overall = devices[0];
  const winners: CategoryWinner[] = [
    { title: "Best Overall", device: overall, metric: `${overall.score10.toFixed(1)}/10 score` },
  ];

  // Map metric label → highest-scoring device on that metric
  const byMetric = new Map<string, { device: EnrichedDevice; score: number }>();
  for (const d of devices) {
    for (const m of d.metrics) {
      const cur = byMetric.get(m.label);
      if (!cur || m.score > cur.score) byMetric.set(m.label, { device: d, score: m.score });
    }
  }

  const accuracyKey = [...byMetric.keys()].find((k) => /accuracy/i.test(k));
  if (accuracyKey) {
    const w = byMetric.get(accuracyKey)!;
    winners.push({
      title: "Most Accurate",
      device: w.device,
      metric: `${w.score.toFixed(1)}/10 ${accuracyKey.toLowerCase()}`,
    });
  }

  // Best Value = lowest priced
  let bestValue: EnrichedDevice | null = null;
  let bestPrice = Infinity;
  for (const d of devices) {
    if (d.priceNum != null && d.priceNum > 0 && d.priceNum < bestPrice) {
      bestPrice = d.priceNum;
      bestValue = d;
    }
  }
  if (bestValue) {
    winners.push({
      title: "Best Value",
      device: bestValue,
      metric: `${bestValue.priceLabel} starting price`,
    });
  }

  // Best App or Build (whichever metric exists in data)
  const appKey = [...byMetric.keys()].find((k) => /app|sync|connectiv/i.test(k));
  const buildKey = [...byMetric.keys()].find((k) => /build|durab|construct/i.test(k));
  if (appKey) {
    const w = byMetric.get(appKey)!;
    winners.push({
      title: "Best App",
      device: w.device,
      metric: `${w.score.toFixed(1)}/10 ${appKey.toLowerCase()}`,
    });
  } else if (buildKey) {
    const w = byMetric.get(buildKey)!;
    winners.push({
      title: "Best Build",
      device: w.device,
      metric: `${w.score.toFixed(1)}/10 ${buildKey.toLowerCase()}`,
    });
  } else if (devices[1]) {
    winners.push({
      title: "Runner-up",
      device: devices[1],
      metric: `${devices[1].score10.toFixed(1)}/10 overall`,
    });
  }

  return winners.slice(0, 4);
}

export function buildPersonas(devices: EnrichedDevice[]): Persona[] {
  if (devices.length === 0) return [];
  const out: Persona[] = [];
  const used = new Set<number>();

  function add(title: string, why: string, device: EnrichedDevice | null | undefined) {
    if (!device || used.has(device.rank)) return;
    used.add(device.rank);
    out.push({ title, why, device });
  }

  function text(d: EnrichedDevice): string {
    return [
      d.tagline || "",
      d.verdictShort || "",
      ...(d.pros || []),
      ...(d.specs || []).map((s) => `${s.key}:${s.value}`),
    ]
      .join(" ")
      .toLowerCase();
  }

  add(
    "For most people",
    "Top scores across the metrics that matter most — accuracy, build, and ease of use.",
    devices[0]
  );

  const tech =
    devices.find((d) => !used.has(d.rank) && /wi-?fi|cloud|auto[- ]?sync|wireless sync/.test(text(d))) ||
    devices.find((d) => !used.has(d.rank) && /bluetooth|app|sync/.test(text(d)));
  add(
    "For tech-savvy users",
    "Reliable wireless sync, deeper analytics, and integrations with health apps.",
    tech
  );

  const advanced = devices.find(
    (d) => !used.has(d.rank) && /ekg|ecg|physician|clinical|professional|holter|advanced/.test(text(d))
  );
  if (advanced) {
    add(
      "For advanced or clinical needs",
      "Adds richer signals — EKG documentation, physician sharing, or clinical-grade testing.",
      advanced
    );
  }

  let cheapest: EnrichedDevice | null = null;
  let cheapestN = Infinity;
  for (const d of devices) {
    if (used.has(d.rank)) continue;
    if (d.priceNum != null && d.priceNum > 0 && d.priceNum < cheapestN) {
      cheapestN = d.priceNum;
      cheapest = d;
    }
  }
  if (cheapest) {
    add(
      "For budget-conscious shoppers",
      "Solid daily-use performance at the lowest price in our lineup.",
      cheapest
    );
  }

  for (const d of devices) {
    if (out.length >= 4) break;
    if (!used.has(d.rank)) {
      add("Worthy alternative", d.tagline || "An excellent alternative if our top pick isn't available.", d);
    }
  }
  return out.slice(0, 4);
}

/** Performance matrix rows in display order (max 8). */
export function buildMetricRows(devices: EnrichedDevice[]): string[] {
  const coverage = new Map<string, number>();
  for (const d of devices) {
    for (const m of d.metrics) coverage.set(m.label, (coverage.get(m.label) || 0) + 1);
  }
  return [...coverage.keys()]
    .sort((a, b) => {
      const ia = METRIC_PRIORITY.indexOf(a);
      const ib = METRIC_PRIORITY.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return (coverage.get(b) || 0) - (coverage.get(a) || 0);
    })
    .filter((l) => (coverage.get(l) || 0) >= 2)
    .slice(0, 8);
}

/** Spec table rows in display order (max 10), only specs shared by ≥2 products. */
export function buildSpecRows(devices: EnrichedDevice[]): string[] {
  const coverage = new Map<string, number>();
  for (const d of devices) {
    for (const s of d.specs || []) coverage.set(s.key, (coverage.get(s.key) || 0) + 1);
  }
  return [...coverage.keys()]
    .filter((k) => !SPEC_SKIP.has(k))
    .filter((k) => (coverage.get(k) || 0) >= 2)
    .sort((a, b) => {
      const ia = SPEC_PRIORITY.indexOf(a);
      const ib = SPEC_PRIORITY.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return (coverage.get(b) || 0) - (coverage.get(a) || 0);
    })
    .slice(0, 10);
}

export function getMetric(d: EnrichedDevice, label: string): PerformanceScore | undefined {
  return d.metrics.find((m) => m.label === label);
}

export function getSpec(d: EnrichedDevice, key: string): SpecRow | undefined {
  return (d.specs || []).find((s) => s.key === key);
}

/** Per-metric winner score (max value across devices), for highlighting. */
export function metricMax(devices: EnrichedDevice[], label: string): number {
  let max = 0;
  for (const d of devices) {
    const m = getMetric(d, label);
    if (m && m.score > max) max = m.score;
  }
  return max;
}

export function inferRankLabel(d: EnrichedDevice, idx: number): string {
  if (idx === 0) return "Best Overall";
  const tl = (d.tagline || "").toLowerCase();
  if (/best value|budget|affordable/.test(tl)) return "Best Value";
  if (/best app|smart/.test(tl)) return "Best App";
  if (/senior|easiest/.test(tl)) return "Best for Seniors";
  if (/portable|compact|wireless/.test(tl)) return "Best Portable";
  if (/advanced|ekg|ecg/.test(tl)) return "Most Advanced";
  if (/family|multi/.test(tl)) return "Best for Family";
  return `#${idx + 1} Pick`;
}
