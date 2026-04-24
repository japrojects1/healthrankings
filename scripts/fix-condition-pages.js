const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const CONDITION_CSS = `
/* ===== CONDITION CONTENT SECTIONS ===== */
.section { margin-bottom: 3.5rem; max-width: 860px; margin-left: auto; margin-right: auto; padding: 0 24px; }
.section-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.12em; color: var(--teal-600); margin-bottom: 8px;
}
.section h2 {
  font-family: 'DM Sans', sans-serif; font-size: 1.6rem; font-weight: 800;
  color: var(--slate-900); margin-bottom: 16px; line-height: 1.25;
}
.section h3 { font-size: 1.1rem; font-weight: 700; color: var(--slate-900); margin: 24px 0 8px; }
.section p { color: var(--slate-600); line-height: 1.75; margin-bottom: 14px; }
.symptoms-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px; margin: 20px 0;
}
.symptom-card {
  display: flex; gap: 14px; align-items: flex-start; padding: 18px;
  background: white; border-radius: 14px; border: 1px solid var(--slate-200);
  transition: box-shadow 0.2s;
}
.symptom-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.symptom-icon {
  font-size: 1.6rem; flex-shrink: 0; width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: var(--blue-50); border-radius: 12px;
}
.symptom-card h4 { font-size: 0.9rem; font-weight: 700; color: var(--slate-900); margin-bottom: 4px; }
.symptom-card p { font-size: 0.82rem; color: var(--slate-500); line-height: 1.5; margin: 0; }
.causes-list { display: flex; flex-direction: column; gap: 14px; margin: 20px 0; }
.cause-item { display: flex; gap: 14px; align-items: flex-start; }
.cause-dot {
  width: 10px; height: 10px; border-radius: 50%; background: var(--blue-500);
  flex-shrink: 0; margin-top: 6px;
}
.cause-item strong { color: var(--slate-900); display: block; margin-bottom: 2px; }
.cause-item p { font-size: 0.88rem; color: var(--slate-500); margin: 0; }
.lifestyle-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px; margin: 20px 0;
}
.lifestyle-card {
  padding: 20px; background: white; border-radius: 14px;
  border: 1px solid var(--slate-200); transition: box-shadow 0.2s;
}
.lifestyle-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.lc-icon { font-size: 1.5rem; margin-bottom: 10px; }
.lifestyle-card h4 { font-size: 0.9rem; font-weight: 700; color: var(--slate-900); margin-bottom: 6px; }
.lifestyle-card p { font-size: 0.82rem; color: var(--slate-500); line-height: 1.6; margin: 0; }
.med-table {
  width: 100%; border-collapse: collapse; font-size: 0.85rem;
  margin: 20px 0; background: white; border-radius: 12px;
  overflow: hidden; border: 1px solid var(--slate-200);
}
.med-table thead { background: var(--slate-900); color: white; }
.med-table th { padding: 12px 16px; text-align: left; font-weight: 600; font-size: 0.8rem; }
.med-table td { padding: 12px 16px; border-bottom: 1px solid var(--slate-100); }
.med-table tbody tr:last-child td { border-bottom: none; }
.med-table tbody tr:hover { background: var(--blue-50); }
.med-name { font-weight: 600; color: var(--slate-900); }
.callout, .callout-blue, .callout-green {
  border-radius: 12px; padding: 20px 24px; margin: 20px 0;
}
.callout { background: var(--blue-50); border-left: 4px solid var(--blue-500); }
.callout-blue { background: var(--blue-50); border-left: 4px solid var(--blue-500); }
.callout-green { background: var(--teal-50); border-left: 4px solid var(--teal-500); }
.callout p, .callout-blue p, .callout-green p {
  font-size: 0.88rem; color: var(--slate-600); line-height: 1.7; margin: 0;
}
.bp-stages-table {
  width: 100%; border-collapse: collapse; font-size: 0.85rem;
  margin: 20px 0; background: white; border-radius: 12px;
  overflow: hidden; border: 1px solid var(--slate-200);
}
.bp-stages-table thead { background: var(--slate-900); color: white; }
.bp-stages-table th { padding: 12px 16px; text-align: left; font-weight: 600; font-size: 0.8rem; }
.bp-stages-table td { padding: 12px 16px; border-bottom: 1px solid var(--slate-100); color: var(--slate-600); }
.bp-stages-table tbody tr:last-child td { border-bottom: none; }
.bp-stages-table tbody tr:hover { background: var(--blue-50); }
@media (max-width: 640px) {
  .symptoms-grid, .lifestyle-grid { grid-template-columns: 1fr; }
  .section h2 { font-size: 1.3rem; }
}
`;

