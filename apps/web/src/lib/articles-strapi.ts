export type Article = {
  id: number;
  documentId?: string;
  slug: string;
  title: string;
  tag?: string | null;
  topic?: string | null;
  subtitle?: string | null;
  metaDescription?: string | null;
  readTime?: string | null;
  publishedDate?: string | null;
  authorLine?: string | null;
  body: string;
  heroImage?: { url: string; alternativeText?: string | null } | null;
};

function strapiBase(path: string) {
  const base = process.env.STRAPI_URL || 'http://localhost:1337';
  return new URL(path, base.endsWith('/') ? base : `${base}/`).toString();
}

function normalizeMedia(m: unknown): Article['heroImage'] {
  if (!m || typeof m !== 'object') return null;
  const row = m as Record<string, unknown>;
  const item = (row.data ?? row) as Record<string, unknown>;
  const attrs = (item.attributes ?? item) as Record<string, unknown>;
  const url = attrs?.url;
  if (!url || typeof url !== 'string') return null;
  const abs = url.startsWith('http') ? url : strapiBase(url);
  return {
    url: abs,
    alternativeText: (attrs?.alternativeText as string) ?? null,
  };
}

function normalizeArticle(row: Record<string, unknown>): Article {
  const attrs = (row.attributes ?? row) as Record<string, unknown>;
  return {
    id: (row.id ?? attrs.id) as number,
    documentId: (row.documentId ?? attrs.documentId) as string | undefined,
    slug: String(attrs.slug ?? ''),
    title: String(attrs.title ?? ''),
    tag: (attrs.tag as string) ?? null,
    topic: (attrs.topic as string) ?? null,
    subtitle: (attrs.subtitle as string) ?? null,
    metaDescription: (attrs.metaDescription as string) ?? null,
    readTime: (attrs.readTime as string) ?? null,
    publishedDate: (attrs.publishedDate as string) ?? null,
    authorLine: (attrs.authorLine as string) ?? null,
    body: String(attrs.body ?? ''),
    heroImage: normalizeMedia(attrs.heroImage),
  };
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const url = strapiBase(
    `/api/articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate[heroImage]=true`
  );
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const first = (json?.data || [])[0] as Record<string, unknown> | undefined;
  if (!first) return null;
  return normalizeArticle(first);
}
