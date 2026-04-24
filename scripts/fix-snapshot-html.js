const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const SKIP = new Set([
  'healthrankings-homepage.html','healthrankings-conditions.html',
  'healthrankings-devices.html','healthrankings-about.html',
  'healthrankings-drugs.html','healthrankings-news.html','healthrankings-preview.html'
]);

const files = fs.readdirSync(ROOT)
  .filter(f => f.startsWith('healthrankings-') && f.endsWith('.html'))
  .filter(f => !f.includes('-top5') && !f.includes('-all-') && !f.includes('-review-'))
  .filter(f => !SKIP.has(f));

let count = 0;
files.forEach(f => {
  const fp = path.join(ROOT, f);
  let html = fs.readFileSync(fp, 'utf8');
  if (!html.includes('condition-snapshot')) return;
  if (html.includes('snapshot-left')) return;

  // Insert <div class="snapshot-left"> after snapshot-card opening
  const cardOpen = '<div class="snapshot-card">';
  const cardIdx = html.indexOf(cardOpen);
  if (cardIdx === -1) return;

  const afterCard = cardIdx + cardOpen.length;
  const tagDiv = html.indexOf('<div class="snapshot-tag"', afterCard);
  if (tagDiv === -1) return;

  // Insert snapshot-left wrapper before the tag div
  const insertOpen = tagDiv;
  // Find where to close it: right before <div class="snapshot-stats">
  const statsDiv = html.indexOf('<div class="snapshot-stats">', afterCard);
  if (statsDiv === -1) return;

  // Find the newline before stats div
  let closeAt = html.lastIndexOf('\n', statsDiv);

  // Build new HTML
  const before = html.substring(0, insertOpen);
  const leftContent = html.substring(insertOpen, closeAt);
  const after = html.substring(closeAt);

  html = before + '<div class="snapshot-left">\n' + leftContent + '\n    </div>' + after;

  fs.writeFileSync(fp, html);
  count++;
});
console.log(`Updated HTML structure in ${count} files`);
