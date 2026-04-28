const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DEST = path.join(ROOT, "apps", "web", "public");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(srcDir, e.name);
    const d = path.join(destDir, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else if (e.isFile()) copyFile(s, d);
  }
}

function main() {
  ensureDir(DEST);

  // Root HTML pages
  const rootFiles = fs.readdirSync(ROOT);
  for (const f of rootFiles) {
    if (!f.endsWith(".html")) continue;
    copyFile(path.join(ROOT, f), path.join(DEST, f));
  }

  // Core SEO + verification artifacts
  for (const f of ["robots.txt", "sitemap.xml", "news-feed.xml", "googled1734124e4ff88d6.html"]) {
    const fp = path.join(ROOT, f);
    if (fs.existsSync(fp)) copyFile(fp, path.join(DEST, f));
  }

  // Assets and generated content
  copyDir(path.join(ROOT, "brand"), path.join(DEST, "brand"));
  copyDir(path.join(ROOT, "images"), path.join(DEST, "images"));
  copyDir(path.join(ROOT, "news"), path.join(DEST, "news"));
  copyDir(path.join(ROOT, ".well-known"), path.join(DEST, ".well-known"));

  console.log(`Copied static site into ${path.relative(ROOT, DEST)}`);
}

main();

