#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('path');

const dir = path.resolve(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.startsWith('healthrankings-all-') && f.endsWith('.html'));

const NEW_HEAD_CSS = `<meta name="theme-color" content="#0F172A">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --blue-50: #EFF6FF; --blue-100: #DBEAFE; --blue-200: #BFDBFE;
  --blue-300: #93C5FD; --blue-400: #60A5FA; --blue-500: #3B82F6;
  --blue-600: #2563EB; --blue-700: #1D4ED8; --blue-800: #1E40AF;
  --teal-50: #F0FDFA; --teal-100: #CCFBF1; --teal-200: #99F6E4;
  --teal-400: #2DD4BF; --teal-500: #14B8A6; --teal-600: #0D9488;
  --slate-50: #F8FAFC; --slate-100: #F1F5F9; --slate-200: #E2E8F0;
  --slate-300: #CBD5E1; --slate-400: #94A3B8; --slate-500: #64748B;
  --slate-600: #475569; --slate-700: #334155; --slate-900: #0F172A;
  --amber-400: #F59E0B;
  --gradient-blue: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
  --gradient-teal: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

body {
  font-family: 'Inter', 'Helvetica Neue', system-ui, sans-serif;
  background: var(--slate-50);
  color: var(--slate-900);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity: 0.025;
  pointer-events: none;
  z-index: 100;
  mix-blend-mode: multiply;
}

.header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(248, 250, 252, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--slate-200);
}
.header-inner {
  max-width: 1280px; margin: 0 auto; padding: 0 32px;
  height: 68px; display: flex; align-items: center; justify-content: space-between;
}
.logo { display: flex; align-items: center; gap: 12px; }
.logo-tile {
  position: relative; width: 40px; height: 40px;
  background: var(--blue-50); border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
}
.logo-sparkle { position: absolute; top: -3px; right: -3px; color: var(--teal-500); }
.logo-text { font-family: 'DM Sans', sans-serif; font-size: 20px; letter-spacing: -0.035em; line-height: 1; }
.logo-text .one { font-weight: 500; color: var(--slate-900); }
.logo-text .two { font-weight: 700; background: var(--gradient-blue); -webkit-background-clip: text; background-clip: text; color: transparent; }
.nav { display: flex; align-items: center; gap: 32px; }
.nav a { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--slate-900); transition: color 180ms; }
.nav a:hover { color: var(--blue-600); }

.breadcrumb {
  max-width: 900px; margin: 0 auto; padding: 24px 32px 0;
  display: flex; gap: 8px; font-size: 13px; color: var(--slate-600); align-items: center;
}
.breadcrumb a { color: var(--slate-600); transition: color 180ms; }
.breadcrumb a:hover { color: var(--blue-700); }
.breadcrumb-sep { color: var(--slate-300); }
.breadcrumb-current { color: var(--slate-900); font-weight: 500; }

.page-hero {
  max-width: 900px; margin: 0 auto; padding: 24px 32px 40px;
}
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--blue-50); padding: 8px 16px; border-radius: 9999px;
  font-size: 13px; font-weight: 600; color: var(--blue-700); margin-bottom: 20px;
}
.hero-pulse {
  width: 7px; height: 7px; background: var(--blue-600); border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.4); }
}
.page-hero h1 {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(32px, 4vw, 48px); font-weight: 700;
  line-height: 1.08; letter-spacing: -0.035em;
  color: var(--slate-900); margin-bottom: 12px;
}
.page-hero h1 em {
  font-style: italic; font-weight: 500;
  background: var(--gradient-blue); -webkit-background-clip: text; background-clip: text; color: transparent;
}
.page-hero p { font-size: 16px; color: var(--slate-600); max-width: 600px; line-height: 1.6; }

.main { max-width: 900px; margin: 0 auto; padding: 0 32px 80px; }

.count-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid var(--blue-100);
}
.count-bar h2 {
  font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 700;
  letter-spacing: -0.02em; color: var(--slate-900);
}
.count-badge {
  font-size: 12px; font-weight: 600; color: var(--slate-500);
  background: var(--slate-100); padding: 4px 14px; border-radius: 9999px;
}

.top5-link {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--gradient-blue); color: white;
  padding: 12px 24px; border-radius: 9999px;
  font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
  margin-bottom: 28px; transition: all 200ms;
}
.top5-link:hover { transform: translateY(-2px); box-shadow: 0 12px 32px -8px rgba(37, 99, 235, 0.4); }

.device-list { display: flex; flex-direction: column; gap: 10px; }

.dl-item {
  display: flex; align-items: center; gap: 16px;
  padding: 18px 20px; border: 1.5px solid var(--slate-200);
  border-radius: 16px; background: white;
  transition: all 250ms; text-decoration: none; color: var(--slate-900);
}
.dl-item:hover {
  border-color: var(--blue-300);
  box-shadow: 0 12px 32px -12px rgba(37, 99, 235, 0.15);
  transform: translateY(-2px);
}
.dl-item.dl-winner {
  border: 2px solid var(--blue-600);
  background: linear-gradient(135deg, #FFFFFF 0%, var(--blue-50) 100%);
}

.dl-rank {
  width: 44px; height: 44px;
  background: var(--blue-50); color: var(--blue-700);
  border-radius: 14px; display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700; flex-shrink: 0;
}
.dl-winner .dl-rank {
  background: var(--gradient-blue); color: white;
}

.dl-thumb-wrap {
  width: 72px; height: 72px; flex-shrink: 0; border-radius: 12px;
  background: var(--slate-50); border: 1px solid var(--slate-200);
  overflow: hidden; display: flex; align-items: center; justify-content: center;
}
.dl-thumb { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
.dl-thumb-missing { background: linear-gradient(145deg, var(--slate-100) 0%, var(--slate-50) 100%); }
.dl-thumb-missing::after { content: ''; width: 28px; height: 28px; border-radius: 8px; border: 2px dashed var(--slate-300); }

.dl-info { flex: 1; min-width: 0; }
.dl-name {
  font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700;
  color: var(--slate-900); margin-bottom: 2px; letter-spacing: -0.015em;
}
.dl-tagline { font-size: 13px; color: var(--slate-500); }

.dl-score-col { text-align: center; flex-shrink: 0; min-width: 80px; }
.dl-stars { font-size: 14px; color: var(--amber-400); letter-spacing: 1px; }
.dl-score {
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: var(--blue-700); font-weight: 700; margin-top: 2px;
}

.dl-cta {
  color: var(--blue-700); font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
  padding: 8px 16px; border: 1.5px solid var(--blue-200);
  border-radius: 9999px; transition: all 200ms;
}
.dl-cta:hover { background: var(--gradient-blue); color: white; border-color: transparent; }

.footer {
  background: var(--slate-900); color: var(--slate-200);
  padding: 60px 32px 32px; margin-top: 60px;
}
.footer-inner { max-width: 1280px; margin: 0 auto; }
.footer-disclosure {
  padding: 24px; background: rgba(255,255,255,0.05);
  border-left: 3px solid var(--teal-500); border-radius: 8px;
  font-size: 13px; color: rgba(203,213,225,0.7); line-height: 1.7;
  margin-bottom: 48px; max-width: 820px;
}
.footer-disclosure strong { color: var(--slate-50); font-weight: 700; }
.footer-bottom {
  padding-top: 24px; border-top: 1px solid rgba(203,213,225,0.1);
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 16px; font-size: 12px; color: rgba(203,213,225,0.4);
}
.footer-bottom-links { display: flex; gap: 24px; }
.footer-bottom a { transition: color 180ms; }
.footer-bottom a:hover { color: var(--blue-300); }

@media(max-width:768px){
  .header-inner { padding: 0 20px; height: 60px; }
  .nav { display: none; }
  .breadcrumb, .page-hero, .main { padding-left: 20px; padding-right: 20px; }
  .dl-item { flex-wrap: wrap; gap: 12px; padding: 16px; }
  .dl-cta { width: 100%; text-align: center; }
  .dl-score-col { order: 3; }
  .dl-thumb-wrap { width: 56px; height: 56px; }
}
</style>`;

