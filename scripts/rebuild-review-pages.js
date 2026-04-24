const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'review-data.json'), 'utf-8'));

const REF_FILE = path.join(DIR, 'healthrankings-hypertension-top5.html');
const refHtml = fs.readFileSync(REF_FILE, 'utf-8');
const BASE_CSS = refHtml.match(/<style>([\s\S]*?)<\/style>/)[1];

const REVIEW_CSS = `

/* ===== REVIEW-SPECIFIC STYLES ===== */

.review-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 48px 32px 80px;
}

.review-section {
  margin-bottom: 56px;
}

.review-section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--teal-600);
  margin-bottom: 8px;
}

.review-section h2 {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--slate-900);
  margin-bottom: 20px;
}

.review-section p {
  font-size: 16px;
  line-height: 1.7;
  color: var(--slate-600);
  margin-bottom: 16px;
}

.review-verdict {
  background: var(--gradient-blue);
  border-radius: 24px;
  padding: 40px;
  display: flex;
  align-items: center;
  gap: 32px;
  position: relative;
  overflow: hidden;
  margin-bottom: 48px;
}

.review-verdict::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 60%);
  pointer-events: none;
}

.verdict-score-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 3px solid rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.verdict-score-num {
  font-family: 'DM Sans', sans-serif;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: white;
  line-height: 1;
}

.verdict-score-of {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.verdict-text {
  position: relative;
  z-index: 1;
}

.verdict-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.verdict-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: white;
  margin-bottom: 8px;
  line-height: 1.25;
}

.verdict-summary {
  font-size: 15px;
  color: rgba(248, 250, 252, 0.8);
  line-height: 1.6;
  max-width: 520px;
}

.perf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}

.perf-card {
  padding: 20px;
  background: white;
  border: 1px solid var(--slate-200);
  border-radius: 16px;
}

.perf-card-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--slate-600);
  margin-bottom: 10px;
}

.perf-bar-track {
  height: 6px;
  background: var(--slate-200);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.perf-bar-fill {
  height: 100%;
  background: var(--gradient-blue);
  border-radius: 3px;
}

.perf-card-score {
  font-family: 'DM Sans', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--blue-700);
  line-height: 1;
}

.perf-card-score .out {
  font-size: 13px;
  color: var(--slate-400);
  font-weight: 500;
}

.review-pros-cons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.pc-card {
  padding: 28px;
  background: white;
  border: 1px solid var(--slate-200);
  border-radius: 20px;
}

.pc-card.pc-pros {
  border-top: 3px solid var(--blue-600);
}

.pc-card.pc-cons {
  border-top: 3px solid var(--slate-400);
}

.pc-card h3 {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.pc-pros h3 { color: var(--blue-700); }
.pc-cons h3 { color: var(--slate-600); }

.pc-card ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pc-card li {
  font-size: 14px;
  color: var(--slate-900);
  padding-left: 24px;
  position: relative;
  line-height: 1.5;
}

.pc-pros li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--blue-600);
  font-weight: 700;
}

.pc-cons li::before {
  content: '−';
  position: absolute;
  left: 2px;
  color: var(--slate-400);
  font-weight: 700;
  font-size: 18px;
  line-height: 1.1;
}

.who-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.who-card {
  padding: 28px;
  background: white;
  border: 1px solid var(--slate-200);
  border-radius: 20px;
}

.who-card h3 {
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--slate-900);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.who-card ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.who-card li {
  font-size: 14px;
  color: var(--slate-600);
  padding-left: 24px;
  position: relative;
  line-height: 1.5;
}

.who-card li::before {
  content: '•';
  position: absolute;
  left: 6px;
  color: var(--blue-600);
  font-weight: 700;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--slate-200);
  margin-top: 20px;
}

.specs-table tr { border-bottom: 1px solid var(--slate-200); }
.specs-table tr:last-child { border-bottom: none; }

.specs-table td {
  padding: 14px 20px;
  font-size: 14px;
  vertical-align: middle;
}

.specs-table td:first-child {
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  color: var(--slate-600);
  width: 40%;
  background: var(--slate-50);
  font-size: 13px;
}

.specs-table td:last-child {
  color: var(--slate-900);
  background: white;
}

.review-final {
  text-align: center;
  padding: 48px;
  background: white;
  border: 2px solid var(--slate-200);
  border-radius: 24px;
  margin-top: 20px;
}

.final-score-big {
  font-family: 'DM Sans', sans-serif;
  font-size: 64px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--blue-700);
  line-height: 1;
  margin-bottom: 4px;
}

.final-score-big .out {
  font-size: 28px;
  color: var(--slate-400);
}

.final-label {
  font-size: 14px;
  color: var(--slate-600);
  margin-bottom: 20px;
}

.final-text {
  font-size: 16px;
  color: var(--slate-600);
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto 28px;
}

.final-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: var(--gradient-blue);
  color: white;
  border-radius: 9999px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 700;
  font-size: 15px;
  transition: all 200ms;
}

.final-cta:hover { transform: translateY(-2px); }

.review-back-links {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 32px 0;
}

.review-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid var(--blue-600);
  border-radius: 9999px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--blue-700);
  transition: all 200ms;
}

.review-back-link:hover {
  background: var(--gradient-blue);
  color: white;
  border-color: transparent;
}

.footer-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.footer-spec {
  padding: 8px 16px;
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  border-radius: 9999px;
  font-size: 12px;
  color: var(--slate-600);
}

.footer-spec strong {
  font-weight: 700;
  color: var(--slate-900);
}

@media (max-width: 768px) {
  .review-content { padding: 32px 20px 60px; }
  .review-verdict { flex-direction: column; text-align: center; padding: 28px; gap: 20px; }
  .verdict-summary { max-width: 100%; }
  .perf-grid { grid-template-columns: 1fr; }
  .review-pros-cons { grid-template-columns: 1fr; }
  .who-grid { grid-template-columns: 1fr; }
  .review-final { padding: 32px 20px; }
  .final-score-big { font-size: 48px; }
  .review-back-links { padding: 20px 20px 0; }
}
`;

