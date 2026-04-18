#!/usr/bin/env node
/**
 * Reads scripts/catalog-bpm-slug-asins.json (slug → ASIN), fetches each unique ASIN once
 * from Amazon (22s between requests), maps gallery image URL to every slug using that ASIN.
 * Merges successful URLs into ../catalog-amazon-by-slug.json (does not remove existing keys).
 *
 * Usage: node scripts/fetch-bpm-slug-images.js
 *        node scripts/fetch-bpm-slug-images.js scripts/catalog-bpm-slug-asins-round2.json
 *        node scripts/fetch-bpm-slug-images.js --dry   (print ASIN groups only)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { extractMainGalleryImageUrl } = require('./amazon-extract-main-image.js');

const root = path.join(__dirname, '..');
const mapPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, 'catalog-bpm-slug-asins.json');
const outSlugPath = path.join(root, 'catalog-amazon-by-slug.json');
const DELAY_MS = 22000;
const ua =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

function fetchAsin(asin) {
  return new Promise((resolve, reject) => {
    let d = '';
    https
      .get(`https://www.amazon.com/dp/${asin}`, { headers: { 'User-Agent': ua, Accept: 'text/html' } }, (res) => {
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ html: d, len: d.length }));
      })
      .on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const dry = process.argv.includes('--dry');
  const raw = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const slugToAsin = Object.entries(raw).filter(([k]) => !k.startsWith('_'));

  const asinToSlugs = new Map();
  for (const [slug, asin] of slugToAsin) {
    const a = String(asin).trim().toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(a)) {
      console.error('Skip invalid ASIN:', slug, asin);
      continue;
    }
    if (!asinToSlugs.has(a)) asinToSlugs.set(a, []);
    asinToSlugs.get(a).push(slug);
  }

  const uniqueAsins = [...asinToSlugs.keys()];
  console.error('Unique ASINs to fetch:', uniqueAsins.length);

  const slugToUrl = {};
  for (let i = 0; i < uniqueAsins.length; i++) {
    const asin = uniqueAsins[i];
    const slugs = asinToSlugs.get(asin);
    if (dry) {
      console.log(asin, '→', slugs.join(', '));
      continue;
    }
    if (i > 0) await sleep(DELAY_MS);
    try {
      const { html, len } = await fetchAsin(asin);
      const url = extractMainGalleryImageUrl(html);
      if (url && len > 10000) {
        for (const slug of slugs) slugToUrl[slug] = url;
        console.error('OK', asin, slugs[0], url);
      } else {
        console.error('FAIL', asin, 'len=', len, url ? 'badlen' : 'noimg');
      }
    } catch (e) {
      console.error('ERR', asin, e.message);
    }
  }

  if (dry) return;

  const merged = JSON.parse(fs.readFileSync(outSlugPath, 'utf8'));
  Object.assign(merged, slugToUrl);
  const keys = Object.keys(merged).filter((k) => k !== '_comment').sort();
  const ordered = {};
  if (merged._comment != null) ordered._comment = merged._comment;
  for (const k of keys) ordered[k] = merged[k];
  fs.writeFileSync(outSlugPath, JSON.stringify(ordered, null, 2) + '\n', 'utf8');
  console.error('Updated', outSlugPath, 'new/updated slug entries:', Object.keys(slugToUrl).length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
