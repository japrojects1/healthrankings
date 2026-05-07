#!/usr/bin/env node
/**
 * Import editorial articles from data/articles-seed.json into Strapi.
 *
 *   STRAPI_URL=... STRAPI_IMPORT_TOKEN=... node scripts/import-articles-to-strapi.js
 *
 * Optional: STRAPI_ARTICLE_PLURAL (default: articles)
 * Options: --dry-run --limit=N --start=N
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SEED_PATH = path.join(ROOT, "data", "articles-seed.json");

function parseArgs(argv) {
  const out = { dryRun: false, limit: null, start: 0 };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--limit=")) out.limit = Math.max(0, parseInt(a.slice("--limit=".length), 10) || 0);
    else if (a.startsWith("--start=")) out.start = Math.max(0, parseInt(a.slice("--start=".length), 10) || 0);
  }
  return out;
}

function buildApiUrl(base, pathWithQuery) {
  const b = String(base || "").replace(/\/$/, "");
  const p = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  return `${b}${p}`;
}

async function strapiFetch(url, token, options = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { res, json };
}

function isDuplicateSlugError(json) {
  const msg = JSON.stringify(json || {}).toLowerCase();
  if (msg.includes("unique") && msg.includes("slug")) return true;
  const errs = json?.error?.details?.errors;
  if (Array.isArray(errs)) {
    return errs.some((e) => String(e?.path || []).includes("slug") && String(e?.message || "").toLowerCase().includes("unique"));
  }
  return false;
}

function normalizeArticle(row) {
  const slug = String(row.slug || "")
    .trim()
    .toLowerCase();
  const title = String(row.title || "").trim();
  if (!slug || !title) return null;

  const data = {
    slug,
    title,
    body: String(row.body || "").trim() || ".",
  };
  if (row.tag) data.tag = String(row.tag);
  if (row.topic) data.topic = String(row.topic);
  if (row.subtitle) data.subtitle = String(row.subtitle);
  if (row.metaDescription) data.metaDescription = String(row.metaDescription);
  if (row.readTime) data.readTime = String(row.readTime);
  if (row.authorLine) data.authorLine = String(row.authorLine);
  if (row.publishedDate) data.publishedDate = String(row.publishedDate).slice(0, 10);
  return data;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = (process.env.STRAPI_URL || "").replace(/\/$/, "");
  const token = (process.env.STRAPI_IMPORT_TOKEN || "").trim();
  const plural = (process.env.STRAPI_ARTICLE_PLURAL || "articles").replace(/^\/+|\/+$/g, "");

  if (!args.dryRun && (!base || !token)) {
    console.error("Set STRAPI_URL and STRAPI_IMPORT_TOKEN (or use --dry-run).");
    process.exit(1);
  }

  const tokenLower = token.toLowerCase();
  const placeholderTokens = new Set([
    "...",
    "your_token",
    "your_token_here",
    "paste_your_token_here",
    "paste_the_full_token_here",
    "changeme",
    "replace_me",
  ]);
  if (!args.dryRun && (placeholderTokens.has(tokenLower) || token.length < 32)) {
    console.error("STRAPI_IMPORT_TOKEN is missing or invalid. See import-devices-to-strapi.js header for how to create a token.");
    process.exit(1);
  }

  if (!fs.existsSync(SEED_PATH)) {
    console.error("Missing", SEED_PATH, "— run: node scripts/seed-articles-from-html.js");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  if (!Array.isArray(raw)) {
    console.error("articles-seed.json must be an array.");
    process.exit(1);
  }

  if (!args.dryRun) {
    const probeUrl = buildApiUrl(base, `/api/${plural}?pagination[pageSize]=1`);
    const probe = await strapiFetch(probeUrl, token, { method: "GET" });
    if (probe.res.status === 404) {
      console.error(`404 for ${probeUrl} — deploy CMS with Article routes, or set STRAPI_ARTICLE_PLURAL.`);
      process.exit(1);
    }
    if (probe.res.status === 401 || probe.res.status === 403) {
      console.error(`Content API ${probe.res.status}. Check API token (Full access).`);
      process.exit(1);
    }
    if (!probe.res.ok) {
      console.error("Probe failed:", probe.res.status, JSON.stringify(probe.json).slice(0, 400));
      process.exit(1);
    }
  }

  const slice = raw.slice(args.start, args.limit != null ? args.start + args.limit : undefined);
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of slice) {
    const data = normalizeArticle(row);
    if (!data) {
      skipped += 1;
      continue;
    }
    if (args.dryRun) {
      console.log("[dry-run]", data.slug, data.title);
      continue;
    }

    const url = buildApiUrl(base, `/api/${plural}`);
    const { res, json } = await strapiFetch(url, token, {
      method: "POST",
      body: JSON.stringify({ data }),
    });

    if (res.ok) {
      created += 1;
    } else if (res.status === 400 && isDuplicateSlugError(json)) {
      console.log("Skip existing:", data.slug);
      skipped += 1;
    } else {
      console.error("POST failed", data.slug, res.status, JSON.stringify(json).slice(0, 600));
      failed += 1;
    }
    await new Promise((r) => setTimeout(r, 75));
  }

  console.log(
    args.dryRun ? `Dry run (${slice.length} rows).` : `Done. created=${created} skipped=${skipped} failed=${failed}`
  );
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
