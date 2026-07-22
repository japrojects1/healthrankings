export type ReviewSection = {
  heading: string;
  body: string;
};

export type PerformancePillar = {
  pillarLabel: string;
  scoreOutOf100: number;
  commentary: string;
};

export type PerformanceScore = {
  label: string;
  score: number;   // 0-10
  width: number;   // 0-100
};

export type SpecRow = {
  key: string;
  value: string;
};

export type ProductType = "device" | "supplement";

export type Device = {
  id: number;
  slug: string;
  name: string;
  category?: string;
  productType?: ProductType;
  priceText?: string | null;
  rating?: number | null;
  affiliateUrl?: string | null;
  pros?: string[] | null;
  cons?: string[] | null;
  verdictShort?: string | null;
  tagline?: string | null;
  reviewLead?: string | null;
  reviewerAttribution?: string | null;
  evaluationWindow?: string | null;
  assessmentTag?: string | null;
  recommendWhen?: string | null;
  passWhen?: string | null;
  performancePillars?: PerformancePillar[] | null;
  reviewSections?: ReviewSection[] | null;
  performanceScores?: PerformanceScore[] | null;
  specs?: SpecRow[] | null;
  whoFor?: string[] | null;
  whoNot?: string[] | null;
  heroImage?: StrapiMedia | null;
  /**
   * Optional fallback image URL used when no `heroImage` file has been
   * uploaded — paste any public image URL (Amazon, manufacturer site, etc.).
   * The frontend prefers `heroImage` and falls back to this when absent.
   */
  heroImageUrl?: string | null;
  gallery?: StrapiMedia[] | null;
};

/** One row in a category “Top 5” list (Strapi `Category Top 5`). */
export type Top5Entry = {
  rank: number;
  device: Device | null;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type RelatedCondition = {
  name: string;
  href: string;
  meta?: string | null;
};

export type CategoryTopFive = {
  documentId?: string;
  slug: string;
  category: string;
  productType?: ProductType;
  categoryLabel?: string | null;
  title: string;
  subtitle?: string | null;
  intro?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  entries: Top5Entry[];
  faqs?: FaqItem[] | null;
  relatedConditions?: RelatedCondition[] | null;
};

type StrapiMedia = {
  url: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
};

function strapiUrl(path: string) {
  const base = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function normalizeMedia(m: any): StrapiMedia | null {
  if (!m) return null;
  // Strapi v5: media may be flat, wrapped in { data }, or only expose URL under formats.*
  let node: any = m;
  if (m.data !== undefined) {
    const d = m.data;
    if (d == null) return null;
    node = Array.isArray(d) ? d[0] : d;
    if (!node) return null;
  }
  const attrs = node.attributes ?? node;
  let url: string | undefined =
    typeof attrs.url === "string" ? attrs.url : undefined;
  if (!url && attrs.formats && typeof attrs.formats === "object") {
    for (const k of ["large", "medium", "small", "thumbnail"] as const) {
      const u = attrs.formats[k]?.url;
      if (typeof u === "string" && u) {
        url = u;
        break;
      }
    }
  }
  if (!url || typeof url !== "string") return null;
  const abs = url.startsWith("http") ? url : strapiUrl(url);
  return {
    url: abs,
    alternativeText: attrs.alternativeText ?? null,
    width: attrs.width ?? null,
    height: attrs.height ?? null,
  };
}

function blocksToPlainText(node: unknown): string {
  const parts: string[] = [];
  const walk = (n: unknown): void => {
    if (n == null) return;
    if (typeof n === "string") {
      parts.push(n);
      return;
    }
    if (Array.isArray(n)) {
      for (const x of n) walk(x);
      return;
    }
    if (typeof n === "object") {
      const o = n as Record<string, unknown>;
      if (typeof o.text === "string") parts.push(o.text);
      // Strapi Blocks / Prose-style: paragraph → content[]
      if (Array.isArray(o.content)) {
        for (const c of o.content) walk(c);
      }
      if (o.children != null) walk(o.children);
    }
  };
  walk(node);
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function reviewBodyToDisplayString(body: unknown): string {
  if (typeof body === "string") return body;
  if (Array.isArray(body)) return blocksToPlainText(body);
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    // Strapi 5 Blocks root: { type: "doc", content: [...] }
    if (o.type === "doc" && Array.isArray(o.content)) return blocksToPlainText(o.content);
    return blocksToPlainText(body);
  }
  return "";
}

/** Strapi may return components as an array or `{ data: [...] }`. */
function unwrapComponentArray(raw: unknown): unknown[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: unknown[] }).data;
  }
  return [];
}

