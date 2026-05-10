import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { legacyTop5PathToCategory } from "@/lib/device-category-links";

/**
 * Legacy static URLs in /public. Strapi content is served from /articles/[slug]
 * and /devices/[slug]. Use explicit `:slug.html` matchers so single-segment paths
 * (no extra slashes) are matched — `:path*` patterns often miss these.
 *
 * Representative Category Top 5 `.html` URLs rewrite to `/top5/[category]` (CMS-driven).
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const article = /^\/healthrankings-article-(.+)\.html$/i.exec(pathname);
  if (article) {
    return NextResponse.redirect(new URL(`/articles/${article[1]}`, request.url), 308);
  }

  const device = /^\/healthrankings-review-(.+)\.html$/i.exec(pathname);
  if (device) {
    return NextResponse.redirect(new URL(`/devices/${device[1]}`, request.url), 308);
  }

  const top5Category = legacyTop5PathToCategory(pathname);
  if (top5Category) {
    const url = request.nextUrl.clone();
    url.pathname = `/top5/${top5Category}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Must stay in sync with `top5` href values in `src/lib/device-category-links.ts`.
  matcher: [
    "/healthrankings-article-:slug.html",
    "/healthrankings-review-:slug.html",
    "/healthrankings-hypertension-top5.html",
    "/healthrankings-weight-management-body-composition-top5.html",
    "/healthrankings-copd-pulse-oximeters-top5.html",
    "/healthrankings-copd-breathing-trainers-top5.html",
    "/healthrankings-arthritis-tens-top5.html",
    "/healthrankings-thermometers-top5.html",
    "/healthrankings-water-flossers-top5.html",
    "/healthrankings-sti-home-testing-top5.html",
    "/healthrankings-dementia-alzheimers-gps-alert-top5.html",
    "/healthrankings-percussion-massage-guns-top5.html",
    "/healthrankings-oxidative-stress-antioxidant-supplements-top5.html",
    "/healthrankings-pregnancy-tests-top5.html",
  ],
};
