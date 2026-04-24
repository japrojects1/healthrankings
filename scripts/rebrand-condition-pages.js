#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const exclude = /-(review|top5|all-|homepage|conditions|devices|drugs|news|preview|privacy|terms)/;
const files = fs.readdirSync(dir)
  .filter(f => f.startsWith('healthrankings-') && f.endsWith('.html') && !exclude.test(f))
  .filter(f => f !== 'healthrankings-hypertension.html'); // already done

const NEW_NAV = `<header class="header">
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-tile">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <circle cx="11" cy="12" r="2" fill="#2563EB"/>
          <circle cx="21" cy="12" r="2" fill="#2563EB"/>
          <path d="M 8 19 Q 16 26 24 19" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        </svg>
        <div class="logo-sparkle">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
            <path d="M 6 0 L 7 4.5 L 12 6 L 7 7.5 L 6 12 L 5 7.5 L 0 6 L 5 4.5 Z"/>
          </svg>
        </div>
      </div>
      <div class="logo-text">
        <span class="one">health</span><span class="two">rankings</span>
      </div>
    </a>
    <nav class="nav">
      <a href="/healthrankings-conditions.html">Conditions</a>
      <a href="/healthrankings-devices.html">Devices</a>
      <a href="#">Drugs A–Z</a>
      <a href="#">Health News</a>
      <a href="#">About</a>
    </nav>
  </div>
</header>`;

const NEW_FOOTER = `<footer class="footer">
  <div class="footer-inner">
    <div class="footer-disclosure">
      <strong>How we fund our work.</strong> HealthRankings earns a small commission when you buy through the links on this page — but our rankings can't be influenced by advertisers. We buy every product we test at retail, and our medical reviewers have no financial relationship with any brand we cover.
    </div>
    <div class="footer-bottom">
      <div>© 2026 HealthRankings. Made with care in Miami.</div>
      <div class="footer-bottom-links">
        <a href="/healthrankings-privacy-policy.html">Privacy</a>
        <a href="/healthrankings-terms-of-service.html">Terms</a>
        <a href="#">Editorial Policy</a>
        <a href="#">Contact</a>
      </div>
    </div>
  </div>
</footer>`;

// This is the same CSS used for top5 pages (they share the same element classes)
const NEW_CSS = fs.readFileSync(path.join(__dirname, 'condition-page-css.txt'), 'utf8');

let updated = 0;

files.forEach(filename => {
  const filepath = path.join(dir, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  // Replace CSS: everything from <link href="https://fonts... through </style>
  html = html.replace(
    /<link href="https:\/\/fonts\.googleapis\.com[^"]*"[^>]*>\s*<style>[\s\S]*?<\/style>/,
    `<meta name="theme-color" content="#0F172A">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${NEW_CSS}</style>`
  );

  // Replace old nav
  html = html.replace(
    /<nav>[\s\S]*?<\/nav>\s*/,
    NEW_NAV + '\n\n'
  );

  // Replace old footer
  html = html.replace(
    /<footer>[\s\S]*?<\/footer>/,
    NEW_FOOTER
  );

  fs.writeFileSync(filepath, html, 'utf8');
  updated++;
  console.log(`✓ ${filename}`);
});

console.log(`\nDone — updated ${updated} files.`);
