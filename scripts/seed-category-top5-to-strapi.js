#!/usr/bin/env node
/**
 * Create or refresh "Category Top 5" entries in Strapi: for each device category,
 * picks up to 5 devices with highest `rating` (nulls last) and saves an ordered list.
 *
 * Prereqs:
 *   Settings → API Tokens → Full access (or create + Category Top 5 + Device find/delete).
 *
 * Usage (use your real CMS URL — not a placeholder):
 *   STRAPI_URL=https://healthrankings-cms.onrender.com \
 *   STRAPI_IMPORT_TOKEN=<paste from Strapi → Settings → API Tokens> \
 *   npm run seed:category-top5
 *
 * Local Strapi:
 *   STRAPI_URL=http://127.0.0.1:1337 STRAPI_IMPORT_TOKEN=... npm run seed:category-top5
 *
 * Options:
 *   --dry-run     Log only
 *   --force       Replace existing list for a category (DELETE then POST)
 *   --category=X  Only this category enum value (e.g. blood-pressure-monitors)
 */

const DEVICE_CATEGORIES = [
  "blood-pressure-monitors",
  "body-composition-scales",
  "pulse-oximeters",
  "breathing-trainers",
  "tens-units",
  "thermometers",
  "water-flossers",
  "home-test-kits",
  "gps-alert-systems",
  "massage-devices",
  "supplements",
  "fertility-reproductive",
  "other",
];

const CATEGORY_TITLE = {
  "blood-pressure-monitors": "Top 5 Blood Pressure Monitors",
  "body-composition-scales": "Top 5 Smart Scales & Body Composition Monitors",
  "pulse-oximeters": "Top 5 Pulse Oximeters",
  "breathing-trainers": "Top 5 Breathing Trainers",
  "tens-units": "Top 5 TENS Units",
  thermometers: "Top 5 Thermometers",
  "water-flossers": "Top 5 Water Flossers",
  "home-test-kits": "Top 5 Home Test Kits",
  "gps-alert-systems": "Top 5 GPS Alert Systems",
  "massage-devices": "Top 5 Massage Devices",
  supplements: "Top 5 Supplement Picks",
  "fertility-reproductive": "Top 5 Fertility & Reproductive Health Devices",
  other: "Top 5 Devices (Other)",
};

function parseArgs(argv) {
  const out = { dryRun: false, force: false, category: null };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--force") out.force = true;
    else if (a.startsWith("--category=")) out.category = a.slice("--category=".length).trim() || null;
  }
  return out;
}

function printStrapiUrlHelp() {
  console.error(`
Set a real Strapi base URL and an API token, for example:

  STRAPI_URL=http://127.0.0.1:1337 \\
  STRAPI_IMPORT_TOKEN=<long token from Strapi Admin → Settings → API Tokens> \\
  npm run seed:category-top5

Production (replace with your deployed CMS host):

  STRAPI_URL=https://healthrankings-cms.onrender.com \\
  STRAPI_IMPORT_TOKEN=... \\
  npm run seed:category-top5
`);
}