// ===== HYPERTENSION CONDITION CONTENT =====
const HYPERTENSION_CONTENT = `
<!-- ============ CONDITION CONTENT ============ -->
<section class="rankings" id="condition-content" style="padding-top:20px;">

  <div class="section" id="overview">
    <div class="section-label">Overview</div>
    <h2>What Is Hypertension (High Blood Pressure)?</h2>
    <p>Hypertension \u2014 commonly known as high blood pressure \u2014 is a chronic medical condition in which blood pushes against artery walls with consistently excessive force. Over time, this damages blood vessels, stiffens arteries, and forces the heart to work harder, dramatically increasing the risk of heart attack, stroke, kidney disease, and heart failure.</p>
    <p>High blood pressure is often called the \u201csilent killer\u201d because it almost never causes symptoms until serious damage has occurred. The only way to know your blood pressure is to measure it. The American Heart Association recommends all adults have their blood pressure checked regularly and that those with hypertension monitor daily at home.</p>
    <table class="bp-stages-table">
      <thead><tr><th>Category</th><th>Systolic (mmHg)</th><th>Diastolic (mmHg)</th><th>Action Recommended</th></tr></thead>
      <tbody>
        <tr><td style="font-weight:600;color:var(--teal-600)">Normal</td><td>Less than 120</td><td>Less than 80</td><td>Maintain healthy lifestyle. Check annually.</td></tr>
        <tr><td style="font-weight:600;color:#D97706">Elevated</td><td>120\u2013129</td><td>Less than 80</td><td>Lifestyle changes. Monitor monthly.</td></tr>
        <tr><td style="font-weight:600;color:#EA580C">Stage 1 Hypertension</td><td>130\u2013139</td><td>80\u201389</td><td>Lifestyle changes + possible medication. Weekly monitoring.</td></tr>
        <tr><td style="font-weight:600;color:#DC2626">Stage 2 Hypertension</td><td>140 or higher</td><td>90 or higher</td><td>Medication + lifestyle changes. Daily monitoring critical.</td></tr>
        <tr><td style="font-weight:600;color:#7F1D1D">Hypertensive Crisis</td><td>Higher than 180</td><td>Higher than 120</td><td>Seek emergency medical care immediately.</td></tr>
      </tbody>
    </table>
    <div class="callout-blue">
      <p><strong>Why home monitoring matters:</strong> Blood pressure readings taken in a doctor\u2019s office can be inaccurately high (\u201cwhite-coat hypertension\u201d) or inaccurately normal (\u201cmasked hypertension\u201d). Home monitoring provides a more accurate picture of your true blood pressure over time and is recommended by all major cardiology guidelines.</p>
    </div>
  </div>

  <div class="section" id="symptoms">
    <div class="section-label">Symptoms & Warning Signs</div>
    <h2>Signs of High Blood Pressure</h2>
    <p>Most people with hypertension have <strong>no symptoms at all</strong> \u2014 even when readings reach dangerously high levels. This is why regular monitoring is so critical. However, some people with severely elevated blood pressure may experience:</p>
    <div class="symptoms-grid">
      <div class="symptom-card"><div class="symptom-icon">\ud83e\udde0</div><div><h4>Severe Headaches</h4><p>Persistent or pounding headaches, especially in the morning, may signal very high blood pressure</p></div></div>
      <div class="symptom-card"><div class="symptom-icon">\ud83d\udc43</div><div><h4>Nosebleeds</h4><p>Frequent or unexplained nosebleeds can occur with very elevated blood pressure</p></div></div>
      <div class="symptom-card"><div class="symptom-icon">\ud83d\udca8</div><div><h4>Shortness of Breath</h4><p>Difficulty breathing during normal activities may indicate heart strain from chronic hypertension</p></div></div>
      <div class="symptom-card"><div class="symptom-icon">\ud83d\udc41\ufe0f</div><div><h4>Vision Changes</h4><p>Blurred or double vision can result from damage to blood vessels in the eyes (hypertensive retinopathy)</p></div></div>
      <div class="symptom-card"><div class="symptom-icon">\ud83e\udec0</div><div><h4>Chest Pain</h4><p>Chest tightness or discomfort may signal that the heart is straining under elevated pressure</p></div></div>
      <div class="symptom-card"><div class="symptom-icon">\ud83d\udca5</div><div><h4>Dizziness & Fatigue</h4><p>Lightheadedness, fatigue, or confusion \u2014 especially with sudden onset \u2014 requires immediate evaluation</p></div></div>
    </div>
    <div class="callout" style="background:#FEF2F2; border-left-color:#DC2626;">
      <p><strong>\u26a0\ufe0f Hypertensive crisis (180/120+ mmHg):</strong> If you get a reading above 180/120, wait 5 minutes and test again. If still elevated, seek emergency care immediately. Symptoms may include severe headache, chest pain, shortness of breath, numbness, vision changes, or difficulty speaking. This is a medical emergency.</p>
    </div>
  </div>

  <div class="section" id="causes">
    <div class="section-label">Causes & Risk Factors</div>
    <h2>What Causes High Blood Pressure?</h2>
    <p><strong>Primary (essential) hypertension</strong> develops gradually over many years with no single identifiable cause. It accounts for about 90\u201395% of cases and is driven by a combination of genetic and lifestyle factors. <strong>Secondary hypertension</strong> (5\u201310%) is caused by an underlying condition such as kidney disease, thyroid problems, or certain medications.</p>
    <div class="causes-list">
      <div class="cause-item"><div class="cause-dot"></div><div><strong>Age</strong><p>Blood vessels gradually lose flexibility. Risk increases significantly after age 45 in men and 55 in women.</p></div></div>
      <div class="cause-item"><div class="cause-dot"></div><div><strong>Family History</strong><p>Having a parent or sibling with hypertension approximately doubles your risk. Over 100 genetic variants are linked to blood pressure.</p></div></div>
      <div class="cause-item"><div class="cause-dot"></div><div><strong>Excess Sodium</strong><p>High sodium intake causes the body to retain water, increasing blood volume and pressure. Most Americans consume 3,400 mg/day \u2014 well above the 1,500 mg recommended for hypertension.</p></div></div>
      <div class="cause-item"><div class="cause-dot"></div><div><strong>Obesity</strong><p>Each 1 kg of weight gain increases systolic BP by approximately 1 mmHg. Excess visceral fat is especially harmful.</p></div></div>
      <div class="cause-item"><div class="cause-dot"></div><div><strong>Physical Inactivity</strong><p>Sedentary people have a 30\u201350% higher risk. Regular exercise strengthens the heart and improves vessel elasticity.</p></div></div>
      <div class="cause-item"><div class="cause-dot"></div><div><strong>Chronic Stress</strong><p>Sustained cortisol elevation raises blood pressure and promotes unhealthy coping behaviors (overeating, alcohol, smoking).</p></div></div>
      <div class="cause-item"><div class="cause-dot"></div><div><strong>Alcohol & Tobacco</strong><p>More than 2 drinks/day raises BP. Smoking damages vessel walls and accelerates atherosclerosis.</p></div></div>
      <div class="cause-item"><div class="cause-dot"></div><div><strong>Sleep Apnea</strong><p>Nocturnal oxygen drops cause BP surges. Treating sleep apnea can lower daytime BP by 5\u201310 mmHg.</p></div></div>
    </div>
  </div>

  <div class="section" id="lifestyle">
    <div class="section-label">Lifestyle & Prevention</div>
    <h2>How to Lower Blood Pressure Naturally</h2>
    <p>Lifestyle modifications are the first line of treatment for all stages of hypertension and can lower systolic blood pressure by 10\u201320 mmHg \u2014 comparable to adding a medication.</p>
    <div class="lifestyle-grid">
      <div class="lifestyle-card"><div class="lc-icon">\ud83e\udd57</div><h4>DASH Diet</h4><p>The Dietary Approaches to Stop Hypertension (DASH) diet \u2014 rich in fruits, vegetables, whole grains, and low-fat dairy \u2014 lowers BP by 8\u201314 mmHg. It\u2019s the most evidence-based dietary intervention for hypertension.</p></div>
      <div class="lifestyle-card"><div class="lc-icon">\ud83e\uddc2</div><h4>Reduce Sodium</h4><p>Cutting sodium to under 1,500 mg/day lowers systolic BP by 5\u20138 mmHg. Read labels, cook at home, and avoid processed foods. Even modest reduction helps.</p></div>
      <div class="lifestyle-card"><div class="lc-icon">\ud83c\udfc3</div><h4>Regular Exercise</h4><p>150 minutes/week of moderate aerobic exercise (brisk walking, cycling, swimming) lowers BP by 5\u20138 mmHg. Consistency matters more than intensity.</p></div>
      <div class="lifestyle-card"><div class="lc-icon">\u2696\ufe0f</div><h4>Weight Management</h4><p>Losing 5\u201310% of body weight can lower BP by 5\u201320 mmHg. Even 1 kg of weight loss reduces systolic BP by about 1 mmHg.</p></div>
      <div class="lifestyle-card"><div class="lc-icon">\ud83d\udeab</div><h4>Limit Alcohol</h4><p>Limit to 1 drink/day (women) or 2 drinks/day (men). Reducing heavy drinking can lower systolic BP by 4 mmHg.</p></div>
      <div class="lifestyle-card"><div class="lc-icon">\ud83e\uddd8</div><h4>Manage Stress</h4><p>Meditation, deep breathing, and progressive muscle relaxation reduce cortisol and BP. Even 10 minutes/day of mindfulness shows measurable benefit.</p></div>
      <div class="lifestyle-card"><div class="lc-icon">\ud83d\ude34</div><h4>Quality Sleep</h4><p>Poor sleep (under 6 hours) increases hypertension risk by 20%. Treat sleep apnea \u2014 CPAP therapy can lower BP by 5\u201310 mmHg.</p></div>
      <div class="lifestyle-card"><div class="lc-icon">\ud83d\udcca</div><h4>Home Monitoring</h4><p>Daily home BP monitoring catches trends early, improves medication adherence, and eliminates white-coat effects. The AHA recommends it for all hypertensive patients.</p></div>
    </div>
  </div>

  <div class="section" id="treatment">
    <div class="section-label">Medications & Treatment</div>
    <h2>Hypertension Medications</h2>
    <p>When lifestyle changes alone aren\u2019t enough to reach target BP (usually below 130/80 mmHg), medication is added. Most patients with Stage 2 hypertension need two or more medications from different classes.</p>
    <table class="med-table">
      <thead><tr><th>Medication Class</th><th>Examples</th><th>How It Works</th><th>Common Side Effects</th></tr></thead>
      <tbody>
        <tr><td><span class="med-name">ACE Inhibitors</span></td><td>Lisinopril, Enalapril, Ramipril</td><td>Block angiotensin-converting enzyme, relaxing blood vessels</td><td>Dry cough (10\u201315%), elevated potassium</td></tr>
        <tr><td><span class="med-name">ARBs</span></td><td>Losartan, Valsartan, Olmesartan</td><td>Block angiotensin II receptors \u2014 similar to ACE inhibitors without the cough</td><td>Dizziness, elevated potassium (less cough than ACE)</td></tr>
        <tr><td><span class="med-name">Calcium Channel Blockers</span></td><td>Amlodipine, Nifedipine, Diltiazem</td><td>Relax blood vessel walls by blocking calcium entry</td><td>Ankle swelling, flushing, constipation</td></tr>
        <tr><td><span class="med-name">Thiazide Diuretics</span></td><td>Hydrochlorothiazide, Chlorthalidone</td><td>Reduce blood volume by increasing urine output</td><td>Frequent urination, low potassium, elevated glucose</td></tr>
        <tr><td><span class="med-name">Beta-Blockers</span></td><td>Metoprolol, Atenolol, Carvedilol</td><td>Slow heart rate and reduce force of contractions</td><td>Fatigue, cold hands, weight gain, depression</td></tr>
        <tr><td><span class="med-name">Combination Pills</span></td><td>Lisinopril/HCTZ, Amlodipine/Valsartan</td><td>Two drugs in one pill for better adherence and efficacy</td><td>Varies by components</td></tr>
      </tbody>
    </table>
    <div class="callout-green">
      <p><strong>Home monitoring + medication:</strong> Patients who monitor blood pressure at home have significantly better BP control than those who rely only on office visits. Home readings help your doctor adjust medications faster, detect side effects earlier, and confirm treatment is working.</p>
    </div>
  </div>

</section>
`;

