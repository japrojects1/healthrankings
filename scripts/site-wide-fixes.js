const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.html') && !['index.html', 'homepage.html', 'preview.html'].includes(f));

/* ── href="#" replacement map ── */
const LINK_MAP = {
  'Drugs A–Z':    '/healthrankings-drugs.html',
  'Drugs A-Z':    '/healthrankings-drugs.html',
  'Health News':  '/healthrankings-news.html',
  'Heart health': '/healthrankings-hypertension.html',
  'Diabetes':     '/healthrankings-diabetes-body-composition.html',
  'Sleep':        '/healthrankings-sleep-apnea.html',
  "Women's health":'/healthrankings-pcos-ovulation-monitor.html',
  'Blood pressure':'/healthrankings-all-blood-pressure-monitors.html',
  'Glucose meters':'/healthrankings-all-glucometers-cgm.html',
  'Smart scales': '/healthrankings-all-body-composition-monitors.html',
  'Pulse oximeters':'/healthrankings-all-pulse-oximeters.html',
  'View all':     '/healthrankings-conditions.html',
  'About us':     '/healthrankings-about.html',
  'Methodology':  '/healthrankings-about.html',
  'Editorial policy':'/healthrankings-about.html',
  'Editorial Policy':'/healthrankings-about.html',
  'Articles':     '/healthrankings-articles.html',
  'Contact':      '/healthrankings-contact.html',
  'Contact us':   '/healthrankings-contact.html',
  'All devices':  '/healthrankings-devices.html',
  'All conditions':'/healthrankings-conditions.html',
  'Privacy':      '/healthrankings-about.html',
  'Terms':        '/healthrankings-about.html',
};

/* ── hamburger CSS ── */
const HAMBURGER_CSS = `
/* ===== MOBILE NAV ===== */
.hamburger-btn{display:none;width:44px;height:44px;border-radius:50%;background:transparent;border:none;cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:0;z-index:60}
.hamburger-btn span{display:block;width:22px;height:2.5px;background:var(--slate-900,#0F172A);border-radius:2px;transition:all .3s ease}
.mobile-drawer{position:fixed;top:0;right:-100%;width:min(320px,85vw);height:100vh;background:#fff;z-index:100;box-shadow:-4px 0 24px rgba(0,0,0,.12);transition:right .35s ease;display:flex;flex-direction:column;overflow-y:auto}
.mobile-drawer.open{right:0}
.mobile-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:90;opacity:0;pointer-events:none;transition:opacity .3s}
.mobile-overlay.open{opacity:1;pointer-events:auto}
.mobile-drawer-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #E2E8F0}
.mobile-drawer-close{width:40px;height:40px;border-radius:50%;background:#F1F5F9;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;color:#334155}
.mobile-drawer-close:hover{background:#E2E8F0}
.mobile-drawer-nav{padding:16px 0}
.mobile-drawer-nav a{display:flex;align-items:center;padding:14px 24px;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:500;color:#0F172A;text-decoration:none;transition:background .15s}
.mobile-drawer-nav a:hover,.mobile-drawer-nav a.active{background:#EFF6FF;color:#2563EB}
.mobile-drawer-footer{margin-top:auto;padding:20px 24px;border-top:1px solid #E2E8F0}
.mobile-drawer-footer a{display:block;padding:8px 0;font-size:14px;color:#64748B;text-decoration:none}
@media(max-width:768px){.hamburger-btn{display:flex}.cta-btn{display:none}}
`;

/* ── hamburger button HTML (injected inside .header-actions, before search-btn) ── */
const HAMBURGER_BTN = `<button class="hamburger-btn" onclick="document.getElementById('mobileDrawer').classList.add('open');document.getElementById('mobileOverlay').classList.add('open');document.body.style.overflow='hidden'" aria-label="Menu"><span></span><span></span><span></span></button>`;

