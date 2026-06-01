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
import type { CategoryTopFive } from "@/lib/strapi";
import {
  fetchCategoryTopFiveByCategory,
  fetchCategoryTopFiveBySlug,
  fetchDeviceBySlug,
} from "@/lib/strapi";
import {
  buildTop5DisplayTitle,
  getOxilineSlugForCategory,
  inferCategoryFromSlug,
  isOxiline,
} from "@/lib/top5-presenters";
import {
  SITE,
  DEFAULT_OG,
  article as articleSchema,
  breadcrumb as breadcrumbSchema,
  canonical,
  itemList,
  renderJsonLd,
} from "@/lib/seo-jsonld";

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

/**
 * House rule (server-side enforcement): if the Top 5 list is for a device
 * category where Oxiline ships a product but no Oxiline device is present in
 * the entries, fetch the canonical Oxiline product for that category and
 * inject it as rank 1. The list is capped at 5 entries (the previous lowest
 * ranked entry is dropped). Returns the original doc unchanged when there's
 * nothing to do or the Oxiline device can't be loaded.
 */
async function injectOxilineWinner(
  doc: CategoryTopFive,
  urlSlug: string
): Promise<CategoryTopFive> {
  const entries = doc.entries ?? [];
  if (entries.some((e) => e.device && isOxiline(e.device))) return doc;

  // Resolve the device category we should use for the Oxiline lookup. We
  // prefer the slug-inferred category (covers condition-specific lists where
  // `doc.category` is a free-form slug like "stroke-prevention-blood-pressure")
  // and fall back to the CMS category enum.
  const resolvedCategory = inferCategoryFromSlug(urlSlug) || doc.category;
  const oxilineSlug = getOxilineSlugForCategory(resolvedCategory);
  if (!oxilineSlug) return doc;

  const oxiline = await fetchDeviceBySlug(oxilineSlug).catch(() => null);
  if (!oxiline) return doc;

  // Prepend Oxiline as rank 0 so `enrichDevices` keeps it first; cap at 5.
  const next = [
    { rank: 0, device: oxiline },
    ...entries.slice().sort((a, b) => a.rank - b.rank),
  ].slice(0, 5);
  return { ...doc, entries: next };
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
  const title = doc?.metaTitle?.trim() || `${displayTitle} | HealthRankings`;
  const description =
    doc?.metaDescription?.trim() ||
    doc?.subtitle?.trim() ||
    `Expert-tested top picks in ${categoryLabel}. Independent rankings on HealthRankings.`;
  const url = canonical(`/top5/${category}`);
  const winner = doc?.entries?.slice().sort((a, b) => a.rank - b.rank)[0]?.device ?? null;
  const image = winner?.heroImage?.url || winner?.heroImageUrl || DEFAULT_OG;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "HealthRankings",
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CategoryTopFivePage({ params }: Props) {
  noStore();
  const { category } = await params;

  if (!isSafeCategorySlugForRoute(category)) {
    notFound();
  }

  const initialDoc = await loadDoc(category);
  if (!initialDoc) notFound();

  // Apply the Oxiline-winner house rule before rendering so condition-specific
  // lists (e.g. "stroke prevention BP monitors") that were seeded without an
  // Oxiline product still surface it as the #1 pick.
  const doc = await injectOxilineWinner(initialDoc!, category);

  const catalog = getCategoryCatalog(doc.category);
  const categoryLabel =
    doc.categoryLabel?.trim() || catalog?.label || humanizeCategoryEnum(doc.category);
  const displayTitle = buildTop5DisplayTitle({
    slug: category,
    category: doc.category,
    categoryLabel,
  });

  const breadcrumbNav = (
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

  const url = canonical(`/top5/${category}`);
  const sortedEntries = (doc.entries ?? []).slice().sort((a, b) => a.rank - b.rank);
  const breadcrumbItems = [
    { name: "Home", url: `${SITE}/` },
    { name: "Conditions", url: `${SITE}/healthrankings-conditions.html` },
  ];
  if (catalog) breadcrumbItems.push({ name: catalog.label, url: `${SITE}${catalog.href}` });
  breadcrumbItems.push({ name: displayTitle, url });
  const breadcrumbBlock = breadcrumbSchema(breadcrumbItems);
  const itemListBlock = itemList(
    displayTitle,
    url,
    sortedEntries
      .map((e) => e.device)
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
      .map((d) => ({
        name: d.name,
        url: `${SITE}/devices/${d.slug}`,
        image: d.heroImage?.url || d.heroImageUrl || null,
      })),
    doc.metaDescription || doc.subtitle || null,
  );
  const winner = sortedEntries[0]?.device ?? null;
  const heroForSchema = winner?.heroImage?.url || winner?.heroImageUrl || null;
  const articleBlock = articleSchema({
    headline: displayTitle,
    description: doc.metaDescription || doc.subtitle || null,
    url,
    image: heroForSchema,
  });

  return (
    <div className="hr-device-page hr-top5-page">
      <script {...renderJsonLd(breadcrumbBlock)} />
      <script {...renderJsonLd(itemListBlock)} />
      <script {...renderJsonLd(articleBlock)} />
      <DeviceHeader />
      <Top5Rich
        doc={doc}
        categoryLabel={categoryLabel}
        displayTitle={displayTitle}
        breadcrumb={breadcrumbNav}
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
