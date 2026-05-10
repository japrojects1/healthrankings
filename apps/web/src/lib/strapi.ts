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
  // Strapi v5 can return either the raw object or { data: { ... } }
  const item = m.data ?? m;
  const attrs = item.attributes ?? item;
  const url = attrs?.url;
  if (!url) return null;
  const abs = url.startsWith('http') ? url : strapiUrl(url);
  return {
    url: abs,
    alternativeText: attrs?.alternativeText ?? null,
    width: attrs?.width ?? null,
    height: attrs?.height ?? null,
  };
}

function normalizeDevice(row: any): Device {
  const attrs = row.attributes ?? row;
  let galleryList: any[] | null = null;
  const g = attrs.gallery;
  if (Array.isArray(g)) galleryList = g;
  else if (Array.isArray(g?.data)) galleryList = g.data;

  const galleryNormalized: StrapiMedia[] | null = galleryList
    ? (galleryList.map((x: any) => normalizeMedia(x)).filter((m): m is StrapiMedia => m != null))
    : null;

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
    heroImage: normalizeMedia(attrs.heroImage),
    gallery: galleryNormalized?.length ? galleryNormalized : null,
  };
}

export async function fetchDeviceBySlug(slug: string): Promise<Device | null> {
  const url = strapiUrl(
    `/api/devices?filters[slug][$eq]=${encodeURIComponent(slug)}&populate[heroImage]=true&populate[gallery]=true&populate[reviewSections]=true`
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

const CATEGORY_TOP5_POPULATE =
  'populate[entries][populate][device][populate][heroImage]=true';

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
  const url = strapiUrl(`/api/category-top-fives?${CATEGORY_TOP5_POPULATE}&sort=category:asc`);
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
    `/api/category-top-fives?filters[category][$eq]=${encodeURIComponent(category)}&${CATEGORY_TOP5_POPULATE}&pagination[pageSize]=1`
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
    `/api/category-top-fives?filters[slug][$eq]=${encodeURIComponent(slug)}&${CATEGORY_TOP5_POPULATE}&pagination[pageSize]=1`
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

