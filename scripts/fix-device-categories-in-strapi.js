#!/usr/bin/env node
/**
 * Backfill `device.category` in Strapi from legacy review HTML files.
 *
 * Why: older imports defaulted every device to "other", which prevents per-category top-5 lists.
 *
 * It parses JSON-LD in files like:
 *   healthrankings-review-<slug>.html
 * and maps `itemReviewed.category` → the Device category enumeration.
 *
 * Usage:
 *   STRAPI_URL=https://healthrankings-cms.onrender.com \
 *   STRAPI_IMPORT_TOKEN=<token with Device update permission> \
 *   node scripts/fix-device-categories-in-strapi.js
 *
 * Options:
 *   --dry-run         Print what would change
 *   --limit=N         Process at most N devices
 *   --start=N         Skip first N devices
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const CATEGORY_MAP = new Map([
  ["blood pressure monitors", "blood-pressure-monitors"],
  ["blood-pressure monitors", "blood-pressure-monitors"],
  ["blood pressure monitor", "blood-pressure-monitors"],

  ["body composition scales", "body-composition-scales"],
  ["body composition scale", "body-composition-scales"],
  ["smart scales", "body-composition-scales"],
  ["smart scale", "body-composition-scales"],
  ["body composition monitors", "body-composition-scales"],

  ["pulse oximeters", "pulse-oximeters"],
  ["pulse oximeter", "pulse-oximeters"],

  ["breathing trainers", "breathing-trainers"],
  ["breathing trainer", "breathing-trainers"],

  ["tens units", "tens-units"],
  ["tens unit", "tens-units"],

  ["thermometers", "thermometers"],
  ["thermometer", "thermometers"],

  ["water flossers", "water-flossers"],
  ["water flosser", "water-flossers"],

  ["home test kits", "home-test-kits"],
  ["home test kit", "home-test-kits"],
  ["home testing kits", "home-test-kits"],

  ["gps alert systems", "gps-alert-systems"],
  ["gps alert system", "gps-alert-systems"],

  ["massage devices", "massage-devices"],
  ["massage device", "massage-devices"],
  ["massagers", "massage-devices"],

  ["supplements", "supplements"],
  ["supplement", "supplements"],

  ["fertility & reproductive", "fertility-reproductive"],
  ["fertility and reproductive", "fertility-reproductive"],
  ["fertility reproductive", "fertility-reproductive"],
]);

function parseArgs(argv) {
  const out = { dryRun: false, limit: null, start: 0 };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--limit=")) out.limit = Math.max(0, parseInt(a.slice("--limit=".length), 10) || 0);
    else if (a.startsWith("--start=")) out.start = Math.max(0, parseInt(a.slice("--start=".length), 10) || 0);
  }
  return out;
}

function printHelpAndExit(msg) {
  if (msg) console.error(msg);
  console.error(`
Set STRAPI_URL and STRAPI_IMPORT_TOKEN, for example:

  STRAPI_URL=http://127.0.0.1:1337 \\
  STRAPI_IMPORT_TOKEN=<token with Device update permission> \\
  node scripts/fix-device-categories-in-strapi.js
`);
  process.exit(1);
}

function assertUsableStrapiBase(raw) {
  const trimmed = String(raw || "").trim().replace(/\/$/, "");
  if (!trimmed) printHelpAndExit("STRAPI_URL is missing or empty.");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    // validate URL
    new URL(withProtocol);
  } catch {
    printHelpAndExit(`STRAPI_URL is not a valid URL: ${raw}`);
  }
  return trimmed;
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

function unwrapAttrs(row) {
  if (!row || typeof row !== "object") return row;
  const attrs = row.attributes;
  if (attrs && typeof attrs === "object") {
    return { id: row.id, documentId: row.documentId, ...attrs };
  }
  return row;
}

async function fetchAllDevices(baseUrl, token) {
  const pageSize = 100;
  let page = 1;
  const all = [];
  for (;;) {
    const url = buildApiUrl(
      baseUrl,
      `/api/devices?pagination[pageSize]=${pageSize}&pagination[page]=${page}&fields[0]=slug&fields[1]=category&fields[2]=documentId`
    );
    const { res, json } = await strapiFetch(url, token, { method: "GET" });
    if (!res.ok) {
      throw new Error(`GET /api/devices failed ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
    }
    const chunk = json?.data || [];
    for (const row of chunk) {
      const o = unwrapAttrs(row);
      if (!o?.slug) continue;
      all.push({
        id: o.id,
        documentId: o.documentId ?? row.documentId,
        slug: o.slug,
        category: o.category || "other",
      });
    }
    const pagination = json?.meta?.pagination;
    if (!pagination || page >= (pagination.pageCount || 1)) break;
    page += 1;
  }
  return all;
}

function guessHtmlPathForSlug(slug) {
  return path.join(ROOT, `healthrankings-review-${slug}.html`);
}

function normalizeCategoryLabel(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function mapCategoryLabelToEnum(label) {
  const norm = normalizeCategoryLabel(label);
  if (!norm) return "other";
  if (CATEGORY_MAP.has(norm)) return CATEGORY_MAP.get(norm);
  // Loose matching for labels like "Blood Pressure Monitors of 2026"
  for (const [k, v] of CATEGORY_MAP.entries()) {
    if (norm.includes(k)) return v;
  }
  return "other";
}

function extractJsonLdCategory(html) {
  const m = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  const raw = m[1].trim();
  try {
    const obj = JSON.parse(raw);
    const cat = obj?.itemReviewed?.category;
    return typeof cat === "string" ? cat : null;
  } catch {
    return null;
  }
}

async function updateDeviceCategory(baseUrl, token, documentIdOrId, category) {
  const url = buildApiUrl(baseUrl, `/api/devices/${documentIdOrId}`);
  return strapiFetch(url, token, {
    method: "PUT",
    body: JSON.stringify({ data: { category } }),
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = (process.env.STRAPI_IMPORT_TOKEN || "").trim();
  const base = assertUsableStrapiBase(process.env.STRAPI_URL);

  if (!args.dryRun && !token) {
    printHelpAndExit("STRAPI_IMPORT_TOKEN is missing or empty.");
  }

  const devices = await fetchAllDevices(base, token);
  const slice = devices.slice(args.start, args.limit != null ? args.start + args.limit : undefined);
  console.log(`Loaded ${devices.length} devices. Processing ${slice.length}.`);

  let changed = 0;
  let unchanged = 0;
  let missingHtml = 0;
  let failed = 0;

  for (const d of slice) {
    const htmlPath = guessHtmlPathForSlug(d.slug);
    if (!fs.existsSync(htmlPath)) {
      missingHtml += 1;
      continue;
    }
    const html = fs.readFileSync(htmlPath, "utf8");
    const label = extractJsonLdCategory(html);
    const mapped = mapCategoryLabelToEnum(label);

    if (!mapped || mapped === d.category) {
      unchanged += 1;
      continue;
    }

    if (args.dryRun) {
      console.log(`[dry-run] ${d.slug}: ${d.category} -> ${mapped} (from "${label || ""}")`);
      changed += 1;
      continue;
    }

    const key = d.documentId || d.id;
    if (!key) {
      failed += 1;
      continue;
    }
    const { res, json } = await updateDeviceCategory(base, token, key, mapped);
    if (res.ok) {
      changed += 1;
    } else {
      failed += 1;
      console.error(`PUT failed ${d.slug} (${key}) ${res.status}:`, JSON.stringify(json).slice(0, 400));
    }

    await new Promise((r) => setTimeout(r, 60));
  }

  console.log(
    args.dryRun
      ? `Dry run done. wouldChange=${changed} unchanged=${unchanged} missingHtml=${missingHtml}`
      : `Done. changed=${changed} unchanged=${unchanged} missingHtml=${missingHtml} failed=${failed}`
  );
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

