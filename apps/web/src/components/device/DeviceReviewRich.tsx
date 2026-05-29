/**
 * Rich device review page — the HealthRankings answer to MedGrade-style reviews.
 *
 * Sections (top → bottom):
 *  1. Breadcrumb (passed in by the page)
 *  2. Hero card        (eyebrow tag · H1 · tagline · trust badges · score circle · price · CTAs)
 *  3. Clinical summary (4-stat strip: score · price · HSA/FSA · evidence)
 *  4. Sticky table of contents (jump nav)
 *  5. Performance metrics grid (per-metric score + commentary)
 *  6. Quick take (pros / cons)
 *  7. Real-world usage (4 sub-cards)
 *  8. Hands-on notes (CMS reviewSections)
 *  9. Patient suitability (whoFor / whoNot + recommendWhen / passWhen)
 * 10. Comparative performance (sibling rank table)
 * 11. Specs table
 * 12. Final recommendation (final score + dual CTA)
 * 13. Where to buy
 * 14. Methodology + medical disclaimer
 */

import Image from "next/image";
import Link from "next/link";
import type { CategoryTopFive, Device } from "@/lib/strapi";
import {
  buildClinicalSummary,
  buildMetricRows,
  buildRealWorldCards,
  buildSpecRows,
  cleanBulletList,
  inferTrustBadges,
  parsePriceNumber,
  ratingToScore10,
  scoreBand,
  type RankedSibling,
} from "@/lib/device-review-presenters";

type Props = {
  device: Device;
  categoryLabel: string;
  /** Optional pre-rendered breadcrumb (Home / Devices / Category) shown above the hero. */
  breadcrumb?: React.ReactNode;
  /** Optional sibling Top 5 for "Comparative performance" — populated by the page when available. */
  siblings?: CategoryTopFive | null;
  /** Optional href to the matching category Top 5 page (drives the "See full ranking" CTA). */
  top5Href?: string | null;
};

function bodyLooksLikeHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

function pickHeroLede(device: Device): string {
  const lead = device.reviewLead?.trim();
  if (lead) {
    const para = lead.split(/\n\n+/)[0]?.trim() ?? lead;
    return para.length > 320 ? `${para.slice(0, 317)}…` : para;
  }
  if (device.verdictShort?.trim()) {
    const v = device.verdictShort.trim();
    return v.length > 320 ? `${v.slice(0, 317)}…` : v;
  }
  return device.tagline?.trim() || "Independent expert review by HealthRankings.";
}

function PublishBadge({ label, kind }: { label: string; kind: string }) {
  return <span className={`drr-trust-badge drr-trust-${kind}`}>{label}</span>;
}

function buildSiblingTable(
  current: Device,
  top5: CategoryTopFive | null | undefined
): RankedSibling[] {
  if (!top5?.entries?.length) return [];
  const rows: RankedSibling[] = top5.entries
    .filter((e) => e.device?.slug)
    .map((e) => ({
      rank: e.rank,
      name: e.device!.name,
      slug: e.device!.slug,
      score10: ratingToScore10(e.device!.rating),
      isCurrent: e.device!.slug === current.slug,
    }))
    .sort((a, b) => a.rank - b.rank);
  // Always include the current device, even if not in the ranked top 5
  if (!rows.some((r) => r.isCurrent)) {
    const score10 = ratingToScore10(current.rating);
    rows.push({ rank: rows.length + 1, name: current.name, slug: current.slug, score10, isCurrent: true });
  }
  return rows;
}

