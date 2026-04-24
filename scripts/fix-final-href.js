const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

const map = {
  'Medical review board': '/healthrankings-about.html',
  'Disclosures': '/healthrankings-about.html',
  'Newsletter': '/healthrankings-contact.html',
  'Careers': '/healthrankings-contact.html',
  'Press': '/healthrankings-contact.html',
  'Accessibility': '/healthrankings-about.html',
  'Sleep trackers': '/healthrankings-sleep-apnea.html',
  'privacy policy': '/healthrankings-about.html',
};

let fixed = 0;

for (const file of files) {
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');
  const orig = html;

  for (const [text, url] of Object.entries(map)) {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<a href="#"([^>]*)>\\s*${escaped}\\s*</a>`, 'g');
    html = html.replace(re, `<a href="${url}"$1>${text}</a>`);
  }

  /* RankedRx → and RankedRx &rarr; → homepage */
  html = html.replace(/<a href="#">RankedRx[^<]*<\/a>/g,
    '<a href="/">HealthRankings</a>');

  /* related-card with href="#" → link to articles */
  html = html.replace(/<a href="#" class="related-card">/g,
    '<a href="/healthrankings-articles.html" class="related-card">');

  if (html !== orig) {
    fs.writeFileSync(fp, html);
    fixed++;
  }
}

console.log(`Fixed ${fixed} files`);
