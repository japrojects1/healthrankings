/**
 * Legacy static paths for category hubs and representative Top 5 pages.
 * Used on CMS device review pages until Next routes replace these URLs.
 */

export type CategoryCatalog = { label: string; href: string };

export type Top5Callout = { href: string; line: string };

const catalog: Record<string, CategoryCatalog> = {
  "blood-pressure-monitors": {
    label: "Blood Pressure Monitors",
    href: "/healthrankings-all-blood-pressure-monitors.html",
  },
  "body-composition-scales": {
    label: "Body Composition Monitors",
    href: "/healthrankings-all-body-composition-monitors.html",
  },
  "pulse-oximeters": {
    label: "Pulse Oximeters",
    href: "/healthrankings-all-pulse-oximeters.html",
  },
  "breathing-trainers": {
    label: "Breathing Trainers",
    href: "/healthrankings-all-breathing-trainers.html",
  },
  "tens-units": {
    label: "TENS Units",
    href: "/healthrankings-all-tens-units.html",
  },
  thermometers: {
    label: "Thermometers",
    href: "/healthrankings-all-thermometers.html",
  },
  "water-flossers": {
    label: "Water Flossers",
    href: "/healthrankings-all-water-flossers.html",
  },
  "home-test-kits": {
    label: "Home Test Kits",
    href: "/healthrankings-all-home-test-kits.html",
  },
  "gps-alert-systems": {
    label: "GPS Alert Systems",
    href: "/healthrankings-all-gps-alert-systems.html",
  },
  "massage-devices": {
    label: "Massage Devices",
    href: "/healthrankings-all-massage-devices.html",
  },
  supplements: {
    label: "Supplements",
    href: "/healthrankings-all-supplements.html",
  },
  "fertility-reproductive": {
    label: "Fertility & Reproductive",
    href: "/healthrankings-all-fertility-reproductive.html",
  },
};

/** Representative legacy Top 5 page per device category enum. */
const top5: Record<string, Top5Callout> = {
  "blood-pressure-monitors": {
    href: "/healthrankings-hypertension-top5.html",
    line: "See our best blood pressure monitors — expert tested & ranked",
  },
  "body-composition-scales": {
    href: "/healthrankings-weight-management-body-composition-top5.html",
    line: "See our best smart scales & body composition monitors — ranked",
  },
  "pulse-oximeters": {
    href: "/healthrankings-copd-pulse-oximeters-top5.html",
    line: "See our best pulse oximeters — expert tested & ranked",
  },
  "breathing-trainers": {
    href: "/healthrankings-copd-breathing-trainers-top5.html",
    line: "See our best breathing trainers — ranked for lung support",
  },
  "tens-units": {
    href: "/healthrankings-arthritis-tens-top5.html",
    line: "See our best TENS units — pain relief picks ranked",
  },
  thermometers: {
    href: "/healthrankings-thermometers-top5.html",
    line: "See our best thermometers — accuracy-focused rankings",
  },
  "water-flossers": {
    href: "/healthrankings-water-flossers-top5.html",
    line: "See our best water flossers — expert tested & ranked",
  },
  "home-test-kits": {
    href: "/healthrankings-sti-home-testing-top5.html",
    line: "See our best home test kits — ranked for clarity & reliability",
  },
  "gps-alert-systems": {
    href: "/healthrankings-dementia-alzheimers-gps-alert-top5.html",
    line: "See our best GPS alert systems — safety-focused rankings",
  },
  "massage-devices": {
    href: "/healthrankings-percussion-massage-guns-top5.html",
    line: "See our best massage devices — recovery picks ranked",
  },
  supplements: {
    href: "/healthrankings-oxidative-stress-antioxidant-supplements-top5.html",
    line: "See our top supplement picks — dietitian-informed rankings",
  },
  "fertility-reproductive": {
    href: "/healthrankings-pregnancy-tests-top5.html",
    line: "See our best fertility & reproductive health picks — ranked",
  },
};

export function getCategoryCatalog(category: string | undefined): CategoryCatalog | null {
  if (!category) return null;
  return catalog[category] ?? null;
}

export function getCategoryTop5Callout(category: string | undefined): Top5Callout | null {
  if (!category || category === "other") return null;
  return top5[category] ?? null;
}

export function humanizeCategoryEnum(category: string | undefined): string {
  const c = getCategoryCatalog(category);
  if (c) return c.label;
  if (!category || category === "other") return "Devices";
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
