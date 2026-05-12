export type ReviewSection = {
  heading: string;
  body: string;
};

export type Device = {
  id: number;
  slug: string;
  name: string;
  category?: string;
  priceText?: string | null;
  rating?: number | null;
  affiliateUrl?: string | null;
  pros?: string[] | null;
  cons?: string[] | null;
  verdictShort?: string | null;
  reviewSections?: ReviewSection[] | null;
  heroImage?: StrapiMedia | null;
  gallery?: StrapiMedia[] | null;
};

/** One row in a category “Top 5” list (Strapi `Category Top 5`). */
export type Top5Entry = {
  rank: number;
  device: Device | null;
};

export type CategoryTopFive = {
  documentId?: string;
  slug: string;
  category: string;
  title: string;
  subtitle?: string | null;
  entries: Top5Entry[];
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

  return {
    id: row.id ?? attrs.id,
    slug: attrs.slug,
    name: attrs.name,
    category: attrs.category,
    priceText: attrs.priceText ?? null,
    rating: attrs.rating != null ? Number(attrs.rating) : null,
    affiliateUrl: attrs.affiliateUrl ?? null,
    pros: Array.isArray(attrs.pros) ? attrs.pros : null,
    cons: Array.isArray(attrs.cons) ? attrs.cons : null,
    verdictShort: attrs.verdictShort ?? null,
    reviewSections: Array.isArray(attrs.reviewSections) ? attrs.reviewSections : null,
    heroImage,
    gallery: galleryNormalized?.length ? galleryNormalized : null,
  };
}

/** Published devices in a category; sorted by rating (high first), then name. */
export async function fetchPublishedDevicesByCategory(
  category: string,
  limit = 100
): Promise<Device[]> {
  const u = new URL(strapiUrl("/api/devices"));
  u.searchParams.set("filters[category][$eq]", category);
  u.searchParams.set("populate", "*");
  u.searchParams.set("status", "published");
  u.searchParams.set("pagination[pageSize]", String(Math.min(100, Math.max(1, limit))));
  u.searchParams.set("sort[0]", "rating:desc");
  u.searchParams.set("sort[1]", "name:asc");
  const res = await fetch(u.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: Record<string, unknown>[] };
  const rows = json?.data || [];
  return rows.map((row) => normalizeDevice(row));
}

export async function fetchDeviceBySlug(slug: string): Promise<Device | null> {
  // populate=* ensures media + components resolve reliably on Strapi 5 (same-origin CMS URLs).
  const url = strapiUrl(
    `/api/devices?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*&status=published`
  );

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
  u.searchParams.set("populate", "*");
  u.searchParams.set("status", "published");
  u.searchParams.set("pagination[pageSize]", String(Math.min(50, Math.max(1, limit))));
  const res = await fetch(u.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: Record<string, unknown>[] };
  const rows = json?.data || [];
  return rows.map((row) => normalizeDevice(row));
}

const CATEGORY_TOP5_POPULATE =
  "populate[entries][populate][device][populate][heroImage]=true&populate[entries][populate][device][populate][gallery]=true";

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
    title: String(attrs.title ?? ""),
    subtitle: attrs.subtitle ?? null,
    entries: list,
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

