const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const refFile = path.join(dir, 'healthrankings-hypertension.html');
const refHtml = fs.readFileSync(refFile, 'utf8');
const CSS = refHtml.match(/<style>([\s\S]*?)<\/style>/)[1];

const CONDITION_CSS = `
/* ===== CONDITION CONTENT SECTIONS ===== */
.section { margin-bottom: 3.5rem; max-width: 860px; margin-left: auto; margin-right: auto; padding: 0 24px; }
.section-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.12em; color: var(--teal-600); margin-bottom: 8px;
}
.section h2 {
  font-family: 'DM Sans', sans-serif; font-size: 28px; font-weight: 700;
  color: var(--slate-900); margin-bottom: 16px; line-height: 1.2; letter-spacing: -0.03em;
}
.section p { color: var(--slate-600); margin-bottom: 14px; font-size: 15px; line-height: 1.65; }
.section h4 { margin-bottom: 4px; }

/* Callouts */
.callout {
  background: var(--blue-50); border-left: 4px solid var(--blue-600);
  padding: 18px 20px; border-radius: 0 12px 12px 0; margin: 20px 0;
}
.callout p { margin: 0; color: var(--blue-800); font-size: 14px; }
.callout strong { color: var(--blue-700); }
.callout-blue {
  background: var(--blue-50); border-left: 4px solid var(--blue-600);
  padding: 18px 20px; border-radius: 0 12px 12px 0; margin: 20px 0;
}
.callout-blue p { margin: 0; color: var(--blue-800); font-size: 14px; }
.callout-green {
  background: var(--success-100); border-left: 4px solid var(--success-600);
  padding: 18px 20px; border-radius: 0 12px 12px 0; margin: 20px 0;
}
.callout-green p { margin: 0; color: #064E3B; font-size: 14px; }

/* Symptoms grid */
.symptoms-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 12px; margin-top: 20px; }
.symptom-card {
  background: white; border: 1px solid var(--slate-200); border-radius: 14px;
  padding: 18px; display: flex; align-items: flex-start; gap: 14px; transition: all 200ms;
}
.symptom-card:hover { border-color: var(--blue-300); box-shadow: 0 8px 24px -8px rgba(37,99,235,0.1); }
.symptom-icon {
  width: 36px; height: 36px; background: var(--blue-50); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.1rem;
}
.symptom-card h4 { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; color: var(--slate-900); margin-bottom: 2px; }
.symptom-card p { font-size: 13px; color: var(--slate-500); margin: 0; }

/* Causes list */
.causes-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
.cause-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  background: white; border-radius: 12px; border: 1px solid var(--slate-200);
}
.cause-dot { width: 8px; height: 8px; background: var(--blue-600); border-radius: 50%; margin-top: 7px; flex-shrink: 0; }
.cause-item p { font-size: 14px; color: var(--slate-600); margin: 0; }
.cause-item strong { color: var(--slate-900); font-weight: 600; display: block; font-size: 14px; }

/* Lifestyle grid */
.lifestyle-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 12px; margin-top: 16px; }
.lifestyle-card {
  border: 1px solid var(--slate-200); border-radius: 14px; padding: 20px;
  background: white; transition: all 200ms;
}
.lifestyle-card:hover { border-color: var(--blue-300); box-shadow: 0 8px 24px -8px rgba(37,99,235,0.1); }
.lifestyle-card .lc-icon { font-size: 1.5rem; margin-bottom: 12px; }
.lifestyle-card h4 { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; color: var(--slate-900); margin-bottom: 6px; }
.lifestyle-card p { font-size: 13px; color: var(--slate-500); margin: 0; }

/* Med table */
.med-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; border-radius: 12px; overflow: hidden; }
.med-table th {
  text-align: left; padding: 12px 16px; background: var(--blue-600); color: white;
  font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 12px;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.med-table th:first-child { border-radius: 12px 0 0 0; }
.med-table th:last-child { border-radius: 0 12px 0 0; }
.med-table td { padding: 12px 16px; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); vertical-align: top; }
.med-table tr:last-child td { border-bottom: none; }
.med-table tr:nth-child(even) td { background: var(--slate-50); }
.med-name { font-weight: 600; color: var(--blue-700); }

/* Page wrap (legacy) */
.page-wrap { max-width: 860px; margin: 0 auto; padding: 1rem 2rem; }

@media(max-width:768px) {
  .section { padding: 0 16px; }
  .causes-list { grid-template-columns: 1fr; }
}
`;

const files = fs.readdirSync(dir)
  .filter(f => f.startsWith('healthrankings-') && f.endsWith('.html'))
  .filter(f => !f.includes('-top5'))
  .filter(f => !f.includes('-all-'))
  .filter(f => !f.includes('-review-'))
  .filter(f => !['healthrankings-conditions.html', 'healthrankings-homepage.html', 'healthrankings-devices.html', 'healthrankings-privacy-policy.html', 'healthrankings-terms-of-service.html', 'healthrankings-hypertension.html'].includes(f));