const NEW_NAV = `<header class="header">
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
  </div>
</header>`;

const NEW_FOOTER = `<footer class="footer">
  <div class="footer-inner">
    <div class="footer-disclosure">
      <strong>How we fund our work.</strong> HealthRankings earns a small commission when you buy through the links on this page — but our rankings can't be influenced by advertisers. We buy every product we test at retail, and our medical reviewers have no financial relationship with any brand we cover.
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
</footer>`;

let updated = 0;

files.forEach(filename => {
  const filepath = path.join(dir, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  // Extract title and description
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="(.*?)">/);
  const title = titleMatch ? titleMatch[1] : 'HealthRankings';
  const desc = descMatch ? descMatch[1] : '';

  // Extract breadcrumb text from old breadcrumb
  const bcMatch = html.match(/<div class="breadcrumb">([\s\S]*?)<\/div>/);
  let bcLastItem = filename.replace('healthrankings-all-', '').replace('.html', '').replace(/-/g, ' ');
  bcLastItem = bcLastItem.replace(/\b\w/g, c => c.toUpperCase());

  // Extract hero badge text
  const badgeMatch = html.match(/<div class="hero-badge">(.*?)<\/div>/);
  const badge = badgeMatch ? badgeMatch[1] : 'Expert Reviewed';

  // Extract h1
  const h1Match = html.match(/<h1>([\s\S]*?)<\/h1>/);
  let h1Content = h1Match ? h1Match[1].trim() : `All ${bcLastItem}`;

  // Extract hero description
  const heroPMatch = html.match(/<div class="page-hero">[\s\S]*?<p>([\s\S]*?)<\/p>\s*<\/div>\s*<\/div>/);
  const heroP = heroPMatch ? heroPMatch[1].trim() : '';

  // Extract the main content (everything from <div class="main"> to the closing </div> before footer)
  const mainMatch = html.match(/<div class="main">([\s\S]*?)<\/div>\s*<footer/);
  const mainContent = mainMatch ? mainMatch[1] : '';

  // Build the new page
  const newHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
${NEW_HEAD_CSS}
</head>
<body>

${NEW_NAV}

<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="breadcrumb-sep">/</span>
  <a href="/healthrankings-devices.html">Devices</a>
  <span class="breadcrumb-sep">/</span>
  <span class="breadcrumb-current">${bcLastItem}</span>
</nav>

<section class="page-hero">
  <div class="hero-eyebrow">
    <div class="hero-pulse"></div>
    ${badge}
  </div>
  <h1>${h1Content}</h1>
  <p>${heroP}</p>
</section>

<div class="main">
${mainContent}
</div>

${NEW_FOOTER}

<script src="/catalog-product-images.js"></script>
<script src="/catalog-list.js"></script>
</body>
</html>`;

  fs.writeFileSync(filepath, newHtml, 'utf8');
  updated++;
  console.log(`✓ ${filename}`);
});

console.log(`\nDone — updated ${updated} files.`);
