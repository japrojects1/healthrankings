const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.NEWSAPI_KEY;
if (!API_KEY) { console.error('NEWSAPI_KEY env var required'); process.exit(1); }

const ROOT = path.resolve(__dirname, '..');
const NEWS_DIR = path.join(ROOT, 'news');
const ARCHIVE_FILE = path.join(ROOT, 'data', 'news-archive.json');
const MAX_ARTICLES = 300;
const now = new Date();
const dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
const isoDate = now.toISOString().split('T')[0];

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers:{'User-Agent':'HealthRankings/1.0'} }, res => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>{ try{resolve(JSON.parse(d))}catch(e){reject(e)} });
    }).on('error',reject);
  });
}

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,80);
}

function timeAgo(d) {
  const h = Math.floor((now - new Date(d))/3600000);
  if (h<1) return 'Just now';
  if (h<24) return `${h}h ago`;
  const days = Math.floor(h/24);
  if (days===1) return 'Yesterday';
  if (days<7) return `${days} days ago`;
  return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

function dateLabel(d) {
  const date = new Date(d);
  const diffDays = Math.floor((now - date)/86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
}

const HEALTH_TOPICS = [
  {kw:['blood pressure','hypertension','bp monitor','systolic','diastolic'],link:'/healthrankings-hypertension-top5.html',label:'Best Blood Pressure Monitors'},
  {kw:['diabetes','insulin','glucose','a1c','blood sugar','cgm'],link:'/healthrankings-diabetes-body-composition.html',label:'Diabetes Guide'},
  {kw:['weight','obesity','bmi','body fat','scale','body composition'],link:'/healthrankings-weight-management-body-composition-top5.html',label:'Best Smart Scales'},
  {kw:['heart','cardiac','cardiovascular','cholesterol','statin'],link:'/healthrankings-hypertension.html',label:'Heart Health Guide'},
  {kw:['sleep','apnea','insomnia','cpap'],link:'/healthrankings-sleep-apnea.html',label:'Sleep Apnea Guide'},
  {kw:['copd','lung','respiratory','breathing','asthma','pulmonary'],link:'/healthrankings-copd-breathing-trainers.html',label:'Respiratory Guide'},
  {kw:['mental health','anxiety','depression','stress','psychiatry'],link:'/healthrankings-article-anxiety-blood-pressure.html',label:'Anxiety & Blood Pressure'},
  {kw:['cancer','oncology','tumor','chemotherapy','immunotherapy'],link:'/healthrankings-conditions.html',label:'All Condition Guides'},
  {kw:['fda','drug','medication','approval','pharmaceutical'],link:'/healthrankings-drugs.html',label:'Drugs A\u2013Z'},
  {kw:['fitness','exercise','running','walking','workout'],link:'/healthrankings-article-walking-vs-running.html',label:'Walking vs Running'},
  {kw:['nutrition','diet','dash','food','vitamin'],link:'/healthrankings-article-dash-diet-cheat-sheet.html',label:'DASH Diet Guide'},
  {kw:['creatine','supplement','protein'],link:'/healthrankings-article-creatine-not-just-bodybuilders.html',label:'Creatine Guide'},
];

function findRelatedLinks(title, desc) {
  const text = ((title||'')+ ' '+(desc||'')).toLowerCase();
  const matches = [];
  for (const t of HEALTH_TOPICS) {
    if (t.kw.some(k => text.includes(k))) matches.push(t);
    if (matches.length >= 3) break;
  }
  if (matches.length === 0) {
    matches.push({link:'/healthrankings-conditions.html',label:'Browse All Conditions'});
    matches.push({link:'/healthrankings-devices.html',label:'Browse All Devices'});
  }
  return matches;
}

// ─── ARTICLE PAGE TEMPLATE ───
function articlePage(article, relatedArticles) {
  const title = esc(article.title?.split(' - ')[0] || article.title);
  const source = esc(article.source?.name || 'Unknown');
  const desc = esc(article.description || '');
  const content = esc(article.content?.replace(/\[\+\d+ chars\]$/,'') || desc);
  const img = article.urlToImage;
  const url = article.url;
  const pubDate = new Date(article.publishedAt).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const related = findRelatedLinks(article.title, article.description);
  const slug = article.slug;

  const relatedCards = relatedArticles.slice(0,4).map(a => `
    <a href="/news/${a.slug}.html" class="rel-card">
      <div class="rel-img">${a.urlToImage ? `<img src="${esc(a.urlToImage)}" alt="${esc(a.title?.split(' - ')[0])}" loading="lazy" onerror="this.remove()">`:''}</div>
      <div class="rel-body">
        <span class="rel-source">${esc(a.source?.name||'')}</span>
        <h4>${esc(a.title?.split(' - ')[0]||a.title)}</h4>
        <span class="rel-time">${timeAgo(a.publishedAt)}</span>
      </div>
    </a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | Health News | HealthRankings</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://healthrankings.onrender.com/news/${slug}.html">
<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="https://healthrankings.onrender.com/news/${slug}.html">
<meta property="og:site_name" content="HealthRankings">
${img ? `<meta property="og:image" content="${esc(img)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"NewsArticle","headline":"${title}","description":"${desc}","datePublished":"${article.publishedAt}","author":{"@type":"Organization","name":"${source}"},"publisher":{"@type":"Organization","name":"HealthRankings"},"mainEntityOfPage":{"@type":"WebPage","@id":"https://healthrankings.onrender.com/news/${slug}.html"}}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--blue-50:#EFF6FF;--blue-100:#DBEAFE;--blue-200:#BFDBFE;--blue-300:#93C5FD;--blue-400:#60A5FA;--blue-500:#3B82F6;--blue-600:#2563EB;--blue-700:#1D4ED8;--blue-800:#1E40AF;--teal-50:#F0FDFA;--teal-100:#CCFBF1;--teal-200:#99F6E4;--teal-400:#2DD4BF;--teal-500:#14B8A6;--teal-600:#0D9488;--slate-50:#F8FAFC;--slate-100:#F1F5F9;--slate-200:#E2E8F0;--slate-300:#CBD5E1;--slate-400:#94A3B8;--slate-500:#64748B;--slate-600:#475569;--slate-700:#334155;--slate-900:#0F172A;--gradient-blue:linear-gradient(135deg,#3B82F6 0%,#1E40AF 100%);--gradient-teal:linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{font-family:'Inter',system-ui,sans-serif;background:var(--slate-50);color:var(--slate-900);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}
.header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--slate-200)}.header-inner{max-width:1280px;margin:0 auto;padding:0 32px;height:76px;display:flex;align-items:center;justify-content:space-between}.logo{display:flex;align-items:center;gap:14px;line-height:1}.logo-tile{position:relative;width:44px;height:44px;background:var(--blue-50);border-radius:14px;display:flex;align-items:center;justify-content:center}.logo-sparkle{position:absolute;top:-4px;right:-4px;color:var(--teal-500)}.logo-text{font-family:'DM Sans',sans-serif;font-size:22px;letter-spacing:-0.035em;line-height:1}.logo-text .one{font-weight:500;color:var(--slate-900)}.logo-text .two{font-weight:700;background:var(--gradient-teal);-webkit-background-clip:text;background-clip:text;color:transparent}.nav{display:flex;align-items:center;gap:36px}.nav a{font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;color:var(--slate-900);letter-spacing:-0.01em;transition:color 200ms}.nav a:hover{color:var(--blue-600)}.nav a.active{color:var(--blue-600)}.header-actions{display:flex;align-items:center;gap:12px}.cta-btn{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;padding:10px 22px;border-radius:10px;border:none;background:var(--gradient-blue);color:white;cursor:pointer}
.breadcrumb-bar{max-width:800px;margin:0 auto;padding:16px 32px;font-size:13px;color:var(--slate-400);display:flex;align-items:center;gap:8px}.breadcrumb-bar a{color:var(--slate-500);transition:color 200ms}.breadcrumb-bar a:hover{color:var(--blue-600)}.bc-sep{color:var(--slate-300)}
.article-wrap{max-width:800px;margin:0 auto;padding:0 32px 64px}
.article-source{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--blue-600);margin-bottom:12px}
.article-wrap h1{font-family:'DM Sans',sans-serif;font-size:clamp(26px,4vw,38px);font-weight:800;letter-spacing:-0.04em;line-height:1.15;color:var(--slate-900);margin-bottom:16px}
.article-meta{display:flex;align-items:center;gap:16px;font-size:14px;color:var(--slate-500);margin-bottom:28px;flex-wrap:wrap}.article-meta .dot{width:4px;height:4px;border-radius:50%;background:var(--slate-300)}
.article-hero-img{width:100%;height:400px;border-radius:16px;overflow:hidden;margin-bottom:32px;background:var(--slate-100)}.article-hero-img img{width:100%;height:100%;object-fit:cover}
.article-body{font-size:17px;line-height:1.8;color:var(--slate-700);margin-bottom:32px}.article-body p{margin-bottom:20px}
.read-original{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:var(--gradient-blue);color:white;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;transition:transform 120ms,box-shadow 200ms;margin-bottom:40px}.read-original:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,0.3)}
.related-guides{background:var(--blue-50);border:1px solid var(--blue-200);border-radius:14px;padding:24px 28px;margin-bottom:40px}.related-guides h3{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;color:var(--blue-700);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.06em}.related-guides-links{display:flex;flex-wrap:wrap;gap:10px}.related-guides-links a{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:white;border:1px solid var(--blue-200);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:var(--blue-700);transition:all 200ms}.related-guides-links a:hover{border-color:var(--blue-400);background:var(--blue-100)}
.more-news h2{font-family:'DM Sans',sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.03em;color:var(--slate-900);margin-bottom:20px}
.rel-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.rel-card{background:white;border:1px solid var(--slate-200);border-radius:12px;overflow:hidden;transition:all 280ms}.rel-card:hover{border-color:var(--blue-300);box-shadow:0 8px 24px -6px rgba(37,99,235,0.08);transform:translateY(-2px)}.rel-img{height:120px;background:var(--slate-100);overflow:hidden}.rel-img img{width:100%;height:100%;object-fit:cover}.rel-body{padding:14px 16px}.rel-source{font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--blue-600)}.rel-body h4{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;line-height:1.35;color:var(--slate-900);margin:4px 0 6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.rel-time{font-size:11px;color:var(--slate-400)}
.footer{background:var(--slate-900);color:var(--slate-400);font-size:14px;margin-top:40px}.footer-inner{max-width:1280px;margin:0 auto;padding:48px 32px 32px}.footer-bottom{border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;display:flex;align-items:center;justify-content:space-between;font-size:13px}
.disclaimer{background:var(--slate-100);border:1px solid var(--slate-200);border-radius:10px;padding:16px 20px;font-size:13px;color:var(--slate-500);line-height:1.6;margin-bottom:32px}.disclaimer strong{color:var(--slate-700)}
@media(max-width:768px){.article-hero-img{height:220px;border-radius:12px}.rel-grid{grid-template-columns:1fr}.article-wrap{padding:0 20px 48px}.breadcrumb-bar{padding:12px 20px}}
@media(max-width:640px){.header-inner{padding:0 20px;height:64px}.nav{display:none}}
</style>
</head>
<body>
<header class="header"><div class="header-inner"><a href="/" class="logo"><div class="logo-tile"><svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="11" cy="12" r="2" fill="#2563EB"/><circle cx="21" cy="12" r="2" fill="#2563EB"/><path d="M 8 19 Q 16 26 24 19" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg><div class="logo-sparkle"><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M 6 0 L 7 4.5 L 12 6 L 7 7.5 L 6 12 L 5 7.5 L 0 6 L 5 4.5 Z"/></svg></div></div><div class="logo-text"><span class="one">health</span><span class="two">rankings</span></div></a><nav class="nav"><a href="/healthrankings-conditions.html">Conditions</a><a href="/healthrankings-devices.html">Devices</a><a href="/healthrankings-articles.html">Articles</a><a href="/healthrankings-drugs.html">Drugs A\u2013Z</a><a href="/healthrankings-news.html" class="active">Health News</a><a href="/healthrankings-about.html">About</a></nav><div class="header-actions"><button class="cta-btn">Get started</button></div></div></header>
<div class="breadcrumb-bar"><a href="/">Home</a><span class="bc-sep">/</span><a href="/healthrankings-news.html">Health News</a><span class="bc-sep">/</span><span>${title}</span></div>
<div class="article-wrap">
  <div class="article-source">${source}</div>
  <h1>${title}</h1>
  <div class="article-meta"><span>${pubDate}</span><span class="dot"></span><span>Source: ${source}</span></div>
  ${img ? `<div class="article-hero-img"><img src="${esc(img)}" alt="${title}" onerror="this.parentElement.remove()"></div>` : ''}
  <div class="article-body"><p>${content}</p></div>
  <a href="${esc(url)}" target="_blank" rel="noopener" class="read-original">Read full article at ${source} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg></a>
  <div class="disclaimer"><strong>Disclaimer:</strong> This article summary is sourced from ${source}. HealthRankings provides this for informational purposes only. Always consult a qualified healthcare provider before making medical decisions.</div>
  <div class="related-guides">
    <h3>Related on HealthRankings</h3>
    <div class="related-guides-links">
      ${related.map(r=>`<a href="${r.link}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg> ${r.label}</a>`).join('\n      ')}
    </div>
  </div>
  <div class="more-news">
    <h2>More health news</h2>
    <div class="rel-grid">${relatedCards}</div>
  </div>
</div>
<footer class="footer"><div class="footer-inner"><div class="footer-bottom"><div>\u00a9 2026 HealthRankings. Made with care in Miami.</div><div style="display:flex;gap:24px"><a href="/healthrankings-about.html">Privacy</a><a href="/healthrankings-about.html">Terms</a><a href="/healthrankings-contact.html">Contact</a></div></div></div></footer>
</body></html>`;
}

// ─── LISTING PAGE TEMPLATE ───
function listingPage(articles, sources) {
  const grouped = {};
  for (const a of articles) {
    const lbl = dateLabel(a.publishedAt);
    if (!grouped[lbl]) grouped[lbl] = [];
    grouped[lbl].push(a);
  }

  const featured = articles[0];
  const featuredHtml = featured ? `
    <a href="/news/${featured.slug}.html" class="featured-card">
      <div class="featured-img">${featured.urlToImage ? `<img src="${esc(featured.urlToImage)}" alt="${esc(featured.title?.split(' - ')[0])}" loading="lazy" onerror="this.parentElement.classList.add('no-img');this.remove()">`:''}</div>
      <div class="featured-body">
        <span class="news-source">${esc(featured.source?.name||'')}</span>
        <h2>${esc(featured.title?.split(' - ')[0]||featured.title)}</h2>
        <p>${esc(featured.description?.substring(0,180)||'')}</p>
        <span class="news-time">${timeAgo(featured.publishedAt)}</span>
      </div>
    </a>` : '';

  let sectionsHtml = '';
  for (const [label, arts] of Object.entries(grouped)) {
    sectionsHtml += `<div class="day-section"><h2 class="day-label">${label}</h2><div class="news-grid">`;
    for (const a of arts) {
      const t = esc(a.title?.split(' - ')[0]||a.title);
      sectionsHtml += `
      <a href="/news/${a.slug}.html" class="news-card">
        <div class="news-card-img">${a.urlToImage ? `<img src="${esc(a.urlToImage)}" alt="${t}" loading="lazy" onerror="this.parentElement.classList.add('no-img');this.remove()">`:''}</div>
        <div class="news-card-body">
          <span class="news-source">${esc(a.source?.name||'')}</span>
          <h3>${t}</h3>
          <p>${esc(a.description?.substring(0,140)||'')}</p>
          <span class="news-time">${timeAgo(a.publishedAt)}</span>
        </div>
      </a>`;
    }
    sectionsHtml += `</div></div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Health News \u2014 Latest Medical Headlines | HealthRankings</title>
<meta name="description" content="Today's top health news from ${sources.slice(0,5).join(', ')} and more. ${articles.length} articles from ${sources.length} sources. Updated ${dateStr}.">
<link rel="canonical" href="https://healthrankings.onrender.com/healthrankings-news.html">
<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg">
<meta property="og:type" content="website">
<meta property="og:title" content="Health News \u2014 Latest Medical Headlines | HealthRankings">
<meta property="og:description" content="${articles.length} health articles from ${sources.length} sources. Updated ${dateStr}.">
<meta property="og:url" content="https://healthrankings.onrender.com/healthrankings-news.html">
<meta property="og:site_name" content="HealthRankings">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--blue-50:#EFF6FF;--blue-100:#DBEAFE;--blue-200:#BFDBFE;--blue-300:#93C5FD;--blue-400:#60A5FA;--blue-500:#3B82F6;--blue-600:#2563EB;--blue-700:#1D4ED8;--blue-800:#1E40AF;--teal-50:#F0FDFA;--teal-100:#CCFBF1;--teal-200:#99F6E4;--teal-400:#2DD4BF;--teal-500:#14B8A6;--teal-600:#0D9488;--slate-50:#F8FAFC;--slate-100:#F1F5F9;--slate-200:#E2E8F0;--slate-300:#CBD5E1;--slate-400:#94A3B8;--slate-500:#64748B;--slate-600:#475569;--slate-700:#334155;--slate-900:#0F172A;--gradient-blue:linear-gradient(135deg,#3B82F6 0%,#1E40AF 100%);--gradient-teal:linear-gradient(135deg,#14B8A6 0%,#0D9488 100%);--gradient-hero:linear-gradient(180deg,#EFF6FF 0%,#FFFFFF 100%)}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{font-family:'Inter',system-ui,sans-serif;background:var(--slate-50);color:var(--slate-900);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}
.header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--slate-200)}.header-inner{max-width:1280px;margin:0 auto;padding:0 32px;height:76px;display:flex;align-items:center;justify-content:space-between}.logo{display:flex;align-items:center;gap:14px;line-height:1}.logo-tile{position:relative;width:44px;height:44px;background:var(--blue-50);border-radius:14px;display:flex;align-items:center;justify-content:center}.logo-sparkle{position:absolute;top:-4px;right:-4px;color:var(--teal-500)}.logo-text{font-family:'DM Sans',sans-serif;font-size:22px;letter-spacing:-0.035em;line-height:1}.logo-text .one{font-weight:500;color:var(--slate-900)}.logo-text .two{font-weight:700;background:var(--gradient-teal);-webkit-background-clip:text;background-clip:text;color:transparent}.nav{display:flex;align-items:center;gap:36px}.nav a{font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;color:var(--slate-900);letter-spacing:-0.01em;transition:color 200ms}.nav a:hover{color:var(--blue-600)}.nav a.active{color:var(--blue-600)}.header-actions{display:flex;align-items:center;gap:12px}.cta-btn{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;padding:10px 22px;border-radius:10px;border:none;background:var(--gradient-blue);color:white;cursor:pointer}
.page-hero{background:var(--gradient-hero);padding:48px 32px 40px;text-align:center}.page-hero h1{font-family:'DM Sans',sans-serif;font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-0.04em;line-height:1.1;color:var(--slate-900);margin-bottom:12px}.page-hero p{font-size:16px;color:var(--slate-500);max-width:520px;margin:0 auto}.update-badge{display:inline-flex;align-items:center;gap:8px;background:white;border:1px solid var(--slate-200);border-radius:9999px;padding:6px 16px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:var(--slate-600);margin-bottom:16px}.live-dot{width:8px;height:8px;border-radius:50%;background:#22C55E;animation:pulse-dot 2s infinite}
@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
.news-layout{max-width:1280px;margin:0 auto;padding:32px 32px 64px;display:grid;grid-template-columns:1fr 320px;gap:40px}
.featured-card{display:grid;grid-template-columns:1fr 1fr;background:white;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden;margin-bottom:32px;transition:all 280ms}.featured-card:hover{border-color:var(--blue-300);box-shadow:0 12px 32px -8px rgba(37,99,235,0.1)}.featured-img{background:var(--slate-100);min-height:280px;overflow:hidden}.featured-img img{width:100%;height:100%;object-fit:cover}.featured-img.no-img{background:linear-gradient(135deg,var(--blue-50),var(--teal-50))}.featured-body{padding:28px 32px;display:flex;flex-direction:column;justify-content:center;gap:10px}.featured-body h2{font-family:'DM Sans',sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.03em;line-height:1.3}.featured-body p{font-size:14px;color:var(--slate-600);line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.day-section{margin-bottom:36px}.day-label{font-family:'DM Sans',sans-serif;font-size:18px;font-weight:700;color:var(--slate-700);margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--slate-200)}
.news-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}.news-card{background:white;border:1px solid var(--slate-200);border-radius:14px;overflow:hidden;transition:all 280ms;display:flex;flex-direction:column}.news-card:hover{border-color:var(--blue-300);box-shadow:0 8px 24px -6px rgba(37,99,235,0.08);transform:translateY(-2px)}.news-card-img{height:160px;background:var(--slate-100);overflow:hidden}.news-card-img img{width:100%;height:100%;object-fit:cover}.news-card-img.no-img{background:linear-gradient(135deg,var(--blue-50),var(--teal-50))}.news-card-body{padding:18px 20px;flex:1;display:flex;flex-direction:column;gap:6px}.news-card-body h3{font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;line-height:1.35;color:var(--slate-900);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.news-card-body p{font-size:13px;color:var(--slate-600);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1}
.news-source{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--blue-600)}.news-time{font-size:12px;color:var(--slate-400);margin-top:auto}
.sidebar{display:flex;flex-direction:column;gap:20px}.sidebar-card{background:white;border:1px solid var(--slate-200);border-radius:14px;padding:24px}.sidebar-card h4{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;color:var(--slate-900);margin-bottom:14px}.stat-row{display:flex;gap:12px;margin-bottom:16px}.stat-box{flex:1;background:var(--slate-50);border-radius:10px;padding:14px;text-align:center}.stat-num{font-family:'DM Sans',sans-serif;font-size:24px;font-weight:800;color:var(--blue-600)}.stat-label{font-size:11px;color:var(--slate-500);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px}
.source-list{display:flex;flex-direction:column;gap:8px}.source-item{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--slate-600);padding:6px 0}.source-dot{width:8px;height:8px;border-radius:50%;background:var(--blue-500);flex-shrink:0}
.topic-chip{display:inline-block;padding:6px 14px;background:var(--slate-50);border:1px solid var(--slate-200);border-radius:8px;font-size:13px;font-weight:500;color:var(--slate-700);margin:0 6px 8px 0}
.disclaimer-box{background:var(--blue-50);border:1px solid var(--blue-200);border-radius:12px;padding:16px;font-size:12px;color:var(--slate-600);line-height:1.6}.disclaimer-box strong{color:var(--slate-900);display:block;margin-bottom:4px}
.footer{background:var(--slate-900);color:var(--slate-400);font-size:14px}.footer-inner{max-width:1280px;margin:0 auto;padding:48px 32px 32px}.footer-bottom{border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;display:flex;align-items:center;justify-content:space-between;font-size:13px}
@media(max-width:1024px){.news-layout{grid-template-columns:1fr}.sidebar{display:grid;grid-template-columns:1fr 1fr;gap:16px}}
@media(max-width:768px){.featured-card{grid-template-columns:1fr}.featured-img{min-height:200px}.news-grid{grid-template-columns:1fr}.news-layout{padding:24px 20px 48px}.page-hero{padding:36px 20px 28px}.sidebar{grid-template-columns:1fr}}
@media(max-width:640px){.header-inner{padding:0 20px;height:64px}.nav{display:none}}
</style>
</head>
<body>
<header class="header"><div class="header-inner"><a href="/" class="logo"><div class="logo-tile"><svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="11" cy="12" r="2" fill="#2563EB"/><circle cx="21" cy="12" r="2" fill="#2563EB"/><path d="M 8 19 Q 16 26 24 19" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg><div class="logo-sparkle"><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M 6 0 L 7 4.5 L 12 6 L 7 7.5 L 6 12 L 5 7.5 L 0 6 L 5 4.5 Z"/></svg></div></div><div class="logo-text"><span class="one">health</span><span class="two">rankings</span></div></a><nav class="nav"><a href="/healthrankings-conditions.html">Conditions</a><a href="/healthrankings-devices.html">Devices</a><a href="/healthrankings-articles.html">Articles</a><a href="/healthrankings-drugs.html">Drugs A\u2013Z</a><a href="/healthrankings-news.html" class="active">Health News</a><a href="/healthrankings-about.html">About</a></nav><div class="header-actions"><button class="cta-btn">Get started</button></div></div></header>
<section class="page-hero">
  <div class="update-badge"><span class="live-dot"></span> Updated ${dateStr}</div>
  <h1>Health News</h1>
  <p>${articles.length} articles from ${sources.length} sources. Updated daily.</p>