const HEADER = `<header class="header">
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-tile">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <circle cx="11" cy="12" r="2" fill="#2563EB"/>
          <circle cx="21" cy="12" r="2" fill="#2563EB"/>
          <path d="M 8 19 Q 16 26 24 19" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        </svg>
        <div class="logo-sparkle">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
            <path d="M 6 0 L 7 4.5 L 12 6 L 7 7.5 L 6 12 L 5 7.5 L 0 6 L 5 4.5 Z"/>
          </svg>
        </div>
      </div>
      <div class="logo-text">
        <span class="one">health</span><span class="two">rankings</span>
      </div>
    </a>
    <nav class="nav">
      <a href="/healthrankings-conditions.html">Conditions</a>
      <a href="/healthrankings-devices.html">Devices</a>
      <a href="#">Drugs A&ndash;Z</a>
      <a href="#">Health News</a>
      <a href="/healthrankings-about.html">About</a>
    </nav>
    <button class="cta-btn">Get started</button>
  </div>
</header>`;

const FOOTER = `<footer class="footer">
  <div class="footer-inner">
    <div class="footer-disclosure">
      <strong>How we fund our work.</strong> HealthRankings earns a small commission when you buy through the links on this page &mdash; but our rankings can&rsquo;t be influenced by advertisers. We buy every product we test at retail, and our medical reviewers have no financial relationship with any brand we cover. <a href="#" style="color: var(--teal-500); text-decoration: underline;">Read our full methodology &rarr;</a>
    </div>
    <div class="footer-bottom">
      <div>&copy; 2026 HealthRankings. Made with care in Miami.</div>
      <div class="footer-bottom-links">
        <a href="/healthrankings-privacy-policy.html">Privacy</a>
        <a href="/healthrankings-terms-of-service.html">Terms</a>
        <a href="#">Editorial Policy</a>
        <a href="#">Contact</a>
      </div>
    </div>
  </div>
</footer>`;

function esc(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function scoreColor(score) {
  const n = parseFloat(score);
  if (n >= 9) return 'var(--blue-700)';
  if (n >= 8) return 'var(--blue-600)';
  if (n >= 7) return 'var(--teal-600)';
  return 'var(--slate-600)';
}

function ratingLabel(score) {
  const n = parseFloat(score);
  if (n >= 9.5) return 'Outstanding';
  if (n >= 9) return 'Excellent';
  if (n >= 8.5) return 'Very Good';
  if (n >= 8) return 'Good';
  if (n >= 7) return 'Above Average';
  if (n >= 6) return 'Average';
  return 'Below Average';
}

function stars(score) {
  const n = parseFloat(score);
  const full = Math.floor(n / 2);
  const half = (n / 2 - full) >= 0.25;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

function getCategoryName(d) {
  if (d.breadcrumbs && d.breadcrumbs.length >= 3) return d.breadcrumbs[2].text;
  if (d.breadcrumbs && d.breadcrumbs.length >= 2) return d.breadcrumbs[1].text;
  return 'Devices';
}

function getCategoryHref(d) {
  if (d.breadcrumbs && d.breadcrumbs.length >= 3) return d.breadcrumbs[2].href;
  if (d.breadcrumbs && d.breadcrumbs.length >= 2) return d.breadcrumbs[1].href;
  return '/healthrankings-devices.html';
}

function getTop5Href(d) {
  for (const link of (d.backLinks || [])) {
    if (link.href && link.href.includes('top5')) return link.href;
  }
  return null;
}

function buildJsonLd(d) {
  const category = getCategoryName(d);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Review",
    "name": `${d.name} Review`,
    "author": { "@type": "Organization", "name": "HealthRankings" },
    "datePublished": "2026-04-01",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": d.score,
      "bestRating": "10",
      "worstRating": "1"
    },
    "itemReviewed": {
      "@type": "Product",
      "name": d.name,
      "category": category
    }
  });
}

