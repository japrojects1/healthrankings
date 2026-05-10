import type { NextConfig } from "next";

/** Hostnames allowed for next/image when loading Strapi uploads (see STRAPI_URL on Render). */
function collectCmsImageHosts(): string[] {
  const hosts = new Set<string>([
    "healthrankings-cms.onrender.com",
    "cms.healthrankings.co",
  ]);

  const consider = (raw: string | undefined) => {
    const t = raw?.trim();
    if (!t) return;
    try {
      const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
      hosts.add(u.hostname);
    } catch {
      /* ignore bad env */
    }
  };

  consider(process.env.STRAPI_URL);
  consider(process.env.NEXT_PUBLIC_STRAPI_URL);

  const extras = process.env.CMS_IMAGE_HOSTS?.split(/[\s,]+/).filter(Boolean) ?? [];
  for (const e of extras) {
    consider(e.includes("://") ? e : `https://${e}`);
  }

  return [...hosts];
}

function cmsRemotePatterns() {
  const patterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [];
  for (const hostname of collectCmsImageHosts()) {
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      patterns.push({ protocol: "http", hostname, port: "1337", pathname: "/**" });
    } else {
      patterns.push({ protocol: "https", hostname, pathname: "/**" });
    }
  }
  return patterns;
}

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/articles/:slug",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-cache, no-store, max-age=0, must-revalidate",
        },
      ],
    },
    {
      source: "/devices/:slug",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-cache, no-store, max-age=0, must-revalidate",
        },
      ],
    },
  ],
  images: {
    remotePatterns: cmsRemotePatterns(),
  },
};

export default nextConfig;
