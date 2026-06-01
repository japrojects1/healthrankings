import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { fetchPublishedArticles, type Article } from "@/lib/articles-strapi";
import { ArticleHeader } from "@/components/article/ArticleHeader";
import { ArticleFooter } from "@/components/article/ArticleFooter";
import {
  SITE,
  DEFAULT_OG,
  breadcrumb,
  canonical,
  collectionPage,
  itemList,
  renderJsonLd,
} from "@/lib/seo-jsonld";
import "./articles-index.css";

/** Article (with a resolved hero source) — null when no image is available. */
type ArticleWithHero = Article & { resolvedHeroSrc: string | null };

const IMAGE_DIR = path.join(process.cwd(), "public", "images");

async function legacyImageForSlug(slug: string): Promise<string | null> {
  for (const ext of ["png", "jpg", "jpeg", "webp"] as const) {
    const filename = `article-${slug}.${ext}`;
    try {
      await fs.access(path.join(IMAGE_DIR, filename));
      return `/images/${filename}`;
    } catch {
      /* try next extension */
    }
  }
  return null;
}

async function resolveHero(article: Article): Promise<string | null> {
  if (article.heroImage?.url) return article.heroImage.url;
  return legacyImageForSlug(article.slug);
}

export const dynamic = "force-dynamic";

const ARTICLES_DESCRIPTION =
  "Health guides, wellness tips, and honest insights — written by our team, reviewed by medical professionals, and built around the conditions that affect your daily life.";
const ARTICLES_URL = canonical("/articles");

export const metadata: Metadata = {
  title: "Articles & Guides | HealthRankings",
  description: ARTICLES_DESCRIPTION,
  alternates: { canonical: ARTICLES_URL },
  openGraph: {
    type: "website",
    url: ARTICLES_URL,
    title: "Articles & Guides | HealthRankings",
    description: ARTICLES_DESCRIPTION,
    siteName: "HealthRankings",
    images: [{ url: DEFAULT_OG }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Articles & Guides | HealthRankings",
    description: ARTICLES_DESCRIPTION,
    images: [DEFAULT_OG],
  },
};

/** Map a free-form CMS tag string to one of the predefined card classes. */
function tagClass(tag: string | null | undefined): string {
  const t = (tag || "").toLowerCase();
  if (/wellness|aging|longevity|preventive/.test(t)) return "tag-wellness";
  if (/condition|guide|diabetes|copd|cardio|heart|stroke/.test(t)) return "tag-condition";
  if (/lifestyle|tips|sleep|recovery/.test(t)) return "tag-tips";
  if (/nutrition|supplement|diet|food/.test(t)) return "tag-nutrition";
  if (/mental|anxiety|stress|depression/.test(t)) return "tag-mental";
  if (/fitness|exercise|workout|training|movement/.test(t)) return "tag-fitness";
  if (/respiratory|lung|breathing/.test(t)) return "tag-respiratory";
  return "tag-condition";
}

/** Tag → background gradient class for the image area when no hero image is set. */
function gradientClassFor(tag: string | null | undefined): string {
  const t = (tag || "").toLowerCase();
  if (/wellness|aging|longevity/.test(t)) return "grad-teal";
  if (/condition|cardio|heart|diabetes|stroke/.test(t)) return "grad-blue";
  if (/lifestyle|tips|sleep/.test(t)) return "grad-slate";
  if (/nutrition|supplement|diet|food/.test(t)) return "grad-warm";
  if (/mental|anxiety|stress/.test(t)) return "grad-purple";
  if (/fitness|exercise|workout|training/.test(t)) return "grad-green";
  if (/respiratory|lung|breathing/.test(t)) return "grad-teal";
  return "grad-blue";
}

function PlaceholderArt() {
  return (
    <div className="article-card-image-placeholder" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    </div>
  );
}

function metaLine(article: Article): string {
  const parts: string[] = [];
  if (article.topic) parts.push(article.topic);
  if (article.readTime) parts.push(article.readTime);
  return parts.join(" · ");
}

function articleHref(slug: string): string {
  return `/articles/${slug}`;
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function FeaturedHero({ article }: { article: ArticleWithHero }) {
  const tagLabel = article.tag || "Featured";
  return (
    <section className="featured-hero" aria-labelledby="featured-article-title">
      <Link href={articleHref(article.slug)} className="featured-hero-card">
        <div className={`featured-hero-image ${gradientClassFor(article.tag)}`}>
          <span className="featured-hero-tag">{tagLabel}</span>
          {article.resolvedHeroSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.resolvedHeroSrc} alt={article.title} loading="lazy" />
          ) : null}
        </div>
        <div className="featured-hero-body">
          <div className="label">Featured Article</div>
          <h2 id="featured-article-title">{article.title}</h2>
          {article.subtitle ? <p>{article.subtitle}</p> : null}
          <div className="featured-hero-meta">
            <span className="author">By {article.authorLine || "HealthRankings Team"}</span>
            {metaLine(article) ? <span>{metaLine(article)}</span> : null}
          </div>
          <span className="read-link">
            Read full article <ChevronIcon />
          </span>
        </div>
      </Link>
    </section>
  );
}

