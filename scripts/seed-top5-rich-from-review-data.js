#!/usr/bin/env node
/**
 * Seed rich Top-5 data into Strapi from existing static assets.
 *
 *   1. Enrich each Device record with structured `performanceScores`, `specs`,
 *      `whoFor`, and `whoNot` arrays read from `scripts/review-data.json`.
 *   2. Parse each `apps/web/public/healthrankings-*-top5.html` file and
 *      create / update a matching `Category Top 5` entry in Strapi with
 *      its `intro` paragraph, ranked entries, FAQ items, and related links.
 *
 * Usage (dry-run first to see what would change):
 *   STRAPI_URL=http://127.0.0.1:1337 \
 *   STRAPI_IMPORT_TOKEN=xxxx \
 *     node scripts/seed-top5-rich-from-review-data.js --dry-run
 *
 * Real run:
 *   STRAPI_URL=http://127.0.0.1:1337 STRAPI_IMPORT_TOKEN=xxxx \
 *     node scripts/seed-top5-rich-from-review-data.js
 *
 * Optional flags:
 *   --only-devices        Only update Device fields, skip top-5 lists.
 *   --only-top5           Only update Category Top 5 entries.
 *   --top5-glob=<pattern> Limit which top-5 HTML files to import.
 *   --force               Replace existing Category Top 5 entries.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const REVIEW_DATA_PATH = path.join(ROOT, "scripts", "review-data.json");
const PUBLIC_DIR = path.join(ROOT, "apps", "web", "public");

function parseArgs(argv) {
  const out = {
    dryRun: false,
    onlyDevices: false,
    onlyTop5: false,
    force: false,
    top5Glob: null,
  };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--only-devices") out.onlyDevices = true;
    else if (a === "--only-top5") out.onlyTop5 = true;
    else if (a === "--force") out.force = true;
    else if (a.startsWith("--top5-glob=")) out.top5Glob = a.slice("--top5-glob=".length).trim();
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

function unwrapAttrs(row) {
  if (!row || typeof row !== "object") return row;
  const attrs = row.attributes;
  if (attrs && typeof attrs === "object") {
    return { id: row.id, documentId: row.documentId, ...attrs };
  }
  return row;
}

// -------------------- review-data.json helpers --------------------

function slugFromReviewFilename(name) {
  return String(name)
    .replace(/^healthrankings-review-/, "")
    .replace(/\.html$/i, "")
    .trim();
}

function loadReviewData() {
  const raw = fs.readFileSync(REVIEW_DATA_PATH, "utf8");
  const items = JSON.parse(raw);
  const bySlug = new Map();
  for (const item of items) {
    const slug = slugFromReviewFilename(item.filename || "");
    if (!slug) continue;
    bySlug.set(slug, item);
  }
  return bySlug;
}

function normalizePerformanceScores(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const r of raw) {
    const label = String(r?.label || "").trim();
    const scoreNum = Number(r?.score);
    if (!label || !Number.isFinite(scoreNum)) continue;
    let width = Number(r?.width);
    if (!Number.isFinite(width) || width <= 0) width = Math.round(scoreNum * 10);
    width = Math.max(0, Math.min(100, Math.round(width)));
    out.push({
      label,
      score: Math.round(scoreNum * 10) / 10,
      width,
    });
  }
  return out;
}

function normalizeSpecs(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const r of raw) {
    const key = String(r?.key || "").trim();
    const value = String(r?.value ?? "").trim();
    if (!key || !value) continue;
    out.push({ key, value });
  }
  return out;
}

function normalizeStringList(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const x of raw) {
    if (typeof x === "string") {
      const t = x.trim();
      if (t) out.push(t);
    }
  }
  return out;
}

// -------------------- Strapi helpers --------------------

async function fetchAllDevices(base, token) {
  const all = [];
  let page = 1;
  for (;;) {
    const url = buildApiUrl(
      base,
      `/api/devices?pagination[pageSize]=100&pagination[page]=${page}`
    );
    const { res, json } = await strapiFetch(url, token, { method: "GET" });
    if (!res.ok) {
      throw new Error(`GET /api/devices failed ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
    }
    const chunk = json?.data || [];
    for (const row of chunk) {
      const o = unwrapAttrs(row);
      if (!o.slug) continue;
      all.push(o);
    }
    const pagination = json?.meta?.pagination;
    if (!pagination || page >= (pagination.pageCount || 1)) break;
    page += 1;
  }
  return all;
}

async function updateDevice(base, token, documentId, payload) {
  const url = buildApiUrl(base, `/api/devices/${documentId}`);
  return strapiFetch(url, token, {
    method: "PUT",
    body: JSON.stringify({ data: payload }),
  });
}

async function findCategoryTopFive(base, token, slugOrCategory, byCategory = true) {
  const filterField = byCategory ? "category" : "slug";
  const url = buildApiUrl(
    base,
    `/api/category-top-fives?filters[${filterField}][$eq]=${encodeURIComponent(slugOrCategory)}&pagination[pageSize]=1`
  );
  const { res, json } = await strapiFetch(url, token, { method: "GET" });
  if (!res.ok) return null;
  const first = json?.data?.[0];
  if (!first) return null;
  return unwrapAttrs(first);
}

async function deleteCategoryTopFive(base, token, documentId) {
  const url = buildApiUrl(base, `/api/category-top-fives/${documentId}`);
  return strapiFetch(url, token, { method: "DELETE" });
}

async function createCategoryTopFive(base, token, payload) {
  const url = buildApiUrl(base, `/api/category-top-fives`);
  return strapiFetch(url, token, {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
}

async function updateCategoryTopFive(base, token, documentId, payload) {
  const url = buildApiUrl(base, `/api/category-top-fives/${documentId}`);
  return strapiFetch(url, token, {
    method: "PUT",
    body: JSON.stringify({ data: payload }),
  });
}

function connectDevice(dev) {
  if (dev.documentId && !String(dev.documentId).match(/^\d+$/)) {
    return { connect: [{ documentId: String(dev.documentId) }] };
  }
  return { connect: [dev.id] };
}

// -------------------- HTML parsing --------------------

function readHtml(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html) {
  return decodeHtml(String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function pickFirst(html, regexes) {
  for (const re of regexes) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

function extractIntro(html) {
  // Look for the rebuilt v3 intro-lede paragraph
  const m = html.match(/<p[^>]*class="[^"]*intro-lede[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  if (m) return stripTags(m[1]);
  // Fallback: the first <p> after <h1>
  const m2 = html.match(/<h1\b[\s\S]*?<\/h1>\s*([\s\S]*?<p[^>]*>([\s\S]*?)<\/p>)/i);
  if (m2) return stripTags(m2[2]);
  return null;
}

function extractH1(html) {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripTags(m[1]) : null;
}

function extractMetaDescription(html) {
  return pickFirst(html, [
    /<meta\s+name="description"\s+content="([^"]+)"/i,
    /<meta\s+content="([^"]+)"\s+name="description"/i,
  ]);
}

function extractTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]).replace(/\s*\|\s*HealthRankings\s*$/i, "").trim() : null;
}

function extractRankedDeviceSlugs(html) {
  // Product cards link to /healthrankings-review-<slug>.html via the "Read full review" CTA.
  const slugs = [];
  const seen = new Set();
  const re = /href="(?:\.?\/?)healthrankings-review-([a-z0-9-]+)\.html(?:#[a-z-]+)?"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length >= 5) break;
  }
  // House rule: any Oxiline product is always the #1 pick.
  const oxilineIdx = slugs.findIndex((s) => /\boxiline\b/i.test(s));
  if (oxilineIdx > 0) {
    const [oxiline] = slugs.splice(oxilineIdx, 1);
    slugs.unshift(oxiline);
  }
  return slugs;
}

function extractFaqs(html) {
  const out = [];
  // Match any <details> blocks within the FAQ section or generic question/answer accordions
  const sectionMatch = html.match(/id=["']faq["'][\s\S]*?(?=<\/section|$)/i);
  const scope = sectionMatch ? sectionMatch[0] : html;
  const detailsRe = /<details[^>]*>([\s\S]*?)<\/details>/gi;
  let m;
  while ((m = detailsRe.exec(scope)) !== null) {
    const block = m[1];
    const sumMatch = block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
    if (!sumMatch) continue;
    const question = stripTags(sumMatch[1]);
    const after = block.slice(sumMatch.index + sumMatch[0].length);
    const paragraphs = [...after.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1]));
    const answer = paragraphs.length > 0 ? paragraphs.join("\n\n") : stripTags(after);
    if (question && answer) out.push({ question, answer });
  }
  return out;
}

function extractRelatedConditions(html) {
  const out = [];
  const sectionMatch = html.match(
    /<section[^>]*id="?related[-\w]*"?[\s\S]*?<\/section>|<section[^>]*class="[^"]*related[^"]*"[\s\S]*?<\/section>/i
  );
  const scope = sectionMatch ? sectionMatch[0] : "";
  if (!scope) return out;
  const linkRe = /<a\s+([^>]+)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRe.exec(scope)) !== null) {
    const attrs = m[1];
    const inner = stripTags(m[2]);
    const hrefM = attrs.match(/href="([^"]+)"/i);
    if (!hrefM || !inner) continue;
    out.push({ href: hrefM[1], name: inner.split(" — ")[0].trim() });
  }
  return out.slice(0, 8);
}

// -------------------- Top-5 categorization --------------------

function categoryFromTop5Filename(name) {
  // healthrankings-<slug>-top5.html → slug
  const base = path.basename(name, ".html").replace(/^healthrankings-/, "").replace(/-top5$/, "");
  return base;
}

function detectCategoryEnum(htmlSlug) {
  // Map a top5 filename slug to a device category. Falls back to the slug
  // itself for condition-specific lists (the `category` Strapi field accepts
  // any string up to 96 chars, and the dynamic page resolves either by
  // category enum or by slug).
  const knownCats = [
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
  ];
  for (const c of knownCats) {
    if (htmlSlug === c || htmlSlug.endsWith("-" + c)) return c;
  }
  // Pattern-based mapping for known condition-specific lists.
  if (/blood-pressure|hypertension|stroke|cardiac|heart-failure|coronary/.test(htmlSlug))
    return "blood-pressure-monitors";
  if (/scale|composition|bariatric|weight-management|obesity|athletic-body/.test(htmlSlug))
    return "body-composition-scales";
  if (/oximeter|pulse-ox|asthma|copd-pulse|sleep-apnea/.test(htmlSlug))
    return "pulse-oximeters";
  if (/thermomet/.test(htmlSlug)) return "thermometers";
  if (/tens|sciatica|arthritis-tens|back-pain|sports-injuries|menstrual-cramp/.test(htmlSlug))
    return "tens-units";
  if (/water-floss|electric-toothbrush|toothbrush|oral-health/.test(htmlSlug))
    return "water-flossers";
  if (/test-kit|home-testing|sti|hiv|uti|drug-test|colorectal|hereditary|genetic|cancer-screen/.test(htmlSlug))
    return "home-test-kits";
  if (/gps-alert|fall-alert|fall-detection|dementia|alzheimer|cognitive|parkinson/.test(htmlSlug))
    return "gps-alert-systems";
  if (/massage|percussion|shiatsu|anxiety-massagers/.test(htmlSlug))
    return "massage-devices";
  if (/supplement|vitamin|creatine|antioxidant|cholesterol|bcaa|glutamine/.test(htmlSlug))
    return "supplements";
  if (/fertility|ovulat|sperm|pregnancy|prenatal|male-fertility/.test(htmlSlug))
    return "fertility-reproductive";
  if (/breath|breathalyzer|copd-breathing|anxiety-breathing|endurance-training/.test(htmlSlug))
    return "breathing-trainers";
  // Fallback: store the slug itself as the category. The Strapi `category`
  // attribute is a free-form string; lists like `arthritis-gloves`,
  // `back-support-braces`, `diabetes-ketone-monitors`, etc. simply use their
  // own slug here so the page route resolves them.
  return htmlSlug;
}

// -------------------- Pipeline --------------------

async function runDeviceEnrichment(base, token, args) {
  const reviewBySlug = loadReviewData();
  console.log(`Loaded ${reviewBySlug.size} review entries from review-data.json.`);
  if (args.dryRun && (!base || !token)) {
    let wouldUpdate = 0;
    for (const [slug, review] of reviewBySlug) {
      const performanceScores = normalizePerformanceScores(review.performanceScores);
      const specs = normalizeSpecs(review.specs);
      const whoFor = normalizeStringList(review.whoFor);
      const whoNot = normalizeStringList(review.whoNot);
      if (performanceScores.length || specs.length || whoFor.length || whoNot.length) {
        wouldUpdate += 1;
      }
    }
    console.log(
      `[dry-run, no Strapi] ${wouldUpdate}/${reviewBySlug.size} review entries have data ready to seed.`
    );
    return;
  }
  const devices = await fetchAllDevices(base, token);
  console.log(`Fetched ${devices.length} devices from Strapi.`);

  let updated = 0;
  let skipped = 0;
  for (const d of devices) {
    const review = reviewBySlug.get(d.slug);
    if (!review) {
      skipped += 1;
      continue;
    }
    const performanceScores = normalizePerformanceScores(review.performanceScores);
    const specs = normalizeSpecs(review.specs);
    const whoFor = normalizeStringList(review.whoFor);
    const whoNot = normalizeStringList(review.whoNot);

    if (!performanceScores.length && !specs.length && !whoFor.length && !whoNot.length) {
      skipped += 1;
      continue;
    }

    const payload = {
      performanceScores,
      specs,
      whoFor,
      whoNot,
    };

    if (args.dryRun) {
      console.log(
        `[dry-run] would PATCH device ${d.slug}: ${performanceScores.length} scores, ${specs.length} specs, whoFor=${whoFor.length}, whoNot=${whoNot.length}`
      );
      updated += 1;
      continue;
    }

    const docId = d.documentId || d.id;
    const { res, json } = await updateDevice(base, token, docId, payload);
    if (res.ok) {
      updated += 1;
      if (updated % 10 === 0) console.log(`Updated ${updated} devices…`);
    } else {
      console.error(`PUT /api/devices/${docId} failed`, res.status, JSON.stringify(json).slice(0, 300));
    }
    await new Promise((r) => setTimeout(r, 30));
  }
  console.log(`Device enrichment done — updated ${updated}, skipped ${skipped}.`);
}

function listTop5HtmlFiles(args) {
  const all = fs
    .readdirSync(PUBLIC_DIR)
    .filter((f) => /^healthrankings-.*-top5\.html$/.test(f));
  if (!args.top5Glob) return all;
  const re = new RegExp(args.top5Glob.replace(/\*/g, ".*"));
  return all.filter((f) => re.test(f));
}

