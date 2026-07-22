#!/usr/bin/env node
/**
 * Adds a "Supplements" nav link immediately after the "Devices" link in the
 * global top menu (both the desktop <nav class="nav"> and the mobile drawer)
 * across every tracked HTML page.
 *
 * Safe by design:
 *  - Only inserts when the Devices anchor is immediately followed by another
 *    <a ...> (i.e. a nav/drawer link). Breadcrumbs are followed by <span>, so
 *    they are never touched.
 *  - Idempotent: skips files that already link to /healthrankings-supplements.html.
 *
 * Usage:  node scripts/add-supplements-nav.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

// Only touch git-tracked HTML files (excludes node_modules, .next, etc.).
const tracked = execSync('git ls-files "*.html"', { cwd: repoRoot, encoding: 'utf8' })
  .split('\n')
  .map(s => s.trim())
  .filter(Boolean)
  // Strapi admin/build assets should not get the marketing nav.
  .filter(f => !f.startsWith('apps/cms/'))
  // Don't rewrite the supplements page itself (it already ships with the link).
  .filter(f => path.basename(f) !== 'healthrankings-supplements.html');

const SUPPLEMENTS_LINK = '<a href="/healthrankings-supplements.html">Supplements</a>';

// Match a Devices nav anchor that is immediately followed by another <a ...>.
// Group 1 = the Devices anchor, Group 2 = the following whitespace, Group 3 = "<a "
const NAV_RX =
  /(<a\s+href="[^"]*healthrankings-devices\.html"[^>]*>Devices<\/a>)(\s*)(<a\s)/g;

let updated = 0;
let skipped = 0;

for (const rel of tracked) {
  const fp = path.join(repoRoot, rel);
  let html;
  try {
    html = fs.readFileSync(fp, 'utf8');
  } catch {
    continue;
  }

  if (html.includes('/healthrankings-supplements.html')) {
    skipped++;
    continue;
  }
  if (!/healthrankings-devices\.html"[^>]*>Devices<\/a>/.test(html)) {
    skipped++;
    continue;
  }

  const next = html.replace(NAV_RX, (m, devicesAnchor, gap, nextOpen) => {
    // Preserve whatever spacing separated the original nav links.
    const sep = gap && gap.length ? gap : '';
    return `${devicesAnchor}${sep}${SUPPLEMENTS_LINK}${sep}${nextOpen}`;
  });

  if (next !== html) {
    fs.writeFileSync(fp, next, 'utf8');
    updated++;
  } else {
    skipped++;
  }
}

console.log(`Supplements nav: updated ${updated} files, skipped ${skipped}.`);