function ArticleCard({ article }: { article: ArticleWithHero }) {
  const tagLabel = article.tag || "Article";
  return (
    <Link href={articleHref(article.slug)} className="article-card" aria-label={article.title}>
      <div className={`article-card-image ${gradientClassFor(article.tag)}`}>
        <span className={`article-card-tag ${tagClass(article.tag)}`}>{tagLabel}</span>
        {article.resolvedHeroSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.resolvedHeroSrc} alt={article.title} loading="lazy" />
        ) : (
          <PlaceholderArt />
        )}
      </div>
      <div className="article-card-body">
        <h3 className="article-card-title">{article.title}</h3>
        {article.subtitle ? <p className="article-card-excerpt">{article.subtitle}</p> : null}
        <div className="article-card-footer">
          <span>{metaLine(article) || tagLabel}</span>
          <span className="article-card-read">
            Read <ChevronIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function ArticlesIndexPage() {
  noStore();
  const articles = await fetchPublishedArticles(200);
  const enriched: ArticleWithHero[] = await Promise.all(
    articles.map(async (a) => ({ ...a, resolvedHeroSrc: await resolveHero(a) })),
  );
  const featured = enriched[0] ?? null;
  const rest = enriched.slice(featured ? 1 : 0);

  const breadcrumbBlock = breadcrumb([
    { name: "Home", url: `${SITE}/` },
    { name: "Articles", url: ARTICLES_URL },
  ]);
  const collectionBlock = collectionPage(
    "Articles & Guides | HealthRankings",
    ARTICLES_URL,
    ARTICLES_DESCRIPTION,
  );
  const itemListBlock = itemList(
    "HealthRankings articles",
    ARTICLES_URL,
    enriched.slice(0, 50).map((a) => ({
      name: a.title,
      url: `${SITE}/articles/${a.slug}`,
      image: a.resolvedHeroSrc || null,
    })),
  );

  return (
    <div className="hr-articles-index hr-article-page">
      <script {...renderJsonLd(breadcrumbBlock)} />
      <script {...renderJsonLd(collectionBlock)} />
      <script {...renderJsonLd(itemListBlock)} />
      <ArticleHeader />

      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Articles &amp; Guides
          </div>
          <h1>
            Read what <em>matters.</em>
          </h1>
          <p>
            Health guides, wellness tips, and honest insights — written by our team, reviewed by medical
            professionals, and built around the conditions that affect your daily life.
          </p>
        </div>
      </section>

      {featured ? <FeaturedHero article={featured} /> : null}

      <section className="articles-section">
        <div className="articles-section-inner">
          <div className="articles-section-header">
            <h2>Latest articles</h2>
            <span className="count">
              {enriched.length} {enriched.length === 1 ? "article" : "articles"}
            </span>
          </div>

          {enriched.length === 0 ? (
            <div className="articles-empty">
              <strong>No published articles yet.</strong>
              <p style={{ marginTop: 8 }}>
                When the editorial team publishes an article in Strapi, it appears here automatically.
              </p>
            </div>
          ) : (
            <div className="articles-grid">
              {rest.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>

      <ArticleFooter />
    </div>
  );
}
