#!/usr/bin/env node
/**
 * v3: Rebuild top-5 pages with richer data-driven sections inspired by medgrade.org.
 *
 * Adds:
 *   - Category Winners grid (Best Overall, Most Accurate, Best Value, Best App/Build)
 *   - Performance Scores Matrix (per-metric x per-product table)
 *   - Specs comparison table
 *   - Recommendations by Use Case (persona-based picks)
 *   - Trust badges on each card (FDA, AHA validated, etc.)
 *
 * Sources:
 *   - existing top5 page HTML (parses 5 product cards with rank, score, pros/cons, link)
 *   - scripts/review-data.json (richer per-product data: specs, performanceScores, whoFor)
 *
 * Usage:
 *   node scripts/rebuild-top5-pages-v3.js                         # rebuild all 60 top5 pages
 *   node scripts/rebuild-top5-pages-v3.js --only=afib-blood-pressure-monitor   # one page
 *   node scripts/rebuild-top5-pages-v3.js --dry                   # don't write; just print
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'apps', 'web', 'public');
const REVIEW_DATA = path.join(__dirname, 'review-data.json');

const argv = process.argv.slice(2);
const ONLY = (argv.find(a => a.startsWith('--only=')) || '').replace('--only=', '');
const DRY = argv.includes('--dry');

// ----------------------------------------------------------------------------
// Load review data, build index by filename slug
// ----------------------------------------------------------------------------

const reviewData = JSON.parse(fs.readFileSync(REVIEW_DATA, 'utf8'));
const byFilename = {};
for (const r of reviewData) {
  if (r && r.filename) byFilename[r.filename] = r;
}

function lookupReview(href) {
  if (!href) return null;
  const file = href.replace(/^\//, '').split('?')[0].split('#')[0];
  return byFilename[file] || null;
}

// ----------------------------------------------------------------------------
// HTML parsing helpers
// ----------------------------------------------------------------------------

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&times;/g, '\u00d7');
}

function extractFirst(s, re) {
  const m = s.match(re);
  return m ? m[1].trim() : '';
}

function extractAll(s, re) {
  const out = [];
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const r = new RegExp(re.source, flags);
  let m;
  while ((m = r.exec(s))) out.push(m[1].trim());
  return out;
}

// Parse a single product card from the existing v2 top5 HTML.
// Each card is wrapped in an <article class="product-card ..."> ... </article>
function parseProductCards(html) {
  const cards = [];
  const re = /<article class="product-card([^"]*)">([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(html))) {
    const cls = m[1];
    const body = m[2];

    const rank = parseInt(extractFirst(body, /class="rank-number[^"]*">[\s\S]*?>(\d+)/) || '0', 10);
    const rankLabel = decode(extractFirst(body, /class="product-rank-label[^"]*">([^<]+)</));
    const tagline = decode(extractFirst(body, /class="product-tagline[^"]*">([^<]+)</));
    const name = decode(extractFirst(body, /class="product-name">([^<]+)</));
    const brand = decode(extractFirst(body, /class="product-brand">([^<]+)</));
    const verdict = decode(extractFirst(body, /class="product-verdict">([\s\S]*?)<\/p>/));
    const score = parseFloat(extractFirst(body, /class="score-big">([\d.]+)/) || '0');
    const price = decode(extractFirst(body, /class="price-amount">([^<]+)</));
    const retailer = decode(extractFirst(body, /class="price-unit">at ([^<]+)</));
    const reviewLink =
      extractFirst(body, /<a[^>]+class="product-cta-secondary"[^>]*href="([^"]+)"/) ||
      extractFirst(body, /<a[^>]+href="([^"]+)"[^>]*class="product-cta-secondary"/) ||
      extractFirst(body, /<a[^>]+class="product-cta"[^>]*href="([^"]+)"/) ||
      extractFirst(body, /<a[^>]+href="([^"]+)"[^>]*class="product-cta(?:[^a-z])/);

    const pros = extractAll(
      (body.match(/<div class="pros-cons-col pros">[\s\S]*?<ul>([\s\S]*?)<\/ul>/) || ['', ''])[1],
      /<li>([\s\S]*?)<\/li>/g
    ).map(decode);

    const cons = extractAll(
      (body.match(/<div class="pros-cons-col cons">[\s\S]*?<ul>([\s\S]*?)<\/ul>/) || ['', ''])[1],
      /<li>([\s\S]*?)<\/li>/g
    ).map(decode);

    const sbLabels = extractAll(body, /class="score-row-label">([^<]+)</g).map(decode);
    const sbVals = extractAll(body, /class="score-row-value">([^<]+)</g);
    const sbWidths = extractAll(body, /class="score-row-fill"\s*style="width:([\d.]+)%/g);
    const breakdown = sbLabels.map((label, i) => ({
      label,
      value: parseFloat(sbVals[i] || '0'),
      width: parseFloat(sbWidths[i] || (sbVals[i] ? sbVals[i] * 10 : 0))
    }));

    cards.push({
      rank, rankLabel, tagline, name, brand, verdict,
      score, price, retailer: retailer || 'Amazon', reviewLink,
      pros, cons, breakdown,
      isWinner: cls.includes('is-winner')
    });
  }
  cards.sort((a, b) => a.rank - b.rank);
  return cards;
}

// ----------------------------------------------------------------------------
// Enrich product with review-data.json info
// ----------------------------------------------------------------------------

// Map various label spellings to a canonical metric label.
// Returns null if the label should be dropped (too vague / not a real metric).
function canonicalMetric(label) {
  const l = (label || '').trim().toLowerCase();
  if (!l) return null;
  if (/accuracy|precision/.test(l)) return 'Accuracy';
  if (/cuff comfort|comfort/.test(l)) return 'Cuff Comfort';
  if (/ease of use|usability|ease/.test(l)) return 'Ease of Use';
  if (/app|sync|connectiv|smart features/.test(l)) return 'App & Sync';
  if (/build quality|build|durability|construction/.test(l)) return 'Build Quality';
  if (/display|screen/.test(l)) return 'Display';
  if (/battery|power management/.test(l)) return 'Battery';
  if (/value|price|cost/.test(l)) return 'Value';
  if (/portab|travel|compact/.test(l)) return 'Portability';
  if (/memory|data/.test(l)) return 'Memory & Data';
  if (/design|aesthetic|look/.test(l)) return null;       // too vague
  if (/apple health|google fit|integration/.test(l)) return null; // not a metric
  if (/ekg|ecg|rhythm/.test(l)) return 'EKG / Rhythm';
  return label.replace(/\b\w/g, c => c.toUpperCase()); // Title-case fallback
}

// Whitelist of useful spec keys - drop ones that are not specs or are duplicated elsewhere.
const SPEC_KEY_WHITELIST = new Set([
  'Cuff Size', 'Cuff Range', 'Memory', 'Storage', 'Bluetooth', 'Wi-Fi', 'Connectivity',
  'AFib Detection', 'Arrhythmia Detection', 'Validated', 'Validation', 'EKG', 'ECG',
  'Display', 'Screen', 'Power', 'Power Source', 'Battery', 'Battery Life',
  'Cuff Type', 'Users', 'Multi-user', 'Warranty', 'App', 'App Compatibility',
  'Weight', 'Dimensions', 'Form Factor', 'Sensors', 'Accuracy', 'Measurement Range'
]);

function normalizeSpecKey(key) {
  const k = (key || '').trim();
  if (!k) return null;
  // Filter out specs that are basically metadata duplications
  const lk = k.toLowerCase();
  if (/^(price|overall score|ranking|healthrankings rank|score|rank|verdict|our verdict)$/.test(lk)) return null;
  if (/design|aesthetic/.test(lk) && !/cuff/.test(lk)) return null;
  return k;
}

function enrichProduct(p) {
  const rd = lookupReview(p.reviewLink);
  if (!rd) {
    // Even unenriched products: canonicalize their breakdown labels
    return { ...p, breakdown: canonicalizeBreakdown(p.breakdown), specs: [], _enriched: false };
  }

  const specs = (Array.isArray(rd.specs) ? rd.specs : [])
    .map(s => ({ key: normalizeSpecKey(s.key), value: s.value }))
    .filter(s => s.key);

  const rawPerf = Array.isArray(rd.performanceScores) && rd.performanceScores.length >= p.breakdown.length
    ? rd.performanceScores.map(ps => ({
        label: ps.label, value: parseFloat(ps.score) || 0, width: parseFloat(ps.width) || 0
      }))
    : p.breakdown;

  return {
    ...p,
    breakdown: canonicalizeBreakdown(rawPerf),
    specs,
    whoFor: Array.isArray(rd.whoFor) ? rd.whoFor : [],
    whoNot: Array.isArray(rd.whoNot) ? rd.whoNot : [],
    _enriched: true
  };
}

function canonicalizeBreakdown(breakdown) {
  const seen = new Map();
  for (const m of breakdown || []) {
    const c = canonicalMetric(m.label);
    if (!c) continue;
    // Keep highest scoring instance if duplicate
    const cur = seen.get(c);
    if (!cur || (m.value || 0) > (cur.value || 0)) {
      seen.set(c, { label: c, value: m.value, width: m.width });
    }
  }
  return [...seen.values()];
}

// ----------------------------------------------------------------------------
// Trust badges - infer from specs and pros
// ----------------------------------------------------------------------------

function inferTrustBadges(p) {
  const text = [
    ...(p.pros || []),
    ...(p.specs || []).map(s => `${s.key}: ${s.value}`),
    p.verdict || '',
    p.tagline || '',
    p.brand || ''
  ].join(' ').toLowerCase();

  const badges = [];
  if (/\bfda\b|510\(k\)|fda[- ]cleared/.test(text)) badges.push({ label: 'FDA Cleared', kind: 'medical' });
  if (/\baha\b|american heart/.test(text)) badges.push({ label: 'AHA Validated', kind: 'medical' });
  if (/\baami\b|ansi\/aami/.test(text)) badges.push({ label: 'AAMI Standard', kind: 'medical' });
  if (/\besh\b|european society of hyper/.test(text)) badges.push({ label: 'ESH Validated', kind: 'medical' });
  if (/\bbhs\b|british hyper/.test(text)) badges.push({ label: 'BHS Validated', kind: 'medical' });
  if (/clinical(ly)?[- ]validated|clinical(ly)?[- ]proven/.test(text)) {
    if (!badges.some(b => /Validated/.test(b.label))) badges.push({ label: 'Clinically Validated', kind: 'medical' });
  }
  if (/hsa[\/ ]?fsa|hsa[/ ]eligible|fsa[/ ]eligible/.test(text)) badges.push({ label: 'HSA/FSA Eligible', kind: 'value' });
  if (/bluetooth|wi-?fi/.test(text)) badges.push({ label: 'Connected', kind: 'tech' });

  // Cap to 3 most important
  return badges.slice(0, 3);
}

// ----------------------------------------------------------------------------
// Compute Category Winners
// ----------------------------------------------------------------------------

function pickWinners(products) {
  // Best Overall = #1 in ranking
  const overall = products[0];

  // Map each metric label -> highest scoring product
  const byMetric = new Map();
  for (const p of products) {
    for (const m of p.breakdown || []) {
      const key = m.label;
      const cur = byMetric.get(key);
      if (!cur || (m.value || 0) > (cur.value || 0)) {
        byMetric.set(key, { label: key, value: m.value, product: p });
      }
    }
  }

  const winners = [];
  // Always: Best Overall
  winners.push({ title: 'Best Overall', product: overall, metric: `${overall.score.toFixed(1)}/10 score` });

  // Most Accurate (look for accuracy-style metrics)
  const accuracyKey = [...byMetric.keys()].find(k => /accuracy/i.test(k));
  if (accuracyKey) {
    const w = byMetric.get(accuracyKey);
    winners.push({ title: 'Most Accurate', product: w.product, metric: `${w.value.toFixed(1)}/10 ${accuracyKey.toLowerCase()}` });
  }

  // Best Value = lowest price among products
  let bestValue = null;
  let bestValuePrice = Infinity;
  for (const p of products) {
    const n = parseFloat((p.price || '').replace(/[^\d.]/g, ''));
    if (!isNaN(n) && n > 0 && n < bestValuePrice) {
      bestValuePrice = n;
      bestValue = p;
    }
  }
  if (bestValue) {
    winners.push({ title: 'Best Value', product: bestValue, metric: `${bestValue.price} starting price` });
  }

  // Best App or Best Build (whichever metric exists)
  const appKey = [...byMetric.keys()].find(k => /app|sync|connectiv/i.test(k));
  const buildKey = [...byMetric.keys()].find(k => /build|durab|construct/i.test(k));
  if (appKey) {
    const w = byMetric.get(appKey);
    winners.push({ title: 'Best App', product: w.product, metric: `${w.value.toFixed(1)}/10 ${appKey.toLowerCase()}` });
  } else if (buildKey) {
    const w = byMetric.get(buildKey);
    winners.push({ title: 'Best Build', product: w.product, metric: `${w.value.toFixed(1)}/10 ${buildKey.toLowerCase()}` });
  } else {
    // Fallback: 2nd best overall
    if (products[1]) winners.push({ title: 'Runner-up', product: products[1], metric: `${products[1].score.toFixed(1)}/10 overall` });
  }

  // Dedupe by title only (we want each title shown once)
  return winners.slice(0, 4);
}

// ----------------------------------------------------------------------------
// Recommendations by Use Case
// ----------------------------------------------------------------------------

function buildPersonas(products) {
  // Each persona: { title, why, productRank }
  const out = [];
  const used = new Set();

  function productText(p) {
    return [
      (p.tagline || ''), (p.brand || ''),
      ...(p.pros || []), (p.verdict || ''),
      ...(p.specs || []).map(s => `${s.key}:${s.value}`)
    ].join(' ').toLowerCase();
  }

  function addPersona(title, why, product) {
    if (!product || used.has(product.rank)) return false;
    used.add(product.rank);
    out.push({ title, why, product });
    return true;
  }

  // Persona 1: Best for most people (winner)
  addPersona('For most people', 'Top scores across the metrics that matter most — accuracy, build, and ease of use.', products[0]);

  // Persona 2: Tech / Wi-Fi / cloud sync (skip winner if already used)
  const tech = products.find(p =>
    !used.has(p.rank) && /wi-?fi|cloud|auto[- ]?sync|wireless sync/.test(productText(p))
  ) || products.find(p =>
    !used.has(p.rank) && /bluetooth|app|sync/.test(productText(p))
  );
  addPersona('For tech-savvy users', 'Reliable wireless sync, deeper analytics, and integrations with health apps.', tech);

  // Persona 3: Advanced / clinical / EKG
  const advanced = products.find(p =>
    !used.has(p.rank) && /ekg|ecg|physician|clinical|professional|holter|advanced/.test(productText(p))
  );
  if (advanced) addPersona('For advanced or clinical needs', 'Adds richer signals — EKG documentation, physician sharing, or clinical-grade testing.', advanced);

  // Persona 4: Budget pick (lowest priced of remaining)
  const remaining = products.filter(p => !used.has(p.rank));
  let cheapest = null, cheapestN = Infinity;
  for (const p of remaining) {
    const n = parseFloat((p.price || '').replace(/[^\d.]/g, ''));
    if (!isNaN(n) && n > 0 && n < cheapestN) { cheapestN = n; cheapest = p; }
  }
  if (cheapest) addPersona('For budget-conscious shoppers', 'Solid daily-use performance at the lowest price in our lineup.', cheapest);

  // Fill any remaining slot up to 4 with diverse rank-based picks
  for (const p of products) {
    if (out.length >= 4) break;
    if (!used.has(p.rank)) {
      const why = p.brand || `An excellent alternative if our top pick is unavailable.`;
      addPersona(p.rankLabel || 'Worthy alternative', why.substring(0, 140), p);
    }
  }

  return out.slice(0, 4);
}

// ----------------------------------------------------------------------------
// Build new sections
// ----------------------------------------------------------------------------

function escAttr(s) { return (s || '').replace(/"/g, '&quot;'); }
function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function categoryWinnersHtml(winners) {
  if (!winners || winners.length === 0) return '';
  const cards = winners.map(w => `
    <a class="cw-card" href="${escAttr(w.product.reviewLink || '#')}">
      <span class="cw-title">${esc(w.title)}</span>
      <span class="cw-product">${esc(w.product.name)}</span>
      <span class="cw-metric">${esc(w.metric)}</span>
    </a>`).join('');

  return `
<!-- ============ CATEGORY WINNERS ============ -->
<section class="category-winners" id="winners-grid">
  <div class="cw-header">
    <h2>Category <em>winners.</em></h2>
    <p>Best performer in each evaluation category.</p>
  </div>
  <div class="cw-grid">${cards}
  </div>
</section>`;
}

function perfMatrixHtml(products) {
  // Use the union of metric labels (already canonicalized in enrichProduct)
  // Score each label by coverage (how many products report it) so we keep the most-shared metrics
  const coverage = new Map();
  for (const p of products) {
    for (const m of p.breakdown || []) {
      coverage.set(m.label, (coverage.get(m.label) || 0) + 1);
    }
  }
  // Stable order: priority labels first, then by coverage
  const PRIORITY = ['Accuracy', 'Ease of Use', 'Cuff Comfort', 'App & Sync', 'Build Quality', 'Display', 'Battery', 'Value', 'Memory & Data', 'Portability', 'EKG / Rhythm'];
  const order = [...coverage.keys()].sort((a, b) => {
    const ia = PRIORITY.indexOf(a), ib = PRIORITY.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return (coverage.get(b) - coverage.get(a));
  }).filter(l => coverage.get(l) >= 2)  // only keep if at least 2 products have it
    .slice(0, 8);
  if (order.length === 0) return '';

  const head = `<thead><tr><th>Metric</th>${products.map(p => `<th${p.rank === 1 ? ' class="hl"' : ''}>${esc(p.name)}</th>`).join('')}</tr></thead>`;

  // Add overall score row
  const overallRow = `<tr><td>Overall Score</td>${products.map(p => `<td${p.rank === 1 ? ' class="hl"' : ''}><span class="pm-score pm-score-big">${p.score.toFixed(1)}<span class="pm-out">/10</span></span></td>`).join('')}</tr>`;

  const rows = order.map(label => {
    // Find max value to highlight winner
    let max = 0;
    for (const p of products) {
      const m = (p.breakdown || []).find(b => b.label === label);
      if (m && m.value > max) max = m.value;
    }
    const cells = products.map(p => {
      const m = (p.breakdown || []).find(b => b.label === label);
      const v = m ? m.value : null;
      const isMax = v != null && v === max && max > 0;
      return `<td${isMax ? ' class="best"' : ''}>${v != null ? `<span class="pm-score">${v.toFixed(1)}</span>${isMax ? ' <span class="pm-trophy">\u2605</span>' : ''}` : '\u2014'}</td>`;
    }).join('');
    return `<tr><td>${esc(label)}</td>${cells}</tr>`;
  }).join('');

  // Add price row
  const priceRow = `<tr><td>Price</td>${products.map(p => `<td><span class="pm-price">${esc(p.price || '\u2014')}</span></td>`).join('')}</tr>`;

  return `
<!-- ============ PERFORMANCE MATRIX ============ -->
<section class="perf-matrix" id="performance">
  <div class="pm-header">
    <h2>Performance, <em>side-by-side.</em></h2>
    <p>Every metric we measured. Highest score in each row marked with <span class="pm-trophy">\u2605</span>.</p>
  </div>
  <div class="pm-table-wrap">
    <table class="pm-table">${head}<tbody>${overallRow}${rows}${priceRow}</tbody></table>
  </div>
</section>`;
}

function specsTableHtml(products) {
  // Build union of spec keys preserving order from products with most specs
  const order = [];
  const seen = new Set();
  // sort products so the one with most specs comes first
  const sorted = [...products].sort((a, b) => (b.specs?.length || 0) - (a.specs?.length || 0));
  for (const p of sorted) {
    for (const s of p.specs || []) {
      if (!seen.has(s.key)) { seen.add(s.key); order.push(s.key); }
    }
  }
  // Skip rows we already covered (Price, Overall Score, HealthRankings Rank)
  const SKIP = new Set(['Price', 'Overall Score', 'HealthRankings Rank', 'Ranking']);
  // Prioritize commonly-shared spec keys
  const SPEC_PRIORITY = ['Cuff Size', 'Cuff Range', 'Memory', 'Storage', 'Bluetooth', 'Wi-Fi',
    'Connectivity', 'AFib Detection', 'Arrhythmia Detection', 'Validated', 'Validation',
    'EKG', 'ECG', 'Display', 'Power', 'Power Source', 'Battery', 'Battery Life',
    'Warranty', 'Users', 'App', 'Weight', 'Dimensions'];
  // Coverage map for specs
  const specCoverage = new Map();
  for (const p of products) for (const s of p.specs || []) specCoverage.set(s.key, (specCoverage.get(s.key) || 0) + 1);
  const useOrder = order
    .filter(k => !SKIP.has(k))
    .filter(k => (specCoverage.get(k) || 0) >= 2)  // at least 2 products share it
    .sort((a, b) => {
      const ia = SPEC_PRIORITY.indexOf(a), ib = SPEC_PRIORITY.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return (specCoverage.get(b) - specCoverage.get(a));
    })
    .slice(0, 10);
  if (useOrder.length === 0) return '';

  const rows = useOrder.map(key => {
    const cells = products.map(p => {
      const s = (p.specs || []).find(x => x.key === key);
      return `<td>${s ? esc(s.value) : '\u2014'}</td>`;
    }).join('');
    return `<tr><td>${esc(key)}</td>${cells}</tr>`;
  }).join('');

  const head = `<thead><tr><th>Specification</th>${products.map(p => `<th${p.rank === 1 ? ' class="hl"' : ''}>${esc(p.name)}</th>`).join('')}</tr></thead>`;

  return `
<!-- ============ SPECS TABLE ============ -->
<section class="specs-section" id="specs">
  <div class="pm-header">
    <h2>Tech <em>specs.</em></h2>
    <p>Hardware and feature details, side-by-side.</p>
  </div>
  <div class="pm-table-wrap">
    <table class="pm-table specs">${head}<tbody>${rows}</tbody></table>
  </div>
</section>`;
}

function personasHtml(personas) {
  if (!personas || personas.length === 0) return '';
  const cards = personas.map(pp => `
    <article class="persona-card">
      <span class="persona-title">${esc(pp.title)}</span>
      <span class="persona-pick">Recommended: <strong>${esc(pp.product.name)}</strong></span>
      <p class="persona-why">${esc(pp.why)}</p>
      <a href="${escAttr(pp.product.reviewLink || '#')}" class="persona-cta">Read review
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </a>
    </article>`).join('');

  return `
<!-- ============ RECOMMENDATIONS BY USE CASE ============ -->
<section class="personas" id="recommendations">
  <div class="pm-header">
    <h2>Which one is right for <em>you?</em></h2>
    <p>Our recommendation depends on what you need most.</p>
  </div>
  <div class="persona-grid">${cards}
  </div>
</section>`;
}

function trustBadgesHtml(badges) {
  if (!badges || badges.length === 0) return '';
  return `<div class="trust-badges">${badges.map(b =>
    `<span class="trust-badge tb-${b.kind}">${esc(b.label)}</span>`
  ).join('')}</div>`;
}

// ----------------------------------------------------------------------------
// Inject new sections + new CSS into an existing page
// ----------------------------------------------------------------------------

const NEW_CSS = `
/* ===== CATEGORY WINNERS ===== */
.category-winners { max-width: 1280px; margin: 0 auto; padding: 8px 32px 40px; }
.cw-header { margin-bottom: 24px; }
.cw-header h2 { font-family: 'DM Sans', sans-serif; font-size: clamp(28px, 3.4vw, 38px); font-weight: 700; letter-spacing: -0.035em; line-height: 1.1; color: var(--slate-900); }
.cw-header h2 em { font-style: italic; font-weight: 500; background: var(--gradient-blue); -webkit-background-clip: text; background-clip: text; color: transparent; }
.cw-header p { color: var(--slate-600); font-size: 15px; margin-top: 6px; }
.cw-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.cw-card { display: flex; flex-direction: column; gap: 6px; padding: 18px 20px; background: white; border: 1px solid var(--slate-200); border-radius: 16px; transition: all 200ms; }
.cw-card:hover { border-color: var(--blue-300); transform: translateY(-2px); box-shadow: 0 14px 32px -16px rgba(37,99,235,.18); }
.cw-title { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--blue-700); }
.cw-product { font-family: 'DM Sans', sans-serif; font-size: 17px; font-weight: 700; color: var(--slate-900); letter-spacing: -.025em; line-height: 1.25; }
.cw-metric { font-size: 12px; color: var(--slate-600); }

