const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function textBetween(html, startRe, endRe) {
  const start = html.search(startRe);
  if (start === -1) return "";
  const sliced = html.slice(start);
  const end = sliced.search(endRe);
  if (end === -1) return "";
  return sliced.slice(0, end);
}

function stripTags(s) {
  return String(s || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickAllLi(html) {
  const out = [];
  const re = /<li>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = re.exec(html))) {
    const t = stripTags(m[1]);
    if (t) out.push(t);
  }
  return out;
}

function slugFromFilename(file) {
  const base = file.replace(/\.html$/i, "");
  return base
    .replace(/^healthrankings-review-/, "")
    .replace(/^healthrankings-/, "")
    .toLowerCase();
}

function extractDeviceFromReviewHtml(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const filename = path.basename(filePath);
  const slug = slugFromFilename(filename);

  const nameMatch = html.match(/<h1>([^<]+)<\/h1>/i);
  const name = nameMatch ? stripTags(nameMatch[1]) : slug;

  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const metaDesc = descMatch ? descMatch[1] : "";

  const verdictTitleMatch = html.match(/<div class="verdict-title">([\s\S]*?)<\/div>/i);
  const verdictSummaryMatch = html.match(/<div class="verdict-summary">([\s\S]*?)<\/div>/i);
  const verdictShort = stripTags(verdictSummaryMatch ? verdictSummaryMatch[1] : metaDesc);

  const scoreMatch = html.match(/<div class="verdict-score-num">([\d.]+)<\/div>/i);
  const rating10 = scoreMatch ? Number(scoreMatch[1]) : null;
  const rating5 = rating10 != null && Number.isFinite(rating10) ? Math.round((rating10 / 2) * 10) / 10 : null;

  // Pros/cons block
  const prosBlock = textBetween(html, /<div class="pc-card pc-pros">/i, /<\/div>\s*<\/div>/i);
  const consBlock = textBetween(html, /<div class="pc-card pc-cons">/i, /<\/div>\s*<\/div>/i);
  const pros = prosBlock ? pickAllLi(prosBlock) : [];
  const cons = consBlock ? pickAllLi(consBlock) : [];

  // Review sections: try to capture each .review-section id + h2 + a short paragraph/summary
  const sections = [];
  const sectionRe = /<div class="review-section" id="([^"]+)">([\s\S]*?)<\/div>\s*<\/div>/gi;
  let sm;
  while ((sm = sectionRe.exec(html))) {
    const id = sm[1];
    const block = sm[2];
    const h2 = (block.match(/<h2>([\s\S]*?)<\/h2>/i) || [])[1];
    const heading = stripTags(h2 || id);
    const p = (block.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
    const body = stripTags(p || "");
    if (heading && body) sections.push({ heading, body });
  }

  return {
    slug,
    name,
    rating: rating5,
    pros,
    cons,
    verdictShort,
    reviewSections: sections.slice(0, 8),
    sourceHtmlPath: filename,
  };
}

function main() {
  const files = fs
    .readdirSync(ROOT)
    .filter((f) => /^healthrankings-review-.*\.html$/i.test(f))
    .sort();

  const devices = [];
  for (const f of files) {
    const fp = path.join(ROOT, f);
    devices.push(extractDeviceFromReviewHtml(fp));
  }

  const outPath = path.join(ROOT, "data", "devices-seed.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(devices, null, 2) + "\n");

  console.log(`Seeded ${devices.length} devices → data/devices-seed.json`);
}

main();

