import type { Core } from '@strapi/strapi';

export type CatalogDeviceRow = { name: string; slug: string };

/**
 * Devices in this category (for the discovery prompt) and all catalog slugs (for de-dupe).
 */
export async function loadDeviceCatalogContext(
  strapi: Core.Strapi,
  category: string
): Promise<{
  existingInCategory: CatalogDeviceRow[];
  globalSlugSet: Set<string>;
  /** True when category query hit the row limit (there may be more). */
  categoryListTruncated: boolean;
}> {
  const categoryLimit = 400;
  const inCatRaw = await strapi.db.query('api::device.device').findMany({
    where: { category },
    select: ['name', 'slug'],
    limit: categoryLimit,
    orderBy: { name: 'asc' },
  });

  const existingInCategory: CatalogDeviceRow[] = (inCatRaw as any[]).map((r) => ({
    name: String(r.name ?? '').trim(),
    slug: String(r.slug ?? '').trim(),
  }));

  const slugRows = await strapi.db.query('api::device.device').findMany({
    select: ['slug'],
    limit: 12000,
  });

  const globalSlugSet = new Set<string>();
  for (const r of slugRows as any[]) {
    const s = String(r.slug ?? '').trim();
    if (s) globalSlugSet.add(s);
  }

  return {
    existingInCategory,
    globalSlugSet,
    categoryListTruncated: existingInCategory.length >= categoryLimit,
  };
}
