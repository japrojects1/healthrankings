import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { fetchCategoryTopFiveByCategory, fetchDeviceBySlug } from "@/lib/strapi";
import {
  getCategoryCatalog,
  getCategoryTop5Callout,
  humanizeCategoryEnum,
} from "@/lib/device-category-links";
import { DeviceHeader } from "@/components/device/DeviceHeader";
import { ArticleFooter } from "@/components/article/ArticleFooter";
import { DeviceReviewRich } from "@/components/device/DeviceReviewRich";
import {
  SITE,
  DEFAULT_OG,
  breadcrumb,
  canonical,
  productReview,
  renderJsonLd,
} from "@/lib/seo-jsonld";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  noStore();
  const { slug } = await params;
  const device = await fetchDeviceBySlug(slug);
  if (!device) return { title: "Device review" };
  const catLabel = humanizeCategoryEnum(device.category);
  const lead = device.reviewLead?.trim();
  const desc =
    device.tagline?.trim() ||
    (lead ? `${lead.slice(0, 165)}${lead.length > 165 ? "…" : ""}` : "") ||
    device.verdictShort ||
    `${device.name} — independent expert review on HealthRankings.`;
  const description = desc.length > 165 ? `${desc.slice(0, 162)}…` : desc;
  const url = canonical(`/devices/${slug}`);
  const image = device.heroImage?.url || device.heroImageUrl || DEFAULT_OG;
  const title = `${device.name} Review | ${catLabel} | HealthRankings`;
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

export default async function DevicePage({ params }: Props) {
  noStore();
  const { slug } = await params;
  const device = await fetchDeviceBySlug(slug);
  if (!device) return notFound();

  const catalog = getCategoryCatalog(device.category);
  const top5Callout = getCategoryTop5Callout(device.category);
  const categoryLabel = catalog?.label ?? humanizeCategoryEnum(device.category);

  // Fetch siblings for the comparative table; failure is non-fatal — the
  // section is omitted when there's no Top 5 data for the category.
  let siblings = null;
  try {
    siblings = device.category ? await fetchCategoryTopFiveByCategory(device.category) : null;
  } catch {
    siblings = null;
  }

  const breadcrumbNav = (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <span className="breadcrumb-sep">/</span>
      <Link href="/healthrankings-devices.html">Devices</Link>
      <span className="breadcrumb-sep">/</span>
      {catalog ? (
        <>
          <Link href={catalog.href}>{catalog.label}</Link>
          <span className="breadcrumb-sep">/</span>
        </>
      ) : null}
      <span className="breadcrumb-current">{device.name}</span>
    </nav>
  );

  const url = canonical(`/devices/${slug}`);
  const heroForSchema = device.heroImage?.url || device.heroImageUrl || null;
  const breadcrumbItems = [
    { name: "Home", url: `${SITE}/` },
    { name: "Devices", url: `${SITE}/healthrankings-devices.html` },
  ];
  if (catalog) breadcrumbItems.push({ name: catalog.label, url: `${SITE}${catalog.href}` });
  breadcrumbItems.push({ name: device.name, url });
  const breadcrumbBlock = breadcrumb(breadcrumbItems);
  const productBlock = productReview({
    name: device.name,
    description: device.tagline || device.verdictShort || device.reviewLead || null,
    url,
    image: heroForSchema,
    ratingScore10: device.rating ?? null,
    reviewBody: device.verdictShort || device.reviewLead || null,
    reviewerName: device.reviewerAttribution || "HealthRankings Editorial",
  });

  return (
    <div className="hr-device-page">
      <script {...renderJsonLd(breadcrumbBlock)} />
      <script {...renderJsonLd(productBlock)} />
      <DeviceHeader />
      <DeviceReviewRich
        device={device}
        categoryLabel={categoryLabel}
        breadcrumb={breadcrumbNav}
        siblings={siblings}
        top5Href={top5Callout?.href ?? null}
      />
      <div className="medical-disclaimer">
        <div className="medical-disclaimer-inner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <span>
            <strong>Medical disclaimer:</strong> Reviews are for general information only and are not medical advice.
            Always follow your clinician&apos;s guidance for diagnosing or treating health conditions.{" "}
            <Link href="/healthrankings-terms-of-service.html">Read full disclaimer</Link>
          </span>
        </div>
      </div>
      <ArticleFooter />
    </div>
  );
}
