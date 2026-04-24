const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..');

const reviewFiles = fs.readdirSync(dir).filter(f => f.startsWith('healthrankings-review-') && f.endsWith('.html'));

const oldCSS = `.top5-callout{max-width:900px;margin:0 auto 0;padding:0 32px;}`;
const newCSS = `.top5-callout{max-width:900px;margin:-12px auto 12px;padding:0 32px;position:sticky;top:77px;z-index:40;}`;

let updated = 0;

for (const file of reviewFiles) {
  const fp = path.join(dir, file);
  let html = fs.readFileSync(fp, 'utf8');

  if (!html.includes('top5-callout')) continue;

  if (html.includes(oldCSS)) {
    html = html.replace(oldCSS, newCSS);

    const oldInner = `.top5-callout-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);border:1px solid #BFDBFE;border-radius:12px;padding:14px 20px;transition:all 280ms cubic-bezier(0.4,0,0.2,1)}`;
    const newInner = `.top5-callout-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);border:1px solid #BFDBFE;border-radius:12px;padding:14px 20px;transition:all 280ms cubic-bezier(0.4,0,0.2,1);box-shadow:0 4px 12px -2px rgba(37,99,235,0.08),0 2px 4px -1px rgba(0,0,0,0.04)}`;

    html = html.replace(oldInner, newInner);
    fs.writeFileSync(fp, html);
    updated++;
  }
}

console.log(`Updated: ${updated}`);
