const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const refFile = path.join(dir, 'healthrankings-hypertension.html');
const refHtml = fs.readFileSync(refFile, 'utf8');

const CSS = refHtml.match(/<style>([\s\S]*?)<\/style>/)[1];

const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('-top5.html') && f.startsWith('healthrankings-'))
  .filter(f => f !== 'healthrankings-hypertension-top5.html');

console.log(`Found ${files.length} top5 files to rebuild`);

function extractText(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function extractAll(html, re) {
  const results = [];
  let m;
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = r.exec(html)) !== null) results.push(m[1].trim());
  return results;
}

function htmlDecode(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function parseProducts(html) {
  const products = [];
  for (let i = 1; i <= 5; i++) {
    const startMarker = `id="review-${i}"`;
    const startIdx = html.indexOf(startMarker);
    if (startIdx === -1) continue;

    const nextMarker = i < 5 ? `id="review-${i + 1}"` : 'class="section"';
    let endIdx = html.indexOf(nextMarker, startIdx);
    if (endIdx === -1) endIdx = html.indexOf('<hr class="section-divider">', startIdx);
    if (endIdx === -1) endIdx = html.indexOf('</div>\n\n<footer', startIdx);
    if (endIdx === -1) endIdx = html.length;

    const block = html.substring(startIdx, endIdx);

    const name = extractText(block, /class="product-name">([^<]+)</);
    const tagline = extractText(block, /class="product-tagline">([^<]+)</);
    const desc = extractText(block, /class="product-desc">([^<]+(?:<[^>]*>[^<]*)*?)<\/p>/s);
    const score = extractText(block, /class="score-num">([^<]+)</);
    const price = extractText(block, /class="price-tag">([^<]+)</);
    const buyText = extractText(block, /class="buy-btn[^"]*">([^<]+)</);

    const ratingLabels = extractAll(block, /class="rating-bar-label">([^<]+)</g);
    const ratingValues = extractAll(block, /class="rating-num">([^<]+)</g);
    const ratingWidths = extractAll(block, /class="rating-bar-fill[^"]*"\s*style="width:(\d+)%"/g);

    const prosMatch = block.match(/<div class="pros">[\s\S]*?<ul>([\s\S]*?)<\/ul>/);
    const consMatch = block.match(/<div class="cons">[\s\S]*?<ul>([\s\S]*?)<\/ul>/);
    const pros = prosMatch ? extractAll(prosMatch[1], /<li>([^<]+(?:<[^>]*>[^<]*)*?)<\/li>/g) : [];
    const cons = consMatch ? extractAll(consMatch[1], /<li>([^<]+(?:<[^>]*>[^<]*)*?)<\/li>/g) : [];

    const footerMatch = block.match(/class="product-footer">([\s\S]*?)<\/div>/);
    const footerSpecs = footerMatch ? extractAll(footerMatch[1], /<span>([\s\S]*?)<\/span>/g) : [];

    products.push({
      rank: i, name, tagline, desc, score: parseFloat(score) || 0,
      price, buyText: buyText || 'Buy Now',
      ratingLabels, ratingValues, ratingWidths,
      pros, cons, footerSpecs
    });
  }
  return products;
}

function parseComparison(html) {
  const match = html.match(/<table class="comparison-table">([\s\S]*?)<\/table>/);
  if (!match) return null;
  return match[1];
}

function parseReviewMeta(html) {
  const items = [];
  const re = /class="review-meta-item"><strong>([^<]+)<\/strong>([^<]+)<\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    items.push({ value: m[1].trim(), label: m[2].trim() });
  }
  return items;
}

function parseTop5Intro(html) {
  const m = html.match(/class="top5-intro">[\s\S]*?<p>([\s\S]*?)<\/p>/);
  return m ? m[1].trim() : '';
}

function starRating(score) {
  const full = Math.round(score);
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= full) stars += '★';
    else stars += '<span style="color:#E2E8F0">★</span>';
  }
  return stars;
}

function getRankLabel(product, idx) {
  if (idx === 0) return 'Best Overall';
  const tl = product.tagline.toLowerCase();
  if (tl.includes('best value') || tl.includes('budget') || tl.includes('affordable')) return 'Best Value';
  if (tl.includes('best app') || tl.includes('smart')) return 'Best App';
  if (tl.includes('senior') || tl.includes('easiest')) return 'Best for Seniors';
  if (tl.includes('portable') || tl.includes('compact') || tl.includes('wireless')) return 'Best Portable';
  if (tl.includes('advanced') || tl.includes('ekg') || tl.includes('ecg')) return 'Most Advanced';
  if (tl.includes('family') || tl.includes('multi')) return 'Best for Family';
  const words = product.tagline.split('—');
  return words.length > 1 ? words[0].replace(/^Best\s*/i, '').trim().substring(0, 30) : `#${idx + 1} Pick`;
}

