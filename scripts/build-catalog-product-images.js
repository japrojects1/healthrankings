/**
 * Reads:
 *   - catalog-amazon-by-slug.json (review page stem → Amazon main image, highest priority)
 *   - healthrankings-devices.html PRODUCT_IMAGES
 *   - all healthrankings-all-*.html catalog rows
 * Writes: ../catalog-product-images.js
 *
 * Policy: Catalog thumbnails use Amazon CDN main gallery images only (m.media-amazon.com).
 * Non-Amazon URLs from the devices map are omitted unless overridden by slug JSON.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const devicesPath = path.join(root, 'healthrankings-devices.html');
const slugPath = path.join(root, 'catalog-amazon-by-slug.json');

function isAmazonMainImageUrl(url) {
  return typeof url === 'string' && url.includes('m.media-amazon.com/images/I/');
}

function parseProductImages(html) {
  const m = html.match(/const PRODUCT_IMAGES = \{([\s\S]*?)\n\};/);
  if (!m) throw new Error('PRODUCT_IMAGES not found');
  const body = m[1];
  const out = {};
  const re = /'((?:\\'|[^'])+)':\s*'([^']+)'/g;
  let x;
  while ((x = re.exec(body))) {
    const key = x[1].replace(/\\'/g, "'");
    out[key] = x[2];
  }
  return out;
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#64;/g, '@')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .trim();
}

function hrefToSlug(href) {
  const s = href.replace(/^\//, '');
  return s.replace(/\.html$/, '');
}

function loadSlugMap() {
  if (!fs.existsSync(slugPath)) return {};
  const raw = JSON.parse(fs.readFileSync(slugPath, 'utf8'));
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('_')) continue;
    if (typeof v === 'string' && isAmazonMainImageUrl(v)) out[k] = v;
  }
  return out;
}

function collectCatalogRows() {
  const files = fs.readdirSync(root).filter((f) => f.startsWith('healthrankings-all-') && f.endsWith('.html'));
  const rows = [];
  for (const f of files) {
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    const blockRe = /<a href="(\/healthrankings-review-[^"]+\.html)" class="dl-item[^"]*">([\s\S]*?)<\/a>/g;
    let m;
    while ((m = blockRe.exec(html))) {
      const href = m[1];
      const inner = m[2];
      const nameM = inner.match(/<div class="dl-name">([^<]+)<\/div>/);
      if (!nameM) continue;
      const name = decodeHtmlEntities(nameM[1]);
      rows.push({ file: f, href, name, slug: hrefToSlug(href) });
    }
  }
  return rows;
}

function matchBySubstring(name, deviceKeys) {
  const n = name.toLowerCase();
  let best = '';
  let bestLen = 0;
  for (const k of deviceKeys) {
    const kl = k.toLowerCase();
    if (kl.length < 8) continue;
    if (n.includes(kl) && k.length > bestLen) {
      best = k;
      bestLen = k.length;
    }
  }
  return best;
}

const EXTRA_ALIASES = {
  'Pressure XS Pro Bluetooth Monitor': 'Oxiline Pressure XS Pro',
};

/**
 * Only Amazon URLs; representative models (avoid wrong categories, e.g. thermometer for BP).
 */
function brandFallbackUrl(name, deviceMap) {
  const n = name.toLowerCase();
  const o = (k) => {
    const u = deviceMap[k] || '';
    return isAmazonMainImageUrl(u) ? u : '';
  };
  if (n.includes('omron')) return o('Omron Platinum BP5450');
  if (n.includes('withings')) return o('Withings BPM Connect');
  if (n.includes('oxiline') || n.includes('pressure xs pro')) return o('Oxiline Pressure XS Pro');
  if (n.includes('theragun')) return o('Theragun PRO Gen 6');
  if (n.includes('hypervolt')) return o('Hypervolt 2 Pro');
  if (n.includes('renpho') && n.includes('massage')) return o('Renpho R3 Percussion Massager');
  if (n.includes('waterpik')) return o('Waterpik Aquarius WP-660');
  if (n.includes('oral-b') || n.includes('oral b')) return o('Oral-B Pro 3000');
  if (n.includes('sonicare') || n.includes('philips')) return o('Philips Sonicare DiamondClean Smart 9750');
  if (n.includes('tanita')) return o('Tanita RD-953');
  if (n.includes('garmin') && n.includes('index s2')) return o('Garmin Index S2');
  if (n.includes('garmin') && n.includes('bpm')) return '';
  return '';
}

function resolveUrl(name, slug, deviceMap, deviceKeys, slugMap) {
  if (slugMap[slug] && isAmazonMainImageUrl(slugMap[slug])) {
    return slugMap[slug];
  }

  let url = '';
  if (deviceMap[name] && isAmazonMainImageUrl(deviceMap[name])) {
    url = deviceMap[name];
  } else if (EXTRA_ALIASES[name] && deviceMap[EXTRA_ALIASES[name]]) {
    const u = deviceMap[EXTRA_ALIASES[name]];
    if (isAmazonMainImageUrl(u)) url = u;
  }

  if (!url) {
    const sub = matchBySubstring(name, deviceKeys);
    if (sub && isAmazonMainImageUrl(deviceMap[sub])) url = deviceMap[sub];
  }

  if (!url) {
    url = brandFallbackUrl(name, deviceMap);
  }

  if (url && !isAmazonMainImageUrl(url)) url = '';

  if (!url && slugMap[slug] && isAmazonMainImageUrl(slugMap[slug])) {
    url = slugMap[slug];
  }

  return url;
}

function main() {
  const devicesHtml = fs.readFileSync(devicesPath, 'utf8');
  const deviceMap = parseProductImages(devicesHtml);
  const deviceKeys = Object.keys(deviceMap);
  const slugMap = loadSlugMap();
  const rows = collectCatalogRows();

  const byName = {};
  const seen = new Set();

  for (const { name, slug } of rows) {
    if (seen.has(name)) continue;
    seen.add(name);
    byName[name] = resolveUrl(name, slug, deviceMap, deviceKeys, slugMap);
  }

  const sortedNames = Object.keys(byName).sort();
  let js = `/* Auto-generated by scripts/build-catalog-product-images.js — run: node scripts/build-catalog-product-images.js */\n`;
  js += `/* Catalog uses Amazon main gallery images (m.media-amazon.com). Add per-product overrides in catalog-amazon-by-slug.json */\n`;
  js += `(function(){\n'use strict';\nwindow.CATALOG_PRODUCT_IMAGES = {\n`;
  for (const name of sortedNames) {
    const url = byName[name];
    const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    js += `  '${esc(name)}': '${esc(url)}',\n`;
  }
  js += `};\n})();\n`;

  const outPath = path.join(root, 'catalog-product-images.js');
  fs.writeFileSync(outPath, js, 'utf8');
  const withUrl = sortedNames.filter((n) => byName[n]).length;
  console.log('Wrote', outPath);
  console.log('Slug overrides:', Object.keys(slugMap).length);
  console.log('Products:', sortedNames.length, 'with Amazon URL:', withUrl, 'placeholder:', sortedNames.length - withUrl);
}

main();
