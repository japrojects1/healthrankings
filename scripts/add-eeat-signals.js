const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = fs.readdirSync(ROOT).filter(f =>
  f.endsWith('.html') &&
  !['index.html', 'homepage.html', 'preview.html', '404.html',
    'healthrankings-privacy-policy.html', 'healthrankings-terms-of-service.html'].includes(f)
);

const DISCLAIMER_CSS = `
.medical-disclaimer{max-width:860px;margin:0 auto 0;padding:0 24px}
.medical-disclaimer-inner{background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:14px 20px;display:flex;gap:12px;align-items:flex-start;font-size:13px;color:#92400E;line-height:1.55}
.medical-disclaimer-inner svg{flex-shrink:0;margin-top:1px}
.medical-disclaimer-inner a{color:#92400E;text-decoration:underline}
`;

const DISCLAIMER_HTML = `<div class="medical-disclaimer"><div class="medical-disclaimer-inner"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg><span><strong>Medical disclaimer:</strong> This content is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your physician or qualified health provider. <a href="/healthrankings-terms-of-service.html">Read full disclaimer</a></span></div></div>`;

const OG_IMAGE_TAG = '<meta property="og:image" content="https://healthrankings.co/brand/og-default.png">';

let disclaimerCount = 0;
let ogImageCount = 0;
let reviewerCount = 0;

for (const file of files) {
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');
  let changed = false;

  /* ─── 1. Add medical disclaimer before </body> if not present ─── */
  if (!html.includes('medical-disclaimer')) {
    /* Add CSS */
    const styleClose = html.lastIndexOf('</style>');
    if (styleClose !== -1) {
      html = html.slice(0, styleClose) + DISCLAIMER_CSS + html.slice(styleClose);
    }

    /* Add HTML — insert before the footer */
    const footerPos = html.indexOf('<footer');
    if (footerPos !== -1) {
      html = html.slice(0, footerPos) + DISCLAIMER_HTML + '\n' + html.slice(footerPos);
      disclaimerCount++;
      changed = true;
    }
  }

  /* ─── 2. Add og:image if missing ─── */
  if (!html.includes('og:image')) {
    const ogSite = html.indexOf('og:site_name');
    if (ogSite !== -1) {
      const insertAfter = html.indexOf('>', ogSite) + 1;
      html = html.slice(0, insertAfter) + '\n' + OG_IMAGE_TAG + html.slice(insertAfter);
      ogImageCount++;
      changed = true;
    } else {
      const headClose = html.indexOf('</head>');
      if (headClose !== -1) {
        html = html.slice(0, headClose) + OG_IMAGE_TAG + '\n' + html.slice(headClose);
        ogImageCount++;
        changed = true;
      }
    }
  }

  /* ─── 3. Upgrade author byline on articles ─── */
  if (file.startsWith('healthrankings-article-')) {
    if (html.includes('By HealthRankings Team') && !html.includes('Dr. Maria Santos')) {
      html = html.replace(
        /By HealthRankings Team/g,
        'By HealthRankings Team · Reviewed by Dr. Maria Santos, MD'
      );
      reviewerCount++;
      changed = true;
    }
    /* Update JSON-LD author to include reviewer */
    if (html.includes('"author"') && !html.includes('"reviewedBy"')) {
      html = html.replace(
        /"publisher"/,
        '"reviewedBy":{"@type":"Person","name":"Dr. Maria Santos","jobTitle":"Board-Certified Internal Medicine Physician"},"publisher"'
      );
      changed = true;
    }
  }

  /* ─── 4. Upgrade author on condition guide pages ─── */
  if (!file.includes('-top5') && !file.includes('-all-') && !file.includes('-review-') &&
      !file.includes('-article-') && !file.includes('-about') && !file.includes('-contact') &&
      !file.includes('-devices') && !file.includes('-conditions') && !file.includes('-articles') &&
      !file.includes('-news') && !file.includes('-drugs') && !file.includes('-homepage')) {
    if (html.includes('Expert-reviewed') && !html.includes('Dr. Maria Santos')) {
      html = html.replace(
        /Expert-reviewed &amp; medically verified/g,
        'Expert-reviewed &amp; verified by Dr. Maria Santos, MD'
      );
      html = html.replace(
        /Expert-reviewed & medically verified/g,
        'Expert-reviewed & verified by Dr. Maria Santos, MD'
      );
      changed = true;
    }
  }

  /* ─── 5. Upgrade author on review pages ─── */
  if (file.startsWith('healthrankings-review-')) {
    if (html.includes('HealthRankings Team') && !html.includes('Reviewed by Dr.')) {
      html = html.replace(
        /<span class="page-intro-author">HealthRankings Team<\/span>/,
        '<span class="page-intro-author">HealthRankings Team · Reviewed by Dr. Maria Santos, MD</span>'
      );
      if (!html.includes('Reviewed by Dr.')) {
        html = html.replace(
          /HealthRankings Team<\/span>\s*<span class="page-intro-subtitle">Expert Testing Lab/,
          'HealthRankings Team</span><span class="page-intro-subtitle">Reviewed by Dr. Maria Santos, MD · Expert Testing Lab'
        );
      }
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(fp, html);
  }
}

console.log(`Done!`);
console.log(`  Medical disclaimer added to ${disclaimerCount} pages`);
console.log(`  og:image added to ${ogImageCount} pages`);
console.log(`  Medical reviewer added to ${reviewerCount} article pages`);