function normalizeReviewSectionsAttr(raw: unknown): ReviewSection[] | null {
  const list = unwrapComponentArray(raw);
  const out: ReviewSection[] = [];
  for (const row of list) {
    const a = (row as any)?.attributes ?? row;
    const heading = String(a?.heading ?? "").trim();
    const body = reviewBodyToDisplayString(a?.body);
    if (heading && body) out.push({ heading, body });
  }
  return out.length ? out : null;
}

function normalizePerformancePillarsAttr(raw: unknown): PerformancePillar[] | null {
  const list = unwrapComponentArray(raw);
  const out: PerformancePillar[] = [];
  for (const row of list) {
    const a = (row as any)?.attributes ?? row;
    const pillarLabel = String(a?.pillarLabel ?? "").trim();
    let score = Number(a?.scoreOutOf100);
    if (!Number.isFinite(score)) score = 0;
    score = Math.round(Math.min(100, Math.max(0, score)));
    const commentary = String(a?.commentary ?? "").trim();
    if (!pillarLabel || !commentary) continue;
    out.push({ pillarLabel, scoreOutOf100: score, commentary });
  }
  return out.length ? out : null;
}

function pickAttrs(row: unknown): Record<string, unknown> {
  if (row && typeof row === "object") {
    const r = row as Record<string, unknown>;
    if (r.attributes && typeof r.attributes === "object") {
      return r.attributes as Record<string, unknown>;
    }
    return r;
  }
  return {};
}

function normalizePerformanceScoresAttr(raw: unknown): PerformanceScore[] | null {
  const list = unwrapComponentArray(raw);
  const out: PerformanceScore[] = [];
  for (const row of list) {
    const a = pickAttrs(row);
    const label = String(a?.label ?? "").trim();
    const score = Number(a?.score);
    if (!label || !Number.isFinite(score)) continue;
    let width = Number(a?.width);
    if (!Number.isFinite(width) || width <= 0) width = Math.round(score * 10);
    width = Math.round(Math.min(100, Math.max(0, width)));
    out.push({ label, score: Math.round(score * 10) / 10, width });
  }
  return out.length ? out : null;
}

function normalizeSpecsAttr(raw: unknown): SpecRow[] | null {
  const list = unwrapComponentArray(raw);
  const out: SpecRow[] = [];
  for (const row of list) {
    const a = pickAttrs(row);
    const key = String(a?.key ?? "").trim();
    const value = String(a?.value ?? "").trim();
    if (!key || !value) continue;
    out.push({ key, value });
  }
  return out.length ? out : null;
}

function normalizeFaqsAttr(raw: unknown): FaqItem[] | null {
  const list = unwrapComponentArray(raw);
  const out: FaqItem[] = [];
  for (const row of list) {
    const a = pickAttrs(row);
    const question = String(a?.question ?? "").trim();
    const answer = reviewBodyToDisplayString(a?.answer);
    if (!question || !answer) continue;
    out.push({ question, answer });
  }
  return out.length ? out : null;
}

function normalizeRelatedConditionsAttr(raw: unknown): RelatedCondition[] | null {
  const list = unwrapComponentArray(raw);
  const out: RelatedCondition[] = [];
  for (const row of list) {
    const a = pickAttrs(row);
    const name = String(a?.name ?? "").trim();
    const href = String(a?.href ?? "").trim();
    if (!name || !href) continue;
    out.push({
      name,
      href,
      meta: a?.meta ? String(a.meta).trim() : null,
    });
  }
  return out.length ? out : null;
}

function asStringArray(raw: unknown): string[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const out = raw
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter((s) => s.length > 0);
    return out.length ? out : null;
  }
  return null;
}

function normalizeProductType(value: unknown): ProductType {
  return String(value ?? "").trim().toLowerCase() === "supplement" ? "supplement" : "device";
}