function getTaglineStyle(product, idx) {
  if (idx === 0) return 'accurate';
  const tl = product.tagline.toLowerCase();
  if (tl.includes('budget') || tl.includes('value') || tl.includes('affordable')) return 'budget';
  return '';
}

function buildPage(title, description, conditionName, conditionLink, products, compTableInner, reviewMeta, top5Intro, categorySlug) {
  const winner = products[0];
  if (!winner) return '';

  const conditionDisplay = conditionName || title.replace(/ \| HealthRankings$/, '');
  const categoryBreadcrumb = conditionDisplay.split(' for ').length > 1 ? conditionDisplay.split(' for ')[1] : conditionDisplay;

  const labels = winner.ratingLabels.length > 0 ? winner.ratingLabels : ['Score 1', 'Score 2', 'Score 3', 'Score 4'];
  const vals = winner.ratingValues.length > 0 ? winner.ratingValues : [winner.score.toFixed(1), (winner.score - 0.2).toFixed(1), (winner.score - 0.3).toFixed(1), (winner.score - 0.1).toFixed(1)];

  const winnerScoreGridHtml = labels.slice(0, 4).map((label, i) => `
          <div>
            <span class="winner-score-label">${label}</span>
            <span class="winner-score-value">${vals[i] || '—'}<span class="out">/10</span></span>
          </div>`).join('');

  const metaHtml = reviewMeta.length > 0 ? reviewMeta.map(m => `
    <div class="intro-meta-divider"></div>
    <div class="intro-meta-fact">
      <span class="intro-meta-fact-label">${m.label}</span>
      <span class="intro-meta-fact-value">${m.value}</span>
    </div>`).join('') : `
    <div class="intro-meta-divider"></div>
    <div class="intro-meta-fact">
      <span class="intro-meta-fact-label">Products tested</span>
      <span class="intro-meta-fact-value">5 top picks</span>
    </div>
    <div class="intro-meta-divider"></div>
    <div class="intro-meta-fact">
      <span class="intro-meta-fact-label">Updated</span>
      <span class="intro-meta-fact-value">April 2026</span>
    </div>`;

  const productCardsHtml = products.map((p, idx) => {
    const isWinner = idx === 0;
    const rankLabel = getRankLabel(p, idx);
    const tagStyle = getTaglineStyle(p, idx);
    const tagUpper = p.tagline.split('—').pop().trim().toUpperCase().substring(0, 40);

    const sidebarLabels = p.ratingLabels.length > 0 ? p.ratingLabels : labels;
    const sidebarVals = p.ratingValues.length > 0 ? p.ratingValues : [];
    const sidebarWidths = p.ratingWidths.length > 0 ? p.ratingWidths : sidebarVals.map(v => Math.round(parseFloat(v) * 10));

    const scoreRows = sidebarLabels.slice(0, 4).map((label, i) => {
      const val = sidebarVals[i] || p.score.toFixed(1);
      const w = sidebarWidths[i] || Math.round(parseFloat(val) * 10);
      return `
              <div class="score-row">
                <span class="score-row-label">${label}</span>
                <div class="score-row-bar"><div class="score-row-fill" style="width:${w}%"></div></div>
                <span class="score-row-value">${val}</span>
              </div>`;
    }).join('');

    const prosHtml = p.pros.map(li => `            <li>${li}</li>`).join('\n');
    const consHtml = p.cons.map(li => `            <li>${li}</li>`).join('\n');

    const priceClean = p.price.replace(/\$/, '').trim();
    const retailer = p.buyText.replace(/^Buy\s*(on|at|from|Now)\s*/i, '').trim() || 'Amazon';

    return `
  <!-- #${p.rank} PRODUCT CARD${isWinner ? ' (winner)' : ''} -->
  <article class="product-card${isWinner ? ' is-winner' : ''}">
    <div class="product-rank">
      <div class="rank-number${isWinner ? ' is-first' : ''}">
        <span class="hash">#</span>${p.rank}
      </div>
      <div class="product-rank-label${isWinner ? ' is-first' : ''}">${rankLabel}</div>
    </div>

    <div class="product-main">
      <span class="product-tagline${tagStyle ? ' ' + tagStyle : ''}">${tagUpper}</span>
      <h3 class="product-name">${p.name}</h3>
      <p class="product-brand">${p.tagline}</p>
      <p class="product-verdict">${p.desc}</p>
      <div class="product-pros-cons">
        <div class="pros-cons-col pros">
          <h4>What we loved</h4>
          <ul>
${prosHtml}
          </ul>
        </div>
        <div class="pros-cons-col cons">
          <h4>What to know</h4>
          <ul>
${consHtml}
          </ul>
        </div>
      </div>
    </div>

    <div class="product-sidebar">
      <div class="product-score-block">
        <div class="score-headline">
          <div class="score-big">${p.score.toFixed(1)}<span class="out">/10</span></div>
          <div class="score-stars">${starRating(p.score)}</div>
        </div>
        <div class="score-breakdown">${scoreRows}
        </div>
      </div>

      <div class="product-price-cta">
        <span class="price-label">Price</span>
        <div class="product-price">
          <span class="price-amount">$${priceClean}</span>
          <span class="price-unit">at ${retailer}</span>
        </div>
        <a href="#" class="product-cta">
          See on ${retailer}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
        <a href="#" class="product-cta-secondary">Read full review</a>
      </div>
    </div>
  </article>
`;
  }).join('');

  let compSection = '';
  if (compTableInner) {
    const cleanHeaders = compTableInner.replace(/<thead>([\s\S]*?)<\/thead>/, (match, inner) => {
      return `<thead>${inner.replace(/<th>/g, '<th>').replace(/<\/th>/g, '</th>')}</thead>`;
    });

    compSection = `
<!-- ============ COMPARISON TABLE ============ -->
<section class="comparison-section" id="comparison">
  <div class="comparison-header">
    <h2>Side-by-side, <em>everything.</em></h2>
    <p>Everything we measured, in one place.</p>
  </div>
  <div class="comparison-table-wrap">
    <table class="comparison-table">${cleanHeaders}</table>
  </div>
</section>
`;
  }

  const shortTitle = title.replace(/ \| HealthRankings$/, '').replace(/— Expert Top 5$/i, '').trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${CSS}
</style>
</head>
<body>

<!-- ============ HEADER ============ -->
<header class="header">
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
      <a href="#">Drugs A–Z</a>
      <a href="#">Health News</a>
      <a href="#">About</a>
    </nav>
    <button class="cta-btn">Get started</button>
  </div>
</header>

<!-- ============ BREADCRUMB ============ -->
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="breadcrumb-sep">/</span>
  <a href="/healthrankings-conditions.html">Conditions</a>
  <span class="breadcrumb-sep">/</span>
  <span class="breadcrumb-current">${categoryBreadcrumb}</span>
</nav>

<!-- ============ PAGE INTRO ============ -->
<section class="page-intro">
  <div class="intro-eyebrow">
    <div class="intro-pulse"></div>
    Updated April 2026
  </div>
  <h1>The 5 best products for <em>${categoryBreadcrumb.toLowerCase()}.</em></h1>
  <p class="intro-lede">${top5Intro || description}</p>

  <div class="intro-meta">
    <div class="intro-author">
      <div class="intro-author-avatar">HR</div>
      <div class="intro-author-info">
        <strong>HealthRankings Team</strong>
        <span>Expert-reviewed &amp; independently tested</span>
      </div>
    </div>${metaHtml}
  </div>
</section>

<!-- ============ JUMP NAV ============ -->
<nav class="jump-nav" aria-label="Jump to section">
  <span class="jump-nav-label">Jump to</span>
  <a href="#winner" class="primary">The Winner</a>
  <a href="#rankings">All 5 Picks</a>
  <a href="#comparison">Side-by-side</a>
  <a href="#faq">FAQ</a>
</nav>

<!-- ============ WINNER HERO ============ -->
<section class="winner-hero" id="winner">
  <div class="winner-hero-inner">
    <div class="winner-hero-left">
      <div class="winner-hero-eyebrow">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>
        OUR #1 PICK
      </div>
      <h2>The ${categoryBreadcrumb.toLowerCase()} product we'd <em>actually recommend.</em></h2>
      <p class="winner-hero-desc">
        ${winner.desc.substring(0, 200).replace(/<[^>]*>/g, '')}${winner.desc.length > 200 ? '…' : ''}
      </p>
      <div class="winner-hero-stats">
        <div>
          <span class="winner-stat-num">${winner.score.toFixed(1)}<span class="unit">/10</span></span>
          <span class="winner-stat-label">Overall score</span>
        </div>
        <div>
          <span class="winner-stat-num">${winner.price}</span>
          <span class="winner-stat-label">Starting price</span>
        </div>
      </div>
    </div>

    <div class="winner-card-wrap">
      <div class="winner-card">
        <div class="winner-badge">
          <div class="winner-badge-heart">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor"><path d="M 6 0 L 7 4.5 L 12 6 L 7 7.5 L 6 12 L 5 7.5 L 0 6 L 5 4.5 Z"/></svg>
          </div>
          <span>TOP PICK</span>
          <span>2026</span>
        </div>

        <div class="winner-rank">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>
          #1 PICK
        </div>

        <h3 class="winner-product">${winner.name}</h3>
        <p class="winner-brand">${winner.tagline}</p>

        <div class="winner-score-grid">${winnerScoreGridHtml}
        </div>

        <div class="winner-bottom">
          <div class="winner-price">
            <span class="from">Starts at</span>
            ${winner.price}
          </div>
          <a href="#" class="winner-cta">
            See Details
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ ALL 5 RANKINGS ============ -->
<section class="rankings" id="rankings">
  <div class="rankings-header">
    <h2>All 5 <em>ranked.</em></h2>
    <div class="rankings-sort">
      <span class="sort-label">Sort by</span>
      <button class="sort-btn active">Our ranking</button>
      <button class="sort-btn">Price (low to high)</button>
    </div>
  </div>
${productCardsHtml}
</section>

${compSection}

<!-- ============ BOTTOM NEWSLETTER CTA ============ -->
<section class="bottom-cta">
  <div class="bottom-cta-inner">
    <h2>One review a week. <em>That's it.</em></h2>
    <p>Every Tuesday we send you the single most useful review we published that week. No spam, no affiliate pitches, no clickbait — just the work.</p>
    <form class="bottom-cta-form" onsubmit="event.preventDefault(); alert('Thanks — this is a mockup!');">
      <input type="email" placeholder="your@email.com" required>
      <button type="submit">Subscribe</button>
    </form>
  </div>
</section>

<!-- ============ RELATED CONDITIONS ============ -->
<section class="related">
  <h2>Related conditions</h2>
  <div class="related-grid">
    <a href="/healthrankings-hypertension.html" class="related-card">
      <div class="related-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>
      </div>
      <div class="related-name">Heart &amp; Blood Pressure</div>
      <div class="related-meta">14 products ranked</div>
    </a>
    <a href="/healthrankings-diabetes-ketone-monitors.html" class="related-card">
      <div class="related-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      </div>
      <div class="related-name">Diabetes &amp; Glucose</div>
      <div class="related-meta">18 products ranked</div>
    </a>
    <a href="/healthrankings-cholesterol.html" class="related-card">
      <div class="related-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/></svg>
      </div>
      <div class="related-name">Cholesterol Tests</div>
      <div class="related-meta">8 products ranked</div>
    </a>
    <a href="/healthrankings-sleep-apnea.html" class="related-card">
      <div class="related-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </div>
      <div class="related-name">Sleep &amp; Recovery</div>
      <div class="related-meta">13 products ranked</div>
    </a>
  </div>
</section>

<!-- ============ FOOTER ============ -->
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-disclosure">
      <strong>How we fund our work.</strong> HealthRankings earns a small commission when you buy through the links on this page — but our rankings can't be influenced by advertisers. We buy every product we test at retail, and our medical reviewers have no financial relationship with any brand we cover. <a href="#" style="color: var(--teal-500); text-decoration: underline;">Read our full methodology →</a>
    </div>

    <div class="footer-bottom">
      <div>© 2026 HealthRankings. Made with care in Miami.</div>
      <div class="footer-bottom-links">
        <a href="/healthrankings-privacy-policy.html">Privacy</a>
        <a href="/healthrankings-terms-of-service.html">Terms</a>
        <a href="#">Editorial Policy</a>
        <a href="#">Contact</a>
      </div>
    </div>
  </div>
</footer>

</body>
</html>`;
}

let updated = 0;
let errors = 0;

files.forEach(filename => {
  const filepath = path.join(dir, filename);
  const html = fs.readFileSync(filepath, 'utf8');

  const title = extractText(html, /<title>([^<]+)<\/title>/);
  const description = extractText(html, /<meta name="description" content="([^"]+)"/);

  const condLinkMatch = html.match(/href="\/?(healthrankings-[^"]+\.html)"[^>]*style="[^"]*"[^>]*>← Back to/);
  const condLink = condLinkMatch ? condLinkMatch[1] : '';
  const condNameMatch = html.match(/← Back to ([^<]+) Guide/);
  const condName = condNameMatch ? condNameMatch[1].trim() : '';

  const products = parseProducts(html);
  if (products.length < 5) {
    console.log(`  WARN: ${filename} only has ${products.length} products`);
  }
  if (products.length === 0) {
    console.log(`  SKIP (no products): ${filename}`);
    errors++;
    return;
  }

  const compInner = parseComparison(html);
  const reviewMeta = parseReviewMeta(html);
  const top5Intro = parseTop5Intro(html);

  const categorySlug = filename.replace('healthrankings-', '').replace('-top5.html', '');

  const newHtml = buildPage(title, description, condName, condLink, products, compInner, reviewMeta, top5Intro, categorySlug);
  fs.writeFileSync(filepath, newHtml, 'utf8');
  console.log(`  REBUILT: ${filename} (${products.length} products)`);
  updated++;
});

console.log(`\nDone. Rebuilt: ${updated}, Errors: ${errors}`);