/** Normalize STRAPI_URL and reject obvious documentation placeholders. */
function assertUsableStrapiBase(raw) {
  const trimmed = String(raw || "").trim().replace(/\/$/, "");
  if (!trimmed) {
    console.error("STRAPI_URL is missing or empty.");
    printStrapiUrlHelp();
    process.exit(1);
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let host = "";
  try {
    host = new URL(withProtocol).hostname.toLowerCase();
  } catch {
    console.error(`STRAPI_URL is not a valid URL: ${raw}`);
    printStrapiUrlHelp();
    process.exit(1);
  }

  const placeholderHosts = new Set([
    "your-cms-host",
    "your-strapi-url",
    "example.com",
    "localhost.invalid",
  ]);
  if (placeholderHosts.has(host)) {
    console.error(
      `STRAPI_URL uses a placeholder host "${host}" — that is not a real server. Replace it with your Strapi URL (see below).`
    );
    printStrapiUrlHelp();
    process.exit(1);
  }

  return trimmed.replace(/\/$/, "");
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

function deviceSortKey(rating) {
  if (rating == null || Number.isNaN(Number(rating))) return -1;
  return Number(rating);
}

async function fetchAllDevices(baseUrl, token) {
  const pageSize = 100;
  let page = 1;
  const all = [];
  for (;;) {
    const url = buildApiUrl(
      baseUrl,
      `/api/devices?pagination[pageSize]=${pageSize}&pagination[page]=${page}&sort=rating:desc`
    );
    const { res, json } = await strapiFetch(url, token, { method: "GET" });
    if (!res.ok) {
      throw new Error(`GET /api/devices failed ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
    }
    const chunk = json?.data || [];
    for (const row of chunk) {
      const o = unwrapAttrs(row);
      const documentId = o.documentId;
      const id = o.id;
      if (!documentId && id == null) continue;
      all.push({
        documentId: documentId || String(id),
        id,
        category: o.category || "other",
        rating: o.rating,
        slug: o.slug,
        name: o.name,
      });
    }
    const pagination = json?.meta?.pagination;
    if (!pagination || page >= (pagination.pageCount || 1)) break;
    page += 1;
  }
  return all;
}

async function findExistingTopFive(baseUrl, token, category) {
  const url = buildApiUrl(
    baseUrl,
    `/api/category-top-fives?filters[category][$eq]=${encodeURIComponent(category)}&pagination[pageSize]=1`
  );
  const { res, json } = await strapiFetch(url, token, { method: "GET" });
  if (!res.ok) return null;
  const first = json?.data?.[0];
  if (!first) return null;
  return unwrapAttrs(first);
}

async function deleteTopFive(baseUrl, token, documentId) {
  const url = buildApiUrl(baseUrl, `/api/category-top-fives/${documentId}`);
  return strapiFetch(url, token, { method: "DELETE" });
}

async function createTopFive(baseUrl, token, payload) {
  const url = buildApiUrl(baseUrl, `/api/category-top-fives`);
  return strapiFetch(url, token, {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
}

function connectDevice(dev) {
  if (dev.documentId && !String(dev.documentId).match(/^\d+$/)) {
    return { connect: [{ documentId: String(dev.documentId) }] };
  }
  return { connect: [dev.id] };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = (process.env.STRAPI_IMPORT_TOKEN || "").trim();
  const needsNetwork = !args.dryRun || Boolean(process.env.STRAPI_URL?.trim() && token);
  const base = needsNetwork ? assertUsableStrapiBase(process.env.STRAPI_URL) : "";

  if (!args.dryRun && (!base || !token)) {
    console.error("Set STRAPI_URL and STRAPI_IMPORT_TOKEN (or use --dry-run).");
    printStrapiUrlHelp();
    process.exit(1);
  }

  const categories = args.category
    ? DEVICE_CATEGORIES.filter((c) => c === args.category)
    : DEVICE_CATEGORIES;
  if (args.category && categories.length === 0) {
    console.error("Unknown --category. Use one of:", DEVICE_CATEGORIES.join(", "));
    process.exit(1);
  }

  let devices = [];
  if (!args.dryRun || (base && token)) {
    if (args.dryRun && (!base || !token)) {
      console.log("Dry run: set STRAPI_URL + STRAPI_IMPORT_TOKEN to preview picks from live Strapi.");
    } else {
      try {
        devices = await fetchAllDevices(base, token);
      } catch (e) {
        const cause = e && typeof e === "object" && "cause" in e ? e.cause : null;
        if (cause && typeof cause === "object" && cause.code === "ENOTFOUND") {
          console.error(
            `Could not resolve Strapi host (ENOTFOUND). Check STRAPI_URL — current value: ${process.env.STRAPI_URL || "(empty)"}`
          );
          printStrapiUrlHelp();
          process.exit(1);
        }
        throw e;
      }
      console.log(`${args.dryRun ? "Would use" : "Fetched"} ${devices.length} devices from Strapi.`);
    }
  }

  const byCat = new Map();
  for (const c of DEVICE_CATEGORIES) byCat.set(c, []);
  for (const d of devices) {
    const cat = d.category && byCat.has(d.category) ? d.category : "other";
    byCat.get(cat).push(d);
  }

  for (const cat of categories) {
    const list = byCat.get(cat) || [];
    list.sort((a, b) => {
      const dr = deviceSortKey(b.rating) - deviceSortKey(a.rating);
      if (dr !== 0) return dr;
      return String(a.slug || "").localeCompare(String(b.slug || ""));
    });
    const top = list.slice(0, 5);
    if (top.length === 0) {
      console.log(`Skip ${cat}: no devices.`);
      continue;
    }

    const slug = `${cat}-top5`;
    const title = CATEGORY_TITLE[cat] || `Top 5 — ${cat}`;
    const subtitle = `Highest-rated picks in this category on HealthRankings.`;

    const entries = top.map((d, i) => ({
      rank: i + 1,
      device: connectDevice(d),
    }));

    const payload = {
      slug,
      category: cat,
      title,
      subtitle,
      entries,
      publishedAt: new Date().toISOString(),
    };

    if (args.dryRun) {
      console.log(`[dry-run] ${cat}: would set top ${top.length}:`, top.map((d) => d.slug).join(", "));
      continue;
    }

    const existing = await findExistingTopFive(base, token, cat);
    if (existing?.documentId || existing?.id) {
      const docId = existing.documentId || existing.id;
      if (!args.force) {
        console.log(`Skip ${cat}: category-top-five exists (documentId=${docId}). Use --force to replace.`);
        continue;
      }
      const del = await deleteTopFive(base, token, docId);
      if (!del.res.ok) {
        console.error(`DELETE failed for ${cat}`, del.res.status, JSON.stringify(del.json).slice(0, 400));
        continue;
      }
      console.log(`Removed existing top-5 for ${cat}.`);
    }

    const { res, json } = await createTopFive(base, token, payload);
    if (res.ok) {
      console.log(`Created top-5 for ${cat} (${top.length} devices).`);
    } else {
      console.error(`POST failed ${cat}`, res.status, JSON.stringify(json).slice(0, 800));
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  console.log("Done.");
}

main().catch((e) => {
  const cause = e && typeof e === "object" && "cause" in e ? e.cause : null;
  if (cause && typeof cause === "object" && cause.code === "ENOTFOUND") {
    console.error(
      `Could not resolve Strapi host. STRAPI_URL was: ${process.env.STRAPI_URL || "(empty)"}`
    );
    printStrapiUrlHelp();
    process.exit(1);
  }
  console.error(e);
  process.exit(1);
});
