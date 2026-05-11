import type { Core } from '@strapi/strapi';
import {
  CATEGORY_TOP5_TITLE,
  MAX_DEVICES_PER_REQUEST,
  MIN_CATEGORY_HINT_LENGTH,
  isValidDeviceCategorySlug,
} from './constants';
import { slugifyName } from './slugify';
import { anthropicMessagesJson } from './anthropic-client';
import { resolveCatalogAiLlm } from './llm-config';
import { openAiChatJson } from './openai-client';
import { buildDeviceReviewSystemPrompt, buildDeviceReviewUserPrompt } from './prompts';
import {
  clampRating,
  normalizeReviewSections,
  sectionBodyToString,
  toStringArray,
} from './normalize';
import { refreshPublishedCategoryTopFive } from './top5';
import { discoverProductNames } from './discover';

type DeviceInput = { name?: string; slug?: string };

export type CatalogAiGenerateBody = {
  category?: string;
  devices?: DeviceInput[];
  dryRun?: boolean;
  refreshTop5?: boolean;
  replaceExistingDevices?: boolean;
  /** When true, AI proposes product names (up to 25); manual device list is ignored. Requires categoryHint. */
  discoverModels?: boolean;
  /** Longer description of the category / scope — required when discoverModels is true. */
  categoryHint?: string;
};

type RowResult =
  | { name: string; slug: string; status: 'created'; documentId: string }
  | { name: string; slug: string; status: 'skipped'; reason: string }
  | { name: string; slug: string; status: 'error'; message: string };

type AiReviewPayload = {
  verdictShort?: string;
  rating?: number;
  pros?: unknown;
  cons?: unknown;
  reviewSections?: unknown;
};

function plannedDevicesFromBody(body: CatalogAiGenerateBody): Array<{ name: string; slug: string }> {
  const devicesRaw = Array.isArray(body.devices) ? body.devices : [];
  return devicesRaw
    .map((d) => {
      const name = String(d?.name ?? '').trim();
      const slug = String(d?.slug ?? '').trim();
      return { name, slug };
    })
    .filter((d) => d.name.length > 0);
}

async function createReviewRows(
  strapi: Core.Strapi,
  llm: Exclude<ReturnType<typeof resolveCatalogAiLlm>, { error: string }>,
  category: string,
  categoryHint: string | undefined,
  sliced: Array<{ name: string; slug: string }>,
  replaceExistingDevices: boolean
): Promise<RowResult[]> {
  const results: RowResult[] = [];
  const hint = String(categoryHint || '').trim() || undefined;

  for (const item of sliced) {
    const slug = item.slug || slugifyName(item.name);
    if (!slug) {
      results.push({
        name: item.name,
        slug: '',
        status: 'error',
        message: 'Could not derive slug from name',
      });
      continue;
    }

    const existing = await strapi.db.query('api::device.device').findOne({
      where: { slug },
      select: ['id', 'documentId'],
    });

    if (existing && !replaceExistingDevices) {
      results.push({
        name: item.name,
        slug,
        status: 'skipped',
        reason: 'Slug already exists (set replaceExistingDevices to overwrite)',
      });
      continue;
    }

    if (existing && replaceExistingDevices && (existing as any).documentId) {
      try {
        await strapi.documents('api::device.device').delete({
          documentId: String((existing as any).documentId),
        });
      } catch (e: any) {
        results.push({
          name: item.name,
          slug,
          status: 'error',
          message: `Failed to delete existing device: ${e?.message || e}`,
        });
        continue;
      }
    }

    const sys = buildDeviceReviewSystemPrompt();
    const user = buildDeviceReviewUserPrompt(category, item.name, hint);
    const aiRes =
      llm.provider === 'anthropic'
        ? await anthropicMessagesJson<AiReviewPayload>({
            apiKey: llm.apiKey,
            model: llm.model,
            system: sys,
            user,
          })
        : await openAiChatJson<AiReviewPayload>({
            apiKey: llm.apiKey,
            model: llm.model,
            system: sys,
            user,
          });

    if (aiRes.ok === false) {
      results.push({ name: item.name, slug, status: 'error', message: aiRes.error });
      continue;
    }

    const ai = aiRes.data || {};
    const rating = clampRating(ai.rating);
    const pros = toStringArray(ai.pros, 12);
    const cons = toStringArray(ai.cons, 12);
    const verdictShort = sectionBodyToString(ai.verdictShort);
    const reviewSections = normalizeReviewSections(ai.reviewSections, item.name);

    try {
      const doc = await strapi.documents('api::device.device').create({
        data: {
          slug,
          name: item.name,
          category,
          rating,
          pros,
          cons,
          verdictShort,
          reviewSections,
        },
      });
      const documentId = String((doc as any).documentId || '');
      results.push({ name: item.name, slug, status: 'created', documentId });
    } catch (e: any) {
      results.push({
        name: item.name,
        slug,
        status: 'error',
        message: e?.message || String(e),
      });
    }
  }

  return results;
}

