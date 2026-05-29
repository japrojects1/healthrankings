#!/usr/bin/env node
/**
 * Seed CPAP devices + Top 5 Best CPAP Machines into Strapi.
 *
 * Idempotent — looks up each device by slug; PUTs if it exists, POSTs otherwise.
 * Same for the `category-top-five` entry (slug = `cpap-machines`).
 *
 * Usage (dry run, no auth required):
 *   node scripts/seed-cpap-devices-and-top5.js --dry-run
 *
 * Live run (against any Strapi v5 instance):
 *   STRAPI_URL=https://healthrankings-cms.onrender.com \
 *   STRAPI_IMPORT_TOKEN=<full-access token> \
 *     node scripts/seed-cpap-devices-and-top5.js
 *
 * Flags:
 *   --dry-run        Print payloads, no network writes.
 *   --only-devices   Skip the Top 5 step.
 *   --only-top5      Skip the device upsert step (Top 5 expects devices to exist).
 *   --force          Recreate the Top 5 entry from scratch (DELETE then POST).
 */

const DEVICES = require("./data/cpap-devices.js");

function parseArgs(argv) {
  const out = {
    dryRun: false,
    onlyDevices: false,
    onlyTop5: false,
    force: false,
  };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--only-devices") out.onlyDevices = true;
    else if (a === "--only-top5") out.onlyTop5 = true;
    else if (a === "--force") out.force = true;
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

async function findDeviceBySlug(base, token, slug) {
  const u = new URL(buildApiUrl(base, "/api/devices"));
  u.searchParams.set("filters[slug][$eq]", slug);
  u.searchParams.set("pagination[pageSize]", "1");
  u.searchParams.set("status", "published");
  const { res, json } = await strapiFetch(u.toString(), token, { method: "GET" });
  if (!res.ok) return null;
  const row = json?.data?.[0];
  if (!row) {
    // Fallback to draft (in case it was created but not published).
    const u2 = new URL(buildApiUrl(base, "/api/devices"));
    u2.searchParams.set("filters[slug][$eq]", slug);
    u2.searchParams.set("pagination[pageSize]", "1");
    u2.searchParams.set("status", "draft");
    const r2 = await strapiFetch(u2.toString(), token, { method: "GET" });
    return r2.res.ok ? unwrapAttrs(r2.json?.data?.[0]) ?? null : null;
  }
  return unwrapAttrs(row);
}

async function findCategoryTopFiveBySlug(base, token, slug) {
  const u = new URL(buildApiUrl(base, "/api/category-top-fives"));
  u.searchParams.set("filters[slug][$eq]", slug);
  u.searchParams.set("pagination[pageSize]", "1");
  u.searchParams.set("status", "published");
  const { res, json } = await strapiFetch(u.toString(), token, { method: "GET" });
  if (!res.ok) return null;
  const row = json?.data?.[0];
  if (row) return unwrapAttrs(row);
  const u2 = new URL(buildApiUrl(base, "/api/category-top-fives"));
  u2.searchParams.set("filters[slug][$eq]", slug);
  u2.searchParams.set("pagination[pageSize]", "1");
  u2.searchParams.set("status", "draft");
  const r2 = await strapiFetch(u2.toString(), token, { method: "GET" });
  return r2.res.ok ? unwrapAttrs(r2.json?.data?.[0]) ?? null : null;
}

function connectDeviceRel(dev) {
  if (dev.documentId && !String(dev.documentId).match(/^\d+$/)) {
    return { connect: [{ documentId: String(dev.documentId) }] };
  }
  return { connect: [dev.id] };
}

async function upsertDevice(base, token, payload, args) {
  if (args.dryRun) {
    console.log(
      `[dry-run] device ${payload.slug} — ${payload.performanceScores.length} scores, ${payload.specs.length} specs, ${payload.reviewSections.length} sections`
    );
    return { documentId: `dry_${payload.slug}`, id: 0 };
  }
  const existing = await findDeviceBySlug(base, token, payload.slug);
  if (existing?.documentId) {
    const url = buildApiUrl(base, `/api/devices/${existing.documentId}`);
    const { res, json } = await strapiFetch(url, token, {
      method: "PUT",
      body: JSON.stringify({ data: payload }),
    });
    if (!res.ok) {
      console.error(`PUT /api/devices/${existing.documentId} failed`, res.status, JSON.stringify(json).slice(0, 400));
      return null;
    }
    console.log(`Updated device ${payload.slug}`);
    return unwrapAttrs(json?.data) ?? existing;
  }
  const url = buildApiUrl(base, "/api/devices");
  const { res, json } = await strapiFetch(url, token, {
    method: "POST",
    body: JSON.stringify({ data: { ...payload, publishedAt: new Date().toISOString() } }),
  });
  if (!res.ok) {
    console.error(`POST /api/devices ${payload.slug} failed`, res.status, JSON.stringify(json).slice(0, 400));
    return null;
  }
  console.log(`Created device ${payload.slug}`);
  return unwrapAttrs(json?.data) ?? null;
}

async function upsertCategoryTopFive(base, token, payload, args) {
  if (args.dryRun) {
    console.log(
      `[dry-run] Top 5 ${payload.slug} — ${payload.entries.length} entries, ${payload.faqs.length} FAQs, ${payload.relatedConditions.length} related`
    );
    return;
  }
  const existing = await findCategoryTopFiveBySlug(base, token, payload.slug);
  if (existing?.documentId) {
    if (args.force) {
      const del = await strapiFetch(
        buildApiUrl(base, `/api/category-top-fives/${existing.documentId}`),
        token,
        { method: "DELETE" }
      );
      if (!del.res.ok) {
        console.error("DELETE failed", del.res.status, JSON.stringify(del.json).slice(0, 400));
        return;
      }
    } else {
      const url = buildApiUrl(base, `/api/category-top-fives/${existing.documentId}`);
      const { res, json } = await strapiFetch(url, token, {
        method: "PUT",
        body: JSON.stringify({ data: payload }),
      });
      if (!res.ok) {
        console.error(`PUT category-top-five ${payload.slug} failed`, res.status, JSON.stringify(json).slice(0, 400));
        return;
      }
      console.log(`Updated Top 5 ${payload.slug}`);
      return;
    }
  }
  const url = buildApiUrl(base, "/api/category-top-fives");
  const { res, json } = await strapiFetch(url, token, {
    method: "POST",
    body: JSON.stringify({ data: { ...payload, publishedAt: new Date().toISOString() } }),
  });
  if (!res.ok) {
    console.error(`POST category-top-five ${payload.slug} failed`, res.status, JSON.stringify(json).slice(0, 400));
    return;
  }
  console.log(`Created Top 5 ${payload.slug}`);
}

// -------------------- Top 5 payload builder --------------------

function buildCategoryTopFivePayload(deviceRecords) {
  const devBySlug = new Map(deviceRecords.filter(Boolean).map((d) => [d.slug, d]));
  const ranked = DEVICES.map((d, i) => ({ slug: d.slug, rank: i + 1 }))
    .map((r) => ({ rank: r.rank, dev: devBySlug.get(r.slug) }))
    .filter((r) => r.dev);

  const entries = ranked.map((r) => ({
    rank: r.rank,
    device: connectDeviceRel(r.dev),
  }));

  return {
    slug: "cpap-machines",
    category: "cpap-machines",
    categoryLabel: "CPAP Machines",
    title: "Top 5 Best CPAP Machines of 2026",
    subtitle:
      "Auto-titrating CPAPs ranked for therapy reliability, comfort, and at-home usability.",
    intro:
      "Roughly 30 million U.S. adults have obstructive sleep apnea, and CPAP remains the most evidence-backed first-line therapy. Choosing the right machine matters more than most people realize: pressure algorithm quality, mask seal at low pressures, humidification, and noise are what separate a CPAP you actually keep using from one that ends up in the closet. We compared the most prescribed CPAPs of 2026 — including travel options — for therapy data quality, comfort features, and night-to-night reliability.",
    metaTitle: "Best CPAP Machines of 2026 — Top 5 Ranked | HealthRankings",
    metaDescription:
      "We tested the top 5 CPAP machines of 2026 for sleep apnea — auto-pressure algorithms, comfort, humidification, app data, and travel friendliness. Independent rankings.",
    entries,
    faqs: [
      {
        question: "Do I need a prescription to buy a CPAP machine?",
        answer:
          "Yes. In the U.S. (and most countries), CPAPs are FDA Class II medical devices and require a prescription from a sleep physician. You'll typically need a recent sleep study (in-lab polysomnography or a home sleep test) and an AHI ≥ 5 events/hour with symptoms, or AHI ≥ 15 regardless of symptoms.",
      },
      {
        question: "What is the difference between CPAP, APAP, and BiPAP?",
        answer:
          "CPAP delivers a single fixed pressure all night. APAP (auto-titrating CPAP — what every machine on this list does) adjusts pressure breath-by-breath based on detected events, which is generally more comfortable and equally effective for most patients. BiPAP delivers two different pressures (higher on inhale, lower on exhale) and is reserved for higher-pressure needs, central sleep apnea, or COPD overlap.",
      },
      {
        question: "How loud is a modern CPAP machine?",
        answer:
          "Quiet. The ResMed AirSense 11 measures around 27 dBA — quieter than a whisper. Most newer CPAPs run at 25–30 dBA at therapy pressure. The mask, hose, and humidifier add some sound, but partner complaints are far less common than they were a decade ago.",
      },
      {
        question: "Is CPAP covered by insurance or HSA/FSA?",
        answer:
          "Most U.S. private insurers and Medicare cover CPAP rentals (typically a 13-month rent-to-own arrangement) when ordered by an in-network durable medical equipment supplier with a valid prescription. Out-of-pocket purchase is HSA/FSA eligible. Compliance — typically ≥ 4 hours of use on ≥ 70% of nights in a 30-day window — is required to keep coverage.",
      },
      {
        question: "How do I know if my CPAP pressure is set correctly?",
        answer:
          "Auto-titrating CPAPs (APAPs) self-adjust within a prescribed range (commonly 4–20 cmH₂O). Your therapy data — AHI (residual events/hour), leak rate, and 90/95th-percentile pressure — should be reviewed monthly with your sleep clinician through the manufacturer's app (myAir, DreamMapper, etc.) or a downloaded SD card. A residual AHI under 5 with leaks under 24 L/min is the goal.",
      },
      {
        question: "What about the Philips DreamStation recall?",
        answer:
          "The 2021 recall covered the original DreamStation (and other legacy Philips devices) due to PE-PUR sound abatement foam. The DreamStation 2 reviewed here uses a redesigned silicone foam and is not part of that recall. Philips has since exited the U.S. CPAP market for new patients (settlement-driven), but DreamStation 2 units already shipped continue to receive support.",
      },
      {
        question: "Can I travel with a CPAP machine?",
        answer:
          "Yes. CPAPs are FAA-approved as medical devices and don't count toward your carry-on allowance. The ResMed AirMini and Transcend Micro on this list are purpose-built for travel — both weigh under a pound and run on portable batteries. For longer trips, look for machines that accept 12V DC input or have first-party battery packs.",
      },
    ],
    relatedConditions: [
      {
        name: "Sleep Apnea",
        href: "/healthrankings-sleep-apnea.html",
        meta: "Condition guide",
      },
      {
        name: "Heart Failure",
        href: "/healthrankings-heart-failure.html",
        meta: "Sleep apnea is highly comorbid",
      },
      {
        name: "Hypertension",
        href: "/healthrankings-hypertension.html",
        meta: "Untreated OSA raises BP",
      },
      {
        name: "Top 5 Pulse Oximeters",
        href: "/healthrankings-asthma-pulse-oximeter-top5.html",
        meta: "Companion overnight monitoring",
      },
    ],
  };
}

// -------------------- Main --------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = String(process.env.STRAPI_URL || "").trim().replace(/\/$/, "");
  const token = String(process.env.STRAPI_IMPORT_TOKEN || "").trim();

  if (!args.dryRun && (!base || !token)) {
    console.error(
      "Set STRAPI_URL and STRAPI_IMPORT_TOKEN, or pass --dry-run.\n" +
        "  STRAPI_URL=https://healthrankings-cms.onrender.com \\\n" +
        "  STRAPI_IMPORT_TOKEN=<token> \\\n" +
        "    node scripts/seed-cpap-devices-and-top5.js"
    );
    process.exit(1);
  }

  console.log(
    args.dryRun
      ? `Dry-run — would seed ${DEVICES.length} CPAP devices + 1 Top 5 entry.`
      : `Seeding ${DEVICES.length} CPAP devices + 1 Top 5 entry to ${base}…`
  );

  // 1. Devices
  const deviceRecords = [];
  if (!args.onlyTop5) {
    for (const dev of DEVICES) {
      const rec = await upsertDevice(base, token, dev, args);
      if (rec) deviceRecords.push({ ...rec, slug: dev.slug });
      await new Promise((r) => setTimeout(r, 60));
    }
    console.log(`Devices done — ${deviceRecords.length}/${DEVICES.length} written.`);
  }

  // 2. Top 5
  if (args.onlyDevices) {
    console.log("Skipping Top 5 (--only-devices).");
    return;
  }

  if (args.dryRun) {
    const fakeRecords = DEVICES.map((d, i) => ({
      slug: d.slug,
      documentId: `dry_${d.slug}`,
      id: i + 1,
    }));
    const top5Payload = buildCategoryTopFivePayload(fakeRecords);
    await upsertCategoryTopFive(base, token, top5Payload, args);
    return;
  }

  // Resolve devices fresh (so we have proper documentIds even if --only-top5).
  const resolved = [];
  for (const dev of DEVICES) {
    const found = await findDeviceBySlug(base, token, dev.slug);
    if (found) resolved.push(found);
    else console.warn(`Top 5 missing device ${dev.slug} — was it created?`);
  }
  if (resolved.length === 0) {
    console.error("Aborting Top 5 — no resolvable devices in Strapi.");
    process.exit(1);
  }

  const top5Payload = buildCategoryTopFivePayload(resolved);
  await upsertCategoryTopFive(base, token, top5Payload, args);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
