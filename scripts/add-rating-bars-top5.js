const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('-top5.html') && f.startsWith('healthrankings-'))
  .filter(f => f !== 'healthrankings-hypertension-top5.html');

console.log(`Found ${files.length} top5 files to process`);

function extractRatingLabels(html) {
  const labels = [];
  const re = /class="rating-bar-label">([^<]+)<\/span>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (labels.length < 4) labels.push(m[1]);
    else break;
  }
  return labels;
}

function extractProductScores(html) {
  const scores = [];
  const re = /class="score-num">(\d+\.\d+)<\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    scores.push(parseFloat(m[1]));
  }
  return scores;
}

function generateRatings(overallScore, labels) {
  const count = labels.length;
  const ratings = [];
  for (let i = 0; i < count; i++) {
    const offset = (i === 0) ? 0.2 : (i === 1) ? 0.0 : (i === 2) ? -0.2 : -0.1;
    let val = overallScore + offset;
    val = Math.min(9.9, Math.max(6.0, val));
    val = Math.round(val * 10) / 10;
    ratings.push(val);
  }
  return ratings;
}

function buildRatingBarsHtml(labels, values, isWinner) {
  const fillClass = isWinner ? ' gold' : '';
  let html = `\n          <div style="margin-bottom: 0.75rem;">\n`;
  for (let i = 0; i < labels.length; i++) {
    const pct = Math.round(values[i] * 10);
    html += `            <div class="rating-bar-row"><span class="rating-bar-label">${labels[i]}</span><div class="rating-bar-track"><div class="rating-bar-fill${fillClass}" style="width:${pct}%"></div></div><span class="rating-num">${values[i].toFixed(1)}</span></div>\n`;
  }
  html += `          </div>`;
  return html;
}

let updated = 0;
let skipped = 0;

files.forEach(filename => {
  const filepath = path.join(dir, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  const labels = extractRatingLabels(html);
  if (labels.length === 0) {
    console.log(`  SKIP (no rating labels): ${filename}`);
    skipped++;
    return;
  }

  const scores = extractProductScores(html);
  if (scores.length < 5) {
    console.log(`  SKIP (only ${scores.length} scores): ${filename}`);
    skipped++;
    return;
  }

  let needsUpdate = false;

  for (let productIdx = 2; productIdx <= 5; productIdx++) {
    const productIdMarker = `id="review-${productIdx}"`;
    const productStart = html.indexOf(productIdMarker);
    if (productStart === -1) continue;

    const nextProductMarker = productIdx < 5 ? `id="review-${productIdx + 1}"` : 'class="section"';
    let productEnd = html.indexOf(nextProductMarker, productStart);
    if (productEnd === -1) productEnd = html.length;

    const productHtml = html.substring(productStart, productEnd);

    if (productHtml.includes('rating-bar-row')) continue;

    const prosConsIdx = productHtml.indexOf('class="product-pros-cons"');
    if (prosConsIdx === -1) continue;

    const insertPoint = productStart + prosConsIdx;
    const beforeInsert = html.lastIndexOf('<div', insertPoint - 1);

    const lineStart = html.lastIndexOf('\n', insertPoint) + 1;
    const actualInsertIdx = html.lastIndexOf('<div class="product-pros-cons">', insertPoint + 30);

    const searchFrom = productStart;
    const prosConsFullIdx = html.indexOf('<div class="product-pros-cons">', searchFrom);
    if (prosConsFullIdx === -1 || prosConsFullIdx > productEnd) continue;

    const score = scores[productIdx - 1];
    const ratings = generateRatings(score, labels);
    const barsHtml = buildRatingBarsHtml(labels, ratings, false);

    html = html.substring(0, prosConsFullIdx) + barsHtml + '\n          ' + html.substring(prosConsFullIdx);

    needsUpdate = true;
  }

  if (needsUpdate) {
    fs.writeFileSync(filepath, html, 'utf8');
    console.log(`  UPDATED: ${filename} (labels: ${labels.join(', ')})`);
    updated++;
  } else {
    console.log(`  ALREADY OK: ${filename}`);
    skipped++;
  }
});

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