export async function runCatalogAiGenerate(
  strapi: Core.Strapi,
  rawBody: CatalogAiGenerateBody | unknown
): Promise<Record<string, unknown>> {
  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as CatalogAiGenerateBody;
  const categoryRaw = String(body.category || '').trim();
  if (!isValidDeviceCategorySlug(categoryRaw)) {
    return {
      ok: false,
      error: `Invalid category slug. Use lowercase kebab-case (letters/digits/hyphens), 2–96 chars, e.g. continuous-glucose-monitors.`,
    };
  }
  const category = categoryRaw;

  const discoverModels = Boolean(body.discoverModels);
  const categoryHintRaw = String(body.categoryHint || '').trim();

  if (discoverModels && categoryHintRaw.length < MIN_CATEGORY_HINT_LENGTH) {
    return {
      ok: false,
      error: `discoverModels requires categoryHint (at least ${MIN_CATEGORY_HINT_LENGTH} characters) describing the category and product scope.`,
    };
  }

  let planned = plannedDevicesFromBody(body);

  if (!discoverModels && planned.length === 0) {
    return {
      ok: false,
      error: 'Provide at least one device name, or enable discoverModels with a categoryHint.',
    };
  }

  const dryRun = Boolean(body.dryRun);
  const refreshTop5 = Boolean(body.refreshTop5);
  const replaceExistingDevices = Boolean(body.replaceExistingDevices);

  /** Discovery preview / dry path */
  if (dryRun && discoverModels) {
    const llm = resolveCatalogAiLlm();
    if ('error' in llm) {
      return { ok: false, error: llm.error };
    }
    const discovered = await discoverProductNames({
      llm,
      categorySlug: category,
      categoryHint: categoryHintRaw,
      maxCount: MAX_DEVICES_PER_REQUEST,
    });
    if (discovered.ok === false) {
      return { ok: false, error: discovered.error };
    }
    const sliced = discovered.names.slice(0, MAX_DEVICES_PER_REQUEST);
    return {
      ok: true,
      dryRun: true,
      discoverModels: true,
      category,
      categoryHint: categoryHintRaw,
      maxPerRequest: MAX_DEVICES_PER_REQUEST,
      discoveredCount: sliced.length,
      wouldProcess: sliced.map((name) => ({
        name,
        slug: slugifyName(name),
      })),
      refreshTop5,
      replaceExistingDevices,
    };
  }

  /** Manual list dry path */
  if (dryRun && !discoverModels) {
    const sliced = planned.slice(0, MAX_DEVICES_PER_REQUEST);
    const truncated = planned.length > MAX_DEVICES_PER_REQUEST;
    return {
      ok: true,
      dryRun: true,
      discoverModels: false,
      category,
      truncated,
      maxPerRequest: MAX_DEVICES_PER_REQUEST,
      wouldProcess: sliced.map((d) => ({
        name: d.name,
        slug: d.slug || slugifyName(d.name),
      })),
      refreshTop5,
      replaceExistingDevices,
    };
  }

  const llm = resolveCatalogAiLlm();
  if ('error' in llm) {
    return { ok: false, error: llm.error };
  }

  if (discoverModels) {
    const discovered = await discoverProductNames({
      llm,
      categorySlug: category,
      categoryHint: categoryHintRaw,
      maxCount: MAX_DEVICES_PER_REQUEST,
    });
    if (discovered.ok === false) {
      return { ok: false, error: discovered.error };
    }
    planned = discovered.names.map((name) => ({ name, slug: '' }));
  }

  const sliced = planned.slice(0, MAX_DEVICES_PER_REQUEST);
  const truncated = planned.length > MAX_DEVICES_PER_REQUEST;

  const results = await createReviewRows(
    strapi,
    llm,
    category,
    categoryHintRaw || undefined,
    sliced,
    replaceExistingDevices
  );

  let top5: Record<string, unknown> | undefined;
  if (refreshTop5) {
    top5 = await refreshPublishedCategoryTopFive(strapi, category);
  }

  return {
    ok: true,
    dryRun: false,
    discoverModels,
    category,
    llmProvider: llm.provider,
    model: llm.model,
    truncated,
    maxPerRequest: MAX_DEVICES_PER_REQUEST,
    titleHint: CATEGORY_TOP5_TITLE[category] ?? `Top 5 — ${category}`,
    discoveredCount: discoverModels ? sliced.length : undefined,
    results,
    top5,
  };
}
