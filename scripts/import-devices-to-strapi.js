#!/usr/bin/env node
/**
 * Import devices from data/devices-seed.json into Strapi (REST API).
 *
 * Prereqs in Strapi admin:
 * Settings → API Tokens → Create token (e.g. name "import", type: Full access is simplest for a one-off import).
 *
 * Usage:
 *   STRAPI_URL=https://healthrankings-cms.onrender.com \
 *   STRAPI_IMPORT_TOKEN=your_token_here \
 *   node scripts/import-devices-to-strapi.js
 *
 * Optional env:
 *   STRAPI_DEVICE_PLURAL   REST segment (default: devices). Must match Content-Type Builder → API ID (Plural).
 *
 * Options:
 *   --dry-run          Log actions only (no POST)
 *   --limit=N          Import at most N devices (after --start)
 *   --start=N          Skip first N entries in the seed file (default 0)
 *   --category=other   Force category enum (default: other)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SEED_PATH = path.join(ROOT, "data", "devices-seed.json");

const DEFAULT_CATEGORY = "other";

function parseArgs(argv) {
  const out = { dryRun: false, limit: null, start: 0, category: DEFAULT_CATEGORY };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--limit=")) out.limit = Math.max(0, parseInt(a.slice("--limit=".length), 10) || 0);
    else if (a.startsWith("--start=")) out.start = Math.max(0, parseInt(a.slice("--start=".length), 10) || 0);
    else if (a.startsWith("--category=")) out.category = a.slice("--category=".length).trim() || DEFAULT_CATEGORY;
  }
  return out;
}

function buildApiUrl(base, pathWithQuery) {
  const b = String(base || "").replace(/\/$/, "");
  const p = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  return `${b}${p}`;
}

function decodeHtmlEntities(str) {
  if (str == null || typeof str !== "string") return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * `review.section` uses Strapi "richtext" stored as a plain string via REST (not Blocks JSON).
 * See ValidationError: body must be a `string` type.
 */
function sectionBodyToString(text) {
  const t = decodeHtmlEntities(String(text ?? "").trim());
  return t.length ? t : ".";
}

function buildReviewSections(sections, categoryLabel) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return [
      {
        heading: categoryLabel || "Overview",
        body: sectionBodyToString("Imported from legacy HTML. Add sections in Strapi as needed."),
      },
    ];
  }
  return sections.map((s) => ({
    heading: decodeHtmlEntities(String(s.heading || "Section").trim()) || "Section",
    body: sectionBodyToString(s.body),
  }));
}

function normalizeSeedRow(row, category) {
  const name = decodeHtmlEntities(String(row.name || "").trim());
  const slug = String(row.slug || "")
    .trim()
    .toLowerCase();
  if (!name || !slug) return null;

  const pros = Array.isArray(row.pros) ? row.pros.map((x) => decodeHtmlEntities(String(x))) : [];
  const cons = Array.isArray(row.cons) ? row.cons.map((x) => decodeHtmlEntities(String(x))) : [];

  return {
    slug,
    name,
    category,
    rating: row.rating != null ? Number(row.rating) : null,
    pros,
    cons,
    verdictShort: row.verdictShort != null ? decodeHtmlEntities(String(row.verdictShort)) : null,
    reviewSections: buildReviewSections(row.reviewSections, name),
  };
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
  if (msg.includes("must be unique") && msg.includes("slug")) return true;
  const errs = json?.error?.details?.errors;
  if (Array.isArray(errs)) {
    return errs.some((e) => String(e?.path || []).includes("slug") && String(e?.message || "").toLowerCase().includes("unique"));
  }
  return false;
}

async function createDevice(baseUrl, token, plural, data) {
  const url = buildApiUrl(baseUrl, `/api/${plural}`);
  return strapiFetch(url, token, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
}

async function probeContentApi(baseUrl, token, plural) {
  const url = buildApiUrl(baseUrl, `/api/${plural}?pagination[pageSize]=1`);
  return strapiFetch(url, token, { method: "GET" });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = (process.env.STRAPI_URL || "").replace(/\/$/, "");
  const token = (process.env.STRAPI_IMPORT_TOKEN || "").trim();
  const plural = (process.env.STRAPI_DEVICE_PLURAL || "devices").replace(/^\/+|\/+$/g, "");

  if (!args.dryRun && (!base || !token)) {
    console.error("Set STRAPI_URL and STRAPI_IMPORT_TOKEN (or use --dry-run).");
    process.exit(1);
  }

  if (!args.dryRun && (token === "..." || token.length < 20)) {
    console.error(
      "STRAPI_IMPORT_TOKEN looks invalid (placeholder or too short). In Strapi: Settings → API Tokens → create a token and paste the full secret."
    );
    process.exit(1);
  }

  if (!fs.existsSync(SEED_PATH)) {
    console.error("Missing seed file:", SEED_PATH);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  if (!Array.isArray(raw)) {
    console.error("Seed JSON must be an array.");
    process.exit(1);
  }

  if (!args.dryRun) {
    const probe = await probeContentApi(base, token, plural);
    if (probe.res.status === 404) {
      console.error(`
Content API returned 404 for: ${buildApiUrl(base, `/api/${plural}`)}

That usually means the REST route for this collection is not registered on the server.
Fix: deploy the CMS with api::device routes/controllers/services (see apps/cms/src/api/device/), then redeploy.

If your plural API ID is not "${plural}", set STRAPI_DEVICE_PLURAL to match Content-Type Builder (e.g. device-reviews).
`);
      process.exit(1);
    }
    if (probe.res.status === 401 || probe.res.status === 403) {
      console.error(
        `Content API returned ${probe.res.status} for GET /api/${plural}.
- Use the real token value from Strapi (Settings → API Tokens). Do not leave "..." as a placeholder.
- Token type should be Full access for import (or Custom with find + create on Device).
- Copy/paste can add spaces; the script trims them.`
      );
      process.exit(1);
    }
    if (!probe.res.ok) {
      console.error(`Unexpected response ${probe.res.status} probing /api/${plural}:`, JSON.stringify(probe.json).slice(0, 800));
      process.exit(1);
    }
  }

  const slice = raw.slice(args.start, args.limit != null ? args.start + args.limit : undefined);
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of slice) {
    const data = normalizeSeedRow(row, args.category);
    if (!data) {
      console.warn("Skip invalid row:", row?.slug || row?.name || "(empty)");
      skipped += 1;
      continue;
    }

    if (args.dryRun) {
      console.log("[dry-run] would import:", data.slug, data.name);
      continue;
    }

    const { res, json } = await createDevice(base, token, plural, data);
    if (res.ok) {
      created += 1;
      if (created % 25 === 0) console.log("… imported", created);
    } else if (res.status === 400 && isDuplicateSlugError(json)) {
      console.log("Skip existing (unique slug):", data.slug);
      skipped += 1;
    } else {
      console.error("POST failed", data.slug, res.status, JSON.stringify(json).slice(0, 500));
      failed += 1;
    }

    await new Promise((r) => setTimeout(r, 75));
  }

  console.log(
    args.dryRun
      ? `Dry run done (${slice.length} rows).`
      : `Done. created=${created} skipped=${skipped} failed=${failed}`
  );
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
