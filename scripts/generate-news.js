const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.NEWSAPI_KEY;
if (!API_KEY) {
  console.error('NEWSAPI_KEY environment variable is required');
  process.exit(1);
}

const dir = path.resolve(__dirname, '..');
const now = new Date();
const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const isoDate = now.toISOString().split('T')[0];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'HealthRankings/1.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.substring(0, 200))); }
      });
    }).on('error', reject);
  });
}

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(dateString) {
  const diff = now - new Date(dateString);
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function articleCard(a, isFeatured) {
  const img = a.urlToImage;
  const source = a.source?.name || 'Unknown';
  const title = escHtml(a.title?.split(' - ')[0] || a.title);
  const desc = escHtml(a.description?.substring(0, 160));
  const url = a.url;
  const time = timeAgo(a.publishedAt);

  if (isFeatured) {
    return `
    <a href="${url}" target="_blank" rel="noopener" class="featured-card">
      <div class="featured-img">${img ? `<img src="${escHtml(img)}" alt="${title}" loading="lazy" onerror="this.parentElement.classList.add('no-img');this.remove()">` : ''}</div>
      <div class="featured-body">
        <span class="news-source">${escHtml(source)}</span>
        <h2>${title}</h2>
        <p>${desc}</p>
        <span class="news-time">${time}</span>
      </div>
    </a>`;
  }

  return `
    <a href="${url}" target="_blank" rel="noopener" class="news-card">
      <div class="news-card-img">${img ? `<img src="${escHtml(img)}" alt="${title}" loading="lazy" onerror="this.parentElement.classList.add('no-img');this.remove()">` : ''}</div>
      <div class="news-card-body">
        <span class="news-source">${escHtml(source)}</span>
        <h3>${title}</h3>
        <p>${desc}</p>
        <span class="news-time">${time}</span>
      </div>
    </a>`;
}

async function main() {
  console.log('Fetching health news...');

  const url = `https://newsapi.org/v2/top-headlines?category=health&country=us&pageSize=30&apiKey=${API_KEY}`;
  const data = await fetch(url);

  if (data.status !== 'ok') {
    console.error('API error:', data.message || JSON.stringify(data));
    process.exit(1);
  }

  const articles = (data.articles || []).filter(a =>
    a.title && a.title !== '[Removed]' && a.url && a.description
  );

  console.log(`Got ${articles.length} articles`);
  if (articles.length === 0) {
    console.log('No articles found, skipping generation');
    process.exit(0);
  }

  const featured = articles[0];
  const rest = articles.slice(1);
  const sources = [...new Set(articles.map(a => a.source?.name).filter(Boolean))];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Health News — Latest Medical Headlines ${isoDate} | HealthRankings</title>
<meta name="description" content="Today's top health news from ${sources.slice(0,5).join(', ')} and more. Updated ${dateStr}. Breaking medical research, drug approvals, and wellness updates.">
<link rel="canonical" href="https://healthrankings.co/healthrankings-news.html">
<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg">
<meta property="og:type" content="website">
<meta property="og:title" content="Health News — Latest Medical Headlines | HealthRankings">
<meta property="og:description" content="Today's top health news. Updated ${dateStr}.">
<meta property="og:url" content="https://healthrankings.co/healthrankings-news.html">
<meta property="og:site_name" content="HealthRankings">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--blue-50:#EFF6FF;--blue-100:#DBEAFE;--blue-200:#BFDBFE;--blue-300:#93C5FD;--blue-400:#60A5FA;--blue-500:#3B82F6;--blue-600:#2563EB;--blue-700:#1D4ED8;--blue-800:#1E40AF;--teal-50:#F0FDFA;--teal-100:#CCFBF1;--teal-200:#99F6E4;--teal-400:#2DD4BF;--teal-500:#14B8A6;--teal-600:#0D9488;--slate-50:#F8FAFC;--slate-100:#F1F5F9;--slate-200:#E2E8F0;--slate-300:#CBD5E1;--slate-400:#94A3B8;--slate-500:#64748B;--slate-600:#475569;--slate-700:#334155;--slate-900:#0F172A;--gradient-blue:linear-gradient(135deg,#3B82F6 0%,#1E40AF 100%);--gradient-teal:linear-gradient(135deg,#14B8A6 0%,#0D9488 100%);--gradient-hero:linear-gradient(180deg,#EFF6FF 0%,#FFFFFF 100%)}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{font-family:'Inter','Helvetica Neue',system-ui,sans-serif;background:var(--slate-50);color:var(--slate-900);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}

.header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--slate-200)}.header-inner{max-width:1280px;margin:0 auto;padding:0 32px;height:76px;display:flex;align-items:center;justify-content:space-between}.logo{display:flex;align-items:center;gap:14px;line-height:1}.logo-tile{position:relative;width:44px;height:44px;background:var(--blue-50);border-radius:14px;display:flex;align-items:center;justify-content:center}.logo-sparkle{position:absolute;top:-4px;right:-4px;color:var(--teal-500)}.logo-text{font-family:'DM Sans',sans-serif;font-size:22px;letter-spacing:-0.035em;line-height:1}.logo-text .one{font-weight:500;color:var(--slate-900)}.logo-text .two{font-weight:700;background:var(--gradient-teal);-webkit-background-clip:text;background-clip:text;color:transparent}.nav{display:flex;align-items:center;gap:36px}.nav a{font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;color:var(--slate-900);letter-spacing:-0.01em;transition:color 200ms}.nav a:hover{color:var(--blue-600)}.nav a.active{color:var(--blue-600)}.header-actions{display:flex;align-items:center;gap:12px}.search-btn{width:40px;height:40px;border:1px solid var(--slate-200);border-radius:10px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--slate-500);transition:all 200ms}.search-btn:hover{border-color:var(--blue-300);color:var(--blue-600)}.cta-btn{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;padding:10px 22px;border-radius:10px;border:none;background:var(--gradient-blue);color:white;cursor:pointer;transition:transform 120ms,box-shadow 200ms}.cta-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,0.3)}

