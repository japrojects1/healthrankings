const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..');

const articleFiles = [
  'healthrankings-article-sleep-apnea-weight.html',
  'healthrankings-article-creatine-not-just-bodybuilders.html',
  'healthrankings-article-anxiety-blood-pressure.html',
  'healthrankings-article-walking-vs-running.html',
  'healthrankings-article-daily-habits-lower-blood-pressure.html',
  'healthrankings-article-type-2-diabetes-complete-guide.html',
];

const linkMap = {
  'Walking vs. running: which matters more for heart health?': '/healthrankings-article-walking-vs-running.html',
  'Walking vs. running: which actually matters more for heart health?': '/healthrankings-article-walking-vs-running.html',
  'Creatine isn\u2019t just for bodybuilders': '/healthrankings-article-creatine-not-just-bodybuilders.html',
  'Anxiety and blood pressure: stress or real problem?': '/healthrankings-article-anxiety-blood-pressure.html',
  'Sleep apnea and weight: the cycle nobody talks about': '/healthrankings-article-sleep-apnea-weight.html',
  'Home health monitoring: which devices are worth buying in 2026': '#',
  'The DASH diet cheat sheet: meals, snacks, and grocery lists': '#',
};

let totalFixes = 0;
for (const file of articleFiles) {
  const fp = path.join(dir, file);
  if (!fs.existsSync(fp)) continue;
  let html = fs.readFileSync(fp, 'utf8');
  let fixes = 0;
  for (const [title, href] of Object.entries(linkMap)) {
    if (href === '#') continue;
    const re = new RegExp(`href="#"(\\s+class="related-card"[^>]*>[\\s\\S]*?<h3>${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`);
    if (re.test(html)) {
      html = html.replace(re, `href="${href}"$1`);
      fixes++;
    }
  }
  if (fixes > 0) {
    fs.writeFileSync(fp, html, 'utf8');
    totalFixes += fixes;
    console.log(`${file}: fixed ${fixes} link(s)`);
  }
}
console.log(`Total fixes: ${totalFixes}`);