// ===== 1. TRANSFORM HYPERTENSION PAGE =====
function transformHypertension() {
  const filepath = path.join(ROOT, 'healthrankings-hypertension.html');
  let html = fs.readFileSync(filepath, 'utf8');

  // Update title
  html = html.replace(
    '<title>Best Blood Pressure Monitors for Hypertension (2026) | HealthRankings</title>',
    '<title>Hypertension (High Blood Pressure): Overview, Symptoms, Causes & Treatment | HealthRankings</title>'
  );

  // Update meta description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    '<meta name="description" content="Complete guide to hypertension (high blood pressure) — overview, symptoms, causes, risk factors, lifestyle changes, treatment options, and BP monitoring recommendations.">'
  );

  // Add CONDITION_CSS before </style>
  if (!html.includes('CONDITION CONTENT SECTIONS')) {
    html = html.replace('</style>', CONDITION_CSS + '\n</style>');
  }

  // Update page intro
  html = html.replace(
    /<!-- ={3,} PAGE INTRO ={3,} -->[\s\S]*?<!-- ={3,} CONDITION SNAPSHOT/,
    (match) => {
      const snapshotComment = '<!-- ============ CONDITION SNAPSHOT';
      return `<!-- ============ PAGE INTRO ============ -->
<section class="page-intro">
  <div class="intro-eyebrow">
    <div class="intro-pulse"></div>
    Updated April 2026 \u00b7 Cardiovascular
  </div>
  <h1>Hypertension (High Blood Pressure)</h1>
  <p class="intro-lede">A comprehensive guide to understanding, preventing, and managing high blood pressure \u2014 the leading modifiable risk factor for heart disease and stroke.</p>

  <div class="intro-meta">
    <div class="intro-author">
      <div class="intro-author-avatar">HR</div>
      <div class="intro-author-info">
        <strong>HealthRankings Team</strong>
        <span>Expert-reviewed &amp; medically verified</span>
      </div>
    </div>
    <div class="intro-meta-divider"></div>
    <div class="intro-meta-fact">
      <span class="intro-meta-fact-label">Category</span>
      <span class="intro-meta-fact-value">Cardiovascular</span>
    </div>
    <div class="intro-meta-divider"></div>
    <div class="intro-meta-fact">
      <span class="intro-meta-fact-label">Last updated</span>
      <span class="intro-meta-fact-value">April 2026</span>
    </div>
  </div>
</section>

${snapshotComment}`;
    }
  );

  // Update jump nav
  html = html.replace(
    /<!-- ={3,} JUMP NAV ={3,} -->[\s\S]*?<\/nav>/,
    `<!-- ============ JUMP NAV ============ -->
<nav class="jump-nav" aria-label="Jump to section">
  <span class="jump-nav-label">Jump to</span>
  <a href="#overview" class="primary">Overview</a>
  <a href="#symptoms">Symptoms</a>
  <a href="#causes">Causes</a>
  <a href="#lifestyle">Lifestyle</a>
  <a href="#treatment">Treatment</a>
  <a href="#top5">Top 5 Monitors</a>
  <a href="#faq">FAQ</a>
</nav>`
  );

  // Replace everything between jump nav and FAQ with:
  // 1. Condition content, 2. Top 5 CTA, 3. Key stats
  const jumpNavEnd = html.indexOf('</nav>', html.indexOf('class="jump-nav"'));
  const faqStart = html.indexOf('<!-- ============ FAQ ============ -->');

  if (jumpNavEnd === -1 || faqStart === -1) {
    console.log('  ERROR: Could not find injection points in hypertension.html');
    return;
  }

  const top5CTA = `
<!-- ============ TOP 5 CTA ============ -->
<section class="winner-hero" id="top5" style="cursor:pointer;" onclick="window.location='/healthrankings-hypertension-top5.html'">
  <div class="winner-hero-inner" style="grid-template-columns:1fr auto; gap:32px;">
    <div class="winner-hero-left">
      <div class="winner-hero-eyebrow">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>
        Top 5 Picks
      </div>
      <h2 style="font-family:'DM Sans',sans-serif;font-size:1.5rem;font-weight:800;color:var(--slate-900);margin-bottom:8px;">Best Blood Pressure Monitors for Hypertension</h2>
      <p class="winner-hero-desc">#1 Pick: Omron Platinum BP5450  \u00b7  Score: 9.4/10  \u00b7  14 monitors tested for 120+ hours</p>
    </div>
    <div class="winner-hero-right" style="display:flex;align-items:center;">
      <span style="display:inline-flex;align-items:center;gap:8px;background:var(--gradient-blue);color:white;padding:12px 24px;border-radius:12px;font-weight:700;font-size:0.9rem;">
        See Top 5 Picks
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </span>
    </div>
  </div>
</section>`;

  const keyStats = `
<!-- ============ KEY STATS ============ -->
<div class="primer" style="padding:0; margin:40px auto; max-width:860px; padding:0 24px;">
  <div class="primer-inner">
    <div class="primer-left">
      <h2>About <em>blood pressure.</em></h2>
      <p>High blood pressure affects roughly 1 in 3 American adults \u2014 and only half of them have it under control. Monitoring at home is one of the most important tools for managing it, because readings in a doctor\u2019s office can be misleading due to stress or white-coat syndrome.</p>
      <p style="margin-top: 16px;">The American Heart Association recommends home monitoring for anyone with hypertension, pre-hypertension, or a family history of heart disease.</p>
      <div class="primer-stats" style="margin-top: 28px;">
        <div class="primer-stat">
          <span class="primer-stat-num">1 in 3</span>
          <span class="primer-stat-label">American adults have high blood pressure</span>
        </div>
        <div class="primer-stat">
          <span class="primer-stat-num">50%</span>
          <span class="primer-stat-label">of those don\u2019t have it controlled</span>
        </div>
      </div>
    </div>
    <div class="primer-right">
      <h3>What your numbers mean</h3>
      <ul class="primer-list">
        <li>
          <div class="primer-list-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
          <div class="primer-list-content"><strong>Normal: Under 120/80 mmHg</strong><span>Keep doing what you\u2019re doing. Check annually.</span></div>
        </li>
        <li>
          <div class="primer-list-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div class="primer-list-content"><strong>Elevated: 120\u2013129 / under 80 mmHg</strong><span>Lifestyle changes can prevent progression. Monitor monthly.</span></div>
        </li>
        <li>
          <div class="primer-list-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div class="primer-list-content"><strong>Stage 1 HTN: 130\u2013139 / 80\u201389 mmHg</strong><span>Speak with your doctor. Home monitoring weekly is recommended.</span></div>
        </li>
        <li>
          <div class="primer-list-icon" style="background: #FEE2E2; color: #DC2626;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>
          <div class="primer-list-content"><strong>Stage 2 HTN: 140+ / 90+ mmHg</strong><span>Medication likely needed. Daily monitoring is critical.</span></div>
        </li>
      </ul>
    </div>
  </div>
</div>`;

  const before = html.substring(0, jumpNavEnd + '</nav>'.length);
  const after = html.substring(faqStart);

  html = before + '\n\n' + HYPERTENSION_CONTENT + '\n' + top5CTA + '\n' + keyStats + '\n\n' + after;

  fs.writeFileSync(filepath, html);
  console.log('  \u2713 healthrankings-hypertension.html transformed to condition overview page');
}