function normalizeDevice(row: any): Device {
  const attrs = row.attributes ?? row;
  let galleryList: any[] | null = null;
  const g = attrs.gallery;
  if (Array.isArray(g)) galleryList = g;
  else if (Array.isArray(g?.data)) galleryList = g.data;

  const galleryNormalized: StrapiMedia[] | null = galleryList
    ? galleryList.map((x: any) => normalizeMedia(x)).filter((m): m is StrapiMedia => m != null)
    : null;

  const heroFromField = normalizeMedia(attrs.heroImage);
  const heroImage = heroFromField ?? galleryNormalized?.[0] ?? null;

  const reviewSections = normalizeReviewSectionsAttr(attrs.reviewSections);
  const performancePillars = normalizePerformancePillarsAttr(attrs.performancePillars);
  const performanceScores = normalizePerformanceScoresAttr(attrs.performanceScores);
  const specs = normalizeSpecsAttr(attrs.specs);

  return {
    id: row.id ?? attrs.id,
    slug: attrs.slug,
    name: attrs.name,
    category: attrs.category,
    productType: normalizeProductType(attrs.productType),
    priceText: attrs.priceText ?? null,
    rating: attrs.rating != null ? Number(attrs.rating) : null,
    affiliateUrl: attrs.affiliateUrl ?? null,
    pros: Array.isArray(attrs.pros) ? attrs.pros : null,
    cons: Array.isArray(attrs.cons) ? attrs.cons : null,
    verdictShort: attrs.verdictShort ?? null,
    tagline: attrs.tagline ?? null,
    reviewLead: attrs.reviewLead ?? null,
    reviewerAttribution: attrs.reviewerAttribution ?? null,
    evaluationWindow: attrs.evaluationWindow ?? null,
    assessmentTag: attrs.assessmentTag ?? null,
    recommendWhen: attrs.recommendWhen ?? null,
    passWhen: attrs.passWhen ?? null,
    performancePillars,
    reviewSections,
    performanceScores,
    specs,
    whoFor: asStringArray(attrs.whoFor),
    whoNot: asStringArray(attrs.whoNot),
    heroImage,
    heroImageUrl:
      typeof attrs.heroImageUrl === "string" && attrs.heroImageUrl.trim()
        ? attrs.heroImageUrl.trim()
        : null,
    gallery: galleryNormalized?.length ? galleryNormalized : null,
  };
}

/** Strapi 5: list media + repeatable components explicitly (populate=* alone can omit components). */
const DEVICE_DEEP_POPULATE =
  "populate[heroImage]=true&populate[gallery]=true&populate[reviewSections]=true&populate[performancePillars]=true&populate[performanceScores]=true&populate[specs]=true";

function appendDevicePopulate(urlWithQuery: string): string {
  return urlWithQuery.includes("?")
    ? `${urlWithQuery}&${DEVICE_DEEP_POPULATE}`
    : `${urlWithQuery}?${DEVICE_DEEP_POPULATE}`;
}

/** Published devices in a category; sorted by rating (high first), then name. */
export async function fetchPublishedDevicesByCategory(
  category: string,
  limit = 100
): Promise<Device[]> {
  const u = new URL(strapiUrl("/api/devices"));
  u.searchParams.set("filters[category][$eq]", category);
  u.searchParams.set("status", "published");
  u.searchParams.set("pagination[pageSize]", String(Math.min(100, Math.max(1, limit))));
  u.searchParams.set("sort[0]", "rating:desc");
  u.searchParams.set("sort[1]", "name:asc");
  const res = await fetch(appendDevicePopulate(u.toString()), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: Record<string, unknown>[] };
  const rows = json?.data || [];
  return rows.map((row) => normalizeDevice(row));
}

export async function fetchDeviceBySlug(slug: string): Promise<Device | null> {
  const base = strapiUrl(
    `/api/devices?filters[slug][$eq]=${encodeURIComponent(slug)}&status=published&pagination[pageSize]=1`
  );
  const url = appendDevicePopulate(base);

  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const first = (json?.data || [])[0];
  if (!first) return null;
  return normalizeDevice(first);
}

/** Case-insensitive name or slug match; published devices only. */
export async function searchPublishedDevices(query: string, limit = 20): Promise<Device[]> {
  const term = query.trim().slice(0, 120);
  if (term.length < 2) return [];
  const u = new URL(strapiUrl("/api/devices"));
  u.searchParams.set("filters[$or][0][name][$containsi]", term);
  u.searchParams.set("filters[$or][1][slug][$containsi]", term);
  u.searchParams.set("status", "published");
  u.searchParams.set("pagination[pageSize]", String(Math.min(50, Math.max(1, limit))));
  const res = await fetch(appendDevicePopulate(u.toString()), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: Record<string, unknown>[] };
  const rows = json?.data || [];
  return rows.map((row) => normalizeDevice(row));
}

