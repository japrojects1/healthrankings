const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..');

const reviewFiles = fs.readdirSync(dir).filter(f => f.startsWith('healthrankings-review-') && f.endsWith('.html'));
let updated = 0;

for (const file of reviewFiles) {
  const fp = path.join(dir, file);
  let html = fs.readFileSync(fp, 'utf8');

  if (!html.includes('review-back-links')) continue;

  let changed = false;

  if (html.includes('padding: 24px 32px 0;')) {
    html = html.replace(
      /\.review-back-links \{([^}]*?)padding: 24px 32px 0;/,
      '.review-back-links {$1padding: 8px 32px 0;'
    );
    changed = true;
  }

  if (html.includes('.review-back-links { padding: 20px 20px 0; }')) {
    html = html.replace(
      '.review-back-links { padding: 20px 20px 0; }',
      '.review-back-links { padding: 8px 20px 0; }'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fp, html);
    updated++;
  }
}

console.log(`Updated: ${updated}`);
