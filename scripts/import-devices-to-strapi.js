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

/** Strapi Rich Text (blocks) — one or more paragraphs */
function plainTextToBlocks(text) {
  const t = decodeHtmlEntities(String(text || "").trim());
  if (!t) {
    return [
      {
        type: "paragraph",
        children: [{ type: "text", text: "." }],
      },
    ];
  }
  const parts = t.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks = parts.length ? parts : [t];
  return chunks.map((chunk) => ({
    type: "paragraph",
    children: [{ type: "text", text: chunk }],
  }));
}

function buildReviewSections(sections, categoryLabel) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return [
      {
        heading: categoryLabel || "Overview",
        body: plainTextToBlocks("Imported from legacy HTML. Add sections in Strapi as needed."),
      },
    ];
  }
  return sections.map((s) => ({
    heading: decodeHtmlEntities(String(s.heading || "Section").trim()) || "Section",
    body: plainTextToBlocks(s.body),
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

async function strapiFetch(base, token, relUrl, options = {}) {
  const url = new URL(relUrl.replace(/^\//, ""), base.endsWith("/") ? base : `${base}/`);
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

async function deviceExists(base, token, slug) {
  const q = `filters[slug][$eq]=${encodeURIComponent(slug)}`;
  const { res, json } = await strapiFetch(base, token, `/api/devices?${q}`);
  if (!res.ok) return { ok: false, error: json };
  const list = Array.isArray(json?.data) ? json.data : [];
  return { ok: true, exists: list.length > 0 };
}

async function createDevice(base, token, data) {
  const { res, json } = await strapiFetch(base, token, "/api/devices", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = (process.env.STRAPI_URL || "").replace(/\/$/, "");
  const token = process.env.STRAPI_IMPORT_TOKEN || "";

  if (!args.dryRun && (!base || !token)) {
    console.error("Set STRAPI_URL and STRAPI_IMPORT_TOKEN (or use --dry-run).");
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

    const check = await deviceExists(base, token, data.slug);
    if (!check.ok) {
      console.error("Lookup failed for", data.slug, check.error);
      failed += 1;
      continue;
    }
    if (check.exists) {
      console.log("Skip existing:", data.slug);
      skipped += 1;
      continue;
    }

    const { ok, status, json } = await createDevice(base, token, data);
    if (!ok) {
      console.error("POST failed", data.slug, status, JSON.stringify(json).slice(0, 500));
      failed += 1;
    } else {
      created += 1;
      if (created % 25 === 0) console.log("… imported", created);
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
