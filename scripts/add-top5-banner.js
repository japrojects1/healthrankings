const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..');

const categoryToTop5 = {
  'all-blood-pressure-monitors': { top5: 'healthrankings-hypertension-top5.html', label: 'Best Blood Pressure Monitors', category: 'Blood Pressure Monitors' },
  'all-body-composition-monitors': { top5: 'healthrankings-weight-management-body-composition-top5.html', label: 'Best Smart Scales & Body Fat Scales', category: 'Smart Scales' },
  'all-pulse-oximeters': { top5: 'healthrankings-copd-pulse-oximeters-top5.html', label: 'Best Pulse Oximeters', category: 'Pulse Oximeters' },
  'all-tens-units': { top5: 'healthrankings-back-pain-tens-top5.html', label: 'Best TENS Units', category: 'TENS Units' },
  'all-thermometers': { top5: 'healthrankings-thermometers-top5.html', label: 'Best Thermometers', category: 'Thermometers' },
  'all-electric-toothbrushes': { top5: 'healthrankings-electric-toothbrushes-top5.html', label: 'Best Electric Toothbrushes', category: 'Electric Toothbrushes' },
  'all-water-flossers': { top5: 'healthrankings-water-flossers-top5.html', label: 'Best Water Flossers', category: 'Water Flossers' },
  'all-glucometers-cgm': { top5: 'healthrankings-diabetes-ketone-monitors-top5.html', label: 'Best Glucose Monitors', category: 'Glucose Monitors' },
  'all-breathing-trainers': { top5: 'healthrankings-copd-breathing-trainers-top5.html', label: 'Best Breathing Trainers', category: 'Breathing Trainers' },
  'all-massage-devices': { top5: 'healthrankings-percussion-massage-guns-top5.html', label: 'Best Massage Guns', category: 'Massage Devices' },
  'all-arthritis-gloves': { top5: 'healthrankings-arthritis-gloves-top5.html', label: 'Best Arthritis Gloves', category: 'Arthritis Gloves' },
  'all-back-support-braces': { top5: 'healthrankings-back-support-braces-top5.html', label: 'Best Back Support Braces', category: 'Back Support Braces' },
  'all-foot-leg-supports': { top5: 'healthrankings-plantar-fasciitis-foot-support-top5.html', label: 'Best Foot & Leg Supports', category: 'Foot & Leg Supports' },
  'all-gps-alert-systems': { top5: 'healthrankings-dementia-alzheimers-gps-alert-top5.html', label: 'Best GPS Alert Systems', category: 'GPS Alert Systems' },
  'all-home-test-kits': { top5: 'healthrankings-sti-home-testing-top5.html', label: 'Best Home Test Kits', category: 'Home Test Kits' },
  'all-supplements': { top5: 'healthrankings-creatine-supplements-top5.html', label: 'Best Supplements', category: 'Supplements' },
  'all-fitness-recovery': { top5: 'healthrankings-weight-management-body-composition-top5.html', label: 'Best Fitness & Recovery Devices', category: 'Fitness & Recovery' },
  'all-fertility-reproductive': { top5: 'healthrankings-ovulation-test-kits-top5.html', label: 'Best Fertility Monitors', category: 'Fertility & Reproductive' },
};

const bannerCSS = `
<style>
.top5-callout{max-width:900px;margin:0 auto 0;padding:0 32px;}
.top5-callout-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);border:1px solid #BFDBFE;border-radius:12px;padding:14px 20px;transition:all 280ms cubic-bezier(0.4,0,0.2,1)}
.top5-callout-inner:hover{border-color:#93C5FD;box-shadow:0 4px 16px -4px rgba(37,99,235,0.12)}
.top5-callout-left{display:flex;align-items:center;gap:12px}
.top5-callout-badge{display:flex;align-items:center;gap:6px;background:#2563EB;color:white;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:5px 10px;border-radius:6px;white-space:nowrap}
.top5-callout-text{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;color:#1E40AF}
.top5-callout-arrow{display:flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#2563EB;white-space:nowrap}
@media(max-width:640px){.top5-callout{padding:0 20px}.top5-callout-inner{flex-direction:column;align-items:flex-start;gap:10px;padding:14px 16px}.top5-callout-text{font-size:13px}}
</style>`;

const bannerHTML = (top5Url, label) => `
<div class="top5-callout">
  <a href="/${top5Url}" class="top5-callout-inner">
    <div class="top5-callout-left">
      <span class="top5-callout-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg> TOP 5</span>
      <span class="top5-callout-text">See our ${label} of 2026 — expert tested & ranked</span>
    </div>
    <span class="top5-callout-arrow">View rankings <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></span>
  </a>
</div>`;

const reviewFiles = fs.readdirSync(dir).filter(f => f.startsWith('healthrankings-review-') && f.endsWith('.html'));
let updated = 0, skipped = 0, noMatch = 0;

for (const file of reviewFiles) {
  const fp = path.join(dir, file);
  let html = fs.readFileSync(fp, 'utf8');

  if (html.includes('top5-callout')) {
    skipped++;
    continue;
  }

  const catMatch = html.match(/href="\/healthrankings-(all-[^"]+)\.html"/);
  if (!catMatch) {
    noMatch++;
    continue;
  }

  const catKey = catMatch[1];
  const mapping = categoryToTop5[catKey];
  if (!mapping) {
    noMatch++;
    continue;
  }

  const banner = bannerHTML(mapping.top5, mapping.label);

  if (!html.includes(bannerCSS.trim().substring(0, 30))) {
    html = html.replace('</head>', bannerCSS + '\n</head>');
  }

  const insertPoint = '</nav>\n\n<div class="page-intro">';
  const insertPointAlt = '</nav>\n<div class="page-intro">';
  
  if (html.includes(insertPoint)) {
    html = html.replace(insertPoint, '</nav>\n' + banner + '\n\n<div class="page-intro">');
  } else if (html.includes(insertPointAlt)) {
    html = html.replace(insertPointAlt, '</nav>\n' + banner + '\n<div class="page-intro">');
  } else {
    const navEnd = html.indexOf('</nav>');
    if (navEnd !== -1) {
      const afterNav = navEnd + '</nav>'.length;
      html = html.substring(0, afterNav) + '\n' + banner + '\n' + html.substring(afterNav);
    } else {
      noMatch++;
      continue;
    }
  }

  fs.writeFileSync(fp, html);
  updated++;
}

console.log(`Updated: ${updated} | Skipped (already had banner): ${skipped} | No category match: ${noMatch}`);
