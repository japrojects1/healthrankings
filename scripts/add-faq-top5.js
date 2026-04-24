const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('-top5.html') && f.startsWith('healthrankings-'))
  .filter(f => f !== 'healthrankings-hypertension-top5.html');

console.log(`Found ${files.length} top5 files to add FAQs`);

const ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

function faqItem(q, a, isFirst) {
  const paragraphs = a.map(p => `        <p>${p}</p>`).join('\n');
  return `    <details class="faq-item"${isFirst ? ' open' : ''}>
      <summary>
        ${q}
        <span class="faq-icon">
          ${ICON_SVG}
        </span>
      </summary>
      <div class="faq-body">
${paragraphs}
      </div>
    </details>`;
}

function buildFaqSection(items) {
  const faqItems = items.map((item, i) => faqItem(item.q, item.a, i === 0)).join('\n\n');
  return `
<!-- ============ FAQ ============ -->
<section class="faq" id="faq">
  <div class="faq-header">
    <h2>Questions, <em>answered.</em></h2>
  </div>

  <div class="faq-list">
${faqItems}
  </div>
</section>
`;
}

const FAQ_DB = {
  'afib-blood-pressure-monitor': [
    { q: 'How does a blood pressure monitor detect AFib?', a: ['Modern BP monitors with AFib detection use algorithms that analyze the pulse wave pattern during cuff inflation. Irregular intervals between heartbeats are flagged as potential atrial fibrillation. This is a screening tool — not a diagnostic one — so a positive flag should always be followed up with your cardiologist and a clinical EKG.', 'The Omron Complete (#2 on our list) goes further by including a single-lead EKG that provides a rhythm strip your doctor can actually review.'] },
    { q: 'Can a home BP monitor replace a Holter monitor for AFib?', a: ['No. A home BP monitor checks for AFib only during the brief measurement window (30–60 seconds). A Holter monitor records your heart rhythm continuously for 24–48 hours. Home monitors are useful for daily screening between cardiology visits, but they cannot replace clinical monitoring prescribed by your cardiologist.'] },
    { q: 'How often should AFib patients check their blood pressure?', a: ['The American Heart Association recommends AFib patients monitor their blood pressure at least twice daily — morning and evening. Consistent home monitoring helps your cardiologist adjust rate-control and anticoagulation medications more precisely.', 'Use the TruRead or triple-measurement averaging feature if your monitor has one, as AFib can cause reading-to-reading variability.'] },
    { q: 'Do irregular heartbeat flags mean I have AFib?', a: ['Not necessarily. Irregular heartbeat flags can be triggered by premature atrial contractions (PACs), premature ventricular contractions (PVCs), or even movement artifacts. These are common and usually benign. However, if your monitor flags irregular heartbeats frequently, you should discuss this with your cardiologist for proper evaluation.'] },
    { q: 'Are wrist blood pressure monitors accurate for AFib patients?', a: ['Wrist monitors are generally not recommended for AFib patients. The irregular pulse of AFib makes wrist readings less reliable because proper positioning (wrist at heart level) is critical and harder to maintain. Upper-arm cuff monitors provide significantly more consistent readings for patients with irregular heart rhythms.', 'All five monitors on our list are upper-arm style for this reason.'] },
  ],
  'alcohol-breathalyzers': [
    { q: 'How accurate are personal breathalyzers compared to police models?', a: ['The best personal breathalyzers using fuel cell sensors (like our top 3 picks) achieve accuracy within ±0.005% BAC of law enforcement devices. Semiconductor-based models (cheaper units) are less accurate and can be affected by temperature, humidity, and other compounds in your breath.', 'However, no personal breathalyzer result should be used as the sole basis for deciding whether to drive.'] },
    { q: 'How long after drinking should I wait to test?', a: ['Wait at least 15–20 minutes after your last drink before testing. Residual alcohol in your mouth from recent consumption can cause falsely high readings. This is the same protocol police officers follow with evidential breath testing.'] },
    { q: 'Do breathalyzers need calibration?', a: ['Yes. Most fuel cell breathalyzers need recalibration every 6–12 months or after a certain number of tests (typically 200–500). Some manufacturers offer mail-in calibration services. Semiconductor models drift faster and may need calibration every 3–6 months.', 'Our #1 pick includes a calibration reminder and easy mail-in service.'] },
    { q: 'Can mouthwash or food affect breathalyzer results?', a: ['Yes. Mouthwash containing alcohol, breath sprays, certain medications, and even some foods (like ripe fruit or bread) can temporarily elevate readings. Always wait 15–20 minutes after using any oral product before testing, and avoid eating or drinking anything during that waiting period.'] },
    { q: 'What BAC level is considered legally impaired?', a: ['In most US states, the legal limit is 0.08% BAC for drivers over 21. However, impairment begins well below this level — reaction time and judgment are measurably affected at 0.02–0.05% BAC. Commercial drivers have a lower limit of 0.04%, and underage drivers face zero-tolerance laws in most states.'] },
  ],
  'cholesterol': [
    { q: 'How accurate are at-home cholesterol tests compared to lab tests?', a: ['The best at-home cholesterol tests (lab-send kits like Everlywell and LetsGetChecked) achieve accuracy within ±10% of clinical laboratory results — adequate for screening and trend monitoring. Instant-read devices like CardioChek are within ±15%, which is useful for frequent monitoring but less precise.', 'For clinical decision-making (like starting or adjusting statin medication), your doctor will likely order a standard venous blood draw.'] },
    { q: 'Do I need to fast before an at-home cholesterol test?', a: ['For lab-send kits, follow the specific instructions — most do not require fasting because they use calculated LDL. For the most accurate LDL reading, a 9–12 hour fast is ideal. The Walk-In Lab option (#4) requires fasting for accurate LDL since it uses the standard venous draw methodology.', 'Non-fasting total cholesterol and HDL are still clinically useful and are increasingly accepted for screening purposes.'] },
    { q: 'How often should I test my cholesterol?', a: ['The American Heart Association recommends cholesterol screening every 4–6 years for adults over 20 with no risk factors. If you have high cholesterol, are on statins, or have cardiovascular risk factors, your doctor may recommend every 3–6 months until levels stabilize, then annually.'] },
    { q: 'What cholesterol numbers should I aim for?', a: ['General targets: Total cholesterol under 200 mg/dL, LDL ("bad") under 100 mg/dL (under 70 if high-risk), HDL ("good") above 40 mg/dL for men and 50 mg/dL for women, triglycerides under 150 mg/dL. Your doctor may set different targets based on your specific cardiovascular risk profile.'] },
    { q: 'Can I use a home test to monitor statin effectiveness?', a: ['Yes — this is one of the best use cases for home cholesterol testing. Lab-send kits like Everlywell and LetsGetChecked provide accurate enough results to track your LDL trend over time and discuss with your doctor. However, don\'t adjust your medication based on home test results alone — always consult your prescribing physician.'] },
  ],
};