const CATEGORY_TOP5_POPULATE = [
  "populate[entries][populate][device][populate][heroImage]=true",
  "populate[entries][populate][device][populate][gallery]=true",
  "populate[entries][populate][device][populate][reviewSections]=true",
  "populate[entries][populate][device][populate][performancePillars]=true",
  "populate[entries][populate][device][populate][performanceScores]=true",
  "populate[entries][populate][device][populate][specs]=true",
  "populate[faqs]=true",
  "populate[relatedConditions]=true",
].join("&");

function unwrapStrapiRelation(m: any): any {
  if (!m) return null;
  if (m.data != null) {
    const d = m.data;
    return Array.isArray(d) ? d[0] : d;
  }
  return m;
}

function normalizeTop5Entry(raw: any): Top5Entry {
  const e = raw?.attributes ?? raw;
  const devRow = unwrapStrapiRelation(e?.device);
  return {
    rank: Number(e?.rank),
    device: devRow ? normalizeDevice(devRow) : null,
  };
}

function normalizeCategoryTopFiveRow(row: any): CategoryTopFive {
  const attrs = row.attributes ?? row;
  let rawEntries = attrs.entries;
  if (rawEntries?.data != null && Array.isArray(rawEntries.data)) {
    rawEntries = rawEntries.data;
  }
  const list = Array.isArray(rawEntries) ? rawEntries.map(normalizeTop5Entry) : [];
  list.sort((a, b) => a.rank - b.rank);
  return {
    documentId: row.documentId ?? attrs.documentId,
    slug: String(attrs.slug ?? ""),
    category: String(attrs.category ?? ""),
    productType: normalizeProductType(attrs.productType),
    categoryLabel: attrs.categoryLabel ?? null,
    title: String(attrs.title ?? ""),
    subtitle: attrs.subtitle ?? null,
    intro: attrs.intro ?? null,
    metaTitle: attrs.metaTitle ?? null,
    metaDescription: attrs.metaDescription ?? null,
    entries: list,
    faqs: normalizeFaqsAttr(attrs.faqs),
    relatedConditions: normalizeRelatedConditionsAttr(attrs.relatedConditions),
  };
}

export async function fetchCategoryTopFives(): Promise<CategoryTopFive[]> {
  const url = strapiUrl(
    `/api/category-top-fives?${CATEGORY_TOP5_POPULATE}&sort=category:asc&status=published`
  );
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const json = await res.json();
  const rows = json?.data || [];
  return rows.map(normalizeCategoryTopFiveRow);
}

/**
 * Published Category Top 5s for a given product kind ('supplement' powers the /supplements hub,
 * 'device' the /devices hub). Rows are normalized and sorted by category.
 */
export async function fetchCategoryTopFivesByProductType(
  productType: ProductType
): Promise<CategoryTopFive[]> {
  const url = strapiUrl(
    `/api/category-top-fives?filters[productType][$eq]=${encodeURIComponent(
      productType
    )}&${CATEGORY_TOP5_POPULATE}&sort=category:asc&status=published`
  );
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const json = await res.json();
  const rows = json?.data || [];
  return rows.map(normalizeCategoryTopFiveRow);
}

export async function fetchCategoryTopFiveByCategory(
  category: string
): Promise<CategoryTopFive | null> {
  const url = strapiUrl(
    `/api/category-top-fives?filters[category][$eq]=${encodeURIComponent(category)}&${CATEGORY_TOP5_POPULATE}&pagination[pageSize]=1&status=published`
  );
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const first = (json?.data || [])[0];
  if (!first) return null;
  return normalizeCategoryTopFiveRow(first);
}

export async function fetchCategoryTopFiveBySlug(slug: string): Promise<CategoryTopFive | null> {
  const url = strapiUrl(
    `/api/category-top-fives?filters[slug][$eq]=${encodeURIComponent(slug)}&${CATEGORY_TOP5_POPULATE}&pagination[pageSize]=1&status=published`
  );
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const first = (json?.data || [])[0];
  if (!first) return null;
  return normalizeCategoryTopFiveRow(first);
}

