import Link from "next/link";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { DeviceHeader } from "@/components/device/DeviceHeader";
import { ArticleFooter } from "@/components/article/ArticleFooter";
import {
  SupplementsBrowser,
  type SupplementCategory,
} from "@/components/supplements/SupplementsBrowser";
import { fetchCategoryTopFivesByProductType } from "@/lib/strapi";
import { humanizeCategoryEnum } from "@/lib/device-category-links";
import {
  SITE,
  DEFAULT_OG,
  breadcrumb,
  canonical,
  collectionPage,
  renderJsonLd,
} from "@/lib/seo-jsonld";

export const dynamic = "force-dynamic";

// Canonical stays on the legacy .html URL (nav links point there; middleware
// rewrites it to /supplements), mirroring how /articles is handled.
const CANONICAL_PATH = "/healthrankings-supplements.html";
const PAGE_TITLE = "Health Supplements Reviewed — Best Supplements of 2026 | HealthRankings";
const PAGE_DESC =
  "Browse every health supplement reviewed by HealthRankings. Filter by supplement type and find expert-ranked Top 5 lists for creatine, antioxidants, and more.";

function ratingToScore10(rating: number | null | undefined): number | null {
  if (rating == null || Number.isNaN(Number(rating))) return null;
  return Math.round(Number(rating) * 2 * 10) / 10;
}

export async function generateMetadata(): Promise<Metadata> {
  noStore();
  const url = canonical(CANONICAL_PATH);
  return {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: PAGE_TITLE,
      description: PAGE_DESC,
      siteName: "HealthRankings",
      images: [{ url: DEFAULT_OG }],
    },
    twitter: { card: "summary", title: PAGE_TITLE, description: PAGE_DESC, images: [DEFAULT_OG] },
  };
}

export default async function SupplementsPage() {
  noStore();

  const topFives = await fetchCategoryTopFivesByProductType("supplement");

  const categories: SupplementCategory[] = topFives
    .map((t) => {
      const entries = (t.entries ?? []).filter((e) => e.device);
      const label = t.categoryLabel?.trim() || humanizeCategoryEnum(t.category);
      const winner = entries[0]?.device ?? null;
      const products = entries.slice(0, 4).map((e) => {
        const d = e.device!;
        return {
          name: d.name,
          slug: d.slug,
          score: ratingToScore10(d.rating),
          image: d.heroImage?.url || d.heroImageUrl || null,
        };
      });
      return {
        category: t.category,
        label,
        count: entries.length,
        winnerName: winner?.name ?? null,
        winnerScore: ratingToScore10(winner?.rating),
        top5Href: `/top5/${encodeURIComponent(t.category)}`,
        allHref: `/devices/category/${encodeURIComponent(t.category)}`,
        products,
      };
    })
    .filter((c) => c.products.length > 0);

  const url = canonical(CANONICAL_PATH);
  const breadcrumbBlock = breadcrumb([
    { name: "Home", url: `${SITE}/` },
    { name: "Supplements", url },
  ]);
  const collectionBlock = collectionPage(PAGE_TITLE, url, PAGE_DESC);

  return (
    <div className="hr-device-page hr-supplements-page">
      <script {...renderJsonLd(breadcrumbBlock)} />
      <script {...renderJsonLd(collectionBlock)} />
      <DeviceHeader active="supplements" />

      <section className="page-hero">
        <div className="hero-eyebrow">
          <div className="hero-pulse" aria-hidden />
          Expert Reviewed · 2026
        </div>
        <h1>
          Health supplements, <em>reviewed.</em>
        </h1>
        <p className="hero-desc">
          Filter by supplement type to find expert-ranked reviews. Every category includes a full Top
          5 ranking with scores, pros &amp; cons, and buy links.
        </p>
      </section>

      <SupplementsBrowser categories={categories} />

      <div className="medical-disclaimer">
        <div className="medical-disclaimer-inner">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <span>
            <strong>Medical disclaimer:</strong> This content is for informational purposes only and
            is not a substitute for professional medical advice. Supplements are not intended to
            diagnose, treat, cure, or prevent any disease. Always consult your physician.{" "}
            <Link href="/healthrankings-terms-of-service.html">Read full disclaimer</Link>
          </span>
        </div>
      </div>

      <ArticleFooter />
    </div>
  );
}
