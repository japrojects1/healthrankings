#!/usr/bin/env node
/**
 * Parse healthrankings-article-*.html at repo root into data/articles-seed.json
 * (excludes apps/web/public copies).
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data", "articles-seed.json");

function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html) {
  return decodeHtmlEntities(String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function parseArticleFile(filePath, basename) {
  const html = fs.readFileSync(filePath, "utf8");
  const slug = basename.replace(/^healthrankings-article-/, "").replace(/\.html$/i, "");

  const titleM = html.match(/<title>([^<]+)<\/title>/i);
  let title = titleM ? titleM[1].replace(/\s*\|\s*HealthRankings\s*$/i, "").trim() : slug;

  const descM = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const metaDescription = descM ? decodeHtmlEntities(descM[1]) : "";

  const tagM = html.match(/<span class="article-tag"[^>]*>([^<]+)<\/span>/i);
  const tag = tagM ? stripTags(tagM[1]) : "";

  const subM = html.match(/<p class="subtitle">([\s\S]*?)<\/p>/i);
  const subtitle = subM ? stripTags(subM[1]) : "";

  const bodyM = html.match(/<article class="article-content">([\s\S]*?)<\/article>/i);
  let body = bodyM ? bodyM[1].trim() : "";
  if (!body) body = "<p>(No article body extracted.)</p>";

  const dateM = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
  const publishedDate = dateM ? dateM[1].slice(0, 10) : null;

  const authorM = html.match(/<span class="author">([^<]+)<\/span>/i);
  const authorLine = authorM ? stripTags(authorM[1]) : "";

  let topic = "";
  let readTime = "";
  const metaBlock = html.match(/<div class="article-meta">([\s\S]*?)<\/div>/i);
  if (metaBlock) {
    const spans = [...metaBlock[1].matchAll(/<span>([^<]+)<\/span>/gi)].map((m) =>
      decodeHtmlEntities(m[1].trim())
    );
    if (spans.length >= 2) {
      const second = spans[1];
      const middotSplit = second.split(/\s*[·•]\s*|\s*&middot;\s*/i);
      if (middotSplit.length >= 2) {
        topic = middotSplit[0].trim();
        readTime = middotSplit.slice(1).join(" · ").trim();
      } else {
        const rm = second.match(/(\d+)\s*min read/i);
        if (rm) {
          readTime = `${rm[1]} min read`;
          topic = second.replace(/\s*\d+\s*min read/i, "").trim();
        } else {
          topic = second;
        }
      }
    }
  }
  if (!readTime) {
    const readM = html.match(/(\d+)\s*min read/i);
    readTime = readM ? `${readM[1]} min read` : "";
  }

  return {
    slug,
    title,
    tag: tag || null,
    topic: topic || null,
    subtitle: subtitle || null,
    metaDescription: metaDescription || null,
    readTime: readTime || null,
    publishedDate,
    authorLine: authorLine || null,
    body,
    sourceHtmlPath: basename,
  };
}

function main() {
  const names = fs.readdirSync(ROOT).filter((n) => /^healthrankings-article-.+\.html$/i.test(n));
  const articles = [];
  for (const name of names.sort()) {
    const fp = path.join(ROOT, name);
    if (!fs.statSync(fp).isFile()) continue;
    try {
      articles.push(parseArticleFile(fp, name));
    } catch (e) {
      console.warn("Skip", name, e.message);
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(articles, null, 2), "utf8");
  console.log(`Wrote ${articles.length} articles → ${OUT}`);
}

main();
