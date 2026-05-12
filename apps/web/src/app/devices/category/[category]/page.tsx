import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { DeviceHeader } from "@/components/device/DeviceHeader";
import { ArticleFooter } from "@/components/article/ArticleFooter";
import {
  getCategoryCatalog,
  getCategoryTop5Callout,
  humanizeCategoryEnum,
  isSafeCategorySlugForRoute,
} from "@/lib/device-category-links";
import { fetchPublishedDevicesByCategory } from "@/lib/strapi";
import "../../../top5/top5-shell.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

function ratingToScore10(rating: number | null | undefined): number | null {
  if (rating == null || Number.isNaN(Number(rating))) return null;
  return Math.round(Number(rating) * 2 * 10) / 10;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  noStore();
  const { category } = await params;
  if (!isSafeCategorySlugForRoute(category)) {
    return { title: "Devices | HealthRankings" };
  }
  const label = getCategoryCatalog(category)?.label ?? humanizeCategoryEnum(category);
  return {
    title: `All ${label} Tested & Reviewed | HealthRankings`,
    description: `Browse every ${label.toLowerCase()} we have reviewed — scores, summaries, and full expert write-ups.`,
  };
}

export default async function DeviceCategoryCatalogPage({ params }: Props) {
  noStore();
  const { category } = await params;

  if (!isSafeCategorySlugForRoute(category)) {
    notFound();
  }

  const devices = await fetchPublishedDevicesByCategory(category);
  const catalog = getCategoryCatalog(category);
  const categoryLabel = catalog?.label ?? humanizeCategoryEnum(category);
  const top5 = getCategoryTop5Callout(category);

  return (
    <div className="hr-device-page hr-top5-page">
      <DeviceHeader />

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href="/healthrankings-devices.html">Devices</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{categoryLabel}</span>
      </nav>

      <div className="top5-page-inner">
        <header className="top5-intro">
          <div className="intro-eyebrow" style={{ marginBottom: "16px" }}>
            <span className="intro-pulse" aria-hidden />
            {categoryLabel} · {devices.length}{" "}
            {devices.length === 1 ? "device" : "devices"} reviewed
          </div>
          <h1>
            All <em style={{ fontStyle: "italic", color: "var(--blue-700)" }}>{categoryLabel}</em>{" "}
            tested
          </h1>
          <p className="top5-intro-sub">
            Independent reviews from HealthRankings. Open any product for the full score, pros &amp;
            cons, and buying guidance.
          </p>
          {top5 ? (
            <p style={{ marginTop: "12px" }}>
              <Link href={top5.href} className="top5-link">
                🏆 See our Top 5 picks →
              </Link>
            </p>
          ) : null}
        </header>

        {devices.length === 0 ? (
          <div className="top5-empty">
            No published devices in <strong>{categoryLabel}</strong> yet. In the CMS, set the
            device&apos;s <strong>category</strong> field to{" "}
            <strong style={{ fontFamily: "monospace" }}>{category}</strong> and publish.
          </div>
        ) : (
          <div className="top5-list">
            {devices.map((dev, idx) => {
              const score10 = ratingToScore10(dev.rating);
              const thumb = dev.heroImage?.url;
              const imgUnoptimized =
                Boolean(thumb?.startsWith("http")) && !thumb?.includes("healthrankings");
              const winner = idx === 0 && score10 != null;

              return (
                <Link
                  key={dev.slug}
                  href={`/devices/${encodeURIComponent(dev.slug)}`}
                  className={`top5-row${winner ? " is-winner" : ""}`}
                  aria-label={`${dev.name} — full review`}
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
                    <div className="top5-device-meta">Full review &amp; score</div>
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
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