function buildBreadcrumb(d) {
  const catName = getCategoryName(d);
  const catHref = getCategoryHref(d);
  return `<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="breadcrumb-sep">/</span>
  <a href="/healthrankings-devices.html">Devices</a>
  <span class="breadcrumb-sep">/</span>
  <a href="${catHref}">${esc(catName)}</a>
  <span class="breadcrumb-sep">/</span>
  <span class="breadcrumb-current">${esc(d.name)}</span>
</nav>`;
}

function buildPageIntro(d) {
  const score = d.score || '?';
  const rank = d.rank || '';
  const price = d.price || '';
  const tagline = d.tagline || d.verdictTitle || '';
  const catName = getCategoryName(d);
  const tested = d.tested || '';

  let metaFacts = '';
  if (rank) {
    metaFacts += `<div class="intro-meta-fact">
        <span class="intro-meta-fact-label">Rank</span>
        <span class="intro-meta-fact-value">#${esc(rank)} of ${esc(catName)}</span>
      </div>
      <div class="intro-meta-divider"></div>`;
  }
  metaFacts += `<div class="intro-meta-fact">
        <span class="intro-meta-fact-label">Score</span>
        <span class="intro-meta-fact-value">${esc(score)}<span style="color:var(--slate-400);font-weight:400">/10</span></span>
      </div>
      <div class="intro-meta-divider"></div>`;
  if (price) {
    metaFacts += `<div class="intro-meta-fact">
        <span class="intro-meta-fact-label">Price</span>
        <span class="intro-meta-fact-value">$${esc(price)}</span>
      </div>
      <div class="intro-meta-divider"></div>`;
  }
  metaFacts += `<div class="intro-meta-fact">
        <span class="intro-meta-fact-label">Rating</span>
        <span class="intro-meta-fact-value">${ratingLabel(score)}</span>
      </div>`;
  if (tested) {
    metaFacts += `<div class="intro-meta-divider"></div>
      <div class="intro-meta-fact">
        <span class="intro-meta-fact-label">Testing</span>
        <span class="intro-meta-fact-value">${esc(tested)}</span>
      </div>`;
  }

  return `<div class="page-intro">
  <div class="intro-eyebrow"><span class="intro-pulse"></span> Expert Review</div>
  <h1>${esc(d.name)}</h1>
  ${tagline ? `<p class="intro-lede">${esc(tagline)}</p>` : ''}
  <div class="intro-meta">
    <div class="intro-author">
      <div class="intro-author-avatar">HR</div>
      <div class="intro-author-info">
        <strong>HealthRankings Team</strong>
        <span>Expert Testing Lab</span>
      </div>
    </div>
    <div class="intro-meta-divider"></div>
    ${metaFacts}
  </div>
</div>`;
}

function buildJumpNav(d) {
  const isLong = d.type === 'long';
  let links = '<a href="#verdict">Verdict</a>';
  if (isLong && d.performanceScores.length) links += '<a href="#performance">Performance</a>';
  if (d.type === 'short' && d.ratingBars && d.ratingBars.length) links += '<a href="#performance">Performance</a>';
  links += '<a href="#pros-cons">Pros &amp; Cons</a>';
  if (isLong && d.assessmentParagraphs.length) links += '<a href="#assessment">Assessment</a>';
  if (isLong && (d.whoFor.length || d.whoNot.length)) links += '<a href="#who">Who It\'s For</a>';
  if (isLong && d.specs.length) links += '<a href="#specs">Specs</a>';
  if (isLong && d.comparison) links += '<a href="#compare">Compare</a>';
  if ((isLong && d.faq.length) || false) links += '<a href="#faq">FAQ</a>';
  links += '<a href="#final" class="primary">Final Score</a>';
  return `<div class="jump-nav">
  <span class="jump-nav-label">Jump to</span>
  ${links}
</div>`;
}