console.log(`Found ${files.length} condition guide pages to rebuild`);

function extractText(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function extractHeroData(html) {
  const condTag = extractText(html, /class="condition-tag">([^<]+)</);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const h1 = h1Match ? h1Match[1].replace(/<br\s*\/?>/g, ' ').trim() : '';
  const subtitle = extractText(html, /class="hero-subtitle">([^<]+(?:<[^>]*>[^<]*)*?)<\/p>/s);

  const stats = [];
  const statsRe = /class="stat-num">([^<]+)<\/div>\s*<div class="stat-label">([^<]+)</;
  let m;
  const fullRe = new RegExp(statsRe.source, 'g');
  while ((m = fullRe.exec(html)) !== null) {
    stats.push({ num: m[1].trim(), label: m[2].trim() });
  }
  return { condTag, h1, subtitle, stats };
}

function extractTocItems(html) {
  const items = [];
  const re = /<a href="#([^"]+)">([^<]+)<\/a>/g;
  const tocMatch = html.match(/class="toc-bar">([\s\S]*?)<\/div>/);
  if (!tocMatch) return items;
  let m;
  while ((m = re.exec(tocMatch[1])) !== null) {
    items.push({ id: m[1], label: m[2] });
  }
  return items;
}

function extractTop5Box(html) {
  const m = html.match(/<a href="([^"]*)"[^>]*class="top5-box">([\s\S]*?)<\/a>/);
  if (!m) return null;
  const href = m[1];
  const title = extractText(m[2], /class="top5-box-title">([^<]+)</);
  const sub = extractText(m[2], /class="top5-box-sub">([^<]+(?:<[^>]*>[^<]*)*?)<\/div>/s);
  return { href, title, sub };
}

function extractSections(html) {
  const sections = [];
  const pageWrap = html.indexOf('class="page-wrap"');
  const footer = html.indexOf('<footer');
  if (pageWrap === -1 || footer === -1) return sections;

  const body = html.substring(pageWrap, footer);

  const sectionRe = /<div class="section"[^>]*id="([^"]*)">([\s\S]*?)(?=<div class="section"|<\/div>\s*<footer|<\/div>\s*$)/g;

  const allSections = [];
  let match;
  const simpleRe = /(<div class="section"[^>]*id="[^"]*">)/g;
  const positions = [];
  while ((match = simpleRe.exec(body)) !== null) {
    const idMatch = match[1].match(/id="([^"]*)"/);
    positions.push({ id: idMatch[1], start: match.index });
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].start;
    const end = i + 1 < positions.length ? positions[i + 1].start : body.length;
    let content = body.substring(start, end);
    content = content.replace(/^<div class="section"[^>]*>/, '').replace(/<\/div>\s*$/, '');
    allSections.push({ id: positions[i].id, content: content.trim() });
  }

  return allSections;
}

