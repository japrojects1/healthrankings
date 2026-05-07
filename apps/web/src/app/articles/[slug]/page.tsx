import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { fetchArticleBySlug } from "@/lib/articles-strapi";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

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

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 48px" }}>
      <nav style={{ fontSize: 14, marginBottom: 20 }}>
        <Link href="/">Home</Link>
        <span style={{ opacity: 0.6 }}> / </span>
        <Link href="/healthrankings-articles.html">Articles</Link>
        <span style={{ opacity: 0.6 }}> / </span>
        <span>{article.title}</span>
      </nav>

      {article.tag ? (
        <p style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", marginBottom: 8 }}>{article.tag}</p>
      ) : null}
      <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", lineHeight: 1.2, margin: "0 0 12px" }}>{article.title}</h1>
      {article.subtitle ? (
        <p style={{ fontSize: 18, color: "#475569", lineHeight: 1.5, marginBottom: 16 }}>{article.subtitle}</p>
      ) : null}
      <div style={{ fontSize: 14, color: "#64748b", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {article.authorLine ? <span>{article.authorLine}</span> : null}
        {article.publishedDate ? <span>{article.publishedDate}</span> : null}
        {article.topic ? <span>{article.topic}</span> : null}
        {article.readTime ? <span>{article.readTime}</span> : null}
      </div>

      {article.heroImage?.url ? (
        <div style={{ marginBottom: 28, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
          <Image
            src={article.heroImage.url}
            alt={article.heroImage.alternativeText || article.title}
            width={1200}
            height={630}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      ) : null}

      <div
        className="article-cms-body"
        style={{ fontSize: 17, lineHeight: 1.75, color: "#334155" }}
        dangerouslySetInnerHTML={{ __html: article.body }}
      />
    </main>
  );
}
