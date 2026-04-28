const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://healthrankings.co';
const dir = path.resolve(__dirname, '..');

const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'healthrankings-homepage.html' && f !== 'healthrankings-preview.html')
  .sort();

let updated = 0;
let skipped = 0;

for (const f of files) {
  const fp = path.join(dir, f);
  let html = fs.readFileSync(fp, 'utf8');

  if (html.includes('rel="icon"') && html.includes('rel="canonical"')) {
    skipped++;
    continue;
  }

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1] : 'HealthRankings';
  
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  const desc = descMatch ? descMatch[1] : title;

  const slug = f === 'healthrankings-about.html' ? 'healthrankings-about.html'
    : f;
  const canonicalUrl = `${DOMAIN}/${slug}`;

  const faviconTag = `<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg">`;
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}">`;
  const ogTags = `<meta property="og:type" content="website">
<meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
<meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:site_name" content="HealthRankings">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}">
<meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}">`;

  const insertBlock = `${faviconTag}\n${canonicalTag}\n${ogTags}`;

  if (!html.includes('rel="icon"')) {
    if (html.includes('<link rel="preconnect"')) {
      html = html.replace('<link rel="preconnect"', insertBlock + '\n<link rel="preconnect"');
    } else if (html.includes('</head>')) {
      html = html.replace('</head>', insertBlock + '\n</head>');
    }
  }

  fs.writeFileSync(fp, html);
  updated++;
}

console.log(`Updated: ${updated}, Skipped (already had tags): ${skipped}`);