function buildVerdictCard(d) {
  const score = d.score || '?';
  const title = d.verdictTitle || `${d.name} — ${d.tagline || ''}`;
  const summary = d.verdictSummary || d.description || '';
  return `<div class="review-verdict" id="verdict">
  <div class="verdict-score-circle">
    <div class="verdict-score-num">${esc(score)}</div>
    <div class="verdict-score-of">/10</div>
  </div>
  <div class="verdict-text">
    <div class="verdict-label">HealthRankings Verdict</div>
    <div class="verdict-title">${esc(title)}</div>
    ${summary ? `<div class="verdict-summary">${esc(summary)}</div>` : ''}
  </div>
</div>`;
}

function buildPerformanceSection(d) {
  const scores = d.type === 'long' ? d.performanceScores : (d.ratingBars || []);
  if (!scores.length) return '';
  const cards = scores.map(s => `<div class="perf-card">
      <div class="perf-card-label">${esc(s.label)}</div>
      <div class="perf-bar-track"><div class="perf-bar-fill" style="width:${s.width}%"></div></div>
      <div class="perf-card-score">${esc(s.score)}<span class="out">/10</span></div>
    </div>`).join('\n    ');

  return `<div class="review-section" id="performance">
  <div class="review-section-label">Performance Testing</div>
  <h2>How the ${esc(d.name)} Performed</h2>
  <div class="perf-grid">
    ${cards}
  </div>
</div>`;
}

function buildProsCons(d) {
  const prosItems = (d.pros || []).map(p => `<li>${esc(p)}</li>`).join('');
  const consItems = (d.cons || []).map(c => `<li>${esc(c)}</li>`).join('');
  return `<div class="review-section" id="pros-cons">
  <div class="review-section-label">Strengths &amp; Weaknesses</div>
  <h2>What We Liked &amp; What Could Be Better</h2>
  <div class="review-pros-cons">
    <div class="pc-card pc-pros">
      <h3>Strengths</h3>
      <ul>${prosItems}</ul>
    </div>
    <div class="pc-card pc-cons">
      <h3>Limitations</h3>
      <ul>${consItems}</ul>
    </div>
  </div>
</div>`;
}

function buildAssessment(d) {
  if (d.type !== 'long' || !d.assessmentParagraphs.length) return '';
  const title = d.assessmentTitle || 'Our Expert Assessment';
  const paras = d.assessmentParagraphs.map(p => `<p>${p}</p>`).join('\n  ');
  return `<div class="review-section" id="assessment">
  <div class="review-section-label">Expert Assessment</div>
  <h2>${esc(title)}</h2>
  ${paras}
</div>`;
}

function buildWhoFor(d) {
  if (d.type !== 'long' || (!d.whoFor.length && !d.whoNot.length)) return '';
  const forItems = d.whoFor.map(i => `<li>${esc(i)}</li>`).join('');
  const notItems = d.whoNot.map(i => `<li>${esc(i)}</li>`).join('');
  return `<div class="review-section" id="who">
  <div class="review-section-label">Suitability</div>
  <h2>Who Should Buy the ${esc(d.name)}?</h2>
  <div class="who-grid">
    <div class="who-card">
      <h3>👍 Recommended For</h3>
      <ul>${forItems}</ul>
    </div>
    <div class="who-card">
      <h3>🔄 Consider Alternatives If</h3>
      <ul>${notItems}</ul>
    </div>
  </div>
</div>`;
}

function buildSpecs(d) {
  if (d.type !== 'long' || !d.specs.length) {
    if (d.type === 'short' && d.footerSpecs && d.footerSpecs.length) {
      const rows = d.footerSpecs.map(s => `<tr><td>${esc(s.key)}</td><td>${esc(s.value)}</td></tr>`).join('\n      ');
      return `<div class="review-section" id="specs">
  <div class="review-section-label">Key Specs</div>
  <h2>At a Glance</h2>
  <table class="specs-table">
      ${rows}
  </table>
</div>`;
    }
    return '';
  }
  const rows = d.specs.map(s => `<tr><td>${esc(s.key)}</td><td>${esc(s.value)}</td></tr>`).join('\n      ');
  return `<div class="review-section" id="specs">
  <div class="review-section-label">Technical Details</div>
  <h2>Full Specifications</h2>
  <table class="specs-table">
      ${rows}
  </table>
</div>`;
}