</section>
<div class="news-layout">
  <div>
    ${featuredHtml}
    ${sectionsHtml}
  </div>
  <aside class="sidebar">
    <div class="sidebar-card"><h4>Coverage</h4><div class="stat-row"><div class="stat-box"><div class="stat-num">${articles.length}</div><div class="stat-label">Articles</div></div><div class="stat-box"><div class="stat-num">${sources.length}</div><div class="stat-label">Sources</div></div></div></div>
    <div class="sidebar-card"><h4>Trending Topics</h4><div><span class="topic-chip">Weight Loss</span><span class="topic-chip">Cancer</span><span class="topic-chip">Heart Disease</span><span class="topic-chip">Diabetes</span><span class="topic-chip">Mental Health</span><span class="topic-chip">FDA</span><span class="topic-chip">Nutrition</span><span class="topic-chip">Sleep</span><span class="topic-chip">Alzheimer's</span><span class="topic-chip">Longevity</span></div></div>
    <div class="sidebar-card"><h4>Top Sources</h4><div class="source-list">${sources.slice(0,10).map(s=>`<div class="source-item"><div class="source-dot"></div>${esc(s)}</div>`).join('')}</div></div>
    <div class="disclaimer-box"><strong>Medical Disclaimer</strong>News articles are for informational purposes only. Always consult a qualified healthcare provider before making medical decisions.</div>
  </aside>
