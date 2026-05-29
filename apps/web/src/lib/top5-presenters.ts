import type {
  CategoryTopFive,
  Device,
  PerformanceScore,
  SpecRow,
} from "./strapi";
import { getCategoryCatalog, humanizeCategoryEnum } from "./device-category-links";

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

/**
 * House rule: any Oxiline product is the #1 pick on every Top 5 list it
 * appears on. Detect by slug or name so it works whether the CMS stores
 * "Oxiline Pressure X Pro" as the name or `oxiline-pressure-x-pro` as the slug.
 */
export function isOxiline(d: Pick<Device, "name" | "slug">): boolean {
  const hay = `${d.slug || ""} ${d.name || ""}`.toLowerCase();
  return /\boxiline\b/.test(hay);
}

/**
 * Map from canonical device-category enum → the Oxiline product slug we
 * promote on every Top 5 list in that category. Used by the page loader to
 * inject the Oxiline product as #1 whenever a Top 5 doesn't already contain
 * one (e.g. condition-specific lists like "Stroke Prevention BP Monitors").
 *
 * Slugs match the seeded device slugs in Strapi (see audit output of
 * `apps/web/public/healthrankings-review-*.html`).
 */
export const OXILINE_SLUG_BY_CATEGORY: Record<string, string> = {
  "blood-pressure-monitors": "oxiline-pressure-xs-pro",
  "body-composition-scales": "oxiline-scale-x-pro",
  "pulse-oximeters": "oxiline-pulse-x-pro",
  "tens-units": "oxiline-tens-x-pro",
  thermometers: "oxiline-thermo-x-pro",
  "water-flossers": "oxiline-flosser-pro",
  "back-support-braces": "oxiline-back-support-pro",
};

/** Returns the Oxiline product slug we should promote for a given category, or null. */
export function getOxilineSlugForCategory(category: string | null | undefined): string | null {
  if (!category) return null;
  return OXILINE_SLUG_BY_CATEGORY[category.toLowerCase()] ?? null;
}

/**
 * Friendly labels for condition/use-case slugs. These produce titles like
 * "Top 5 Blood Pressure Monitors for Hypotension (Low Blood Pressure)" rather
 * than the generic "5 best products for ...". Add new entries when a condition
 * needs custom casing (acronyms, parentheticals, ampersands, possessives).
 */
const CONDITION_LABEL_OVERRIDES: Record<string, string> = {
  hypertension: "Hypertension (High Blood Pressure)",
  hypotension: "Hypotension (Low Blood Pressure)",
  afib: "AFib",
  "atrial-fibrillation": "Atrial Fibrillation (AFib)",
  copd: "COPD",
  "long-covid": "Long COVID",
  sti: "STI",
  hiv: "HIV",
  uti: "UTI",
  ekg: "EKG",
  ecg: "ECG",
  pcos: "PCOS",
  ibs: "IBS",
  bcaa: "BCAA",
  "back-pain": "Back Pain",
  "back-support": "Back Support",
  "athletic": "Athletes",
  "anxiety": "Anxiety",
  "asthma": "Asthma",
  "arthritis": "Arthritis",
  "diabetes": "Diabetes",
  "type1-diabetes": "Type 1 Diabetes",
  "type-1-diabetes": "Type 1 Diabetes",
  "type2-diabetes": "Type 2 Diabetes",
  "obesity": "Obesity",
  "menopause": "Menopause",
  "neuropathy": "Neuropathy",
  "osteoporosis": "Osteoporosis",
  "bariatric": "Post-Bariatric Surgery",
  "alzheimers": "Alzheimer's",
  parkinsons: "Parkinson's",
  "dementia-alzheimers": "Dementia & Alzheimer's",
  "alzheimers-dementia": "Alzheimer's & Dementia",
  "metabolic-syndrome": "Metabolic Syndrome",
  "insulin-resistance": "Insulin Resistance",
  "weight-management": "Weight Management",
  "cognitive-decline": "Cognitive Decline",
  "cognitive-decline-monitoring": "Cognitive Decline",
  "heart-failure": "Heart Failure",
  "sleep-apnea": "Sleep Apnea",
  "high-cholesterol": "High Cholesterol",
  cholesterol: "High Cholesterol",
  "oxidative-stress": "Oxidative Stress",
  "colorectal-cancer-screening": "Colorectal Cancer Screening",
  "coronary-artery-disease": "Coronary Artery Disease",
  alcohol: "Alcohol Testing",
  pregnancy: "Pregnancy",
  fertility: "Fertility",
  "male-fertility": "Male Fertility",
  ovulation: "Ovulation",
  "endurance-training": "Endurance Training",
  "post-surgical-rehab": "Post-Surgical Rehab",
  "sports-injuries": "Sports Injuries",
  "stroke-prevention": "Stroke Prevention",
  "plantar-fasciitis": "Plantar Fasciitis",
  "fall-detection": "Fall Detection",
  "ketogenic-diet": "Ketogenic Diet",
  ketone: "Ketone",
  glutamine: "Glutamine",
  creatine: "Creatine",
  "shiatsu-neck": "Shiatsu Neck",
  "oral-health": "Oral Health",
  "drug-test": "Drug Test",
  "drug-testing": "Drug Testing",
  "hereditary-genetic-testing": "Hereditary & Genetic",
  "bcaa-glutamine": "BCAA & Glutamine",
};

