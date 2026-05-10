import type { Core } from '@strapi/strapi';
import { CATEGORY_TOP5_TITLE } from './constants';

function deviceSortKey(rating: unknown): number {
  if (rating == null || Number.isNaN(Number(rating))) return -1;
  return Number(rating);
}

export type Top5RefreshResult =
  | { status: 'skipped'; reason: string }
  | { status: 'refreshed'; documentId: string; slug: string; deviceSlugs: string[] };

/**
 * Rebuilds the published Category Top 5 for a category from the five highest-rated **published** devices.
 * Draft-only devices are ignored until they are published (matches public-site behavior).
 */
export async function refreshPublishedCategoryTopFive(
  strapi: Core.Strapi,
  category: string
): Promise<Top5RefreshResult> {
  const rows = await strapi.db.query('api::device.device').findMany({
    where: {
      category,
      publishedAt: { $notNull: true },
    },
    select: ['documentId', 'slug', 'rating', 'name'],
    limit: 100,
  });

  const sorted = [...rows].sort((a: any, b: any) => {
    const dr = deviceSortKey(b.rating) - deviceSortKey(a.rating);
    if (dr !== 0) return dr;
    return String(a.slug || '').localeCompare(String(b.slug || ''));
  });

  const top = sorted.slice(0, 5);
  if (top.length === 0) {
    return {
      status: 'skipped',
      reason: 'No published devices in this category yet — publish reviews first, then refresh Top 5.',
    };
  }

  const existingRows = await strapi.db.query('api::category-top-five.category-top-five').findMany({
    where: { category },
    select: ['documentId'],
    limit: 50,
  });
  const docIds = [...new Set(existingRows.map((r: any) => r.documentId).filter(Boolean))];
  for (const documentId of docIds) {
    try {
      await strapi.documents('api::category-top-five.category-top-five').delete({ documentId });
    } catch (e: any) {
      strapi.log.warn(`catalog-ai: Top 5 delete failed for ${documentId}: ${e?.message || e}`);
    }
  }

  const slug = `${category}-top5`;
  const title = CATEGORY_TOP5_TITLE[category] || `Top 5 — ${category}`;
  const subtitle = 'Highest-rated picks in this category on HealthRankings.';

  const entries = top.map((d: any, i: number) => ({
    rank: i + 1,
    device: { connect: [{ documentId: String(d.documentId) }] },
  }));

  const created = await strapi.documents('api::category-top-five.category-top-five').create({
    data: {
      slug,
      category,
      title,
      subtitle,
      entries,
    },
    status: 'published',
  });

  const documentId = String((created as any).documentId || '');
  return {
    status: 'refreshed',
    documentId,
    slug,
    deviceSlugs: top.map((d: any) => String(d.slug || '')),
  };
}
