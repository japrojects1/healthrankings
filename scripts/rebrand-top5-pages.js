#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.match(/healthrankings-.*-top5\.html$/));

const NEW_CSS = `:root {
  --blue-50: #EFF6FF; --blue-100: #DBEAFE; --blue-200: #BFDBFE;
  --blue-300: #93C5FD; --blue-400: #60A5FA; --blue-500: #3B82F6;
  --blue-600: #2563EB; --blue-700: #1D4ED8; --blue-800: #1E40AF;
  --teal-50: #F0FDFA; --teal-100: #CCFBF1; --teal-200: #99F6E4;
  --teal-400: #2DD4BF; --teal-500: #14B8A6; --teal-600: #0D9488;
  --slate-50: #F8FAFC; --slate-100: #F1F5F9; --slate-200: #E2E8F0;
  --slate-300: #CBD5E1; --slate-400: #94A3B8; --slate-500: #64748B;
  --slate-600: #475569; --slate-700: #334155; --slate-900: #0F172A;
  --success-100: #D1FAE5; --success-600: #059669;
  --amber-400: #F59E0B;
  --red-500: #EF4444; --red-50: #FEF2F2;
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
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }

body::before {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity: 0.025; pointer-events: none; z-index: 100; mix-blend-mode: multiply;
}

/* ===== HEADER ===== */
.header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(248,250,252,0.92);
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

/* ===== HERO ===== */
.hero {
  background: var(--slate-50);
  padding: 2rem 2rem 1.5rem;
  border-bottom: 1px solid var(--slate-200);
}
.hero-inner { max-width: 860px; margin: 0 auto; position: relative; z-index: 1; }
.breadcrumb {
  font-size: 13px; color: var(--slate-600); margin-bottom: 20px;
  display: flex; gap: 8px; align-items: center;
}
.breadcrumb a { color: var(--slate-600); transition: color 180ms; }
.breadcrumb a:hover { color: var(--blue-700); }
.condition-tag {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--blue-50); color: var(--blue-700);
  font-size: 12px; font-weight: 700; padding: 6px 16px;
  border-radius: 9999px; margin-bottom: 16px; letter-spacing: 0.05em; text-transform: uppercase;
}
.hero h1 {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(1.6rem,4vw,2.4rem); font-weight: 700;
  line-height: 1.15; letter-spacing: -0.03em;
  color: var(--slate-900); margin-bottom: 8px;
}
.hero-subtitle { font-size: 16px; color: var(--slate-600); max-width: 620px; margin-bottom: 1.5rem; }
.hero-stats { display: flex; gap: 20px; flex-wrap: wrap; }
.stat {
  background: white; border: 1px solid var(--slate-200);
  border-radius: 14px; padding: 14px 20px; min-width: 110px;
}
.stat-num {
  font-family: 'DM Sans', sans-serif; font-size: 24px;
  color: var(--blue-700); font-weight: 700; line-height: 1; letter-spacing: -0.03em;
}
.stat-label { font-size: 12px; color: var(--slate-500); margin-top: 4px; }

/* ===== TOC BAR ===== */
.toc-bar {
  background: rgba(248,250,252,0.95); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--slate-200); padding: 0 2rem; overflow-x: auto;
}
.toc-bar ul { list-style: none; display: flex; gap: 0; max-width: 860px; margin: 0 auto; white-space: nowrap; }
.toc-bar ul a {
  display: block; padding: 14px 20px;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
  color: var(--slate-600); border-bottom: 2px solid transparent; transition: all 180ms;
}
.toc-bar ul a:hover { color: var(--blue-700); border-bottom-color: var(--blue-600); }

/* ===== PAGE WRAP ===== */
.page-wrap { max-width: 860px; margin: 0 auto; padding: 3rem 2rem; }

/* ===== SECTIONS ===== */
.section { margin-bottom: 3.5rem; }
.section-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.12em; color: var(--teal-600); margin-bottom: 8px;
}
.section h2 {
  font-family: 'DM Sans', sans-serif; font-size: 28px; font-weight: 700;
  color: var(--slate-900); margin-bottom: 16px; line-height: 1.2; letter-spacing: -0.03em;
}
.section p { color: var(--slate-600); margin-bottom: 14px; font-size: 15px; line-height: 1.65; }

/* ===== CALLOUTS ===== */
.callout {
  background: var(--red-50); border-left: 4px solid var(--red-500);
  padding: 18px 20px; border-radius: 0 12px 12px 0; margin: 20px 0;
}
.callout p { margin: 0; color: #7F1D1D; font-size: 14px; }
.callout strong { color: var(--red-500); }
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

/* ===== SYMPTOMS GRID ===== */
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

/* ===== CAUSES LIST ===== */
.causes-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
.cause-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  background: white; border-radius: 12px; border: 1px solid var(--slate-200);
}
.cause-dot { width: 8px; height: 8px; background: var(--blue-600); border-radius: 50%; margin-top: 7px; flex-shrink: 0; }
.cause-item p { font-size: 14px; color: var(--slate-600); margin: 0; }
.cause-item strong { color: var(--slate-900); font-weight: 600; display: block; font-size: 14px; }

/* ===== LIFESTYLE GRID ===== */
.lifestyle-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 12px; margin-top: 16px; }
.lifestyle-card {
  border: 1px solid var(--slate-200); border-radius: 14px; padding: 20px;
  background: white; transition: all 200ms;
}
.lifestyle-card:hover { border-color: var(--blue-300); box-shadow: 0 8px 24px -8px rgba(37,99,235,0.1); }
.lifestyle-card .lc-icon { font-size: 1.5rem; margin-bottom: 12px; }
.lifestyle-card h4 { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; color: var(--slate-900); margin-bottom: 6px; }
.lifestyle-card p { font-size: 13px; color: var(--slate-500); margin: 0; }

/* ===== MED TABLE ===== */
.med-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
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

/* ===== SECTION DIVIDER ===== */
.section-divider { border: none; border-top: 2px solid var(--slate-200); margin: 2rem 0; position: relative; }
.section-divider::before {
  content: '◆'; position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
  background: var(--slate-50); padding: 0 1rem; color: var(--blue-600); font-size: 0.7rem;
}

/* ===== REVIEW HERO ===== */
.review-hero {
  background: var(--gradient-blue); border-radius: 20px; padding: 2.5rem;
  margin-bottom: 2.5rem; position: relative; overflow: hidden;
}
.review-hero::after {
  content: ''; position: absolute; right: -40px; top: -40px; width: 200px; height: 200px;
  background-image: radial-gradient(circle, rgba(20,184,166,0.12) 2px, transparent 2px);
  background-size: 18px 18px; pointer-events: none;
}
.review-hero h2 {
  font-family: 'DM Sans', sans-serif; color: white; font-size: 28px; font-weight: 700;
  margin-bottom: 12px; position: relative; z-index: 1; letter-spacing: -0.03em;
}
.review-hero p { color: rgba(248,250,252,0.85); font-size: 15px; max-width: 520px; position: relative; z-index: 1; margin: 0; }
.review-meta { display: flex; gap: 28px; margin-top: 20px; position: relative; z-index: 1; flex-wrap: wrap; }
.review-meta-item { font-size: 13px; color: rgba(248,250,252,0.6); }
.review-meta-item strong { color: white; display: block; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; }

/* ===== TOP 5 INTRO ===== */
.top5-intro {
  background: var(--blue-50); border-radius: 16px; padding: 20px 24px;
  margin-bottom: 28px; display: flex; align-items: center; gap: 20px;
  border: 1px solid var(--blue-200);
}
.top5-badge {
  background: var(--gradient-blue); color: white;
  font-family: 'DM Sans', sans-serif; font-size: 22px; font-weight: 700;
  width: 56px; height: 56px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.top5-intro p { font-size: 14px; color: var(--slate-600); margin: 0; line-height: 1.6; }

/* ===== PRODUCT CARDS ===== */
.product-card {
  border: 1.5px solid var(--slate-200); border-radius: 20px; overflow: hidden;
  margin-bottom: 20px; background: white; transition: all 250ms;
}
.product-card:hover { border-color: var(--blue-300); box-shadow: 0 12px 40px -12px rgba(37,99,235,0.15); }
.product-card.winner { border: 2px solid var(--blue-600); background: linear-gradient(135deg, #FFF 0%, var(--blue-50) 100%); }
.winner-ribbon {
  position: absolute; top: 16px; right: -1px;
  background: var(--gradient-blue); color: white;
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
  padding: 5px 16px 5px 12px; letter-spacing: 0.05em; text-transform: uppercase;
  border-radius: 8px 0 0 8px;
}
.product-rank {
  position: absolute; top: 16px; left: 16px; width: 36px; height: 36px;
  background: var(--blue-50); color: var(--blue-700); border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; z-index: 2;
}
.product-rank.rank-1 { background: var(--gradient-blue); color: white; }
.product-card-body { padding: 24px; display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: start; }
.product-name {
  font-family: 'DM Sans', sans-serif; font-size: 20px; font-weight: 700;
  color: var(--slate-900); margin-bottom: 4px; padding-left: 2.75rem; letter-spacing: -0.025em;
}
.product-tagline {
  font-size: 13px; color: var(--blue-600); font-weight: 600;
  margin-bottom: 14px; padding-left: 2.75rem;
}
.product-desc { font-size: 14px; color: var(--slate-600); margin-bottom: 16px; line-height: 1.65; }
.product-pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.pros h5, .cons h5 {
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;
}
.pros h5 { color: var(--blue-700); }
.cons h5 { color: var(--slate-500); }
.pros ul, .cons ul { list-style: none; font-size: 13px; color: var(--slate-700); }
.pros ul li::before { content: '✓ '; color: var(--blue-600); font-weight: 700; }
.cons ul li::before { content: '− '; color: var(--slate-400); font-weight: 700; }
.pros ul li, .cons ul li { margin-bottom: 4px; line-height: 1.45; }

.product-score-panel { text-align: center; min-width: 120px; }
.score-circle {
  width: 72px; height: 72px; border-radius: 20px; background: var(--blue-50);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  margin: 0 auto 10px; border: 2px solid var(--blue-200);
}
.score-num {
  font-family: 'DM Sans', sans-serif; font-size: 24px; font-weight: 700;
  color: var(--blue-700); line-height: 1;
}
.score-circle.gold { background: var(--gradient-blue); border: none; }
.score-circle.gold .score-num { color: white; }
.score-label { font-size: 11px; color: var(--slate-500); margin-bottom: 12px; font-weight: 600; }
.price-tag {
  font-family: 'DM Sans', sans-serif; font-size: 22px; font-weight: 700;
  color: var(--slate-900); margin-bottom: 8px; letter-spacing: -0.03em;
}
.buy-btn {
  display: block; background: var(--gradient-blue); color: white; text-align: center;
  padding: 10px 18px; border-radius: 9999px;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
  transition: all 200ms; white-space: nowrap;
}
.buy-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px -6px rgba(37,99,235,0.4); }
.buy-btn.gold-btn { background: var(--gradient-blue); }
.buy-btn.gold-btn:hover { box-shadow: 0 8px 20px -6px rgba(37,99,235,0.4); }

.rating-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 13px; }
.rating-bar-label { min-width: 80px; color: var(--slate-500); font-weight: 500; }
.rating-bar-track { flex: 1; height: 5px; background: var(--slate-200); border-radius: 3px; overflow: hidden; }
.rating-bar-fill { height: 100%; background: var(--gradient-blue); border-radius: 3px; }
.rating-bar-fill.gold { background: var(--gradient-blue); }
.rating-num { min-width: 24px; font-family: 'DM Sans', sans-serif; font-weight: 700; color: var(--slate-900); font-size: 13px; }

.product-footer {
  background: var(--slate-50); padding: 14px 24px; border-top: 1px solid var(--slate-200);
  display: flex; gap: 20px; font-size: 13px; color: var(--slate-500); flex-wrap: wrap;
}
.product-footer span strong { color: var(--slate-900); font-weight: 600; }

/* ===== COMPARISON TABLE ===== */
.comparison-wrap { overflow-x: auto; margin-top: 20px; }
.comparison-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.comparison-table th {
  background: var(--blue-600); color: white; padding: 12px 14px; text-align: left;
  font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 12px;
}
.comparison-table th:first-child { border-radius: 12px 0 0 0; }
.comparison-table th:last-child { border-radius: 0 12px 0 0; }
.comparison-table td { padding: 10px 14px; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); }
.comparison-table tr:nth-child(even) td { background: var(--slate-50); }
.comparison-table tr:last-child td { border-bottom: none; }
.check { color: var(--blue-600); font-weight: 700; }
.cross { color: var(--slate-300); }
.winner-row td { font-weight: 600; color: var(--slate-900); }
.winner-row td:first-child { color: var(--blue-700); font-weight: 700; }

/* ===== TOP 5 BOX ===== */
.top5-box {
  background: var(--gradient-blue); border-radius: 20px; padding: 24px 28px;
  margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between;
  gap: 20px; position: relative; overflow: hidden; text-decoration: none; transition: all 250ms;
}
.top5-box:hover { transform: translateY(-2px); box-shadow: 0 16px 40px -16px rgba(37,99,235,0.4); }
.top5-box::after {
  content: ''; position: absolute; right: -30px; top: -30px; width: 160px; height: 160px;
  background-image: radial-gradient(circle, rgba(20,184,166,0.12) 2px, transparent 2px);
  background-size: 18px 18px; pointer-events: none;
}
.top5-box-badge {
  display: inline-block; background: rgba(255,255,255,0.15); color: var(--teal-400);
  font-size: 11px; font-weight: 700; padding: 4px 14px; border-radius: 9999px;
  letter-spacing: 0.05em; margin-bottom: 6px;
}
.top5-box-title {
  font-family: 'DM Sans', sans-serif; font-size: 18px; color: white;
  font-weight: 700; margin-bottom: 4px; line-height: 1.25; letter-spacing: -0.02em;
}
.top5-box-sub { font-size: 13px; color: rgba(248,250,252,0.7); }
.top5-box-btn {
  background: white; color: var(--blue-700); padding: 10px 22px;
  border-radius: 9999px; font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
  transition: all 200ms; position: relative; z-index: 1;
}
.top5-box:hover .top5-box-btn { background: var(--blue-50); }

/* ===== FAQ ===== */
.faq-item { border-bottom: 1px solid var(--slate-200); padding: 18px 0; }
.faq-q {
  font-family: 'DM Sans', sans-serif; font-weight: 600; color: var(--slate-900);
  cursor: pointer; display: flex; justify-content: space-between; align-items: center;
  font-size: 15px; user-select: none; letter-spacing: -0.01em;
}
.faq-q::after { content: '+'; font-size: 1.2rem; color: var(--blue-600); transition: transform 200ms; flex-shrink: 0; margin-left: 16px; }
.faq-item.open .faq-q::after { content: '−'; }
.faq-a { font-size: 14px; color: var(--slate-600); padding-top: 12px; display: none; line-height: 1.7; }
.faq-item.open .faq-a { display: block; }

/* ===== FOOTER ===== */
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

@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.hero-inner > * { animation: fadeUp 0.6s ease both; }
.hero-inner > *:nth-child(1) { animation-delay: .1s; }
.hero-inner > *:nth-child(2) { animation-delay: .2s; }
.hero-inner > *:nth-child(3) { animation-delay: .3s; }
.hero-inner > *:nth-child(4) { animation-delay: .4s; }
.hero-inner > *:nth-child(5) { animation-delay: .5s; }

@media(max-width:768px) {
  .header-inner { padding: 0 20px; height: 60px; }
  .nav { display: none; }
  .hero, .page-wrap, .toc-bar { padding-left: 20px; padding-right: 20px; }
  .product-card-body { grid-template-columns: 1fr; }
  .product-score-panel { display: flex; align-items: center; gap: 16px; padding-left: 2.75rem; }
  .causes-list { grid-template-columns: 1fr; }
  .product-pros-cons { grid-template-columns: 1fr; }
  .top5-box { flex-direction: column; align-items: flex-start; }
}`;

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

  // Replace everything from <link href="https://fonts... through </style> with new CSS
  html = html.replace(
    /<link href="https:\/\/fonts\.googleapis\.com[^"]*"[^>]*>\s*<style>[\s\S]*?<\/style>/,
    `<meta name="theme-color" content="#0F172A">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${NEW_CSS}</style>`
  );

  // Replace old nav
  html = html.replace(
    /<nav>[\s\S]*?<\/nav>\s*/,
    NEW_NAV + '\n\n'
  );

  // Replace old footer
  html = html.replace(
    /<footer>[\s\S]*?<\/footer>/,
    NEW_FOOTER
  );

  fs.writeFileSync(filepath, html, 'utf8');
  updated++;
  console.log(`✓ ${filename}`);
});

console.log(`\nDone — updated ${updated} files.`);