const RealWorldIcon = ({ kind }: { kind: string }) => {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  switch (kind) {
    case "routine":
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "learning":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 0 1 .67 6.292A11.99 11.99 0 0 1 12 17a11.99 11.99 0 0 1-6.83-.13 12.083 12.083 0 0 1 .67-6.292L12 14z" />
        </svg>
      );
    case "maintenance":
      return (
        <svg {...common} aria-hidden>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.121 2.121 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "portability":
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "manual":
      return (
        <svg {...common} aria-hidden>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

export function DeviceReviewRich({
  device,
  categoryLabel,
  breadcrumb,
  siblings,
  top5Href,
}: Props) {
  const summary = buildClinicalSummary(device);
  const metrics = buildMetricRows(device);
  const realWorld = buildRealWorldCards(device);
  const specs = buildSpecRows(device);
  const trustBadges = inferTrustBadges(device);
  const heroLede = pickHeroLede(device);
  const pros = cleanBulletList(device.pros);
  const cons = cleanBulletList(device.cons);
  const whoFor = cleanBulletList(device.whoFor);
  const whoNot = cleanBulletList(device.whoNot);
  const reviewSections = device.reviewSections ?? [];
  const recommendWhen = device.recommendWhen?.trim() || "";
  const passWhen = device.passWhen?.trim() || "";
  const heroSrc = device.heroImage?.url || null;
  const imgUnoptimized =
    Boolean(heroSrc?.startsWith("http")) && !heroSrc?.includes("healthrankings");
  const priceNumber = parsePriceNumber(device.priceText);
  const updatedAt = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
  const siblingRows = buildSiblingTable(device, siblings);
  const showCompare = siblingRows.length >= 2;

  // Jump nav items — always include landmark sections, drop empties so we
  // never advertise an anchor that isn't on the page.
  const navItems: { label: string; href: string; primary?: boolean }[] = [];
  if (metrics.length > 0) navItems.push({ label: "Performance", href: "#performance" });
  if (pros.length > 0 || cons.length > 0) navItems.push({ label: "Pros & cons", href: "#quick-take" });
  navItems.push({ label: "Real-world", href: "#real-world" });
  if (reviewSections.length > 0) navItems.push({ label: "Hands-on notes", href: "#deep-dive" });
  if (whoFor.length > 0 || whoNot.length > 0 || recommendWhen || passWhen) {
    navItems.push({ label: "Who it's for", href: "#suitability" });
  }
  if (showCompare) navItems.push({ label: "How it compares", href: "#compare" });
  if (specs.length > 0) navItems.push({ label: "Full specs", href: "#specs" });
  navItems.push({ label: "Final score", href: "#final", primary: true });

  return (
    <div className="hr-device-rich">
      {breadcrumb}

      {/* ============ HERO ============ */}
      <section className="drr-hero" aria-label={`${device.name} review hero`}>
        <div className="drr-hero-inner">
          <div className="drr-hero-left">
            <div className="drr-hero-eyebrow">
              <span className="drr-hero-pulse" aria-hidden />
              {categoryLabel}
              <span className="drr-hero-eyebrow-sep" aria-hidden>
                ·
              </span>
              Updated {updatedAt}
            </div>
            <h1>{device.name}</h1>
            {device.tagline?.trim() ? (
              <p className="drr-hero-tagline">{device.tagline.trim()}</p>
            ) : null}
            <p className="drr-hero-lede">{heroLede}</p>
            {trustBadges.length > 0 ? (
              <div className="drr-trust-row">
                {trustBadges.map((b) => (
                  <PublishBadge key={b.label} label={b.label} kind={b.kind} />
                ))}
              </div>
            ) : null}
            <dl className="drr-hero-meta">
              <div>
                <dt>Reviewed by</dt>
                <dd>{device.reviewerAttribution?.trim() || "HealthRankings editors"}</dd>
              </div>
              {summary.testingWindow ? (
                <div>
                  <dt>Testing window</dt>
                  <dd>{summary.testingWindow}</dd>
                </div>
              ) : null}
              {device.assessmentTag?.trim() ? (
                <div>
                  <dt>Assessment</dt>
                  <dd>{device.assessmentTag.trim()}</dd>
                </div>
              ) : null}
              <div>
                <dt>Evidence</dt>
                <dd>{summary.evidence}</dd>
              </div>
            </dl>
          </div>

          <aside className="drr-hero-card" aria-label="Score & purchase">
            <div className="drr-hero-card-image">
              {heroSrc ? (
                <Image
                  src={heroSrc}
                  alt={device.heroImage?.alternativeText || device.name}
                  width={520}
                  height={520}
                  sizes="(max-width: 1024px) 80vw, 320px"
                  priority
                  unoptimized={imgUnoptimized}
                />
              ) : (
                <div className="drr-hero-img-placeholder" aria-hidden />
              )}
            </div>
            <div className="drr-hero-score">
              <span className="drr-hero-score-num">
                {summary.scoreOutOf100 ?? "—"}
              </span>
              <span className="drr-hero-score-of">/100</span>
              <span className="drr-hero-score-band">
                {summary.band || "Reviewed"}
              </span>
            </div>
            {summary.priceLabel ? (
              <div className="drr-hero-price">
                <span className="drr-hero-price-label">From</span>
                <span className="drr-hero-price-value">{summary.priceLabel}</span>
              </div>
            ) : null}
            {device.affiliateUrl ? (
              <a
                className="drr-hero-cta-primary"
                href={device.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Shop now
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ) : null}
            <a className="drr-hero-cta-secondary" href="#final">
              Jump to final score
            </a>
          </aside>
        </div>
      </section>

      {/* ============ CLINICAL SUMMARY (4-stat strip) ============ */}
      <section className="drr-summary" aria-label="Review summary">
        <div className="drr-summary-grid">
          <div className="drr-summary-card">
            <span className="drr-summary-k">Overall score</span>
            <span className="drr-summary-v">
              {summary.scoreOutOf10 != null ? summary.scoreOutOf10.toFixed(1) : "—"}
              <span className="drr-summary-sub">/10</span>
            </span>
            {summary.band ? <span className="drr-summary-pill">{summary.band}</span> : null}
          </div>
          <div className="drr-summary-card">
            <span className="drr-summary-k">Price</span>
            <span className="drr-summary-v">{summary.priceLabel || "—"}</span>
            {priceNumber != null ? (
              <span className="drr-summary-pill">
                {priceNumber < 60 ? "Budget" : priceNumber < 130 ? "Mid-range" : "Premium"}
              </span>
            ) : null}
          </div>
          <div className="drr-summary-card">
            <span className="drr-summary-k">HSA / FSA</span>
            <span className="drr-summary-v">{summary.hsaFsa}</span>
          </div>
          <div className="drr-summary-card">
            <span className="drr-summary-k">Evidence</span>
            <span className="drr-summary-v">{summary.evidence}</span>
            {summary.testingWindow ? (
              <span className="drr-summary-pill">{summary.testingWindow}</span>
            ) : null}
          </div>
        </div>
      </section>

      {/* ============ JUMP NAV ============ */}
      <nav className="drr-jump-nav" aria-label="Section navigation">
        <span className="drr-jump-label">Jump to</span>
        {navItems.map((item) => (
          <a key={item.href} href={item.href} className={item.primary ? "primary" : undefined}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* ============ PERFORMANCE METRICS ============ */}
      {metrics.length > 0 ? (
        <section className="drr-section drr-perf" id="performance">
          <div className="drr-section-head">
            <span className="drr-section-eyebrow">Performance benchmarks</span>
            <h2>
              How the {device.name} <em>performed.</em>
            </h2>
            <p className="drr-section-dek">
              Quantitative scoring on the metrics that matter for {categoryLabel.toLowerCase()}.
              Higher is better.
            </p>
          </div>
          <div className="drr-perf-grid">
            {metrics.map((m) => (
              <article key={m.label} className="drr-perf-card">
                <header className="drr-perf-head">
                  <span className="drr-perf-label">{m.label}</span>
                  <span className="drr-perf-score">
                    {m.score10.toFixed(1)}
                    <span className="drr-perf-of">/10</span>
                  </span>
                </header>
                <div className="drr-perf-bar" aria-hidden>
                  <span style={{ width: `${m.percent}%` }} />
                </div>
                {m.commentary ? <p className="drr-perf-copy">{m.commentary}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* ============ QUICK TAKE (PROS / CONS) ============ */}
      {pros.length > 0 || cons.length > 0 ? (
        <section className="drr-section drr-quick-take" id="quick-take">
          <div className="drr-section-head">
            <span className="drr-section-eyebrow">Quick take</span>
            <h2>
              What we <em>loved</em> &amp; what to know.
            </h2>
          </div>
          <div className="drr-pros-cons">
            <article className="drr-pc drr-pros">
              <header>
                <span className="drr-pc-icon" aria-hidden>
                  +
                </span>
                <h3>Strengths</h3>
              </header>
              <ul>
                {pros.map((p, i) => (
                  <li key={`p-${i}`}>{p}</li>
                ))}
              </ul>
            </article>
            <article className="drr-pc drr-cons">
              <header>
                <span className="drr-pc-icon" aria-hidden>
                  −
                </span>
                <h3>Tradeoffs</h3>
              </header>
              <ul>
                {cons.map((c, i) => (
                  <li key={`c-${i}`}>{c}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      {/* ============ REAL-WORLD USAGE ============ */}
      <section className="drr-section drr-real" id="real-world">
        <div className="drr-section-head">
          <span className="drr-section-eyebrow">Real-world usage</span>
          <h2>
            Living with the <em>{device.name}.</em>
          </h2>
          <p className="drr-section-dek">
            Practical considerations for daily operation.
          </p>
        </div>
        <div className="drr-real-grid">
          {realWorld.map((c) => (
            <article key={c.title} className="drr-real-card">
              <div className="drr-real-icon">
                <RealWorldIcon kind={c.iconKey} />
              </div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ============ HANDS-ON DEEP DIVES ============ */}
      {reviewSections.length > 0 ? (
        <section className="drr-section drr-deep-dive" id="deep-dive">
          <div className="drr-section-head">
            <span className="drr-section-eyebrow">Hands-on notes</span>
            <h2>
              Deep <em>dives.</em>
            </h2>
          </div>
          <div className="drr-deep-list">
            {reviewSections.map((s, idx) => (
              <article key={`s-${idx}`} className="drr-deep-card">
                <h3>{s.heading}</h3>
                <div className="drr-deep-body">
                  {bodyLooksLikeHtml(s.body) ? (
                    <div dangerouslySetInnerHTML={{ __html: s.body }} />
                  ) : (
                    splitParagraphs(s.body).map((para, pi) => <p key={pi}>{para}</p>)
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* ============ PATIENT SUITABILITY ============ */}
      {whoFor.length > 0 || whoNot.length > 0 || recommendWhen || passWhen ? (
        <section className="drr-section drr-suitability" id="suitability">
          <div className="drr-section-head">
            <span className="drr-section-eyebrow">Patient suitability</span>
            <h2>
              Who it&rsquo;s <em>for.</em>
            </h2>
          </div>
          <div className="drr-suit-grid">
            <article className="drr-suit-card drr-suit-yes">
              <header>
                <span className="drr-suit-icon" aria-hidden>
                  ✓
                </span>
                <h3>Indicated for</h3>
              </header>
              {whoFor.length > 0 ? (
                <ul>
                  {whoFor.map((w, i) => (
                    <li key={`y-${i}`}>{w}</li>
                  ))}
                </ul>
              ) : null}
              {recommendWhen ? <p className="drr-suit-text">{recommendWhen}</p> : null}
            </article>
            <article className="drr-suit-card drr-suit-no">
              <header>
                <span className="drr-suit-icon" aria-hidden>
                  ✕
                </span>
                <h3>Consider alternatives if</h3>
              </header>
              {whoNot.length > 0 ? (
                <ul>
                  {whoNot.map((w, i) => (
                    <li key={`n-${i}`}>{w}</li>
                  ))}
                </ul>
              ) : null}
              {passWhen ? <p className="drr-suit-text">{passWhen}</p> : null}
            </article>
          </div>
        </section>
      ) : null}

      {/* ============ COMPARATIVE PERFORMANCE ============ */}
      {showCompare ? (
        <section className="drr-section drr-compare" id="compare">
          <div className="drr-section-head">
            <span className="drr-section-eyebrow">How it stacks up</span>
            <h2>
              {categoryLabel} <em>ranked.</em>
            </h2>
            <p className="drr-section-dek">
              The {device.name} alongside our top picks in {categoryLabel.toLowerCase()}.
            </p>
          </div>
          <div className="drr-compare-table-wrap">
            <table className="drr-compare-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Device</th>
                  <th scope="col">Score</th>
                  <th scope="col" aria-label="Open device review" />
                </tr>
              </thead>
              <tbody>
                {siblingRows.slice(0, 5).map((r) => (
                  <tr key={r.slug} className={r.isCurrent ? "is-current" : undefined}>
                    <td>
                      <span className="drr-compare-rank">#{r.rank}</span>
                    </td>
                    <td>
                      <div className="drr-compare-name">
                        {r.name}
                        {r.isCurrent ? (
                          <span className="drr-compare-here">You&rsquo;re reading</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className="drr-compare-score">
                        {r.score10 != null ? r.score10.toFixed(1) : "—"}
                        <span className="drr-compare-out">/10</span>
                      </span>
                    </td>
                    <td>
                      {r.isCurrent ? (
                        <span className="drr-compare-current-pill">Current</span>
                      ) : (
                        <Link href={`/devices/${r.slug}`} className="drr-compare-link">
                          Compare →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {top5Href ? (
            <div className="drr-compare-cta">
              <Link href={top5Href} className="drr-compare-cta-btn">
                See full Top 5 ranking
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ============ SPECS TABLE ============ */}
      {specs.length > 0 ? (
        <section className="drr-section drr-specs" id="specs">
          <div className="drr-section-head">
            <span className="drr-section-eyebrow">Full specs</span>
            <h2>
              Hardware &amp; <em>features.</em>
            </h2>
          </div>
          <div className="drr-specs-wrap">
            <dl className="drr-specs-list">
              {specs.map((s) => (
                <div key={s.key} className="drr-specs-row">
                  <dt>{s.key}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {/* ============ FINAL RECOMMENDATION ============ */}
      <section className="drr-final" id="final">
        <div className="drr-final-card">
          <div className="drr-final-score">
            <div className="drr-final-num">
              {summary.scoreOutOf10 != null ? summary.scoreOutOf10.toFixed(1) : "—"}
              {summary.scoreOutOf10 != null ? <span className="drr-final-out">/10</span> : null}
            </div>
            <div className="drr-final-band">{scoreBand(summary.scoreOutOf10) || "Reviewed"}</div>
          </div>
          <div className="drr-final-text">
            <span className="drr-final-eyebrow">HealthRankings verdict</span>
            <h2>The bottom line</h2>
            <p>
              {device.verdictShort?.trim() ||
                `${device.name} earned a ${summary.scoreOutOf10 != null ? `${summary.scoreOutOf10.toFixed(1)}/10` : "reviewed"} score after ${summary.testingWindow || "in-depth testing"}. Read the sections above for the full evaluation.`}
            </p>
            <div className="drr-final-actions">
              {device.affiliateUrl ? (
                <a
                  className="drr-final-cta-primary"
                  href={device.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Shop now
                  {summary.priceLabel ? (
                    <span className="drr-final-cta-price">· {summary.priceLabel}</span>
                  ) : null}
                </a>
              ) : null}
              {top5Href ? (
                <Link href={top5Href} className="drr-final-cta-secondary">
                  See alternatives
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ============ METHODOLOGY FOOTER ============ */}
      <section className="drr-method" aria-label="How we test">
        <div className="drr-method-inner">
          <span className="drr-method-eyebrow">How we test</span>
          <p>
            HealthRankings buys, tests, and rates devices independently. Our scoring blends quantitative
            measurements (accuracy vs reference, sample-to-sample variability, fit testing) with everyday
            usability and cost. We disclose affiliate links and never accept paid placement in our rankings.
          </p>
        </div>
      </section>
    </div>
  );
}
