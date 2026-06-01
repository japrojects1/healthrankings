/**
 * Helpers for rendering schema.org JSON-LD on Next.js pages.
 *
 * Usage in a server component:
 *
 *   import { renderJsonLd, breadcrumb, article } from "@/lib/seo-jsonld";
 *   <script {...renderJsonLd(breadcrumb([...]))} />
 *
 * Or render multiple blocks:
 *
 *   {[breadcrumb([...]), article({...})].map((block, i) => (
 *     <script key={i} {...renderJsonLd(block)} />
 *   ))}
 */

export const SITE = "https://www.healthrankings.co";
export const DEFAULT_OG = `${SITE}/brand/og-default.svg`;
export const PUBLISHER = {
  "@type": "Organization",
  name: "HealthRankings",
  url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: `${SITE}/brand/og-default.svg` },
} as const;

/** Returns props for `<script type="application/ld+json" />`. */
export function renderJsonLd(json: unknown) {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(json).replace(/</g, "\\u003c"),
    },
  };
}

export type BreadcrumbItem = { name: string; url: string };

export function breadcrumb(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export type ArticleSchemaInput = {
  headline: string;
  description?: string | null;
  url: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
};

export function article(input: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline.slice(0, 110),
    description: input.description ? input.description.slice(0, 240) : undefined,
    url: input.url,
    image: input.image || DEFAULT_OG,
    datePublished: input.datePublished || undefined,
    dateModified: input.dateModified || input.datePublished || undefined,
    author: input.authorName
      ? { "@type": "Organization", name: input.authorName }
      : { "@type": "Organization", name: "HealthRankings" },
    publisher: PUBLISHER,
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
  };
}

export type ProductReviewInput = {
  name: string;
  description?: string | null;
  url: string;
  image?: string | null;
  brand?: string | null;
  /** 0–10 score from CMS; converted to a 5-star rating. */
  ratingScore10?: number | null;
  reviewCount?: number | null;
  reviewBody?: string | null;
  reviewerName?: string | null;
  datePublished?: string | null;
};

export function productReview(input: ProductReviewInput) {
  const rating10 = typeof input.ratingScore10 === "number" ? input.ratingScore10 : null;
  const star =
    rating10 != null ? Math.max(0, Math.min(5, Math.round((rating10 / 10) * 5 * 10) / 10)) : null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description ? input.description.slice(0, 240) : undefined,
    url: input.url,
    image: input.image || undefined,
    brand: input.brand ? { "@type": "Brand", name: input.brand } : undefined,
    aggregateRating:
      star != null
        ? {
            "@type": "AggregateRating",
            ratingValue: star,
            bestRating: 5,
            worstRating: 1,
            reviewCount: typeof input.reviewCount === "number" && input.reviewCount > 0 ? input.reviewCount : 1,
          }
        : undefined,
    review: {
      "@type": "Review",
      author: { "@type": "Organization", name: input.reviewerName || "HealthRankings Editorial" },
      datePublished: input.datePublished || undefined,
      reviewBody: input.reviewBody ? input.reviewBody.slice(0, 600) : undefined,
      reviewRating:
        star != null
          ? {
              "@type": "Rating",
              ratingValue: star,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
      publisher: PUBLISHER,
    },
  };
}

export type ItemListEntry = { name: string; url?: string | null; image?: string | null };

export function itemList(name: string, url: string, items: ItemListEntry[], description?: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url,
    description: description || undefined,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: it.url || undefined,
      image: it.image || undefined,
    })),
  };
}

export function collectionPage(name: string, url: string, description?: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url,
    description: description || undefined,
    isPartOf: { "@type": "WebSite", name: "HealthRankings", url: `${SITE}/` },
    publisher: PUBLISHER,
  };
}

/** Build canonical URL for any path (absolute or relative). */
export function canonical(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
}
