/* Server component that renders a rich Top-5 page from a CategoryTopFive payload. */
import Link from "next/link";
import type { CategoryTopFive, RelatedCondition, FaqItem } from "@/lib/strapi";
import {
  buildMetricRows,
  buildPersonas,
  buildSpecRows,
  enrichDevices,
  getMetric,
  getSpec,
  inferRankLabel,
  metricMax,
  pickCategoryWinners,
  type EnrichedDevice,
} from "@/lib/top5-presenters";

type Props = {
  doc: CategoryTopFive;
  categoryLabel: string;
  /** Optional pre-rendered breadcrumb home/category links shown above the H1. */
  breadcrumb?: React.ReactNode;
};

function starRating(score: number): string {
  const full = Math.round(score / 2); // 0-10 → 0-5 stars
  let s = "";
  for (let i = 1; i <= 5; i++) s += i <= full ? "★" : "☆";
  return s;
}

function reviewHref(slug: string) {
  return `/devices/${encodeURIComponent(slug)}`;
}

function ProductCard({
  device,
  idx,
  total,
}: {
  device: EnrichedDevice;
  idx: number;
  total: number;
}) {
  const isWinner = idx === 0;
  const rankLabel = inferRankLabel(device, idx);
  const tagUpper = (device.tagline || "").split("—").pop()?.trim().toUpperCase().slice(0, 40) || "";
  const taglineKind = isWinner
    ? "accurate"
    : /budget|value|affordable/i.test(device.tagline || "")
    ? "budget"
    : "";
  const sb = device.metrics.slice(0, 4);

  return (
    <article className={`product-card${isWinner ? " is-winner" : ""}`}>
      <div className="product-rank">
        <div className={`rank-number${isWinner ? " is-first" : ""}`}>
          <span className="hash">#</span>
          {device.rank}
        </div>
        <div className={`product-rank-label${isWinner ? " is-first" : ""}`}>{rankLabel}</div>
      </div>

      <div className="product-main">
        {tagUpper ? (
          <span className={`product-tagline${taglineKind ? " " + taglineKind : ""}`}>
            {tagUpper}
          </span>
        ) : null}
        <h3 className="product-name">{device.name}</h3>
        {device.tagline ? <p className="product-brand">{device.tagline}</p> : null}
        {device.badges.length > 0 ? (
          <div className="trust-badges">
            {device.badges.map((b) => (
              <span key={b.label} className={`trust-badge tb-${b.kind}`}>
                {b.label}
              </span>
            ))}
          </div>
        ) : null}
        {device.verdictShort ? <p className="product-verdict">{device.verdictShort}</p> : null}

        {(device.pros?.length || device.cons?.length) && (
          <div className="product-pros-cons">
            {device.pros?.length ? (
              <div className="pros-cons-col pros">
                <h4>What we loved</h4>
                <ul>
                  {device.pros.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {device.cons?.length ? (
              <div className="pros-cons-col cons">
                <h4>What to know</h4>
                <ul>
                  {device.cons.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="product-sidebar">
        <div className="product-score-block">
          <div className="score-headline">
            <div className="score-big">
              {device.score10.toFixed(1)}
              <span className="out">/10</span>
            </div>
            <div className="score-stars" aria-label={`${device.score10}/10`}>
              {starRating(device.score10)}
            </div>
          </div>
          {sb.length > 0 ? (
            <div className="score-breakdown">
              {sb.map((m) => (
                <div key={m.label} className="score-row">
                  <span className="score-row-label">{m.label}</span>
                  <div className="score-row-bar">
                    <div className="score-row-fill" style={{ width: `${m.width}%` }} />
                  </div>
                  <span className="score-row-value">{m.score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="product-price-cta">
          <span className="price-label">Price</span>
          {device.priceLabel ? (
            <div className="product-price">
              <span className="price-amount">{device.priceLabel.replace(/^Starts at\s*/i, "")}</span>
            </div>
          ) : null}
          {device.affiliateUrl ? (
            <a
              href={device.affiliateUrl}
              className="product-cta"
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              See deal &rarr;
            </a>
          ) : null}
          <Link href={reviewHref(device.slug)} className="product-cta-secondary">
            Read full review
          </Link>
        </div>
      </div>
      <span className="visually-hidden" aria-hidden style={{ display: "none" }}>
        {`#${idx + 1} of ${total}`}
      </span>
    </article>
  );
}

export function Top5Rich({ doc, categoryLabel, breadcrumb }: Props) {
  const devices = enrichDevices(doc);
  const winners = pickCategoryWinners(devices);
  const metricRows = buildMetricRows(devices);
  const specRows = buildSpecRows(devices);
  const personas = buildPersonas(devices);
  const winner = devices[0];

  if (devices.length === 0) {
    return (
      <div className="hr-top5-rich">
        {breadcrumb}
        <section className="page-intro">
          <h1>{doc.title || `Best ${categoryLabel}`}</h1>
          {doc.intro ? <p className="intro-lede">{doc.intro}</p> : null}
          <p style={{ color: "#64748B", marginTop: 16 }}>
            No Top 5 entries published yet for <strong>{categoryLabel}</strong>. Add devices to this
            list in the CMS.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="hr-top5-rich">
      {breadcrumb}

      {/* Page Intro */}
      <section className="page-intro">
        <div className="intro-eyebrow">
          <div className="intro-pulse" aria-hidden />
          {`Updated ${new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
            new Date()
          )}`}
        </div>
        <h1>
          {doc.title?.includes("for ") ? (
            doc.title.replace(/^(.*?)( for [^.]+)$/, (_, a, b) => a + b)
          ) : (
            <>
              The 5 best products for <em>{categoryLabel.toLowerCase()}.</em>
            </>
          )}
        </h1>
        {doc.intro ? <p className="intro-lede">{doc.intro}</p> : null}

        <div className="intro-meta">
          <div className="intro-author">
            <div className="intro-author-avatar">HR</div>
            <div className="intro-author-info">
              <strong>HealthRankings Team</strong>
              <span>Expert-reviewed &amp; independently tested</span>
            </div>
          </div>
          <div className="intro-meta-divider" />
          <div className="intro-meta-fact">
            <span className="intro-meta-fact-label">Products tested</span>
            <span className="intro-meta-fact-value">{devices.length} top picks</span>
          </div>
          <div className="intro-meta-divider" />
          <div className="intro-meta-fact">
            <span className="intro-meta-fact-label">Updated</span>
            <span className="intro-meta-fact-value">
              {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
                new Date()
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Jump nav */}
      <nav className="jump-nav" aria-label="Jump to section">
        <span className="jump-nav-label">Jump to</span>
        <a href="#winner" className="primary">
          The Winner
        </a>
        <a href="#rankings">All {devices.length} Picks</a>
        <a href="#winners-grid">Category Winners</a>
        {metricRows.length > 0 ? <a href="#performance">Performance</a> : null}
        {personas.length > 0 ? <a href="#recommendations">Recommendations</a> : null}
        {(doc.faqs?.length || 0) > 0 ? <a href="#faq">FAQ</a> : null}
      </nav>

      {/* Winner Hero */}
      <section className="winner-hero" id="winner">
        <div className="winner-hero-inner">
          <div className="winner-hero-left">
            <div className="winner-hero-eyebrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
              </svg>
              OUR #1 PICK
            </div>
            <h2>
              The {categoryLabel.toLowerCase()} we&rsquo;d <em>actually recommend.</em>
            </h2>
            <p className="winner-hero-desc">
              {(winner.verdictShort || winner.tagline || "").substring(0, 220)}
              {(winner.verdictShort || winner.tagline || "").length > 220 ? "…" : ""}
            </p>
            <div className="winner-hero-stats">
              <div>
                <span className="winner-stat-num">
                  {winner.score10.toFixed(1)}
                  <span className="unit">/10</span>
                </span>
                <span className="winner-stat-label">Overall score</span>
              </div>
              {winner.priceLabel ? (
                <div>
                  <span className="winner-stat-num">{winner.priceLabel}</span>
                  <span className="winner-stat-label">Starting price</span>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="winner-card">
              <div className="winner-badge">
                <span>TOP PICK</span>
                <span>2026</span>
              </div>
              <div className="winner-rank">#1 PICK</div>
              <h3 className="winner-product">{winner.name}</h3>
              {winner.tagline ? <p className="winner-brand">{winner.tagline}</p> : null}
              {winner.metrics.length > 0 ? (
                <div className="winner-score-grid">
                  {winner.metrics.slice(0, 4).map((m) => (
                    <div key={m.label}>
                      <span className="winner-score-label">{m.label}</span>
                      <span className="winner-score-value">
                        {m.score.toFixed(1)}
                        <span className="out">/10</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="winner-bottom">
                {winner.priceLabel ? (
                  <div className="winner-price">
                    <span className="from">Starts at</span>
                    {winner.priceLabel}
                  </div>
                ) : (
                  <div />
                )}
                <Link href={reviewHref(winner.slug)} className="winner-cta">
                  See details &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Winners */}
      {winners.length > 0 ? (
        <section className="category-winners" id="winners-grid">
          <div className="cw-header">
            <h2>
              Category <em>winners.</em>
            </h2>
            <p>Best performer in each evaluation category.</p>
          </div>
          <div className="cw-grid">
            {winners.map((w) => (
              <Link key={w.title} className="cw-card" href={reviewHref(w.device.slug)}>
                <span className="cw-title">{w.title}</span>
                <span className="cw-product">{w.device.name}</span>
                <span className="cw-metric">{w.metric}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* All ranked */}
      <section className="rankings" id="rankings">
        <div className="rankings-header">
          <h2>
            All {devices.length} <em>ranked.</em>
          </h2>
        </div>
        {devices.map((d, idx) => (
          <ProductCard key={d.slug} device={d} idx={idx} total={devices.length} />
        ))}
      </section>

      {/* Performance Matrix */}
      {metricRows.length > 0 ? (
        <section className="perf-matrix" id="performance">
          <div className="pm-header">
            <h2>
              Performance, <em>side-by-side.</em>
            </h2>
            <p>
              Every metric we measured. Highest score in each row marked with{" "}
              <span className="pm-trophy">★</span>.
            </p>
          </div>
          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {devices.map((d) => (
                    <th key={d.slug} className={d.rank === 1 ? "hl" : undefined}>
                      {d.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Overall Score</td>
                  {devices.map((d) => (
                    <td key={d.slug} className={d.rank === 1 ? "hl" : undefined}>
                      <span className="pm-score pm-score-big">
                        {d.score10.toFixed(1)}
                        <span className="pm-out">/10</span>
                      </span>
                    </td>
                  ))}
                </tr>
                {metricRows.map((label) => {
                  const max = metricMax(devices, label);
                  return (
                    <tr key={label}>
                      <td>{label}</td>
                      {devices.map((d) => {
                        const m = getMetric(d, label);
                        const isMax = m && m.score === max && max > 0;
                        return (
                          <td key={d.slug} className={isMax ? "best" : undefined}>
                            {m ? (
                              <>
                                <span className="pm-score">{m.score.toFixed(1)}</span>
                                {isMax ? (
                                  <>
                                    {" "}
                                    <span className="pm-trophy">★</span>
                                  </>
                                ) : null}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr>
                  <td>Price</td>
                  {devices.map((d) => (
                    <td key={d.slug}>
                      <span className="pm-price">{d.priceLabel || "—"}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Specs */}
      {specRows.length > 0 ? (
        <section className="specs-section" id="specs">
          <div className="pm-header">
            <h2>
              Tech <em>specs.</em>
            </h2>
            <p>Hardware and feature details, side-by-side.</p>
          </div>
          <div className="pm-table-wrap">
            <table className="pm-table specs">
              <thead>
                <tr>
                  <th>Specification</th>
                  {devices.map((d) => (
                    <th key={d.slug} className={d.rank === 1 ? "hl" : undefined}>
                      {d.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specRows.map((key) => (
                  <tr key={key}>
                    <td>{key}</td>
                    {devices.map((d) => {
                      const s = getSpec(d, key);
                      return <td key={d.slug}>{s ? s.value : "—"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Personas */}
      {personas.length > 0 ? (
        <section className="personas" id="recommendations">
          <div className="pm-header">
            <h2>
              Which one is right for <em>you?</em>
            </h2>
            <p>Our recommendation depends on what you need most.</p>
          </div>
          <div className="persona-grid">
            {personas.map((p) => (
              <article key={p.title} className="persona-card">
                <span className="persona-title">{p.title}</span>
                <span className="persona-pick">
                  Recommended: <strong>{p.device.name}</strong>
                </span>
                <p className="persona-why">{p.why}</p>
                <Link href={reviewHref(p.device.slug)} className="persona-cta">
                  Read review &rarr;
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      {(doc.faqs?.length || 0) > 0 ? (
        <section className="faq-section" id="faq">
          <div className="faq-header">
            <h2>
              Questions, <em>answered.</em>
            </h2>
          </div>
          <div className="faq-list">
            {(doc.faqs as FaqItem[]).map((f, i) => (
              <details key={i} className="faq-item" open={i === 0}>
                <summary>
                  {f.question}
                  <span className="faq-icon" aria-hidden>
                    +
                  </span>
                </summary>
                <div className="faq-body">
                  {f.answer.split(/\n\n+/).map((para, j) => (
                    <p key={j}>{para}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {/* Related */}
      {(doc.relatedConditions?.length || 0) > 0 ? (
        <section className="related">
          <h2>Related conditions</h2>
          <div className="related-grid">
            {(doc.relatedConditions as RelatedCondition[]).map((r) => (
              <Link key={r.href} href={r.href} className="related-card">
                <div className="related-name">{r.name}</div>
                {r.meta ? <div className="related-meta">{r.meta}</div> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
