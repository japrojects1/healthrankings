const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const exclude = new Set([
  'index.html','homepage.html','preview.html','404.html',
  'healthrankings-homepage.html','healthrankings-devices.html',
  'healthrankings-conditions.html','healthrankings-articles.html',
  'healthrankings-news.html','healthrankings-drugs.html',
  'healthrankings-about.html','healthrankings-contact.html',
  'healthrankings-privacy-policy.html','healthrankings-terms-of-service.html'
]);

const files = fs.readdirSync(ROOT).filter(f =>
  f.endsWith('.html') && !f.includes('-top5') && !f.includes('-all-') &&
  !f.includes('-review-') && !f.includes('-article-') && !exclude.has(f)
);

let n = 0;
for (const f of files) {
  const fp = path.join(ROOT, f);
  let h = fs.readFileSync(fp, 'utf8');
  const o = h;

  /* Winner-hero: set margin to 0 */
  h = h.replace(/(\.winner-hero\s*\{[^}]*?)margin:\s*\d+px\s+auto/g, '$1margin: 0 auto');

  /* Primer inline style: set margin to 0 */
  h = h.replace(/class="primer" style="[^"]*margin:\s*\d+px\s+auto/g, (m) =>
    m.replace(/margin:\s*\d+px\s+auto/, 'margin:0 auto')
  );

  if (h !== o) { fs.writeFileSync(fp, h); n++; }
}

console.log('Updated', n, 'condition pages');
