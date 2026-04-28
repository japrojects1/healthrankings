const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://healthrankings.co';
const dir = path.resolve(__dirname, '..');

function mtimeIsoDay(filePath) {
  try {
    return fs.statSync(filePath).mtime.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

const exclude = new Set([
  'index.html',
  'healthrankings-homepage.html',
  'healthrankings-preview.html',
  '404.html',
  'homepage.html',
]);

const rootHtml = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.html') && !exclude.has(f))
  .sort();

const newsDir = path.join(dir, 'news');
const newsHtml = fs.existsSync(newsDir)
  ? fs.readdirSync(newsDir).filter((f) => f.endsWith('.html')).sort()
  : [];

const homePagePath = path.join(dir, 'healthrankings-homepage.html');
const indexPath = path.join(dir, 'index.html');
let homeMtime = 0;
for (const p of [homePagePath, indexPath]) {
  try {
    homeMtime = Math.max(homeMtime, fs.statSync(p).mtimeMs);
  } catch {
    /* skip */
  }
}
const homeLast =
  homeMtime > 0
    ? new Date(homeMtime).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

const priorityMap = (f) => {
  if (f === 'healthrankings-news.html') return '0.85';
  if (f === 'healthrankings-conditions.html' || f === 'healthrankings-devices.html' || f === 'healthrankings-articles.html')
    return '0.9';
  if (f === 'healthrankings-about.html' || f === 'healthrankings-contact.html') return '0.7';
  if (f.includes('-top5')) return '0.8';
  if (f.includes('-review-')) return '0.7';
  if (f.includes('-article-')) return '0.7';
  if (f.includes('-all-')) return '0.6';
  return '0.6';
};

const freqMap = (f) => {
  if (f === 'healthrankings-news.html') return 'daily';
  if (f.includes('-top5') || f === 'healthrankings-devices.html') return 'weekly';
  if (f.includes('-review-') || f.includes('-article-')) return 'monthly';
  return 'monthly';
};

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${homeLast}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

for (const f of rootHtml) {
  const fp = path.join(dir, f);
  xml += `  <url>
    <loc>${DOMAIN}/${f}</loc>
    <lastmod>${mtimeIsoDay(fp)}</lastmod>
    <changefreq>${freqMap(f)}</changefreq>
    <priority>${priorityMap(f)}</priority>
  </url>
`;
}

for (const f of newsHtml) {
  const fp = path.join(newsDir, f);
  xml += `  <url>
    <loc>${DOMAIN}/news/${f}</loc>
    <lastmod>${mtimeIsoDay(fp)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.65</priority>
  </url>
`;
}

xml += `</urlset>`;

fs.writeFileSync(path.join(dir, 'sitemap.xml'), xml);
console.log(
  `Sitemap: homepage + ${rootHtml.length} root pages + ${newsHtml.length} news pages = ${1 + rootHtml.length + newsHtml.length} URLs`
);

// Atom feed from archive (same URLs as /news/*.html) — helps crawlers discover fresh news.
function escXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const archivePath = path.join(dir, 'data', 'news-archive.json');
const feedPath = path.join(dir, 'news-feed.xml');
if (fs.existsSync(archivePath)) {
  try {
    const archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
    if (Array.isArray(archive) && archive.length) {
      const builtIso = new Date().toISOString();
      const FEED_MAX = 50;
      const items = archive.slice(0, FEED_MAX);
      let entries = '';
      for (const a of items) {
        if (!a.slug) continue;
        const title = escXml(a.title?.split(' - ')[0] || a.title);
        const pageUrl = `${DOMAIN}/news/${a.slug}.html`;
        const pub = new Date(a.publishedAt).toISOString();
        const summary = escXml((a.description || '').substring(0, 600));
        entries += `  <entry>
    <title>${title}</title>
    <link href="${escXml(pageUrl)}" rel="alternate" type="text/html"/>
    <id>${escXml(pageUrl)}</id>
    <published>${pub}</published>
    <updated>${pub}</updated>
    <summary type="text">${summary}</summary>
  </entry>
`;
      }
      const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>HealthRankings — Health News</title>
  <subtitle>Latest US health headlines. Full list: ${DOMAIN}/healthrankings-news.html</subtitle>
  <link href="${DOMAIN}/healthrankings-news.html" rel="alternate" type="text/html"/>
  <link href="${DOMAIN}/news-feed.xml" rel="self"/>
  <id>${DOMAIN}/news-feed.xml#feed</id>
  <updated>${builtIso}</updated>
  <generator>HealthRankings generate-sitemap.js</generator>
${entries}</feed>
`;
      fs.writeFileSync(feedPath, atom);
      console.log(`news-feed.xml: ${items.length} entries`);
    }
  } catch (e) {
    console.warn('news-feed.xml skipped:', e.message);
  }
}