/* ===== TRUST BADGES (on product cards) ===== */
.trust-badges { display: flex; gap: 6px; flex-wrap: wrap; margin: -4px 0 16px; }
.trust-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; border-radius: 9999px; }
.trust-badge.tb-medical { background: var(--success-100); color: var(--success-600); }
.trust-badge.tb-tech { background: var(--blue-50); color: var(--blue-700); }
.trust-badge.tb-value { background: #FEF3C7; color: #92400E; }

/* ===== PERFORMANCE / SPECS TABLE ===== */
.perf-matrix, .specs-section { max-width: 1280px; margin: 24px auto 0; padding: 24px 32px; }
.pm-header { margin-bottom: 20px; }
.pm-header h2 { font-family: 'DM Sans', sans-serif; font-size: clamp(28px, 3.4vw, 38px); font-weight: 700; letter-spacing: -.035em; line-height: 1.1; }
.pm-header h2 em { font-style: italic; font-weight: 500; background: var(--gradient-blue); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pm-header p { color: var(--slate-600); font-size: 14px; margin-top: 6px; }
.pm-table-wrap { overflow-x: auto; border: 1px solid var(--slate-200); border-radius: 18px; background: white; }
.pm-table { width: 100%; border-collapse: collapse; min-width: 720px; }
.pm-table thead th { padding: 16px 14px; text-align: left; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: .04em; color: var(--slate-900); background: var(--blue-50); border-bottom: 1px solid var(--slate-200); }
.pm-table thead th:first-child { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--slate-600); }
.pm-table thead th.hl { background: var(--gradient-blue); color: white; }
.pm-table tbody td { padding: 14px; border-bottom: 1px solid var(--slate-100); font-size: 13.5px; color: var(--slate-900); vertical-align: middle; }
.pm-table tbody td:first-child { font-family: 'DM Sans', sans-serif; font-weight: 600; color: var(--slate-600); font-size: 12px; letter-spacing: .02em; width: 180px; }
.pm-table tbody tr:last-child td { border-bottom: none; }
.pm-table td.best { background: linear-gradient(180deg, rgba(20,184,166,.08), rgba(20,184,166,.02)); }
.pm-table td.hl { background: var(--blue-50); }
.pm-score { font-family: 'DM Sans', sans-serif; font-weight: 700; color: var(--blue-700); }
.pm-score-big { font-size: 18px; }
.pm-out { color: var(--slate-400); font-size: 11px; font-weight: 500; }
.pm-trophy { color: var(--teal-500); font-size: 12px; }
.pm-price { font-family: 'DM Sans', sans-serif; font-weight: 700; color: var(--slate-900); }

/* ===== PERSONAS ===== */
.personas { max-width: 1280px; margin: 24px auto 0; padding: 24px 32px; }
.persona-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.persona-card { padding: 22px 22px 20px; background: white; border: 1px solid var(--slate-200); border-radius: 18px; display: flex; flex-direction: column; gap: 8px; transition: all 200ms; }
.persona-card:hover { border-color: var(--blue-300); transform: translateY(-2px); box-shadow: 0 14px 32px -16px rgba(37,99,235,.18); }
.persona-title { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--blue-700); }
.persona-pick { font-family: 'DM Sans', sans-serif; font-size: 18px; color: var(--slate-900); letter-spacing: -.02em; line-height: 1.25; }
.persona-pick strong { font-weight: 700; }
.persona-why { font-size: 14px; line-height: 1.55; color: var(--slate-600); margin: 4px 0 8px; }
.persona-cta { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; padding: 8px 14px; background: var(--blue-50); color: var(--blue-700); border-radius: 9999px; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 700; transition: all 180ms; }
.persona-cta:hover { background: var(--gradient-blue); color: white; }

