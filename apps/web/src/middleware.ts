import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Legacy static URLs live in /public as *.html. Strapi-backed pages live under
 * /articles/[slug] and /devices/[slug]. Redirect so edits in the CMS show when
 * visitors use old links or the existing homepage cards.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const article = /^\/healthrankings-article-(.+)\.html$/i.exec(pathname);
  if (article) {
    const slug = article[1];
    return NextResponse.redirect(new URL(`/articles/${slug}`, request.url), 308);
  }

  const device = /^\/healthrankings-review-(.+)\.html$/i.exec(pathname);
  if (device) {
    const slug = device[1];
    return NextResponse.redirect(new URL(`/devices/${slug}`, request.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/healthrankings-article-:path*", "/healthrankings-review-:path*"],
};
