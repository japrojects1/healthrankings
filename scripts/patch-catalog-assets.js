const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = fs.readdirSync(root).filter((f) => f.startsWith('healthrankings-all-') && f.endsWith('.html'));

const LINK = '\n<link rel="stylesheet" href="/catalog-list.css">\n';
const SCRIPTS = `
<script src="/catalog-product-images.js"></script>
<script src="/catalog-list.js"></script>
`;

for (const f of files) {
  const p = path.join(root, f);
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes('catalog-list.css')) {
    console.log('skip (already patched)', f);
    continue;
  }
  if (!html.includes('</head>')) {
    console.warn('no </head>', f);
    continue;
  }
  html = html.replace('</head>', LINK + '</head>');
  html = html.replace('</body>', SCRIPTS + '</body>');
  fs.writeFileSync(p, html, 'utf8');
  console.log('patched', f);
}
