import { NextResponse } from "next/server";

/**
 * 1) Confirms this is the Next.js Node app (not static hosting).
 * 2) Optional live Strapi read (same path the site uses):
 *    /api/cms-health?slug=daily-habits-lower-blood-pressure
 *    /api/cms-health?slug=oxiline-pressure-xs-pro&kind=device
 *
 * If `strapiUrlConfigured` is false, set STRAPI_URL on the web service in Render.
 * If probe `httpStatus` is not 200, CMS URL or permissions are wrong.
 * If `found` is false, slug mismatch or entry is draft / not published.
 */
export async function GET(request: Request) {
  const base = process.env.STRAPI_URL?.trim() || "";
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const kind = searchParams.get("kind") === "device" ? "device" : "article";

  const out: Record<string, unknown> = {
    ok: true,
    runtime: "next-node",
    host: request.headers.get("host"),
    strapiUrlConfigured: Boolean(base),
    strapiHostPreview: base ? safeHost(base) : null,
    time: new Date().toISOString(),
  };

  if (slug && base) {
    const path =
      kind === "device"
        ? `/api/devices?filters[slug][$eq]=${encodeURIComponent(slug)}&populate[heroImage]=true&status=published`
        : `/api/articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*&status=published`;
    const url = new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const json = (await res.json()) as {
        data?: Array<Record<string, unknown>>;
      };
      const row = json?.data?.[0];
      out.strapiProbe = {
        kind,
        urlTried: url,
        httpStatus: res.status,
        found: Boolean(row),
        title: (row?.title ?? row?.name) as string | undefined,
        updatedAt: row?.updatedAt,
        publishedAt: row?.publishedAt,
      };
    } catch (e) {
      out.strapiProbe = { error: String(e) };
    }
  } else if (slug && !base) {
    out.strapiProbe = {
      skipped: "STRAPI_URL is empty — web app cannot load CMS content.",
    };
  }

  return NextResponse.json(out);
}

function safeHost(base: string) {
  try {
    return new URL(base).host;
  } catch {
    return "(invalid STRAPI_URL)";
  }
}
