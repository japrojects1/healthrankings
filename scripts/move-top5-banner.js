const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..');

const reviewFiles = fs.readdirSync(dir).filter(f => f.startsWith('healthrankings-review-') && f.endsWith('.html'));
let moved = 0, skipped = 0;

for (const file of reviewFiles) {
  const fp = path.join(dir, file);
  let html = fs.readFileSync(fp, 'utf8');

  if (!html.includes('top5-callout')) {
    skipped++;
    continue;
  }

  const bannerRegex = /\n<div class="top5-callout">[\s\S]*?<\/div>\n/;
  const bannerMatch = html.match(bannerRegex);
  if (!bannerMatch) {
    skipped++;
    continue;
  }

  const banner = bannerMatch[0];

  html = html.replace(banner, '\n');

  const insertTarget = '</div>\n\n<div class="jump-nav">';
  const insertTargetAlt = '</div>\n<div class="jump-nav">';

  if (html.includes(insertTarget)) {
    html = html.replace(insertTarget, '</div>\n' + banner + '\n<div class="jump-nav">');
    moved++;
  } else if (html.includes(insertTargetAlt)) {
    html = html.replace(insertTargetAlt, '</div>\n' + banner + '\n<div class="jump-nav">');
    moved++;
  } else {
    const jumpIdx = html.indexOf('<div class="jump-nav">');
    if (jumpIdx !== -1) {
      html = html.substring(0, jumpIdx) + banner + '\n' + html.substring(jumpIdx);
      moved++;
    } else {
      skipped++;
      continue;
    }
  }

  fs.writeFileSync(fp, html);
}

console.log(`Moved: ${moved} | Skipped: ${skipped}`);