.page-hero{background:var(--gradient-hero);padding:48px 32px 40px;text-align:center}.page-hero h1{font-family:'DM Sans',sans-serif;font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-0.04em;line-height:1.1;color:var(--slate-900);margin-bottom:12px}.page-hero p{font-size:16px;color:var(--slate-500);max-width:520px;margin:0 auto}.page-hero .update-badge{display:inline-flex;align-items:center;gap:8px;background:white;border:1px solid var(--slate-200);border-radius:9999px;padding:6px 16px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:var(--slate-600);margin-bottom:16px}.page-hero .live-dot{width:8px;height:8px;border-radius:50%;background:#22C55E;animation:pulse-dot 2s infinite}
@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}

.news-layout{max-width:1280px;margin:0 auto;padding:32px 32px 64px;display:grid;grid-template-columns:1fr 340px;gap:40px}

.featured-card{display:grid;grid-template-columns:1fr 1fr;background:white;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden;margin-bottom:28px;transition:all 280ms cubic-bezier(0.4,0,0.2,1)}.featured-card:hover{border-color:var(--blue-300);box-shadow:0 12px 32px -8px rgba(37,99,235,0.1)}.featured-img{background:var(--slate-100);min-height:280px;overflow:hidden}.featured-img img{width:100%;height:100%;object-fit:cover}.featured-img.no-img{background:linear-gradient(135deg,var(--blue-50),var(--teal-50))}.featured-body{padding:28px 32px;display:flex;flex-direction:column;justify-content:center;gap:10px}.featured-body h2{font-family:'DM Sans',sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.03em;line-height:1.3;color:var(--slate-900)}.featured-body p{font-size:14px;color:var(--slate-600);line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

.news-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}.news-card{background:white;border:1px solid var(--slate-200);border-radius:14px;overflow:hidden;transition:all 280ms cubic-bezier(0.4,0,0.2,1);display:flex;flex-direction:column}.news-card:hover{border-color:var(--blue-300);box-shadow:0 8px 24px -6px rgba(37,99,235,0.08);transform:translateY(-2px)}.news-card-img{height:160px;background:var(--slate-100);overflow:hidden}.news-card-img img{width:100%;height:100%;object-fit:cover}.news-card-img.no-img{background:linear-gradient(135deg,var(--blue-50),var(--teal-50))}.news-card-body{padding:18px 20px;flex:1;display:flex;flex-direction:column;gap:6px}.news-card-body h3{font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;letter-spacing:-0.02em;line-height:1.35;color:var(--slate-900);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.news-card-body p{font-size:13px;color:var(--slate-600);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1}

.news-source{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--blue-600)}.news-time{font-size:12px;color:var(--slate-400);margin-top:auto}

.sidebar{display:flex;flex-direction:column;gap:20px}.sidebar-card{background:white;border:1px solid var(--slate-200);border-radius:14px;padding:24px}.sidebar-card h4{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;color:var(--slate-900);margin-bottom:14px}.stat-row{display:flex;gap:12px;margin-bottom:16px}.stat-box{flex:1;background:var(--slate-50);border-radius:10px;padding:14px;text-align:center}.stat-num{font-family:'DM Sans',sans-serif;font-size:24px;font-weight:800;color:var(--blue-600)}.stat-label{font-size:11px;color:var(--slate-500);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px}
.source-list{display:flex;flex-direction:column;gap:8px}.source-item{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--slate-600);padding:6px 0}.source-dot{width:8px;height:8px;border-radius:50%;background:var(--blue-500);flex-shrink:0}
.topic-chip{display:inline-block;padding:6px 14px;background:var(--slate-50);border:1px solid var(--slate-200);border-radius:8px;font-size:13px;font-weight:500;color:var(--slate-700);margin:0 6px 8px 0;transition:all 200ms}.topic-chip:hover{border-color:var(--blue-300);color:var(--blue-600);background:var(--blue-50)}
.disclaimer-box{background:var(--blue-50);border:1px solid var(--blue-200);border-radius:12px;padding:16px;font-size:12px;color:var(--slate-600);line-height:1.6}.disclaimer-box strong{color:var(--slate-900);display:block;margin-bottom:4px}

