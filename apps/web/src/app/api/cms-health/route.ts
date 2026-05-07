import { NextResponse } from "next/server";

/**
 * Quick check that this deployment is the Next.js Node server (not a static bucket).
 * Open: https://YOUR_DOMAIN/api/cms-health
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    runtime: "next-node",
    strapiUrlConfigured: Boolean(process.env.STRAPI_URL?.trim()),
    time: new Date().toISOString(),
  });
}
