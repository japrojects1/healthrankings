const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..');

const reviewFiles = fs.readdirSync(dir).filter(f => f.startsWith('healthrankings-review-') && f.endsWith('.html'));
let fixed = 0, skipped = 0;

for (const file of reviewFiles) {
  const fp = path.join(dir, file);
  let html = fs.readFileSync(fp, 'utf8');

  if (!html.includes('top5-callout')) {
    skipped++;
    continue;
  }

  const hrefMatch = html.match(/href="(\/healthrankings-[^"]*-top5\.html)"/);
  const labelMatch = html.match(/See our ([^<]+) of 2026/);

  if (!hrefMatch || !labelMatch) {
    skipped++;
    continue;
  }

  const top5Href = hrefMatch[1];
  const label = labelMatch[1].trim();

  const fullBanner = `<div class="top5-callout">
  <a href="${top5Href}" class="top5-callout-inner">
    <div class="top5-callout-left">
      <span class="top5-callout-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg> TOP 5</span>
      <span class="top5-callout-text">See our ${label} of 2026 \u2014 expert tested & ranked</span>
    </div>
    <span class="top5-callout-arrow">View rankings <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></span>
  </a>
</div>`;

  // Remove ALL top5-callout fragments
  // Remove any line containing top5-callout-related content between </nav> and <div class="page-intro">
  // and between </div> (page-intro close) and <div class="jump-nav">
  
  // Strategy: remove everything related to top5-callout from HTML body, then re-insert cleanly
  html = html.replace(/<div class="top5-callout">[\s\S]*?<\/div>\s*\n/g, '');
  // Clean up orphaned fragments
  html = html.replace(/\s*<span class="top5-callout-arrow">[\s\S]*?<\/span>\s*\n\s*<\/a>\s*\n\s*<\/div>\s*\n/g, '\n');
  html = html.replace(/\s*<span class="top5-callout-text">[^<]*<\/span>\s*\n\s*<\/div>\s*\n/g, '\n');

  // Now insert the clean banner right before <div class="jump-nav">
  if (html.includes('<div class="jump-nav">')) {
    html = html.replace('<div class="jump-nav">', fullBanner + '\n\n<div class="jump-nav">');
  }

  fs.writeFileSync(fp, html);
  fixed++;
}

console.log(`Fixed: ${fixed} | Skipped: ${skipped}`);
