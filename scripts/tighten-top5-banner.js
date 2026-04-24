const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..');

const reviewFiles = fs.readdirSync(dir).filter(f => f.startsWith('healthrankings-review-') && f.endsWith('.html'));

const oldCSS = `.top5-callout{max-width:900px;margin:-12px auto 12px;padding:0 32px;position:sticky;top:77px;z-index:40;}`;
const newCSS = `.top5-callout{max-width:900px;margin:-20px auto 8px;padding:0 32px;position:sticky;top:77px;z-index:40;}`;

let updated = 0;

for (const file of reviewFiles) {
  const fp = path.join(dir, file);
  let html = fs.readFileSync(fp, 'utf8');
  if (html.includes(oldCSS)) {
    html = html.replace(oldCSS, newCSS);
    fs.writeFileSync(fp, html);
    updated++;
  }
}

console.log(`Updated: ${updated}`);
