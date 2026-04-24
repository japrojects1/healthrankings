const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://healthrankings.onrender.com';
const dir = path.resolve(__dirname, '..');
const today = new Date().toISOString().split('T')[0];

const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'healthrankings-homepage.html' && f !== 'healthrankings-preview.html')
  .sort();

const priorityMap = (f) => {
  if (f === 'healthrankings-conditions.html' || f === 'healthrankings-devices.html' || f === 'healthrankings-articles.html') return '0.9';
  if (f === 'healthrankings-about.html' || f === 'healthrankings-contact.html') return '0.7';
  if (f.includes('-top5')) return '0.8';
  if (f.includes('-review-')) return '0.7';
  if (f.includes('-article-')) return '0.7';
  if (f.includes('-all-')) return '0.6';
  return '0.6';
};

const freqMap = (f) => {
  if (f.includes('-top5') || f === 'healthrankings-devices.html') return 'weekly';
  if (f.includes('-review-') || f.includes('-article-')) return 'monthly';
  return 'monthly';
};

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

for (const f of files) {
  xml += `  <url>
    <loc>${DOMAIN}/${f}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${freqMap(f)}</changefreq>
    <priority>${priorityMap(f)}</priority>
  </url>
`;
}

xml += `</urlset>`;

fs.writeFileSync(path.join(dir, 'sitemap.xml'), xml);
console.log(`Sitemap generated with ${files.length + 1} URLs (homepage + ${files.length} pages)`);
