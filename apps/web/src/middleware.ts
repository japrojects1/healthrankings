import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Legacy static URLs in /public. Strapi content is served from /articles/[slug]
 * and /devices/[slug]. Use explicit `:slug.html` matchers so single-segment paths
 * (no extra slashes) are matched — `:path*` patterns often miss these.
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/healthrankings-article-:slug.html", "/healthrankings-review-:slug.html"],
};
