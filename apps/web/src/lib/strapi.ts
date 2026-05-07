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
    gallery: Array.isArray(attrs.gallery?.data ?? attrs.gallery)
      ? (attrs.gallery.data ?? attrs.gallery).map((x: any) => normalizeMedia(x)).filter(Boolean)
      : null,
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