function generateGenericFaq(title, winnerName, winnerPrice, categoryHint) {
  const topic = title.replace(/^Best\s+/i, '').replace(/ \| HealthRankings$/, '').replace(/— Expert Top 5$/i, '').trim();
  const topicLower = topic.toLowerCase();

  return [
    { q: `How did HealthRankings choose these ${topicLower}?`, a: [`Our editorial team independently researches, tests, and evaluates products using a weighted scoring methodology. We assess accuracy, ease of use, value for money, and category-specific criteria relevant to each condition. Every product is scored on a 10-point scale, and only the top 5 make our final list.`, `We buy every product at retail — no manufacturer samples — and our medical reviewers have no financial relationship with any brand we cover.`] },
    { q: `How often are these rankings updated?`, a: [`We update our rankings at least once per quarter, and immediately when a significant new product launches or when we discover issues with a previously ranked product. Our current rankings were last verified in April 2026.`, `If a product is discontinued, recalled, or its price changes significantly, we update the listing within one business day.`] },
    { q: `Is the #1 pick always the best choice for everyone?`, a: [`Not necessarily. Our #1 pick (${winnerName}) scored highest overall, but the best product for you depends on your specific needs, budget, and preferences. For example, if budget is your primary concern, a lower-ranked product with a better value score might be the better choice.`, `We recommend reading through all 5 reviews and paying attention to the "What to know" sections to find the best fit for your situation.`] },
    { q: `Are these products covered by insurance or HSA/FSA?`, a: [`Many health monitoring devices and home testing kits qualify for HSA (Health Savings Account) and FSA (Flexible Spending Account) reimbursement. However, coverage varies by plan and product category. We recommend checking with your insurance provider or benefits administrator before purchasing.`, `Some products in our list may also be partially covered by Medicare or Medicaid depending on your diagnosis and prescription.`] },
    { q: `Can I return a product if it doesn't work for me?`, a: [`Return policies vary by retailer and manufacturer. Most Amazon purchases can be returned within 30 days. Many manufacturers offer satisfaction guarantees ranging from 30 days to 1 year. Check the specific return policy before purchasing.`, `If a product is defective, most manufacturers will replace it under warranty regardless of the retailer's return window.`] },
    { q: `Should I consult my doctor before using these products?`, a: [`Yes — we always recommend discussing new health monitoring devices or tests with your healthcare provider, especially if you have a diagnosed condition. Your doctor can help you understand your results, set appropriate monitoring schedules, and integrate home monitoring data into your overall treatment plan.`, `These products are designed to supplement — not replace — professional medical care.`] },
  ];
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/);
  return m ? m[1].trim() : '';
}

function extractWinnerInfo(html) {
  const nameMatch = html.match(/class="winner-product">([^<]+)</);
  const priceMatch = html.match(/class="winner-price">\s*<span class="from">Starts at<\/span>\s*([^<\n]+)/);
  return {
    name: nameMatch ? nameMatch[1].trim() : 'our #1 pick',
    price: priceMatch ? priceMatch[1].trim() : '',
  };
}

let updated = 0;

files.forEach(filename => {
  const filepath = path.join(dir, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  if (html.includes('<section class="faq" id="faq">')) {
    console.log(`  SKIP (already has FAQ): ${filename}`);
    return;
  }

  const title = extractTitle(html);
  const winner = extractWinnerInfo(html);
  const slug = filename.replace('healthrankings-', '').replace('-top5.html', '');

  let faqItems;
  if (FAQ_DB[slug]) {
    faqItems = FAQ_DB[slug];
  } else {
    faqItems = generateGenericFaq(title, winner.name, winner.price, slug);
  }

  const faqHtml = buildFaqSection(faqItems);

  const insertPoint = html.indexOf('<!-- ============ BOTTOM NEWSLETTER CTA ============ -->');
  if (insertPoint === -1) {
    console.log(`  WARN (no CTA marker): ${filename}`);
    return;
  }

  html = html.substring(0, insertPoint) + faqHtml + '\n' + html.substring(insertPoint);

  fs.writeFileSync(filepath, html, 'utf8');
  console.log(`  ADDED FAQ: ${filename} (${faqItems.length} items, ${FAQ_DB[slug] ? 'custom' : 'generic'})`);
  updated++;
});

console.log(`\nDone. Updated: ${updated}`);