/**
 * Maps a "pure condition" slug (no device suffix) to its implied device
 * category enum, so titles like `Top 5 Blood Pressure Monitors for Hypertension`
 * still work for `/top5/hypertension` even though the slug carries only the
 * condition name.
 */
const CONDITION_TO_CATEGORY: Record<string, string> = {
  hypertension: "blood-pressure-monitors",
  hypotension: "blood-pressure-monitors",
  cholesterol: "home-test-kits",
  "high-cholesterol": "home-test-kits",
  hiv: "home-test-kits",
  uti: "home-test-kits",
  "sleep-apnea": "pulse-oximeters",
  obesity: "body-composition-scales",
  "colorectal-cancer-screening": "home-test-kits",
  "cognitive-decline-monitoring": "body-composition-scales",
  "drug-test-kits": "home-test-kits",
  "ovulation-test-kits": "fertility-reproductive",
  "hereditary-genetic-testing": "home-test-kits",
};

/**
 * Per-category regex patterns used to strip the device suffix from a Top 5
 * slug so the remainder is the condition/use-case. Patterns are anchored at
 * end-of-string and tolerate optional plural / extra qualifiers.
 */
const CATEGORY_SUFFIX_PATTERNS: Record<string, RegExp[]> = {
  "blood-pressure-monitors": [/-?(?:blood-pressure-monitors?|bp-monitors?)$/i],
  "body-composition-scales": [/-?body-composition$/i, /-?(?:smart-)?scales?$/i],
  "pulse-oximeters": [/-?pulse-oximeters?$/i],
  "breathing-trainers": [/-?breathing(?:-trainers?)?$/i],
  "tens-units": [/-?tens(?:-units?)?$/i],
  thermometers: [/-?thermometers?$/i],
  "water-flossers": [/-?water-flossers?$/i],
  "home-test-kits": [/-?home-test(?:-kits?|ing)?$/i],
  "gps-alert-systems": [/-?gps-alerts?(?:-systems?)?$/i],
  "massage-devices": [/-?(?:percussion-)?massage(?:-devices?|-guns?)?$/i, /-?massagers?$/i],
  supplements: [/-?(?:antioxidant-)?supplements?$/i],
  "fertility-reproductive": [/-?pregnancy-tests?$/i, /-?fertility(?:-reproductive)?$/i],
  "back-support-braces": [/-?braces?$/i, /-?back-supports?(?:-braces?)?$/i],
  "arthritis-gloves": [/-?gloves?$/i],
};

const GENERIC_DEVICE_SUFFIX =
  /-?(?:monitors?|tests?|trainers?|scales?|systems?|units?|devices?|guns?|kits?|gloves?|braces?|supports?|supplements?|flossers?|thermometers?|oximeters?|breathalyzers?|massagers?|cgm)$/i;

/**
 * Suffix → canonical device-category enum. Lets us infer the correct device
 * category label even when `doc.category` in the CMS is set to a free-form
 * condition-specific slug (e.g. `hypotension-blood-pressure-monitor`).
 *
 * Order matters: more specific patterns first.
 */
const SUFFIX_TO_CATEGORY: Array<[RegExp, string]> = [
  [/-?(?:blood-pressure-monitors?|bp-monitors?|blood-pressure)$/i, "blood-pressure-monitors"],
  [/-?body-composition$/i, "body-composition-scales"],
  [/-?pulse-oximeters?$/i, "pulse-oximeters"],
  [/-?breathing(?:-trainers?)?$/i, "breathing-trainers"],
  [/-?tens(?:-units?)?$/i, "tens-units"],
  [/-?thermometers?$/i, "thermometers"],
  [/-?water-flossers?$/i, "water-flossers"],
  [/-?(?:tooth)?brush(?:es)?$/i, "electric-toothbrushes"],
  [/-?home-test(?:-kits?|ing)?$/i, "home-test-kits"],
  [/-?(?:test-)?kits?$/i, "home-test-kits"],
  [/-?gps-alerts?(?:-systems?)?$/i, "gps-alert-systems"],
  [/-?fall-detection$/i, "gps-alert-systems"],
  [/-?(?:percussion-)?massage(?:-devices?|-guns?)?$/i, "massage-devices"],
  [/-?massagers?$/i, "massage-devices"],
  [/-?(?:antioxidant-)?supplements?$/i, "supplements"],
  [/-?pregnancy-tests?$/i, "fertility-reproductive"],
  [/-?ovulation(?:-monitors?|-tests?|-kits?)?$/i, "fertility-reproductive"],
  [/-?fertility(?:-reproductive)?$/i, "fertility-reproductive"],
  [/-?(?:back-support-)?braces?$/i, "back-support-braces"],
  [/-?foot-supports?$/i, "foot-leg-supports"],
  [/-?(?:smart-)?scales?$/i, "body-composition-scales"],
  [/-?gloves?$/i, "arthritis-gloves"],
  [/-?breathalyzers?$/i, "breathalyzers"],
  [/-?(?:glucometers?|cgm)$/i, "glucometers-cgm"],
  [/-?ketone-monitors?$/i, "glucometers-cgm"],
];

