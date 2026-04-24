const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updated = 0;

for (const file of files) {
  const fp = path.join(dir, file);
  let html = fs.readFileSync(fp, 'utf8');

  if (html.includes('/healthrankings-articles.html')) continue;

  const patterns = [
    // Pattern 1: homepage/conditions/about style with header-actions
    {
      find: /(<a href="[^"]*">Devices<\/a>\s*\n\s*<a href="#">Drugs A..Z<\/a>)/g,
      replace: (m, g) => g + '\n      <a href="/healthrankings-articles.html">Articles</a>'
    },
    // Pattern 2: &ndash; variant
    {
      find: /(<a href="[^"]*">Devices<\/a>\s*\n\s*<a href="#">Drugs A&ndash;Z<\/a>)/g,
      replace: (m, g) => g + '\n      <a href="/healthrankings-articles.html">Articles</a>'
    }
  ];

  let changed = false;
  for (const p of patterns) {
    if (p.find.test(html)) {
      p.find.lastIndex = 0;
      html = html.replace(p.find, p.replace);
      changed = true;
      break;
    }
  }

  if (!changed) {
    // Fallback: insert after Devices link via broader regex
    const rx = /(<a href="[^"]*healthrankings-devices\.html">Devices<\/a>)/;
    if (rx.test(html)) {
      html = html.replace(rx, '$1\n      <a href="/healthrankings-articles.html">Articles</a>');
      changed = true;
    }
  }

  if (!changed) {
    // Last fallback: insert after any "Devices</a>" inside <nav>
    const rx2 = /(>Devices<\/a>)/;
    if (rx2.test(html)) {
      html = html.replace(rx2, '$1\n      <a href="/healthrankings-articles.html">Articles</a>');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(fp, html, 'utf8');
    updated++;
  }
}

console.log(`Updated ${updated} files with Articles nav link.`);
