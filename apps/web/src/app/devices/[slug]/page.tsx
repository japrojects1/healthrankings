import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { fetchDeviceBySlug } from "@/lib/strapi";

export const dynamic = "force-dynamic";

export default async function DevicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();
  const { slug } = await params;
  const device = await fetchDeviceBySlug(slug);
  if (!device) return notFound();

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 20px" }}>
      <nav style={{ fontSize: 14, marginBottom: 20 }}>
        <Link href="/">Home</Link> <span style={{ opacity: 0.6 }}>/</span>{" "}
        <span>{device.name}</span>
      </nav>

      <header style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 20 }}>
        <div>
          {device.heroImage?.url ? (
            <Image
              src={device.heroImage.url}
              alt={device.heroImage.alternativeText || device.name}
              width={320}
              height={320}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "white",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
              }}
            />
          )}
        </div>

        <div>
          <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: 0 }}>{device.name}</h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10, color: "#475569" }}>
            {device.category ? <span>Category: {device.category}</span> : null}
            {device.rating != null ? <span>Rating: {device.rating}/5</span> : null}
            {device.priceText ? <span>Price: {device.priceText}</span> : null}
          </div>

          {device.verdictShort ? (
            <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.7, color: "#334155" }}>
              {device.verdictShort}
            </p>
          ) : null}

          {device.affiliateUrl ? (
            <p style={{ marginTop: 14 }}>
              <a
                href={device.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "#2563eb",
                  color: "white",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View best price
              </a>
            </p>
          ) : null}
        </div>
      </header>

      {(device.pros?.length || device.cons?.length) ? (
        <section style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 16, background: "white" }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Pros</h2>
            <ul style={{ margin: "10px 0 0 18px", color: "#334155" }}>
              {(device.pros || []).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 16, background: "white" }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Cons</h2>
            <ul style={{ margin: "10px 0 0 18px", color: "#334155" }}>
              {(device.cons || []).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {device.reviewSections?.length ? (
        <section style={{ marginTop: 34 }}>
          {device.reviewSections.map((s, idx) => (
            <article key={`${s.heading}-${idx}`} style={{ marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{s.heading}</h2>
              <div style={{ marginTop: 8, color: "#334155", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {s.body}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {device.gallery?.length ? (
        <section style={{ marginTop: 34 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Images</h2>
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {device.gallery.map((img) => (
              <Image
                key={img.url}
                src={img.url}
                alt={img.alternativeText || device.name}
                width={320}
                height={320}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "white",
                }}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

