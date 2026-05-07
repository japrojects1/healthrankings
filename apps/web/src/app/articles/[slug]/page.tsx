import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { fetchArticleBySlug } from "@/lib/articles-strapi";
import { ArticleHeader } from "@/components/article/ArticleHeader";
import { ArticleFooter } from "@/components/article/ArticleFooter";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function formatArticleDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  noStore();
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);
  if (!article) return { title: "Article" };
  return {
    title: `${article.title} | HealthRankings`,
    description: article.metaDescription || article.subtitle || undefined,
  };
}

export default async function ArticlePage({ params }: Props) {
  noStore();
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);
  if (!article) return notFound();

  const heroFromCms = article.heroImage?.url;
  const heroFallback = `/images/article-${slug}.png`;
  const heroSrc = heroFromCms || heroFallback;
  const dateLabel = formatArticleDate(article.publishedDate);

  return (
    <div className="hr-article-page">
      <ArticleHeader />

      <div className="breadcrumb-bar">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href="/healthrankings-articles.html">Articles</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{article.title}</span>
      </div>

      <section className="article-hero">
        <div className="article-hero-inner">
          {article.tag ? <span className="article-tag">{article.tag}</span> : null}
          <h1>{article.title}</h1>
          {article.subtitle ? <p className="subtitle">{article.subtitle}</p> : null}
          <div className="article-meta">
            {article.authorLine ? <span className="author">{article.authorLine}</span> : null}
            {article.authorLine && (dateLabel || article.topic || article.readTime) ? (
              <span className="sep" />
            ) : null}
            {dateLabel ? <span>{dateLabel}</span> : null}
            {dateLabel && (article.topic || article.readTime) ? <span className="sep" /> : null}
            {article.topic ? <span>{article.topic}</span> : null}
            {article.topic && article.readTime ? <span className="sep" /> : null}
            {article.readTime ? <span>{article.readTime}</span> : null}
          </div>
        </div>
        <div className="article-hero-image">
          <Image
            src={heroSrc}
            alt={article.heroImage?.alternativeText || article.title}
            width={1200}
            height={630}
            sizes="(max-width: 900px) 100vw, 860px"
            priority
            unoptimized={heroSrc.startsWith("http") && !heroSrc.includes("healthrankings")}
          />
        </div>
      </section>

      <div className="article-layout">
        <article className="article-content" dangerouslySetInnerHTML={{ __html: article.body }} />
      </div>

      <div className="medical-disclaimer">
        <div className="medical-disclaimer-inner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <span>
            <strong>Medical disclaimer:</strong> This content is for informational purposes only and is not a
            substitute for professional medical advice, diagnosis, or treatment. Always consult your physician or
            qualified health provider.{" "}
            <Link href="/healthrankings-terms-of-service.html">Read full disclaimer</Link>
          </span>
        </div>
      </div>

      <ArticleFooter />
    </div>
  );
}