@media (max-width: 768px) {
  .category-winners, .perf-matrix, .specs-section, .personas { padding-left: 20px; padding-right: 20px; }
}
`;

function injectIntoExisting(html, products, enriched) {
  const winners = pickWinners(enriched);
  const personas = buildPersonas(enriched);

  const cwHtml = categoryWinnersHtml(winners);
  const pmHtml = perfMatrixHtml(enriched);
  const specsHtml = specsTableHtml(enriched);
  const personasHtmlOut = personasHtml(personas);

  let out = html;

  // 0. Remove all previously injected v3 markers so re-runs are idempotent
  out = out.replace(/\s*<div class="trust-badges">[\s\S]*?<\/div>/g, '');
  out = out.replace(/\s*<!--\s*=+\s*CATEGORY WINNERS\s*=+\s*-->\s*<section class="category-winners"[\s\S]*?<\/section>/g, '');
  out = out.replace(/\s*<!--\s*=+\s*PERFORMANCE MATRIX\s*=+\s*-->\s*<section class="perf-matrix"[\s\S]*?<\/section>/g, '');
  out = out.replace(/\s*<!--\s*=+\s*SPECS TABLE\s*=+\s*-->\s*<section class="specs-section"[\s\S]*?<\/section>/g, '');
  out = out.replace(/\s*<!--\s*=+\s*RECOMMENDATIONS BY USE CASE\s*=+\s*-->\s*<section class="personas"[\s\S]*?<\/section>/g, '');
  // Remove any older v3 CSS block (between markers) so it stays in sync with NEW_CSS
  out = out.replace(/\n?\/\* ===== CATEGORY WINNERS ===== \*\/[\s\S]*?(?=\n<\/style>)/, '');

  // 1. Inject NEW_CSS at end of <style> block (before </style>)
  out = out.replace(/<\/style>/, () => NEW_CSS + '\n</style>');

  // 2. Insert Category Winners right after </section> of winner-hero
  out = out.replace(/(<section class="winner-hero"[\s\S]*?<\/section>)/, (m) => m + '\n' + cwHtml);

  // 3. Update jump nav to include new anchors (only if not already present)
  if (!out.includes('href="#performance"')) {
    out = out.replace(
      /<a href="#comparison">Side-by-side<\/a>\s*<a href="#faq">FAQ<\/a>/,
      `<a href="#winners-grid">Category Winners</a>\n  <a href="#performance">Performance</a>\n  <a href="#recommendations">Recommendations</a>\n  <a href="#faq">FAQ</a>`
    );
  }

  // 4. Insert the new performance matrix + specs table + personas.
  //    Use function-form replace to avoid `$N` substitution issues with prices like `$14`.
  const replacementBlock = pmHtml + '\n' + specsHtml + '\n' + personasHtmlOut;
  if (out.includes('class="comparison-section"')) {
    out = out.replace(
      /<!--\s*=+\s*COMPARISON TABLE\s*=+\s*-->\s*<section class="comparison-section"[\s\S]*?<\/section>/,
      () => replacementBlock.trim()
    );
  } else if (out.includes('class="faq"')) {
    // Insert new sections immediately BEFORE the FAQ section
    out = out.replace(
      /(<!--\s*=+\s*FAQ\s*=+\s*-->\s*<section class="faq")/,
      (match) => replacementBlock + '\n\n' + match
    );
    // Fallback if FAQ has no preceding comment marker
    if (!out.includes('id="performance"')) {
      out = out.replace(
        /(<section class="faq")/,
        (match) => replacementBlock + '\n\n' + match
      );
    }
  } else {
    out = out.replace(
      /(<section class="bottom-cta")/,
      (match) => replacementBlock + '\n\n' + match
    );
  }

  // 5. Inject trust badges into each product card (after product-brand)
  for (const p of enriched) {
    const badges = inferTrustBadges(p);
    if (!badges.length) continue;
    const badgeHtml = trustBadgesHtml(badges);
    const escName = p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<h3 class="product-name">${escName}<\\/h3>\\s*<p class="product-brand">[^<]*<\\/p>`);
    out = out.replace(re, (m) => m + '\n      ' + badgeHtml);
  }

  return out;
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

