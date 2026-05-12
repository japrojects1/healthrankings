import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import type { Device } from "@/lib/strapi";
import { fetchDeviceBySlug } from "@/lib/strapi";
import {
  getCategoryCatalog,
  getCategoryTop5Callout,
  humanizeCategoryEnum,
} from "@/lib/device-category-links";
import { DeviceHeader } from "@/components/device/DeviceHeader";
import { ArticleFooter } from "@/components/article/ArticleFooter";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function ratingToScore10(rating: number | null | undefined): number | null {
  if (rating == null || Number.isNaN(Number(rating))) return null;
  return Math.round(Number(rating) * 2 * 10) / 10;
}

function scoreBand(score10: number): string {
  if (score10 >= 8.5) return "Excellent";
  if (score10 >= 7.5) return "Strong pick";
  if (score10 >= 6.5) return "Above average";
  if (score10 >= 5.5) return "Average";
  return "Entry level";
}

function pickVerdictTitle(name: string, verdictShort?: string | null): string {
  if (!verdictShort?.trim()) return `${name}`;
  const t = verdictShort.trim();
  const beforeDot = t.split(".")[0]?.trim() ?? t;
  if (beforeDot.length >= 12 && beforeDot.length <= 130) return beforeDot;
  return t.slice(0, 120).trim() + (t.length > 120 ? "…" : "");
}

function pickIntroLedeFromVerdict(verdictShort?: string | null): string {
  if (!verdictShort?.trim()) {
    return "Expert-tested notes on accuracy, usability, and value — plus clear pros & cons.";
  }
  const parts = verdictShort.split(".").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const rest = parts.slice(1).join(". ");
    return rest.slice(0, 220) + (rest.length > 220 ? "…" : "");
  }
  return verdictShort.slice(0, 200) + (verdictShort.length > 200 ? "…" : "");
}

/** Short line under the title — avoids repeating the full opening essay. */
function shortIntroLede(device: Device): string {
  const rl = device.reviewLead?.trim();
  if (rl) {
    const firstChunk = rl.split(/\n\n+/)[0]?.trim() ?? rl;
    const firstSentence = firstChunk.split(/(?<=[.!?])\s+/)[0]?.trim() ?? firstChunk;
    const s = firstSentence.length > 0 ? firstSentence : firstChunk;
    if (s.length <= 260) return s;
    return `${s.slice(0, 257)}…`;
  }
  return pickIntroLedeFromVerdict(device.verdictShort);
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

function sectionDomId(idx: number): string {
  return `sec-${idx}`;
}

function bodyLooksLikeHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}

function hasSnapshot(device: Device, score10: number | null): boolean {
  return (
    score10 != null ||
    Boolean(device.priceText) ||
    Boolean(device.assessmentTag) ||
    Boolean(device.evaluationWindow) ||
    Boolean(device.reviewerAttribution)
  );
}

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
  return {
    title: `${device.name} Review | ${catLabel} | HealthRankings`,
    description: desc.length > 165 ? `${desc.slice(0, 162)}…` : desc,
  };
}

