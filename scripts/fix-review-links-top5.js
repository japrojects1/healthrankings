const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..');
const reviewData = JSON.parse(fs.readFileSync(path.join(__dirname, 'review-data.json'), 'utf-8'));

const reviewFiles = new Set(
  fs.readdirSync(DIR)
    .filter(f => f.startsWith('healthrankings-review-') && f.endsWith('.html'))
);

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-');
}

function normalize(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const nameToFile = new Map();
const fileToSlug = new Map();

for (const rd of reviewData) {
  const name = normalize(rd.name);
  nameToFile.set(name, '/' + rd.filename);
  const slug = rd.filename.replace('healthrankings-review-', '').replace('.html', '');
  fileToSlug.set(slug, '/' + rd.filename);
}

function tokenScore(a, b) {
  const ta = new Set(a.split(/[\s-]+/).filter(w => w.length > 1));
  const tb = new Set(b.split(/[\s-]+/).filter(w => w.length > 1));
  let matched = 0;
  for (const t of ta) {
    if (tb.has(t)) matched++;
  }
  return ta.size > 0 ? matched / ta.size : 0;
}

function findReviewFile(productName) {
  const slug = slugify(productName);
  const exact = `healthrankings-review-${slug}.html`;
  if (reviewFiles.has(exact)) return '/' + exact;

  const norm = normalize(productName);
  if (nameToFile.has(norm)) return nameToFile.get(norm);

  for (const [key, val] of nameToFile) {
    if (key.includes(norm) || norm.includes(key)) return val;
  }

  for (const [s, val] of fileToSlug) {
    if (s.includes(slug) || slug.includes(s)) return val;
    if (s.startsWith(slug.split('-').slice(0, 3).join('-'))) return val;
  }

  let bestScore = 0;
  let bestFile = null;
  for (const [key, val] of nameToFile) {
    const score = tokenScore(norm, key);
    if (score > bestScore && score >= 0.7) {
      bestScore = score;
      bestFile = val;
    }
  }
  if (bestFile) return bestFile;

  for (const [s, val] of fileToSlug) {
    const score = tokenScore(slug, s);
    if (score > bestScore && score >= 0.6) {
      bestScore = score;
      bestFile = val;
    }
  }
  return bestFile;
}

const top5Files = fs.readdirSync(DIR)
  .filter(f => f.match(/healthrankings-.*-top5\.html$/))
  .sort();

let totalUpdated = 0;
let totalLinks = 0;
let totalMatched = 0;
const unmatched = [];

for (const file of top5Files) {
  let html = fs.readFileSync(path.join(DIR, file), 'utf-8');
  let changed = false;

  const productNames = [...html.matchAll(/<h3 class="product-name">([\s\S]*?)<\/h3>/g)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim());

  let linkIndex = 0;
  html = html.replace(/<a href="[^"]*" class="product-cta-secondary">Read full review<\/a>/g, (match) => {
    totalLinks++;
    const name = productNames[linkIndex] || null;
    linkIndex++;

    if (!name) return match;

    const href = findReviewFile(name);
    if (href) {
      totalMatched++;
      changed = true;
      return `<a href="${href}" class="product-cta-secondary">Read full review</a>`;
    } else {
      unmatched.push({ file, name, slug: slugify(name) });
      return match;
    }
  });

  if (changed) {
    fs.writeFileSync(path.join(DIR, file), html);
    totalUpdated++;
  }
}

console.log(`Processed ${top5Files.length} top5 pages`);
console.log(`  Files updated: ${totalUpdated}`);
console.log(`  Review links found: ${totalLinks}`);
console.log(`  Matched to review pages: ${totalMatched}`);
console.log(`  Unmatched: ${unmatched.length}`);
if (unmatched.length) {
  console.log('\nUnmatched products (no review page found):');
  for (const u of unmatched.slice(0, 30)) {
    console.log(`  [${u.file}] "${u.name}"`);
  }
  if (unmatched.length > 30) console.log(`  ... and ${unmatched.length - 30} more`);
}