// ===== 2. REORDER ALL CONDITION PAGES: condition content BEFORE top 5 CTA =====
function reorderConditionPage(filename) {
  const filepath = path.join(ROOT, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  // Skip hypertension (handled separately)
  if (filename === 'healthrankings-hypertension.html') return;

  // Check if this page has the winner-hero (Top 5 CTA) BEFORE condition-content
  const winnerPos = html.indexOf('class="winner-hero"');
  const contentPos = html.indexOf('id="condition-content"');

  if (winnerPos === -1 || contentPos === -1) {
    console.log(`  SKIP (no winner-hero or condition-content): ${filename}`);
    return;
  }

  if (winnerPos > contentPos) {
    console.log(`  SKIP (already correct order): ${filename}`);
    return;
  }

  // Extract the winner-hero section
  const winnerStartTag = '<!-- ============ TOP 5 CTA ============ -->';
  let winnerStart = html.indexOf(winnerStartTag);
  if (winnerStart === -1) {
    // Try finding by section class
    winnerStart = html.lastIndexOf('\n', html.indexOf('class="winner-hero"'));
    if (winnerStart === -1) {
      console.log(`  WARN: Could not find winner-hero start in ${filename}`);
      return;
    }
  }

  // Find the end of the winner-hero section (closing </section>)
  const winnerSectionStart = html.indexOf('<section class="winner-hero"', winnerStart);
  let depth = 0;
  let winnerEnd = winnerSectionStart;
  const sectionOpenRe = /<section[\s>]/g;
  const sectionCloseRe = /<\/section>/g;

  // Simple approach: find the </section> that closes the winner-hero
  let searchStart = winnerSectionStart;
  depth = 0;
  for (let i = searchStart; i < html.length; i++) {
    if (html.substring(i, i + 8) === '<section') {
      depth++;
    }
    if (html.substring(i, i + 10) === '</section>') {
      depth--;
      if (depth === 0) {
        winnerEnd = i + 10;
        break;
      }
    }
  }

  // Extract the condition-content section
  const contentComment = '<!-- ============ CONDITION CONTENT ============ -->';
  let contentStart = html.indexOf(contentComment);
  if (contentStart === -1) {
    contentStart = html.lastIndexOf('\n', html.indexOf('id="condition-content"'));
  }

  const contentSectionStart = html.indexOf('<section class="rankings"', contentStart);
  let contentEnd = contentSectionStart;
  depth = 0;
  for (let i = contentSectionStart; i < html.length; i++) {
    if (html.substring(i, i + 8) === '<section') {
      depth++;
    }
    if (html.substring(i, i + 10) === '</section>') {
      depth--;
      if (depth === 0) {
        contentEnd = i + 10;
        break;
      }
    }
  }

  // Extract both blocks
  const winnerBlock = html.substring(winnerStart, winnerEnd);
  const contentBlock = html.substring(contentStart, contentEnd);

  // Swap: put condition content where winner was, and winner where content was
  // Strategy: remove both, then insert in correct order
  const beforeWinner = html.substring(0, winnerStart);
  const betweenBlocks = html.substring(winnerEnd, contentStart);
  const afterContent = html.substring(contentEnd);

  html = beforeWinner + contentBlock + betweenBlocks + winnerBlock + afterContent;

  // Update jump nav to put condition links first
  html = html.replace(
    /(<nav class="jump-nav"[^>]*>[\s\S]*?<\/nav>)/,
    (match) => {
      // Reorder: put overview/symptoms/causes/lifestyle/treatment first, then Top 5
      return match
        .replace(/<a href="#top5"[^>]*>[^<]*<\/a>\s*/g, '')
        .replace(/<\/nav>/, '  <a href="#top5">Top 5 Picks</a>\n</nav>');
    }
  );

  fs.writeFileSync(filepath, html);
  console.log(`  \u2713 ${filename} [reordered]`);
}

// ===== 3. UPDATE CONDITION-FOCUSED TITLES =====
function updateTitle(filename) {
  const filepath = path.join(ROOT, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  // Skip hypertension (already updated)
  if (filename === 'healthrankings-hypertension.html') return;

  // Extract h1 text to use as base for title
  const h1Match = html.match(/<h1>([^<]*(?:<[^>]*>[^<]*)*)<\/h1>/);
  if (!h1Match) return;

  let h1 = h1Match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');

  // Check if title is already condition-focused (doesn't mention "Best" or "Complete Guide & Best")
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (!titleMatch) return;
  const currentTitle = titleMatch[1];

  // If title already starts with condition name or doesn't have "Best", skip
  if (!currentTitle.includes('Best') && !currentTitle.includes('Complete Guide &')) return;

  // Build new title: "Condition Name: Overview, Symptoms & Treatment | HealthRankings"
  const newTitle = `${h1}: Overview, Symptoms, Causes & Treatment | HealthRankings`;

  html = html.replace(
    `<title>${currentTitle}</title>`,
    `<title>${newTitle}</title>`
  );

  fs.writeFileSync(filepath, html);
  console.log(`  \u2713 ${filename} [title updated]`);
}

// ===== MAIN =====
const SKIP_FILES = new Set([
  'healthrankings-homepage.html',
  'healthrankings-conditions.html',
  'healthrankings-devices.html',
  'healthrankings-about.html',
  'healthrankings-drugs.html',
  'healthrankings-news.html',
  'healthrankings-preview.html'
]);

const files = fs.readdirSync(ROOT)
  .filter(f => f.startsWith('healthrankings-') && f.endsWith('.html'))
  .filter(f => !f.includes('-top5'))
  .filter(f => !f.includes('-all-'))
  .filter(f => !f.includes('-review-'))
  .filter(f => !SKIP_FILES.has(f))
  .sort();

console.log('\n=== Phase 1: Transform hypertension.html into condition overview ===\n');
transformHypertension();

console.log(`\n=== Phase 2: Reorder ${files.length} condition pages (condition content before Top 5) ===\n`);
files.forEach(reorderConditionPage);

console.log(`\n=== Phase 3: Update titles to be condition-focused ===\n`);
files.forEach(updateTitle);

console.log('\nDone!\n');
