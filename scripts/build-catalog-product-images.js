/**
 * Reads:
 *   - catalog-images-by-slug.json (review page stem → product image URL, highest priority)
 *   - catalog-name-to-product-key.json (optional: catalog dl-name → PRODUCT_IMAGES key)
 *   - healthrankings-devices.html PRODUCT_IMAGES
 *   - all healthrankings-all-*.html catalog rows
 * Writes: ../catalog-product-images.js
 *
 * Policy: Prefer slug overrides (any https:// URL), then exact device-map matches.
 * Substring matching only uses Amazon CDN URLs (avoids wrong-category official art).
 * Broad brand fallbacks are disabled so different models are not forced to share one
 * stock photo.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const devicesPath = path.join(root, 'healthrankings-devices.html');
const slugPath = path.join(root, 'catalog-images-by-slug.json');
const nameToKeyPath = path.join(root, 'catalog-name-to-product-key.json');

function isAmazonMainImageUrl(url) {
  return typeof url === 'string' && url.includes('m.media-amazon.com/images/I/');
}

function isHttpsUrl(url) {
  return typeof url === 'string' && /^https:\/\/.+/.test(url);
}

/** For slug overrides we accept any https:// URL (Amazon, WP uploads, official CDNs, etc.) */
function isAllowedSlugUrl(url) {
  return isHttpsUrl(url);
}

/** For PRODUCT_IMAGES / fallback matching we stay strict: Amazon + known official CDNs */
function isAllowedCatalogThumbnailUrl(url) {
  if (isAmazonMainImageUrl(url)) return true;
  if (!isHttpsUrl(url)) return false;
  if (url.startsWith('https://image-cache.withings.com/site/media/')) return true;
  if (url.startsWith('https://oxiline.shop/app/uploads/')) return true;
  if (url.startsWith('https://cdn.shopify.com/')) return true;
  return false;
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
    if (typeof v === 'string' && isAllowedSlugUrl(v)) out[k] = v;
  }
  return out;
}

function loadNameToProductKey() {
  if (!fs.existsSync(nameToKeyPath)) return {};
  const raw = JSON.parse(fs.readFileSync(nameToKeyPath, 'utf8'));
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('_')) continue;
    if (typeof v === 'string' && v.length) out[k] = v;
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
    if (kl.length < 12) continue;
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

function resolveUrl(name, slug, deviceMap, deviceKeys, slugMap, nameToKey) {
  if (slugMap[slug] && isAllowedSlugUrl(slugMap[slug])) {
    return slugMap[slug];
  }

  const keyFromCatalog = nameToKey[name];
  if (keyFromCatalog && deviceMap[keyFromCatalog] && isAllowedCatalogThumbnailUrl(deviceMap[keyFromCatalog])) {
    return deviceMap[keyFromCatalog];
  }

  let url = '';
  if (deviceMap[name] && isAllowedCatalogThumbnailUrl(deviceMap[name])) {
    url = deviceMap[name];
  } else if (EXTRA_ALIASES[name] && deviceMap[EXTRA_ALIASES[name]]) {
    const u = deviceMap[EXTRA_ALIASES[name]];
    if (isAllowedCatalogThumbnailUrl(u)) url = u;
  }

  if (!url) {
    const sub = matchBySubstring(name, deviceKeys);
    if (sub && isAmazonMainImageUrl(deviceMap[sub])) url = deviceMap[sub];
  }

  if (url && !isAllowedCatalogThumbnailUrl(url)) url = '';

  return url;
}

function main() {
  const devicesHtml = fs.readFileSync(devicesPath, 'utf8');
  const deviceMap = parseProductImages(devicesHtml);
  const deviceKeys = Object.keys(deviceMap);
  const slugMap = loadSlugMap();
  const nameToKey = loadNameToProductKey();
  const rows = collectCatalogRows();

  const byName = {};
  const seen = new Set();

  for (const { name, slug } of rows) {
    if (seen.has(name)) continue;
    seen.add(name);
    byName[name] = resolveUrl(name, slug, deviceMap, deviceKeys, slugMap, nameToKey);
  }

  const sortedNames = Object.keys(byName).sort();
  let js = `/* Auto-generated by scripts/build-catalog-product-images.js — run: node scripts/build-catalog-product-images.js */\n`;
  js += `/* Per-review overrides: catalog-images-by-slug.json · name→device key: catalog-name-to-product-key.json */\n`;
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
  console.log('Name→key aliases:', Object.keys(nameToKey).length);
  console.log('Products:', sortedNames.length, 'with thumbnail URL:', withUrl, 'placeholder:', sortedNames.length - withUrl);
}

main();
