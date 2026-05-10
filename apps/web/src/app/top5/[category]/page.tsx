import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { DeviceHeader } from "@/components/device/DeviceHeader";
import { ArticleFooter } from "@/components/article/ArticleFooter";
import {
  getCategoryCatalog,
  humanizeCategoryEnum,
  isRegisteredTop5Category,
} from "@/lib/device-category-links";
import { fetchCategoryTopFiveByCategory } from "@/lib/strapi";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

function ratingToScore10(rating: number | null | undefined): number | null {
  if (rating == null || Number.isNaN(Number(rating))) return null;
  return Math.round(Number(rating) * 2 * 10) / 10;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  noStore();
  const { category } = await params;
  if (!isRegisteredTop5Category(category)) {
    return { title: "Top 5 | HealthRankings" };
  }
  const doc = await fetchCategoryTopFiveByCategory(category);
  const label = humanizeCategoryEnum(category);
  const title = doc?.title?.trim() || `Top 5 ${label}`;
  return {
    title: `${title} | HealthRankings`,
    description:
      doc?.subtitle?.trim() ||
      `Expert-tested top picks in ${label}. Independent rankings on HealthRankings.`,
  };
}

export default async function CategoryTopFivePage({ params }: Props) {
  noStore();
  const { category } = await params;

  if (!isRegisteredTop5Category(category)) {
    notFound();
  }

  const doc = await fetchCategoryTopFiveByCategory(category);
  const catalog = getCategoryCatalog(category);
  const categoryLabel = catalog?.label ?? humanizeCategoryEnum(category);

  const entries = (doc?.entries || []).filter((e) => e.device?.slug);

  return (
    <div className="hr-device-page hr-top5-page">
      <DeviceHeader />

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
        <span className="breadcrumb-current">Top 5</span>
      </nav>

      <div className="top5-page-inner">
        <header className="top5-intro">
          <div className="intro-eyebrow" style={{ marginBottom: "16px" }}>
            <span className="intro-pulse" aria-hidden />
            Expert rankings
          </div>
          <h1>{doc?.title?.trim() || `Best ${categoryLabel}`}</h1>
          {doc?.subtitle?.trim() ? <p className="top5-intro-sub">{doc.subtitle}</p> : null}
        </header>

        {entries.length === 0 ? (
          <div className="top5-empty">
            No Top 5 list is published for this category yet. Add or publish a{" "}
            <strong>Category Top 5</strong> entry in the CMS for{" "}
            <strong>{categoryLabel}</strong>, with devices that include a <strong>Hero image</strong>{" "}
            upload.
            {catalog ? (
              <>
                {" "}
                Browse all devices in{" "}
                <Link href={catalog.href} style={{ color: "var(--blue-700)", fontWeight: 600 }}>
                  {catalog.label}
                </Link>
                .
              </>
            ) : null}
          </div>
        ) : (
          <div className="top5-list">
            {entries.map((entry) => {
              const dev = entry.device!;
              const score10 = ratingToScore10(dev.rating);
              const thumb = dev.heroImage?.url;
              const imgUnoptimized =
                Boolean(thumb?.startsWith("http")) && !thumb?.includes("healthrankings");
              const winner = entry.rank === 1;

              return (
                <Link
                  key={`${entry.rank}-${dev.slug}`}
                  href={`/devices/${encodeURIComponent(dev.slug)}`}
                  className={`top5-row${winner ? " is-winner" : ""}`}
                  aria-label={`Rank ${entry.rank}: ${dev.name}`}
                >
                  <div
                    className={
                      thumb ? "top5-thumb-wrap" : "top5-thumb-wrap top5-thumb-placeholder"
                    }
                  >
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt=""
                        width={160}
                        height={160}
                        sizes="80px"
                        unoptimized={imgUnoptimized}
                      />
                    ) : null}
                  </div>
                  <div className="top5-row-body">
                    <div className="top5-device-name">{dev.name}</div>
                    <div className="top5-device-meta">
                      {winner ? "#1 pick · " : `#${entry.rank} · `}
                      Full review &amp; score
                    </div>
                  </div>
                  {score10 != null ? (
                    <span className="top5-score-pill">
                      {score10}
                      <span style={{ opacity: 0.85 }}>/10</span>
                    </span>
                  ) : (
                    <span className="top5-score-pill">Review</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="medical-disclaimer">
        <div className="medical-disclaimer-inner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
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