function buildConditionPage(title, description, hero, tocItems, top5Box, sections, filename) {
  const slug = filename.replace('healthrankings-', '').replace('.html', '');
  const top5File = `healthrankings-${slug}-top5.html`;

  const statsHtml = hero.stats.map(s => `
        <div class="primer-stat">
          <span class="primer-stat-num">${s.num}</span>
          <span class="primer-stat-label">${s.label}</span>
        </div>`).join('');

  const tocHtml = tocItems.filter(t => t.id !== 'faq').map((t, i) =>
    `  <a href="#${t.id}"${i === 0 ? ' class="primary"' : ''}>${t.label}</a>`
  ).join('\n');

  const top5CtaHtml = top5Box ? `
<!-- ============ TOP 5 CTA ============ -->
<section class="winner-hero" id="top5" style="cursor:pointer;" onclick="window.location='${top5Box.href}'">
  <div class="winner-hero-inner" style="grid-template-columns:1fr auto; gap:32px;">
    <div class="winner-hero-left">
      <div class="winner-hero-eyebrow">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>
        EXPERT RANKED · TOP 5 OF 2026
      </div>
      <h2>${top5Box.title}</h2>
      <p class="winner-hero-desc">${top5Box.sub.replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '')}</p>
    </div>
    <div style="flex-shrink:0;">
      <a href="${top5Box.href}" class="winner-cta" style="font-size:16px; padding:16px 28px;">
        See Full Top 5 →
      </a>
    </div>
  </div>
</section>
` : '';

  let sectionsHtml = '';
  for (const sec of sections) {
    if (sec.id === 'faq') continue;
    sectionsHtml += `
  <div class="section" id="${sec.id}">
    ${sec.content}
  </div>
`;
  }

  const faqSection = sections.find(s => s.id === 'faq');
  let faqHtml = '';
  if (faqSection) {
    const faqItems = [];
    const faqRe = /class="faq-q">([^<]+)<\/div>\s*<div class="faq-a">([^<]+(?:<[^>]*>[^<]*)*?)<\/div>/gs;
    let fm;
    while ((fm = faqRe.exec(faqSection.content)) !== null) {
      faqItems.push({ q: fm[1].trim(), a: fm[2].trim() });
    }

    if (faqItems.length > 0) {
      const ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
      const items = faqItems.map((item, i) => `    <details class="faq-item"${i === 0 ? ' open' : ''}>
      <summary>
        ${item.q}
        <span class="faq-icon">${ICON_SVG}</span>
      </summary>
      <div class="faq-body">
        <p>${item.a}</p>
      </div>
    </details>`).join('\n\n');

      faqHtml = `
<!-- ============ FAQ ============ -->
<section class="faq" id="faq">
  <div class="faq-header">
    <h2>Questions, <em>answered.</em></h2>
  </div>
  <div class="faq-list">
${items}
  </div>
</section>
`;
    }
  }

  const condCategory = hero.condTag || 'Health';
  const condTitle = hero.h1 || title.replace(/ \| HealthRankings$/, '');

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
${CONDITION_CSS}
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
  <a href="/healthrankings-conditions.html">${condCategory}</a>
  <span class="breadcrumb-sep">/</span>
  <span class="breadcrumb-current">${condTitle}</span>
</nav>

<!-- ============ PAGE INTRO ============ -->
<section class="page-intro">
  <div class="intro-eyebrow">
    <div class="intro-pulse"></div>
    Updated April 2026 · ${condCategory}
  </div>
  <h1>${condTitle.replace(/&/g, '&amp;')}</h1>
  <p class="intro-lede">${hero.subtitle}</p>

  <div class="intro-meta">
    <div class="intro-author">
      <div class="intro-author-avatar">HR</div>
      <div class="intro-author-info">
        <strong>HealthRankings Team</strong>
        <span>Expert-reviewed &amp; medically verified</span>
      </div>
    </div>
    <div class="intro-meta-divider"></div>
    <div class="intro-meta-fact">
      <span class="intro-meta-fact-label">Category</span>
      <span class="intro-meta-fact-value">${condCategory}</span>
    </div>
    <div class="intro-meta-divider"></div>
    <div class="intro-meta-fact">
      <span class="intro-meta-fact-label">Last updated</span>
      <span class="intro-meta-fact-value">April 2026</span>
    </div>
  </div>
</section>

<!-- ============ JUMP NAV ============ -->
<nav class="jump-nav" aria-label="Jump to section">
  <span class="jump-nav-label">Jump to</span>
${tocHtml}
  <a href="#top5">Top 5 Picks</a>
  <a href="#faq">FAQ</a>
</nav>

${top5CtaHtml}

<!-- ============ CONDITION CONTENT ============ -->
<section class="rankings" id="condition-content" style="padding-top:20px;">
${sectionsHtml}

${hero.stats.length > 0 ? `
  <!-- KEY STATS -->
  <div class="primer" style="padding:0; margin:40px 0;">
    <div class="primer-inner" style="max-width:100%;">
      <div class="primer-left">
        <h2>Key <em>statistics.</em></h2>
        <div class="primer-stats" style="margin-top:20px;">
${statsHtml}
        </div>
      </div>
    </div>
  </div>
` : ''}
</section>

${faqHtml}

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
      <div class="related-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg></div>
      <div class="related-name">Heart &amp; Blood Pressure</div>
      <div class="related-meta">14 products ranked</div>
    </a>
    <a href="/healthrankings-diabetes-ketone-monitors.html" class="related-card">
      <div class="related-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
      <div class="related-name">Diabetes &amp; Glucose</div>
      <div class="related-meta">18 products ranked</div>
    </a>
    <a href="/healthrankings-cholesterol.html" class="related-card">
      <div class="related-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/></svg></div>
      <div class="related-name">Cholesterol Tests</div>
      <div class="related-meta">8 products ranked</div>
    </a>
    <a href="/healthrankings-sleep-apnea.html" class="related-card">
      <div class="related-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></div>
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

  const hero = extractHeroData(html);
  if (!hero.h1) {
    console.log(`  SKIP (no h1): ${filename}`);
    errors++;
    return;
  }

  const tocItems = extractTocItems(html);
  const top5Box = extractTop5Box(html);
  const sections = extractSections(html);

  if (sections.length === 0) {
    console.log(`  SKIP (no sections): ${filename}`);
    errors++;
    return;
  }

  const newHtml = buildConditionPage(title, description, hero, tocItems, top5Box, sections, filename);
  fs.writeFileSync(filepath, newHtml, 'utf8');
  console.log(`  REBUILT: ${filename} (${sections.length} sections, ${hero.stats.length} stats)`);
  updated++;
});

console.log(`\nDone. Rebuilt: ${updated}, Skipped: ${errors}`);
