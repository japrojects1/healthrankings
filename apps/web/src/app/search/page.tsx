import Link from "next/link";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { ArticleHeader } from "@/components/article/ArticleHeader";
import { ArticleFooter } from "@/components/article/ArticleFooter";
import { searchPublishedArticles } from "@/lib/articles-strapi";
import { searchPublishedDevices } from "@/lib/strapi";
import { humanizeCategoryEnum } from "@/lib/device-category-links";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  noStore();
  const { q } = await searchParams;
  const query = (q || "").trim();
  return {
    title: query ? `Search: ${query} | HealthRankings` : "Search | HealthRankings",
    description: "Search HealthRankings articles and device reviews.",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  noStore();
  const { q } = await searchParams;
  const query = (q || "").trim();
  const ready = query.length >= 2;
  const [articles, devices] = ready
    ? await Promise.all([searchPublishedArticles(query, 24), searchPublishedDevices(query, 24)])
    : [[], []];

  return (
    <div className="hr-article-page hr-search-page">
      <ArticleHeader />

      <main className="hr-search-main">
        <div className="hr-search-inner">
          <h1 className="hr-search-h1">Search</h1>
          <form className="hr-search-form" action="/search" method="get" role="search">
            <label htmlFor="hr-search-q" className="sr-only">
              Search query
            </label>
            <input
              id="hr-search-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Articles, devices, topics…"
              autoComplete="off"
              className="hr-search-field"
              minLength={2}
            />
            <button type="submit" className="hr-search-submit">
              Search
            </button>
          </form>

          {!ready ? (
            <p className="hr-search-hint">Enter at least 2 characters to search published articles and devices.</p>
          ) : (
            <>
              <p className="hr-search-summary">
                {articles.length + devices.length === 0
                  ? `No published results for “${query}”. Try different keywords or browse Conditions and Devices.`
                  : `${articles.length + devices.length} result(s) for “${query}”.`}
              </p>

              {articles.length > 0 ? (
                <section className="hr-search-section" aria-labelledby="hr-search-articles">
                  <h2 id="hr-search-articles" className="hr-search-h2">
                    Articles
                  </h2>
                  <ul className="hr-search-list">
                    {articles.map((a) => (
                      <li key={a.slug}>
                        <Link href={`/articles/${encodeURIComponent(a.slug)}`} className="hr-search-hit">
                          <span className="hr-search-hit-title">{a.title}</span>
                          {a.metaDescription ? (
                            <span className="hr-search-hit-desc">{a.metaDescription.slice(0, 160)}</span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {devices.length > 0 ? (
                <section className="hr-search-section" aria-labelledby="hr-search-devices">
                  <h2 id="hr-search-devices" className="hr-search-h2">
                    Device reviews
                  </h2>
                  <ul className="hr-search-list">
                    {devices.map((d) => (
                      <li key={d.slug}>
                        <Link href={`/devices/${encodeURIComponent(d.slug)}`} className="hr-search-hit">
                          <span className="hr-search-hit-title">{d.name}</span>
                          <span className="hr-search-hit-meta">
                            {humanizeCategoryEnum(d.category || "other")}
                          </span>
                          {d.verdictShort ? (
                            <span className="hr-search-hit-desc">{d.verdictShort.slice(0, 160)}</span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>

      <ArticleFooter />
    </div>
  );
}