.footer{background:var(--slate-900);color:var(--slate-400);font-size:14px}.footer-inner{max-width:1280px;margin:0 auto;padding:48px 32px 32px}.footer-bottom{border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;display:flex;align-items:center;justify-content:space-between;font-size:13px}

@media(max-width:1024px){.news-layout{grid-template-columns:1fr}.sidebar{display:grid;grid-template-columns:1fr 1fr;gap:16px}}
@media(max-width:768px){.featured-card{grid-template-columns:1fr}.featured-img{min-height:200px}.news-grid{grid-template-columns:1fr}.news-layout{padding:24px 20px 48px}.page-hero{padding:36px 20px 28px}.sidebar{grid-template-columns:1fr}}
@media(max-width:640px){.header-inner{padding:0 20px;height:64px}.nav{display:none}}
</style>
</head>
<body>
<header class="header"><div class="header-inner"><a href="/" class="logo"><div class="logo-tile"><svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="11" cy="12" r="2" fill="#2563EB"/><circle cx="21" cy="12" r="2" fill="#2563EB"/><path d="M 8 19 Q 16 26 24 19" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg><div class="logo-sparkle"><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M 6 0 L 7 4.5 L 12 6 L 7 7.5 L 6 12 L 5 7.5 L 0 6 L 5 4.5 Z"/></svg></div></div><div class="logo-text"><span class="one">health</span><span class="two">rankings</span></div></a><nav class="nav"><a href="/healthrankings-conditions.html">Conditions</a><a href="/healthrankings-devices.html">Devices</a><a href="/healthrankings-articles.html">Articles</a><a href="/healthrankings-drugs.html">Drugs A\u2013Z</a><a href="/healthrankings-news.html" class="active">Health News</a><a href="/healthrankings-about.html">About</a></nav><div class="header-actions"><button class="search-btn" aria-label="Search"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button><button class="cta-btn">Get started</button></div></div></header>

<section class="page-hero">
  <div class="update-badge"><span class="live-dot"></span> Updated ${dateStr}</div>
  <h1>Health News</h1>
  <p>Latest health and medical headlines from top sources worldwide. Updated daily.</p>
</section>

<div class="news-layout">
  <div>
    ${articleCard(featured, true)}
    <div class="news-grid">
      ${rest.map(a => articleCard(a, false)).join('\n')}
    </div>
  </div>

  <aside class="sidebar">
    <div class="sidebar-card">
      <h4>Today's Coverage</h4>
      <div class="stat-row">
        <div class="stat-box"><div class="stat-num">${articles.length}</div><div class="stat-label">Articles</div></div>
        <div class="stat-box"><div class="stat-num">${sources.length}</div><div class="stat-label">Sources</div></div>
      </div>
    </div>

    <div class="sidebar-card">
      <h4>Trending Topics</h4>
      <div>
        <span class="topic-chip">Weight Loss</span>
        <span class="topic-chip">Cancer Research</span>
        <span class="topic-chip">Heart Disease</span>
        <span class="topic-chip">Diabetes</span>
        <span class="topic-chip">Mental Health</span>
        <span class="topic-chip">FDA Approvals</span>
        <span class="topic-chip">Nutrition</span>
        <span class="topic-chip">Sleep</span>
        <span class="topic-chip">Alzheimer's</span>
        <span class="topic-chip">Longevity</span>
      </div>
    </div>

    <div class="sidebar-card">
      <h4>Top Sources</h4>
      <div class="source-list">
        ${sources.slice(0, 8).map(s => `<div class="source-item"><div class="source-dot"></div>${escHtml(s)}</div>`).join('\n')}
      </div>
    </div>

    <div class="disclaimer-box">
      <strong>Medical Disclaimer</strong>
      News articles are for informational purposes only. Always consult a qualified healthcare provider before making medical decisions.
    </div>
  </aside>
</div>

<footer class="footer"><div class="footer-inner"><div class="footer-bottom"><div>\u00a9 2026 HealthRankings. Made with care in Miami.</div><div style="display:flex;gap:24px"><a href="/healthrankings-about.html">Privacy</a><a href="/healthrankings-about.html">Terms</a><a href="/healthrankings-contact.html">Contact</a></div></div></div></footer>
</body></html>`;

  const outPath = path.join(dir, 'healthrankings-news.html');
  fs.writeFileSync(outPath, html);
  console.log(`News page generated with ${articles.length} articles from ${sources.length} sources`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