export default async function DevicePage({ params }: Props) {
  noStore();
  const { slug } = await params;
  const device = await fetchDeviceBySlug(slug);
  if (!device) return notFound();

  const catalog = getCategoryCatalog(device.category);
  const top5 = getCategoryTop5Callout(device.category);
  const categoryLabel = catalog?.label ?? humanizeCategoryEnum(device.category);

  const score10 = ratingToScore10(device.rating);
  const verdictTitle = pickVerdictTitle(device.name, device.verdictShort);
  const introLede = shortIntroLede(device);
  const pillars = device.performancePillars ?? [];
  const openingParagraphs =
    device.reviewLead?.trim() ? splitParagraphs(device.reviewLead.trim()) : [];
  const showOpening = openingParagraphs.length > 0;
  const snapshot = hasSnapshot(device, score10);
  const showFitSection = Boolean(device.recommendWhen?.trim() || device.passWhen?.trim());

  const heroSrc = device.heroImage?.url;
  const imgUnoptimized =
    Boolean(heroSrc?.startsWith("http")) && !heroSrc?.includes("healthrankings");

  const navItems: { label: string; href: string; primary?: boolean }[] = [];
  if (snapshot) navItems.push({ label: "At a glance", href: "#device-snapshot" });
  if (showOpening) navItems.push({ label: "Opening", href: "#device-opening" });
  if (pillars.length > 0) navItems.push({ label: "What we scored", href: "#device-pillars" });
  navItems.push({ label: "Verdict", href: "#verdict" });
  (device.reviewSections || []).forEach((s, idx) => {
    navItems.push({
      label: s.heading.length > 28 ? `${s.heading.slice(0, 28)}…` : s.heading,
      href: `#${sectionDomId(idx)}`,
    });
  });
  if ((device.pros?.length || 0) > 0 || (device.cons?.length || 0) > 0) {
    navItems.push({ label: "Strengths & tradeoffs", href: "#pros-cons" });
  }
  if (showFitSection) navItems.push({ label: "Fit & skip", href: "#device-fit" });
  if ((device.gallery?.length || 0) > 0) {
    navItems.push({ label: "Images", href: "#gallery" });
  }
  navItems.push({ label: "Final score", href: "#final", primary: true });

  return (
    <div className="hr-device-page">
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
        <span className="breadcrumb-current">{device.name}</span>
      </nav>

      <div className="device-intro-grid">
        <div className="device-intro-visual">
          {heroSrc ? (
            <Image
              src={heroSrc}
              alt={device.heroImage?.alternativeText || device.name}
              width={560}
              height={560}
              sizes="(max-width: 900px) 90vw, 280px"
              priority
              unoptimized={imgUnoptimized}
            />
          ) : (
            <div className="device-img-placeholder" aria-hidden />
          )}
        </div>

        <div className="page-intro">
          <div className="intro-eyebrow">
            <span className="intro-pulse" aria-hidden />
            {device.assessmentTag?.trim() || "Independent device review"}
          </div>
          <h1>{device.name}</h1>
          {device.tagline?.trim() ? (
            <p className="device-tagline">{device.tagline.trim()}</p>
          ) : null}
          <p className="intro-lede">{introLede}</p>
          <div className="intro-meta">
            <div className="intro-author">
              <div className="intro-author-avatar">HR</div>
              <div className="intro-author-info">
                <strong>{device.reviewerAttribution?.trim() || "HealthRankings editors"}</strong>
                <span>
                  {device.evaluationWindow?.trim()
                    ? `${device.evaluationWindow.trim()} · Not sponsored`
                    : "Independent testing · Not sponsored"}
                </span>
              </div>
            </div>
            <div className="intro-meta-divider" aria-hidden />
            <div className="intro-meta-fact">
              <span className="intro-meta-fact-label">Category</span>
              <span className="intro-meta-fact-value">{categoryLabel}</span>
            </div>
            {score10 != null ? (
              <>
                <div className="intro-meta-divider" aria-hidden />
                <div className="intro-meta-fact">
                  <span className="intro-meta-fact-label">Score</span>
                  <span className="intro-meta-fact-value">
                    {score10}
                    <span className="out-ten">/10</span>
                  </span>
                </div>
                <div className="intro-meta-divider" aria-hidden />
                <div className="intro-meta-fact">
                  <span className="intro-meta-fact-label">Band</span>
                  <span className="intro-meta-fact-value">{scoreBand(score10)}</span>
                </div>
              </>
            ) : null}
            {device.priceText ? (
              <>
                <div className="intro-meta-divider" aria-hidden />
                <div className="intro-meta-fact">
                  <span className="intro-meta-fact-label">Price</span>
                  <span className="intro-meta-fact-value">{device.priceText}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {top5 ? (
        <div className="top5-callout">
          <Link href={top5.href} className="top5-callout-inner">
            <div className="top5-callout-left">
              <span className="top5-callout-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
                </svg>
                TOP 5
              </span>
              <span className="top5-callout-text">{top5.line}</span>
            </div>
            <span className="top5-callout-arrow">
              View rankings
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>
      ) : null}

      <div className="jump-nav">
        <span className="jump-nav-label">On this page</span>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={item.primary ? "primary" : undefined}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="review-back-links">
        <Link href="/healthrankings-devices.html" className="review-back-link">
          ← All devices
        </Link>
        {catalog ? (
          <Link href={catalog.href} className="review-back-link">
            {catalog.label}
          </Link>
        ) : null}
        {top5 ? (
          <Link href={top5.href} className="review-back-link">
            🏆 Top 5 picks
          </Link>
        ) : null}
      </div>

      <div className="review-content">
        {snapshot ? (
          <section className="device-snapshot" id="device-snapshot" aria-label="Review snapshot">
            <div className="device-snapshot-label">At a glance</div>
            <div className="device-snapshot-grid">
              {score10 != null ? (
                <div className="device-snapshot-card">
                  <span className="device-snapshot-k">Overall</span>
                  <span className="device-snapshot-v">
                    {score10}
                    <span className="device-snapshot-sub">/10 · {scoreBand(score10)}</span>
                  </span>
                </div>
              ) : null}
              {device.priceText ? (
                <div className="device-snapshot-card">
                  <span className="device-snapshot-k">Typical price</span>
                  <span className="device-snapshot-v">{device.priceText}</span>
                </div>
              ) : null}
              {device.evaluationWindow?.trim() ? (
                <div className="device-snapshot-card">
                  <span className="device-snapshot-k">Testing window</span>
                  <span className="device-snapshot-v">{device.evaluationWindow.trim()}</span>
                </div>
              ) : null}
              {device.assessmentTag?.trim() ? (
                <div className="device-snapshot-card">
                  <span className="device-snapshot-k">How we judged it</span>
                  <span className="device-snapshot-v">{device.assessmentTag.trim()}</span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {showOpening ? (
          <section className="device-opening" id="device-opening">
            <div className="review-section-label">Full context</div>
            <h2 className="device-opening-title">Why this product matters right now</h2>
            <div className="device-opening-body">
              {openingParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        ) : null}

        {pillars.length > 0 ? (
          <section className="device-pillars" id="device-pillars">
            <div className="review-section-label">Breakdown</div>
            <h2>What we scored — and why</h2>
            <p className="device-pillars-dek">
              Editorial sub-scores (0–100) summarize how the device felt in testing and how its specs line up
              against common alternatives. They are not clinical measurements.
            </p>
            <div className="device-pillars-grid">
              {pillars.map((p, i) => (
                <div key={`${p.pillarLabel}-${i}`} className="device-pillar-card">
                  <div className="device-pillar-top">
                    <span className="device-pillar-label">{p.pillarLabel}</span>
                    <span className="device-pillar-score">{p.scoreOutOf100}</span>
                  </div>
                  <div className="device-pillar-bar" aria-hidden>
                    <span style={{ width: `${p.scoreOutOf100}%` }} />
                  </div>
                  <p className="device-pillar-copy">{p.commentary}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="review-verdict" id="verdict">
          <div className="verdict-score-circle">
            <div className="verdict-score-num">{score10 != null ? score10 : "—"}</div>
            {score10 != null ? <div className="verdict-score-of">/10</div> : null}
          </div>
          <div className="verdict-text">
            <div className="verdict-label">HealthRankings verdict</div>
            <div className="verdict-title">{verdictTitle}</div>
            {device.verdictShort ? (
              <p className="verdict-summary">{device.verdictShort}</p>
            ) : (
              <p className="verdict-summary">
                See the sections below for testing notes, strengths &amp; tradeoffs, and buying guidance.
              </p>
            )}
          </div>
        </section>

        {(device.reviewSections || []).map((s, idx) => (
          <section key={`${s.heading}-${idx}`} className="review-section" id={sectionDomId(idx)}>
            <div className="review-section-label">Deep dive</div>
            <h2>{s.heading}</h2>
            <div className="review-section-body">
              {bodyLooksLikeHtml(s.body) ? (
                <div dangerouslySetInnerHTML={{ __html: s.body }} />
              ) : (
                splitParagraphs(s.body).map((para, pi) => <p key={pi}>{para}</p>)
              )}
            </div>
          </section>
        ))}

        {device.pros?.length || device.cons?.length ? (
          <section className="review-section" id="pros-cons">
            <div className="review-section-label">Quick read</div>
            <h2>Strengths &amp; tradeoffs</h2>
            <div className="review-pros-cons">
              <div className="pc-card pc-pros">
                <h3>Strengths</h3>
                <ul>
                  {(device.pros || []).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="pc-card pc-cons">
                <h3>Tradeoffs</h3>
                <ul>
                  {(device.cons || []).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {showFitSection ? (
          <section className="device-fit" id="device-fit">
            <div className="review-section-label">Buying lens</div>
            <h2>When it fits — and when to pass</h2>
            <div className="device-fit-grid">
              {device.recommendWhen?.trim() ? (
                <div className="device-fit-card device-fit-yes">
                  <h3>A strong match if…</h3>
                  <p>{device.recommendWhen.trim()}</p>
                </div>
              ) : null}
              {device.passWhen?.trim() ? (
                <div className="device-fit-card device-fit-no">
                  <h3>Consider skipping if…</h3>
                  <p>{device.passWhen.trim()}</p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {(device.gallery?.length || 0) > 0 ? (
          <section className="device-gallery" id="gallery">
            <h2>Images</h2>
            <div className="device-gallery-grid">
              {device.gallery!.map((img) => (
                <Image
                  key={img.url}
                  src={img.url}
                  alt={img.alternativeText || device.name}
                  width={320}
                  height={320}
                  sizes="(max-width: 640px) 45vw, 160px"
                  unoptimized={img.url.startsWith("http") && !img.url.includes("healthrankings")}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="review-final" id="final">
          <div className="final-score-big">
            {score10 != null ? score10 : "—"}
            {score10 != null ? <span className="out">/10</span> : null}
          </div>
          <div className="final-label">HealthRankings overall score</div>
          <p className="final-text">
            {device.verdictShort
              ? device.verdictShort.slice(0, 320) + (device.verdictShort.length > 320 ? "…" : "")
              : "Use the sections above for full testing detail and buying guidance."}
          </p>
          {device.affiliateUrl ? (
            <a className="final-cta" href={device.affiliateUrl} target="_blank" rel="noopener noreferrer">
              Check price &amp; availability →
            </a>
          ) : null}
        </section>
      </div>

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
