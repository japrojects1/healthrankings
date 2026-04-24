const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..');
const files = fs.readdirSync(DIR)
  .filter(f => f.startsWith('healthrankings-review-') && f.endsWith('.html'))
  .sort();

function he(s) {
  return s.replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&').replace(/&rsaquo;/g, '›').replace(/&larr;/g, '←')
    .replace(/&rarr;/g, '→').replace(/&middot;/g, '·').replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019').replace(/&ldquo;/g, '\u201C').replace(/&rdquo;/g, '\u201D')
    .replace(/&#10003;/g, '✓').replace(/&#10007;/g, '✗').replace(/&#127942;/g, '🏆')
    .replace(/&#128077;/g, '👍').replace(/&#128078;/g, '👎')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '');
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').trim();
}

function extractLong(html, filename) {
  const d = { type: 'long', filename };

  const titleM = html.match(/<title>(.*?)<\/title>/);
  d.pageTitle = titleM ? he(titleM[1]) : '';

  const metaM = html.match(/<meta name="description" content="(.*?)"/);
  d.metaDesc = metaM ? he(metaM[1]) : '';

  const ldM = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldM) {
    try { d.jsonLd = JSON.parse(ldM[1]); } catch (e) { d.jsonLd = null; }
  }

  const bcM = html.match(/<div class="breadcrumb">([\s\S]*?)<\/div>/);
  d.breadcrumbs = [];
  d.breadcrumbProduct = '';
  if (bcM) {
    d.breadcrumbs = [...bcM[1].matchAll(/<a href="([^"]*)">(.*?)<\/a>/g)]
      .map(m => ({ href: m[1], text: he(m[2]) }));
    const last = bcM[1].split(/(?:›|&rsaquo;)<\/span>/).pop();
    d.breadcrumbProduct = last ? stripTags(last).trim() : '';
  }

  const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (h1M) {
    const emM = h1M[1].match(/<em>(.*?)<\/em>/);
    d.tagline = emM ? he(emM[1]) : '';
    d.name = he(h1M[1].replace(/<em>[\s\S]*?<\/em>/, '').replace(/:\s*$/, '').replace(/ Review\s*$/, '').trim());
  } else {
    d.name = ''; d.tagline = '';
  }

  const hmScore = html.match(/class="hm-tag hm-score">([\s\S]*?)<\/span>/);
  if (hmScore) {
    const t = he(hmScore[1]);
    const rankM = t.match(/#(\d+)/);
    const scoreM = t.match(/([\d.]+)\/10/);
    d.rank = rankM ? rankM[1] : '';
    d.score = scoreM ? scoreM[1] : '';
  } else { d.rank = ''; d.score = ''; }

  const hmPrice = html.match(/class="hm-tag hm-price">([\s\S]*?)<\/span>/);
  d.price = hmPrice ? he(hmPrice[1]).replace('$', '').trim() : '';

  const hmTested = html.match(/class="hm-tag hm-tested">([\s\S]*?)<\/span>/);
  d.tested = hmTested ? he(hmTested[1]) : '';

  d.heroStats = [];
  const statsBlock = html.match(/<div class="hero-stats-row">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
  if (statsBlock) {
    d.heroStats = [...statsBlock[1].matchAll(/<div class="hs-num"[^>]*>(.*?)<\/div>\s*<div class="hs-label">(.*?)<\/div>/g)]
      .map(m => ({ value: he(stripTags(m[1])), label: he(m[2]) }));
  }

  const vbM = html.match(/<div class="verdict-box">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
  if (vbM) {
    const vtM = vbM[1].match(/<div class="vb-title">([\s\S]*?)<\/div>/);
    const vsM = vbM[1].match(/<div class="vb-sub">([\s\S]*?)<\/div>/);
    d.verdictTitle = vtM ? he(vtM[1]).trim() : '';
    d.verdictSummary = vsM ? he(vsM[1]).trim() : '';
  } else { d.verdictTitle = ''; d.verdictSummary = ''; }

  const assessBlock = html.match(/id="assessment">([\s\S]*?)(?=<div class="r-section"|<\/div>\s*<div class="r-main"|$)/);
  d.assessmentTitle = '';
  d.assessmentParagraphs = [];
  if (assessBlock) {
    const ah = assessBlock[1].match(/<h2>([\s\S]*?)<\/h2>/);
    d.assessmentTitle = ah ? he(stripTags(ah[1])) : '';
    d.assessmentParagraphs = [...assessBlock[1].matchAll(/<p>([\s\S]*?)<\/p>/g)]
      .map(m => he(m[1]).trim());
  }

  d.performanceScores = [];
  const perfCards = [...html.matchAll(/<div class="perf-card">\s*<div class="perf-card-label">(.*?)<\/div>\s*<div class="perf-bar-track"><div class="perf-bar-fill"[^>]*style="width:(\d+)%[^"]*"[^>]*><\/div><\/div>\s*<div class="perf-card-score"[^>]*>([\d.]+)/g)];
  d.performanceScores = perfCards.map(m => ({ label: he(m[1]), width: parseInt(m[2]), score: m[3] }));

  d.pros = [];
  const prosBox = html.match(/<div class="pc-box pc-pros">([\s\S]*?)<\/div>/);
  if (prosBox) d.pros = [...prosBox[1].matchAll(/<li>(.*?)<\/li>/g)].map(m => he(m[1]));

  d.cons = [];
  const consBox = html.match(/<div class="pc-box pc-cons">([\s\S]*?)<\/div>/);
  if (consBox) d.cons = [...consBox[1].matchAll(/<li>(.*?)<\/li>/g)].map(m => he(m[1]));

  d.whoFor = [];
  d.whoNot = [];
  const whoSection = html.match(/id="who">([\s\S]*?)(?=<div class="r-section"|$)/);
  if (whoSection) {
    const boxes = [...whoSection[1].matchAll(/<div class="who-box">\s*<h3>([\s\S]*?)<\/h3>\s*<ul>([\s\S]*?)<\/ul>/g)];
    for (const box of boxes) {
      const heading = box[1];
      const items = [...box[2].matchAll(/<li>(.*?)<\/li>/g)].map(m => he(m[1]));
      if (heading.includes('Recommended') || heading.includes('128077')) {
        d.whoFor = items;
      } else {
        d.whoNot = items;
      }
    }
  }

  d.specs = [];
  const specsTable = html.match(/<table class="specs-table">([\s\S]*?)<\/table>/);
  if (specsTable) {
    d.specs = [...specsTable[1].matchAll(/<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/g)]
      .map(m => ({ key: he(stripTags(m[1])), value: he(stripTags(m[2])) }));
  }

  d.comparison = null;
  const compTable = html.match(/<table class="compare-table">([\s\S]*?)<\/table>/);
  if (compTable) {
    const headers = [...compTable[1].matchAll(/<th>(.*?)<\/th>/g)].map(m => he(m[1]));
    const rows = [...compTable[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
      .filter(m => m[1].includes('<td>'))
      .map(m => {
        const cells = [...m[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(c => he(stripTags(c[1])));
        const isCurrent = m[0].includes('current-row');
        return { cells, isCurrent };
      });
    d.comparison = { headers, rows };
  }

  const compLinks = html.match(/id="compare">([\s\S]*?)(?=<div class="r-section"|$)/);
  d.comparisonLinks = [];
  if (compLinks) {
    d.comparisonLinks = [...compLinks[1].matchAll(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)]
      .filter(m => m[1].includes('review'))
      .map(m => ({ href: m[1], text: he(stripTags(m[2])) }));
  }

  d.faq = [];
  const faqItems = [...html.matchAll(/<div class="faq-q">([\s\S]*?)<\/div>\s*<div class="faq-a">([\s\S]*?)<\/div>/g)];
  d.faq = faqItems.map(m => ({ q: he(stripTags(m[1])), a: he(m[2]).trim() }));

  d.finalScore = '';
  d.finalLabel = '';
  d.finalText = '';
  const fbM = html.match(/<div class="final-box">([\s\S]*?)<\/div>\s*<\/div>/);
  if (fbM) {
    const fsM = fbM[1].match(/<div class="fb-score"[^>]*>([\s\S]*?)<\/div>/);
    const flM = fbM[1].match(/<div class="fb-label">([\s\S]*?)<\/div>/);
    const ftM = fbM[1].match(/<p class="fb-text">([\s\S]*?)<\/p>/);
    d.finalScore = fsM ? he(stripTags(fsM[1])) : '';
    d.finalLabel = flM ? he(flM[1]) : '';
    d.finalText = ftM ? he(ftM[1]).trim() : '';
  }

  const btnM = html.match(/<a href="([^"]*)" class="fb-btn">([\s\S]*?)<\/a>/);
  d.buyLink = btnM ? btnM[1] : '#';

  d.backLinks = [];
  const bnM = html.match(/<div class="back-nav">([\s\S]*?)<\/div>/);
  if (bnM) {
    d.backLinks = [...bnM[1].matchAll(/<a href="([^"]*)">([\s\S]*?)<\/a>/g)]
      .map(m => ({ href: m[1], text: he(stripTags(m[2])) }));
  }

  return d;
}

function extractShort(html, filename) {
  const d = { type: 'short', filename };

  const titleM = html.match(/<title>(.*?)<\/title>/);
  d.pageTitle = titleM ? he(titleM[1]) : '';

  const metaM = html.match(/<meta name="description" content="(.*?)"/);
  d.metaDesc = metaM ? he(metaM[1]) : '';

  d.breadcrumbs = [];
  d.breadcrumbProduct = '';
  const bcM = html.match(/<div class="breadcrumb">([\s\S]*?)<\/div>/);
  if (bcM) {
    d.breadcrumbs = [...bcM[1].matchAll(/<a href="([^"]*)">(.*?)<\/a>/g)]
      .map(m => ({ href: m[1], text: he(m[2]) }));
    const last = bcM[1].split(/(?:›|&rsaquo;)<\/span>/).pop();
    d.breadcrumbProduct = last ? stripTags(last).trim() : '';
  }

  const ctM = html.match(/<div class="condition-tag">([\s\S]*?)<\/div>/);
  if (ctM) {
    const t = he(ctM[1]);
    const rankM = t.match(/#(\d+)/);
    const scoreM = t.match(/([\d.]+)\/10/);
    d.rank = rankM ? rankM[1] : '';
    d.score = scoreM ? scoreM[1] : '';
  } else { d.rank = ''; d.score = ''; }

  const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  d.name = h1M ? he(stripTags(h1M[1])) : '';

  const subM = html.match(/<p class="hero-subtitle"[^>]*>([\s\S]*?)<\/p>/);
  d.tagline = subM ? he(subM[1]).trim() : '';

  const descM = html.match(/<p class="product-desc">([\s\S]*?)<\/p>/);
  d.description = descM ? he(descM[1]).trim() : '';

  d.ratingBars = [];
  const bars = [...html.matchAll(/<span class="rating-bar-label">(.*?)<\/span>[\s\S]*?style="width:(\d+)%"[\s\S]*?<span class="rating-num">([\d.]+)<\/span>/g)];
  d.ratingBars = bars.map(m => ({ label: he(m[1]), width: parseInt(m[2]), score: m[3] }));

  d.pros = [];
  const prosM = html.match(/<div class="pros">([\s\S]*?)<\/div>/);
  if (prosM) d.pros = [...prosM[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => he(m[1]).trim());

  d.cons = [];
  const consM = html.match(/<div class="cons">([\s\S]*?)<\/div>/);
  if (consM) d.cons = [...consM[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => he(m[1]).trim());

  const snM = html.match(/<div class="score-num">([\d.]+)<\/div>/);
  if (snM) d.score = snM[1];

  const ptM = html.match(/<div class="price-tag">([\s\S]*?)<\/div>/);
  d.price = ptM ? he(ptM[1]).replace('$', '').trim() : '';

  d.footerSpecs = [];
  const pfM = html.match(/<div class="product-footer">([\s\S]*?)<\/div>/);
  if (pfM) {
    d.footerSpecs = [...pfM[1].matchAll(/<span>\s*<strong>(.*?):<\/strong>\s*([\s\S]*?)<\/span>/g)]
      .map(m => ({ key: he(m[1]).trim(), value: he(m[2]).trim() }));
  }

  d.backLinks = [];
  const blM = [...html.matchAll(/<a href="([^"]*)" class="back-link">([\s\S]*?)<\/a>/g)];
  d.backLinks = blM.map(m => ({ href: m[1], text: he(stripTags(m[2])) }));

  const isWinner = html.includes('class="product-card winner"') || html.includes('winner-ribbon') || html.includes('rank-1');
  d.isWinner = isWinner;

  const buyM = html.match(/<a href="([^"]*)" class="buy-btn[^"]*">/);
  d.buyLink = buyM ? buyM[1] : '#';

  return d;
}

const results = [];
let longCount = 0, shortCount = 0;
const issues = [];

for (const file of files) {
  const html = fs.readFileSync(path.join(DIR, file), 'utf-8');
  const isLong = html.includes('class="r-hero"');

  try {
    const data = isLong ? extractLong(html, file) : extractShort(html, file);
    results.push(data);
    if (isLong) longCount++; else shortCount++;

    if (!data.name) issues.push(`${file}: no name extracted`);
    if (!data.score) issues.push(`${file}: no score extracted`);
    if (!data.price) issues.push(`${file}: no price extracted`);
    if (data.pros.length === 0) issues.push(`${file}: no pros extracted`);
  } catch (e) {
    issues.push(`${file}: ERROR ${e.message}`);
  }
}

fs.writeFileSync(path.join(__dirname, 'review-data.json'), JSON.stringify(results, null, 2));

console.log(`Extracted ${results.length} review pages`);
console.log(`  Long-form: ${longCount}`);
console.log(`  Short-form: ${shortCount}`);
if (issues.length) {
  console.log(`\nIssues (${issues.length}):`);
  issues.forEach(i => console.log(`  - ${i}`));
}

const sampleLong = results.find(r => r.type === 'long' && r.name);
const sampleShort = results.find(r => r.type === 'short' && r.name);
console.log(`\nSample long: ${sampleLong?.name} (score: ${sampleLong?.score}, price: $${sampleLong?.price})`);
console.log(`Sample short: ${sampleShort?.name} (score: ${sampleShort?.score}, price: $${sampleShort?.price})`);
