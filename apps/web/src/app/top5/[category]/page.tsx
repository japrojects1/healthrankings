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

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

async function loadDoc(category: string) {
  // Allow either `category` enum (e.g. "blood-pressure-monitors") or the
  // top5 entry's `slug` (e.g. "afib-blood-pressure-monitor") so we can route
  // both legacy category hubs and condition-specific top5 lists.
  const byCategory = await fetchCategoryTopFiveByCategory(category);
  if (byCategory) return byCategory;
  return await fetchCategoryTopFiveBySlug(category);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  noStore();
  const { category } = await params;
  if (!isSafeCategorySlugForRoute(category)) {
    return { title: "Top 5 | HealthRankings" };
  }
  const doc = await loadDoc(category);
  const label = humanizeCategoryEnum(category);
  const fallbackTitle = doc?.title?.trim() || `Top 5 ${label}`;
  return {
    title: doc?.metaTitle?.trim() || `${fallbackTitle} | HealthRankings`,
    description:
      doc?.metaDescription?.trim() ||
      doc?.subtitle?.trim() ||
      `Expert-tested top picks in ${label}. Independent rankings on HealthRankings.`,
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
      <span className="breadcrumb-current">{doc!.title || categoryLabel}</span>
    </nav>
  );

  return (
    <div className="hr-device-page hr-top5-page">
      <DeviceHeader />
      <Top5Rich doc={doc!} categoryLabel={categoryLabel} breadcrumb={breadcrumb} />
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