</div>
<footer class="footer"><div class="footer-inner"><div class="footer-bottom"><div>\u00a9 2026 HealthRankings. Made with care in Miami.</div><div style="display:flex;gap:24px"><a href="/healthrankings-about.html">Privacy</a><a href="/healthrankings-about.html">Terms</a><a href="/healthrankings-contact.html">Contact</a></div></div></div></footer>
</body></html>`;
}

// ─── MAIN ───
async function main() {
  console.log('Fetching health news...');
  const data = await httpGet(`https://newsapi.org/v2/top-headlines?category=health&country=us&pageSize=30&apiKey=${API_KEY}`);
  if (data.status !== 'ok') { console.error('API error:', data.message); process.exit(1); }

  const freshArticles = (data.articles||[])
    .filter(a => a.title && a.title !== '[Removed]' && a.url && a.description)
    .map(a => ({ ...a, slug: slugify(a.title) }));

  console.log(`Fetched ${freshArticles.length} fresh articles`);

  // Load existing archive
  let archive = [];
  if (fs.existsSync(ARCHIVE_FILE)) {
    try { archive = JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8')); }
    catch(e) { console.log('Could not parse archive, starting fresh'); }
  }

  // Merge: add new articles, deduplicate by URL
  const existingUrls = new Set(archive.map(a => a.url));
  let newCount = 0;
  for (const a of freshArticles) {
    if (!existingUrls.has(a.url)) {
      archive.unshift(a);
      existingUrls.add(a.url);
      newCount++;
    }
  }

  // Sort by date (newest first) and cap at MAX_ARTICLES
  archive.sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  if (archive.length > MAX_ARTICLES) archive = archive.slice(0, MAX_ARTICLES);

  // Ensure all have slugs
  const usedSlugs = new Set();
  for (const a of archive) {
    if (!a.slug) a.slug = slugify(a.title);
    if (usedSlugs.has(a.slug)) a.slug = a.slug + '-' + Math.random().toString(36).substring(2,6);
    usedSlugs.add(a.slug);
  }

  // Save archive
  fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(archive, null, 0));
  console.log(`Archive: ${archive.length} total articles (${newCount} new)`);

  // Generate individual article pages
  if (!fs.existsSync(NEWS_DIR)) fs.mkdirSync(NEWS_DIR, { recursive: true });
  for (let i = 0; i < archive.length; i++) {
    const a = archive[i];
    const others = archive.filter((_,j) => j !== i).slice(0, 4);
    const pagePath = path.join(NEWS_DIR, `${a.slug}.html`);
    fs.writeFileSync(pagePath, articlePage(a, others));
  }
  console.log(`Generated ${archive.length} individual news pages`);

  // Generate main listing page
  const allSources = [...new Set(archive.map(a => a.source?.name).filter(Boolean))];
  fs.writeFileSync(path.join(ROOT, 'healthrankings-news.html'), listingPage(archive, allSources));
  console.log('Generated main news listing page');

  // Update sitemap with news pages
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    // Remove old news entries
    sitemap = sitemap.replace(/<url>\s*<loc>[^<]*\/news\/[^<]*<\/loc>[\s\S]*?<\/url>\s*/g, '');
    // Add new ones before closing tag
    let newsEntries = '';
    for (const a of archive) {
      newsEntries += `  <url>\n    <loc>https://healthrankings.onrender.com/news/${a.slug}.html</loc>\n    <lastmod>${isoDate}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    }
    sitemap = sitemap.replace('</urlset>', newsEntries + '</urlset>');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`Updated sitemap with ${archive.length} news URLs`);
  }

  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
