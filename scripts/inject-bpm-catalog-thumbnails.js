#!/usr/bin/env node
/**
 * Inserts a product thumbnail after each .dl-rank on healthrankings-all-blood-pressure-monitors.html.
 * Image URL: catalog-images-by-slug.json key healthrankings-review-{slug}, else /images/bpm-catalog-placeholder.svg
 *
 * Usage: node scripts/inject-bpm-catalog-thumbnails.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const catalogPath = path.join(root, 'catalog-images-by-slug.json');
const htmlPath = path.join(root, 'healthrankings-all-blood-pressure-monitors.html');
const PLACEHOLDER = '/images/bpm-catalog-placeholder.svg';

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

function decodeBasicEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function resolveImageUrl(slug) {
  const key = `healthrankings-review-${slug}`;
  const u = catalog[key];
  if (typeof u === 'string' && u.trim()) return u.trim();
  return null;
}

let html = fs.readFileSync(htmlPath, 'utf8');

const re =
  /<a href="\/healthrankings-review-(.+)\.html" class="([^"]+)">\s*<div class="dl-rank">(\d+)<\/div>\s*(?:<div class="dl-thumb-wrap">[\s\S]*?<\/div>\s*)?<div class="dl-info">\s*<div class="dl-name">([^<]*)<\/div>/g;

let n = 0;
html = html.replace(re, (match, slug, cls, rank, name) => {
  n++;
  const url = resolveImageUrl(slug);
  const src = escapeAttr(url || PLACEHOLDER);
  const alt = escapeAttr(decodeBasicEntities((name || '').trim()) || 'Blood pressure monitor');
  const extraAttr = url ? ' referrerpolicy="no-referrer"' : '';
  const thumb = `<div class="dl-thumb-wrap"><img class="dl-thumb" src="${src}" alt="${alt}" loading="lazy" decoding="async"${extraAttr}></div>`;
  return `<a href="/healthrankings-review-${slug}.html" class="${cls}">\n      <div class="dl-rank">${rank}</div>\n      ${thumb}\n      <div class="dl-info">\n        <div class="dl-name">${name}</div>`;
});

if (n === 0) {
  console.error('No dl-items matched; aborting write.');
  process.exit(1);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.error(`Injected thumbnails into ${path.relative(root, htmlPath)} (${n} rows).`);
