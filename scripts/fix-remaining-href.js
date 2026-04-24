const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

let totalFixed = 0;

for (const file of files) {
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');
  const orig = html;

  /* Nav: Drugs A–Z (HTML entity variant) */
  html = html.replace(/<a href="#">Drugs A&ndash;Z<\/a>/g,
    '<a href="/healthrankings-drugs.html">Drugs A\u2013Z</a>');

  /* Nav: About */
  html = html.replace(/<a href="#">About<\/a>/g,
    '<a href="/healthrankings-about.html">About</a>');

  /* Footer: remaining link text matches */
  const footerMap = {
    'Heart health': '/healthrankings-hypertension.html',
    'Diabetes': '/healthrankings-diabetes-body-composition.html',
    'Sleep': '/healthrankings-sleep-apnea.html',
    "Women's health":'/healthrankings-pcos-ovulation-monitor.html',
    "Women&#39;s health":'/healthrankings-pcos-ovulation-monitor.html',
    'Blood pressure': '/healthrankings-all-blood-pressure-monitors.html',
    'Glucose meters': '/healthrankings-all-glucometers-cgm.html',
    'Smart scales': '/healthrankings-all-body-composition-monitors.html',
    'Pulse oximeters': '/healthrankings-all-pulse-oximeters.html',
    'View all': '/healthrankings-conditions.html',
    'About us': '/healthrankings-about.html',
    'Methodology': '/healthrankings-about.html',
    'Editorial policy': '/healthrankings-about.html',
    'Editorial Policy': '/healthrankings-about.html',
    'Articles': '/healthrankings-articles.html',
    'Contact': '/healthrankings-contact.html',
    'Contact us': '/healthrankings-contact.html',
    'All devices': '/healthrankings-devices.html',
    'All conditions': '/healthrankings-conditions.html',
    'Privacy': '/healthrankings-about.html',
    'Terms': '/healthrankings-about.html',
  };

  for (const [text, url] of Object.entries(footerMap)) {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<a href="#">\\s*${escaped}\\s*</a>`, 'g');
    html = html.replace(re, `<a href="${url}">${text}</a>`);
  }

  /* "Read our full methodology" link */
  html = html.replace(/<a href="#"([^>]*)>Read our full methodology[^<]*<\/a>/g,
    '<a href="/healthrankings-about.html"$1>Read our full methodology \u2192</a>');

  /* Review pages: "Check Price on Amazon" final-cta — link to the review page itself or the top5 */
  if (file.startsWith('healthrankings-review-')) {
    html = html.replace(/<a href="#" class="final-cta">[^<]*<\/a>/g,
      '<a href="/healthrankings-hypertension-top5.html" class="final-cta">See Top 5 Picks \u2192</a>');
  }

  /* Top5 pages: winner-cta and product-cta that still point to # */
  if (file.includes('-top5')) {
    /* For product-cta links, find the nearby product-cta-secondary link and use the same URL */
    html = html.replace(/<a href="#" class="product-cta">([\s\S]*?)<\/a>\s*<a href="([^"]+)" class="product-cta-secondary">/g,
      (match, inner, url) => `<a href="${url}" class="product-cta">${inner}</a>\n        <a href="${url}" class="product-cta-secondary">`
    );

    /* winner-cta: find the nearby product-cta-secondary */
    html = html.replace(/<a href="#" class="winner-cta">([\s\S]*?)<\/a>([\s\S]*?)<a href="([^"]+)" class="product-cta-secondary">/g,
      (match, inner, between, url) => `<a href="${url}" class="winner-cta">${inner}</a>${between}<a href="${url}" class="product-cta-secondary">`
    );
  }

  /* Logo href="#" */
  html = html.replace(/<a href="#" class="logo">/g, '<a href="/" class="logo">');

  if (html !== orig) {
    fs.writeFileSync(fp, html);
    totalFixed++;
  }
}

console.log(`Fixed ${totalFixed} files`);