async function runTop5Import(base, token, args) {
  const files = listTop5HtmlFiles(args);
  console.log(`Found ${files.length} static top-5 HTML files.`);

  if (args.dryRun && (!base || !token)) {
    let total = 0;
    let totalDeviceSlugs = 0;
    let totalFaqs = 0;
    for (const filename of files) {
      const html = readHtml(path.join(PUBLIC_DIR, filename));
      const slugs = extractRankedDeviceSlugs(html);
      const faqs = extractFaqs(html);
      const intro = extractIntro(html);
      const cat = detectCategoryEnum(filename.replace(/^healthrankings-/, "").replace(/-top5\.html$/, ""));
      console.log(
        `[dry-run] ${filename} → ${cat || "(no-cat)"} | ${slugs.length} devices, ${faqs.length} faqs, intro=${intro ? "yes" : "no"}`
      );
      total += 1;
      totalDeviceSlugs += slugs.length;
      totalFaqs += faqs.length;
    }
    console.log(
      `[dry-run, no Strapi] Parsed ${total} top-5 pages, ${totalDeviceSlugs} device slugs, ${totalFaqs} faqs total.`
    );
    return;
  }

  const devices = await fetchAllDevices(base, token);
  const devBySlug = new Map(devices.map((d) => [d.slug, d]));

  let created = 0;
  let updatedCt = 0;
  let skipped = 0;
  for (const filename of files) {
    const filePath = path.join(PUBLIC_DIR, filename);
    const html = readHtml(filePath);

    const top5Slug = path.basename(filename, ".html").replace(/^healthrankings-/, "");
    const htmlSlug = top5Slug.replace(/-top5$/, "");
    const categoryEnum = detectCategoryEnum(htmlSlug);
    // The dynamic page route /top5/[slug] resolves the URL slug against
    // the `slug` field, so we use the htmlSlug directly (no -top5 suffix).
    const slug = htmlSlug;

    const title = extractH1(html) || extractTitle(html) || `Top 5 — ${htmlSlug}`;
    const intro = extractIntro(html);
    const metaTitle = extractTitle(html);
    const metaDescription = extractMetaDescription(html);
    const deviceSlugs = extractRankedDeviceSlugs(html);
    const faqs = extractFaqs(html);
    const related = extractRelatedConditions(html);

    const matchedDevices = deviceSlugs
      .map((s) => devBySlug.get(s))
      .filter(Boolean);

    if (matchedDevices.length < 1) {
      console.log(`Skip ${filename}: no matching devices in Strapi for slugs ${deviceSlugs.join(", ")}`);
      skipped += 1;
      continue;
    }

    const entries = matchedDevices.slice(0, 5).map((d, i) => ({
      rank: i + 1,
      device: connectDevice(d),
    }));

    const payload = {
      slug,
      category: categoryEnum,
      categoryLabel: title.replace(/^The 5 best |^5 best |^Top 5 /i, "").replace(/\.$/, "").trim(),
      title,
      subtitle: intro ? intro.split(/[.!]\s/)[0] + "." : null,
      intro,
      metaTitle,
      metaDescription,
      entries,
      faqs: faqs.slice(0, 8),
      relatedConditions: related,
      publishedAt: new Date().toISOString(),
    };

    if (args.dryRun) {
      console.log(
        `[dry-run] ${slug} — ${matchedDevices.length} devices, ${faqs.length} faqs, ${related.length} related, intro=${intro ? "yes" : "no"}`
      );
      continue;
    }

    const existing = await findCategoryTopFive(base, token, slug, false);
    if (existing?.documentId) {
      if (!args.force) {
        const upd = await updateCategoryTopFive(base, token, existing.documentId, payload);
        if (upd.res.ok) {
          updatedCt += 1;
          console.log(`Updated ${slug}.`);
        } else {
          console.error(`PUT failed ${slug}`, upd.res.status, JSON.stringify(upd.json).slice(0, 300));
        }
      } else {
        const del = await deleteCategoryTopFive(base, token, existing.documentId);
        if (!del.res.ok) {
          console.error(`DELETE failed ${slug}`, del.res.status);
          continue;
        }
        const c = await createCategoryTopFive(base, token, payload);
        if (c.res.ok) {
          created += 1;
          console.log(`Recreated ${slug}.`);
        } else {
          console.error(`POST failed ${slug}`, c.res.status, JSON.stringify(c.json).slice(0, 300));
        }
      }
    } else {
      const c = await createCategoryTopFive(base, token, payload);
      if (c.res.ok) {
        created += 1;
        console.log(`Created ${slug}.`);
      } else {
        console.error(`POST failed ${slug}`, c.res.status, JSON.stringify(c.json).slice(0, 300));
      }
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log(`Top-5 import done — created ${created}, updated ${updatedCt}, skipped ${skipped}.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = String(process.env.STRAPI_URL || "").trim().replace(/\/$/, "");
  const token = String(process.env.STRAPI_IMPORT_TOKEN || "").trim();
  if (!args.dryRun && (!base || !token)) {
    console.error(
      "Set STRAPI_URL and STRAPI_IMPORT_TOKEN, or pass --dry-run.\n  Example:\n  STRAPI_URL=http://127.0.0.1:1337 STRAPI_IMPORT_TOKEN=xxx node scripts/seed-top5-rich-from-review-data.js --dry-run"
    );
    process.exit(1);
  }

  if (args.onlyDevices && args.onlyTop5) {
    console.error("--only-devices and --only-top5 are mutually exclusive.");
    process.exit(1);
  }

  if (!args.onlyTop5) await runDeviceEnrichment(base, token, args);
  if (!args.onlyDevices) await runTop5Import(base, token, args);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
