#!/usr/bin/env node
/**
 * Point 3 helper: call catalog-ai with your Render secrets from your machine only.
 *
 *   CMS_URL=https://healthrankings-cms.onrender.com \
 *   CATALOG_AI_SECRET='<paste from Render → CMS → Environment>' \
 *   node scripts/catalog-ai-check.js health
 *
 * Dry-run (no Anthropic call, no DB writes):
 *
 *   CMS_URL=... CATALOG_AI_SECRET=... node scripts/catalog-ai-check.js dry-run
 */

function usage() {
  console.error(`
Usage:
  CMS_URL=https://your-cms-host CATALOG_AI_SECRET=... node scripts/catalog-ai-check.js health
  CMS_URL=... CATALOG_AI_SECRET=... node scripts/catalog-ai-check.js dry-run

Do not commit real secrets. Export vars in your shell or use a local .env (never pushed).
`);
}

function baseUrl(raw) {
  const t = String(raw || "").trim().replace(/\/$/, "");
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

async function main() {
  const cmd = process.argv[2] || "";
  const cms = baseUrl(process.env.CMS_URL);
  const secret = String(process.env.CATALOG_AI_SECRET || "").trim();

  if (!cms || !secret || !["health", "dry-run"].includes(cmd)) {
    usage();
    process.exit(cms && secret ? 2 : 1);
  }

  const headers = {
    "X-Catalog-Ai-Secret": secret,
    Accept: "application/json",
  };

  if (cmd === "health") {
    const url = `${cms}/api/catalog-ai/health`;
    const res = await fetch(url, { method: "GET", headers });
    const text = await res.text();
    console.log(`HTTP ${res.status} ${url}`);
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      console.log(text);
    }
    process.exit(res.ok ? 0 : 1);
  }

  const url = `${cms}/api/catalog-ai/generate`;
  const body = {
    category: "other",
    devices: [{ name: "Catalog AI connectivity test" }],
    dryRun: true,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`HTTP ${res.status} ${url}`);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
  process.exit(res.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