/* ── mobile drawer HTML ── */
const MOBILE_DRAWER = `
<div class="mobile-overlay" id="mobileOverlay" onclick="document.getElementById('mobileDrawer').classList.remove('open');this.classList.remove('open');document.body.style.overflow=''"></div>
<div class="mobile-drawer" id="mobileDrawer">
<div class="mobile-drawer-header">
<div style="font-family:'DM Sans',sans-serif;font-size:18px;font-weight:700"><span style="color:#0F172A">health</span><span style="background:linear-gradient(135deg,#14B8A6,#0D9488);-webkit-background-clip:text;background-clip:text;color:transparent">rankings</span></div>
<button class="mobile-drawer-close" onclick="this.closest('.mobile-drawer').classList.remove('open');document.getElementById('mobileOverlay').classList.remove('open');document.body.style.overflow=''">&times;</button>
</div>
<nav class="mobile-drawer-nav">
<a href="/">Home</a>
<a href="/healthrankings-conditions.html">Conditions</a>
<a href="/healthrankings-devices.html">Devices</a>
<a href="/healthrankings-articles.html">Articles</a>
<a href="/healthrankings-drugs.html">Drugs A\u2013Z</a>
<a href="/healthrankings-news.html">Health News</a>
<a href="/healthrankings-about.html">About</a>
<a href="/healthrankings-contact.html">Contact</a>
</nav>
<div class="mobile-drawer-footer">
<a href="/healthrankings-hypertension-top5.html">Top 5 BP Monitors</a>
<a href="/healthrankings-weight-management-body-composition-top5.html">Top 5 Smart Scales</a>
<a href="/healthrankings-all-blood-pressure-monitors.html">All BP Monitors</a>
<a href="/healthrankings-all-body-composition-monitors.html">All Smart Scales</a>
</div>
</div>`;

let fixedCount = 0;
let hamburgerCount = 0;
let linkFixCount = 0;

for (const file of files) {
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');
  let changed = false;

  /* ─── 1. Fix href="#" links by matching the link text ─── */
  for (const [text, url] of Object.entries(LINK_MAP)) {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<a\\s+href="#"([^>]*)>\\s*${escaped}\\s*</a>`, 'g');
    const before = html;
    html = html.replace(re, (match, attrs) => `<a href="${url}"${attrs}>${text}</a>`);
    if (html !== before) { changed = true; linkFixCount++; }
  }

  /* Also fix "Read our full methodology →" */
  if (html.includes('href="#"') && html.includes('methodology')) {
    html = html.replace(/<a href="#"([^>]*)>Read our full methodology[^<]*<\/a>/g,
      '<a href="/healthrankings-about.html"$1>Read our full methodology \u2192</a>');
    changed = true;
  }

  /* Fix nav "Drugs A–Z" and "Health News" that may have different structures */
  html = html.replace(/<a href="#">Drugs A.Z<\/a>/g, '<a href="/healthrankings-drugs.html">Drugs A\u2013Z</a>');
  html = html.replace(/<a href="#">Health News<\/a>/g, '<a href="/healthrankings-news.html">Health News</a>');

  /* Fix logo href="#" → "/" */
  html = html.replace(/<a href="#" class="logo">/g, '<a href="/" class="logo">');

  /* ─── 2. Add hamburger menu if not already present ─── */
  if (!html.includes('hamburger-btn')) {
    /* Inject CSS before closing </style> */
    const styleClose = html.lastIndexOf('</style>');
    if (styleClose !== -1) {
      html = html.slice(0, styleClose) + HAMBURGER_CSS + html.slice(styleClose);
      changed = true;
    }

    /* Inject hamburger button into header-actions (before search-btn) */
    html = html.replace(
      /<div class="header-actions">/g,
      `<div class="header-actions">${HAMBURGER_BTN}`
    );

    /* Inject mobile drawer right after </header> */
    html = html.replace(
      /<\/header>/,
      `</header>${MOBILE_DRAWER}`
    );
    hamburgerCount++;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fp, html);
    fixedCount++;
  }
}

console.log(`\nDone! Modified ${fixedCount} files.`);
console.log(`  - Hamburger menu added to ${hamburgerCount} pages`);
console.log(`  - Link fixes applied across ${linkFixCount} replacements`);
