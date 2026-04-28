const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://healthrankings.co';

const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

let updated = 0;

for (const file of files) {
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');

  if (html.includes('BreadcrumbList')) continue;

  const bcMatch = html.match(/<nav class="breadcrumb"[^>]*>([\s\S]*?)<\/nav>/);
  if (!bcMatch) continue;

  const bcHtml = bcMatch[1];
  const items = [];

  const linkRe = /<a href="([^"]+)">([^<]+)<\/a>/g;
  let m;
  while ((m = linkRe.exec(bcHtml)) !== null) {
    items.push({ url: m[1], name: m[2].trim() });
  }

  const currentMatch = bcHtml.match(/<span class="breadcrumb-current">([^<]+)<\/span>/);
  if (currentMatch) {
    items.push({ url: '/' + file, name: currentMatch[1].trim() });
  }

  if (items.length < 2) continue;

  const schemaItems = items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : BASE + item.url
  }));

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: schemaItems
  });

  const tag = `<script type="application/ld+json">\n${schema}\n</script>`;

  html = html.replace('</head>', tag + '\n</head>');

  fs.writeFileSync(fp, html, 'utf8');
  updated++;
}

console.log(`Injected BreadcrumbList schema into ${updated} files.`);
