"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type SupplementProduct = {
  name: string;
  slug: string;
  score: number | null;
  image: string | null;
};

export type SupplementCategory = {
  category: string;
  label: string;
  count: number;
  winnerName: string | null;
  winnerScore: number | null;
  top5Href: string;
  allHref: string;
  products: SupplementProduct[];
};

export function SupplementsBrowser({ categories }: { categories: SupplementCategory[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.products.some((p) => p.name.toLowerCase().includes(q)),
    );
  }, [categories, query]);

  const totalProducts = filtered.reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      <div className="search-bar">
        <div className="search-input-wrap">
          <div className="search-ico">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            className="supp-search"
            placeholder="Search supplements (e.g. creatine, magnesium, omega-3)…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="main">
        <h2 className="main-h2">Best health supplements of 2026 — expert tested &amp; ranked</h2>
        <div className="results-info">
          Showing <strong>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "supplement category" : "supplement categories"} ·{" "}
          <strong>{totalProducts}</strong> {totalProducts === 1 ? "product" : "products"} reviewed
        </div>

        {filtered.length === 0 ? (
          <div className="supp-empty">
            <h3>No supplements found</h3>
            <p>
              {categories.length === 0
                ? "No supplement reviews are published yet. Use the CMS “Device catalog AI” tool with Product type set to Supplement to generate reviews and a Top 5 — they’ll appear here automatically."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          filtered.map((c) => (
            <section className="supp-section" key={c.category}>
              <div className="supp-section-header">
                <h3 className="supp-section-title">{c.label}</h3>
                <span className="supp-count">
                  {c.count} {c.count === 1 ? "product" : "products"} reviewed
                </span>
              </div>

              <Link href={c.top5Href} className="top5-box">
                <div>
                  <div className="top5-badge">Expert Ranked · Top 5 of 2026</div>
                  <div className="top5-title">We Reviewed the Best {c.label} of 2026</div>
                  <div className="top5-sub">
                    {c.winnerName ? `#1 Pick: ${c.winnerName}` : "Expert-ranked picks"}
                    {c.winnerScore != null ? ` · Score: ${c.winnerScore}/10` : ""} · {c.count}{" "}
                    {c.count === 1 ? "product tested" : "products tested"}
                  </div>
                </div>
                <div className="top5-btn">See Full Top 5 →</div>
              </Link>

              <div className="products-grid">
                {c.products.map((p, i) => (
                  <Link
                    key={p.slug || p.name}
                    href={`/devices/${encodeURIComponent(p.slug)}`}
                    className="product-card"
                  >
                    {p.image ? (
                      <div className="pc-thumb-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const el = e.currentTarget;
                            const wrap = el.parentElement;
                            el.remove();
                            wrap?.classList.add("pc-thumb-missing");
                          }}
                        />
                      </div>
                    ) : (
                      <div className="pc-thumb-wrap pc-thumb-missing" aria-hidden="true" />
                    )}
                    <div className="pc-rank">#{i + 1} Pick</div>
                    <div className="pc-name">{p.name}</div>
                    <div className="pc-bottom">
                      <span className="pc-score">★ {p.score != null ? `${p.score}/10` : "Review"}</span>
                      <span className="pc-arrow">Read Review →</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="see-all-row">
                <Link href={c.allHref} className="see-all-link">
                  See All {c.label} →
                </Link>
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
