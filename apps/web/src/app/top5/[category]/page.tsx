import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { DeviceHeader } from "@/components/device/DeviceHeader";
import { ArticleFooter } from "@/components/article/ArticleFooter";
import { Top5Rich } from "@/components/top5/Top5Rich";
import {
  getCategoryCatalog,
  humanizeCategoryEnum,
  isSafeCategorySlugForRoute,
} from "@/lib/device-category-links";
import {
  fetchCategoryTopFiveByCategory,
  fetchCategoryTopFiveBySlug,
} from "@/lib/strapi";
import { buildTop5DisplayTitle } from "@/lib/top5-presenters";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

async function loadDoc(category: string) {
  // Try the entry's `slug` first so condition-specific lists (e.g.
  // "hypertension", "afib-blood-pressure-monitor") win when their slug
  // matches the URL exactly. Fall back to the device-category enum so
  // legacy category hubs like /top5/blood-pressure-monitors still resolve.
  const bySlug = await fetchCategoryTopFiveBySlug(category);
  if (bySlug) return bySlug;
  return await fetchCategoryTopFiveByCategory(category);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  noStore();
  const { category } = await params;
  if (!isSafeCategorySlugForRoute(category)) {
    return { title: "Top 5 | HealthRankings" };
  }
  const doc = await loadDoc(category);
  const catalog = getCategoryCatalog(doc?.category);
  const categoryLabel =
    doc?.categoryLabel?.trim() || catalog?.label || humanizeCategoryEnum(doc?.category || category);
  const displayTitle = buildTop5DisplayTitle({
    slug: category,
    category: doc?.category,
    categoryLabel,
  });
  return {
    title: doc?.metaTitle?.trim() || `${displayTitle} | HealthRankings`,
    description:
      doc?.metaDescription?.trim() ||
      doc?.subtitle?.trim() ||
      `Expert-tested top picks in ${categoryLabel}. Independent rankings on HealthRankings.`,
  };
}

export default async function CategoryTopFivePage({ params }: Props) {
  noStore();
  const { category } = await params;

  if (!isSafeCategorySlugForRoute(category)) {
    notFound();
  }

  const doc = await loadDoc(category);
  if (!doc) notFound();

  const catalog = getCategoryCatalog(doc!.category);
  const categoryLabel =
    doc!.categoryLabel?.trim() || catalog?.label || humanizeCategoryEnum(doc!.category);
  const displayTitle = buildTop5DisplayTitle({
    slug: category,
    category: doc!.category,
    categoryLabel,
  });

  const breadcrumb = (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <span className="breadcrumb-sep">/</span>
      <Link href="/healthrankings-conditions.html">Conditions</Link>
      <span className="breadcrumb-sep">/</span>
      {catalog ? (
        <>
          <Link href={catalog.href}>{catalog.label}</Link>
          <span className="breadcrumb-sep">/</span>
        </>
      ) : null}
      <span className="breadcrumb-current">{displayTitle}</span>
    </nav>
  );

  return (
    <div className="hr-device-page hr-top5-page">
      <DeviceHeader />
      <Top5Rich
        doc={doc!}
        categoryLabel={categoryLabel}
        displayTitle={displayTitle}
        breadcrumb={breadcrumb}
      />
      <div className="medical-disclaimer">
        <div className="medical-disclaimer-inner">
          <span>
            <strong>Medical disclaimer:</strong> Rankings are for general information only and are not
            medical advice. Always follow your clinician&apos;s guidance.{" "}
            <Link href="/healthrankings-terms-of-service.html">Read full disclaimer</Link>
          </span>
        </div>
      </div>
      <ArticleFooter />
    </div>
  );
}