function buildComparison(d) {
  if (d.type !== 'long' || !d.comparison) return '';
  const headers = d.comparison.headers.map((h, i) =>
    i === 0 ? `<th>${esc(h)}</th>` : `<th>${esc(h)}</th>`
  ).join('');
  const rows = d.comparison.rows.map(r => {
    const cls = r.isCurrent ? ' class="winner-row"' : '';
    const cells = r.cells.map((c, i) =>
      i === 0 ? `<td>${esc(c)}</td>` : `<td>${esc(c)}</td>`
    ).join('');
    return `<tr${cls}>${cells}</tr>`;
  }).join('\n        ');

  let compLinks = '';
  if (d.comparisonLinks && d.comparisonLinks.length) {
    compLinks = '<div style="margin-top:16px;display:flex;gap:16px;flex-wrap:wrap;">' +
      d.comparisonLinks.map(l => {
        const t = l.text.replace(/→$/, '').trim();
        return `<a href="${l.href}" class="review-back-link" style="border-width:1px;font-size:12px;padding:6px 14px;">${esc(t)} &rarr;</a>`;
      }).join('') +
      '</div>';
  }

  return `<div class="review-section" id="compare">
  <div class="review-section-label">Comparison</div>
  <h2>How It Stacks Up</h2>
  <div class="comparison-table-wrap">
    <table class="comparison-table">
      <thead><tr>${headers}</tr></thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
  ${compLinks}
</div>`;
}

function buildFaq(d) {
  if (!d.faq || !d.faq.length) return '';
  const items = d.faq.map(f => `<details class="faq-item">
      <summary>${esc(f.q)} <span class="faq-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span></summary>
      <div class="faq-body"><p>${f.a}</p></div>
    </details>`).join('\n    ');
  return `<section class="faq" id="faq">
  <div class="faq-header">
    <h2>Frequently asked <em>questions</em></h2>
  </div>
  <div class="faq-list">
    ${items}
  </div>
</section>`;
}

function buildFinalVerdict(d) {
  const score = d.score || '?';
  const label = d.finalLabel || `${ratingLabel(score)} — ${getCategoryName(d)}`;
  const text = d.finalText || d.description || d.verdictSummary || '';
  const buyLink = d.buyLink || '#';
  return `<div class="review-section" id="final">
  <div class="review-section-label">Final Score</div>
  <h2>The Bottom Line</h2>
  <div class="review-final">
    <div class="final-score-big">${esc(score)}<span class="out">/10</span></div>
    <div class="final-label">${esc(label)}</div>
    ${text ? `<p class="final-text">${text}</p>` : ''}
    <a href="${buyLink}" class="final-cta">Check Price on Amazon &rarr;</a>
  </div>
</div>`;
}

function buildBackLinks(d) {
  const catName = getCategoryName(d);
  const catHref = getCategoryHref(d);
  const top5Href = getTop5Href(d);

  let links = `<a href="${catHref}" class="review-back-link">&larr; All ${esc(catName)}</a>`;
  if (top5Href) links += `\n  <a href="${top5Href}" class="review-back-link">🏆 Top 5 Picks</a>`;
  return `<div class="review-back-links">\n  ${links}\n</div>`;
}

function buildPage(d) {
  const isLong = d.type === 'long';
  const scores = isLong ? d.performanceScores : (d.ratingBars || []);
  const hasPerf = scores.length > 0;
  const hasFaq = d.faq && d.faq.length > 0;
  const faqSection = buildFaq(d);
  const faqOutside = hasFaq;

  const catName = getCategoryName(d);
  const title = `${d.name} Review | ${catName} | HealthRankings`;
  const desc = d.metaDesc || `${d.name} — expert review by HealthRankings. Score: ${d.score}/10. ${d.tagline || ''}`;

  const sections = [
    buildVerdictCard(d),
    buildPerformanceSection(d),
    buildProsCons(d),
    buildAssessment(d),
    buildWhoFor(d),
    buildSpecs(d),
    buildComparison(d),
    buildFinalVerdict(d),
  ].filter(Boolean).join('\n\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${buildJsonLd(d)}</script>
<style>
${BASE_CSS}
${REVIEW_CSS}
</style>
</head>
<body>

${HEADER}

${buildBreadcrumb(d)}

${buildPageIntro(d)}

${buildJumpNav(d)}

${buildBackLinks(d)}

<div class="review-content">
  ${sections}
</div>

${faqOutside ? faqSection : ''}

${FOOTER}

</body>
</html>`;
}

let count = 0;
for (const d of data) {
  const html = buildPage(d);
  fs.writeFileSync(path.join(DIR, d.filename), html);
  count++;
}

console.log(`Rebuilt ${count} review pages with Blue Face template`);
console.log(`  Long-form: ${data.filter(d => d.type === 'long').length}`);
console.log(`  Short-form: ${data.filter(d => d.type === 'short').length}`);