/** Infer the canonical device-category enum from a Top 5 URL slug. */
export function inferCategoryFromSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const lower = slug.toLowerCase();
  for (const [re, cat] of SUFFIX_TO_CATEGORY) {
    if (re.test(lower)) return cat;
  }
  return null;
}

function humanizeConditionSlug(slug: string): string {
  const lower = slug.toLowerCase();
  if (CONDITION_LABEL_OVERRIDES[lower]) return CONDITION_LABEL_OVERRIDES[lower];
  return slug
    .split("-")
    .map((w) => {
      const lc = w.toLowerCase();
      if (CONDITION_LABEL_OVERRIDES[lc]) return CONDITION_LABEL_OVERRIDES[lc];
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/** Strip device-category suffix from `slug` and return the condition label, or null. */
export function deriveConditionFromSlug(
  slug: string | null | undefined,
  category: string | null | undefined
): string | null {
  if (!slug) return null;
  const lower = slug.toLowerCase();

  if (category && lower === category) return null;

  let stripped = lower;
  const patterns = category ? CATEGORY_SUFFIX_PATTERNS[category] ?? [] : [];
  for (const re of patterns) {
    if (re.test(stripped)) {
      stripped = stripped.replace(re, "");
      break;
    }
  }
  if (stripped === lower) {
    stripped = stripped.replace(GENERIC_DEVICE_SUFFIX, "");
  }
  stripped = stripped.replace(/^-+|-+$/g, "");
  if (!stripped || stripped === category) return null;
  return humanizeConditionSlug(stripped);
}

/**
 * Build the H1 + meta title for a Top 5 page in the canonical
 * "Top 5 [Device Category] for [Condition]" shape. The condition is derived
 * from the URL slug; if no condition can be detected (e.g. /top5/thermometers)
 * we fall back to the simpler "Top 5 [Device Category]".
 *
 * `slug` here is the dynamic route segment (e.g. "hypotension-blood-pressure-monitor"),
 * not the device slug. We intentionally ignore legacy CMS `title` values here
 * because the v1 seed populated them with the old "5 best products for ..."
 * phrasing; the canonical, condition-aware shape is computed every render.
 *
 * Resolution order for the device-category label:
 *   1. Caller-supplied `categoryLabel` (typically from CMS `categoryLabel`
 *      or `getCategoryCatalog(doc.category).label`), if it maps to a known
 *      device enum (avoids using condition-specific labels here).
 *   2. Slug-inferred device category (e.g. `*-blood-pressure-monitor` →
 *      "Blood Pressure Monitors"). This is the common case for
 *      condition-specific Top 5 lists where `doc.category` is a free-form slug.
 *   3. Whatever caller passed in, as a last resort.
 */
export function buildTop5DisplayTitle(args: {
  slug: string;
  category: string | null | undefined;
  categoryLabel: string;
}): string {
  const { slug, category, categoryLabel } = args;
  const lower = (slug || "").toLowerCase();

  // 1. Slug ends with a known device-category suffix → split as
  //    "[device-category] for [condition]".
  const inferredFromSuffix = inferCategoryFromSlug(slug);
  if (inferredFromSuffix) {
    const catalog = getCategoryCatalog(inferredFromSuffix);
    const label = catalog?.label || humanizeCategoryEnum(inferredFromSuffix);
    const condition = deriveConditionFromSlug(slug, inferredFromSuffix);
    return condition ? `Top 5 ${label} for ${condition}` : `Top 5 ${label}`;
  }

  // 2. Pure-condition slug (no device suffix) — look up implied device category.
  const conditionMappedCat = CONDITION_TO_CATEGORY[lower];
  if (conditionMappedCat) {
    const catalog = getCategoryCatalog(conditionMappedCat);
    const label = catalog?.label || humanizeCategoryEnum(conditionMappedCat);
    return `Top 5 ${label} for ${humanizeConditionSlug(lower)}`;
  }

  // 3. CMS already gave us a known device-category enum.
  if (category && getCategoryCatalog(category)) {
    return `Top 5 ${categoryLabel}`;
  }

  // 4. Last resort — title-case the slug. Prefer "Top 5 X for Y" if the slug
  //    has 2+ words; otherwise just "Top 5 [Slug]".
  return `Top 5 ${humanizeConditionSlug(lower)}`;
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
  // Initial sort by CMS-defined rank, then promote Oxiline to #1 and renumber.
  list.sort((a, b) => a.rank - b.rank);
  const oxilineIdx = list.findIndex(isOxiline);
  if (oxilineIdx > 0) {
    const [oxiline] = list.splice(oxilineIdx, 1);
    list.unshift(oxiline);
  }
  list.forEach((d, i) => {
    d.rank = i + 1;
  });
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