const allFiles = fs.readdirSync(PUBLIC_DIR)
  .filter(f => f.startsWith('healthrankings-') && f.endsWith('-top5.html'));

let files = allFiles;
if (ONLY) {
  files = allFiles.filter(f => f.includes(ONLY));
}

console.log(`Found ${files.length} top5 files (of ${allFiles.length}) to process${DRY ? ' (dry run)' : ''}`);

let updated = 0;
let skipped = 0;
const errors = [];

for (const f of files) {
  const fp = path.join(PUBLIC_DIR, f);
  try {
    const html = fs.readFileSync(fp, 'utf8');
    const products = parseProductCards(html);
    if (products.length < 2) {
      console.log(`  SKIP (too few cards): ${f}`);
      skipped++;
      continue;
    }
    const enriched = products.map(enrichProduct);
    const out = injectIntoExisting(html, products, enriched);

    if (out === html) {
      console.log(`  NOCHANGE: ${f}`);
      skipped++;
      continue;
    }

    if (!DRY) fs.writeFileSync(fp, out, 'utf8');
    const enrichedCount = enriched.filter(p => p._enriched).length;
    console.log(`  ${DRY ? 'WOULD-UPDATE' : 'UPDATED'}: ${f}  (${products.length} cards, ${enrichedCount} enriched)`);
    updated++;
  } catch (e) {
    errors.push({ f, err: e.message });
    console.log(`  ERROR: ${f}: ${e.message}`);
  }
}

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors.length}`);
if (errors.length) {
  for (const e of errors) console.log(`  - ${e.f}: ${e.err}`);
  process.exit(1);
}
