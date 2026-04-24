const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('-top5.html'));

const reviewFiles = new Set(
  fs.readdirSync(ROOT).filter(f => f.startsWith('healthrankings-review-'))
);

let fixed = 0;

for (const file of files) {
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');
  const orig = html;

  /* Remove product-cta-secondary links that point to # */
  html = html.replace(/<a href="#" class="product-cta-secondary">Read full review<\/a>/g, '');

  /* Product-cta links pointing to # → link to the devices page */
  html = html.replace(/<a href="#" class="product-cta">([\s\S]*?)<\/a>/g,
    '<a href="/healthrankings-devices.html" class="product-cta">$1</a>');

  /* Winner-cta links pointing to # → link to devices page */
  html = html.replace(/<a href="#" class="winner-cta">([\s\S]*?)<\/a>/g,
    '<a href="/healthrankings-devices.html" class="winner-cta">$1</a>');

  if (html !== orig) {
    fs.writeFileSync(fp, html);
    fixed++;
  }
}

console.log(`Fixed ${fixed} top5 files`);
