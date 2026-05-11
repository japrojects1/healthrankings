import type { CatalogDeviceRow } from './catalog-context';
import { anthropicMessagesJson } from './anthropic-client';
import type { ResolvedCatalogLlm } from './llm-config';
import { openAiChatJson } from './openai-client';
import {
  MAX_DEVICES_PER_REQUEST,
  MAX_DISCOVERY_PASSES,
} from './constants';
import { buildDiscoverModelsSystemPrompt, buildDiscoverModelsUserPrompt } from './prompts';
import { slugifyName } from './slugify';

type DiscoverPayload = { models?: unknown };

export function normalizeDiscoveredNames(raw: unknown, max: number): string[] {
  if (!raw || typeof raw !== 'object') return [];
  const models = (raw as DiscoverPayload).models;
  if (!Array.isArray(models)) return [];
  const names: string[] = [];
  const seen = new Set<string>();
  for (const m of models) {
    const name =
      typeof m === 'string'
        ? m.trim()
        : String((m as Record<string, unknown>)?.name ?? '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length >= max) break;
  }
  return names;
}

type LlmOk = Exclude<ResolvedCatalogLlm, { error: string }>;

async function callDiscoverLlm(
  llm: LlmOk,
  system: string,
  user: string
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const aiRes =
    llm.provider === 'anthropic'
      ? await anthropicMessagesJson<DiscoverPayload>({
          apiKey: llm.apiKey,
          model: llm.model,
          system,
          user,
          maxTokens: 4096,
        })
      : await openAiChatJson<DiscoverPayload>({
          apiKey: llm.apiKey,
          model: llm.model,
          system,
          user,
        });
  return aiRes;
}

/**
 * Proposes product names not already in the catalog (by slug), using DB context + optional multi-pass LLM calls.
 */
export async function discoverNewModelsAvoidingExisting(opts: {
  llm: LlmOk;
  categorySlug: string;
  categoryHint: string;
  maxCount: number;
  existingInCategory: CatalogDeviceRow[];
  globalSlugSet: ReadonlySet<string>;
  categoryListTruncated: boolean;
  maxPasses?: number;
}): Promise<
  | { ok: true; names: string[]; passesUsed: number }
  | { ok: false; error: string }
> {
  const maxPasses = opts.maxPasses ?? MAX_DISCOVERY_PASSES;
  const sys = buildDiscoverModelsSystemPrompt();
  const sessionSlugs = new Set(opts.globalSlugSet);
  const collected: string[] = [];
  let passesUsed = 0;

  for (let pass = 0; pass < maxPasses; pass++) {
    const need = opts.maxCount - collected.length;
    if (need <= 0) break;

    const askCap = Math.min(need + 12, MAX_DEVICES_PER_REQUEST + 12);
    const user = buildDiscoverModelsUserPrompt(opts.categorySlug, opts.categoryHint, need, {
      existingInCategory: opts.existingInCategory,
      alreadyQueuedNames: [...collected],
      categoryListTruncated: opts.categoryListTruncated,
    });

    passesUsed += 1;
    const aiRes = await callDiscoverLlm(opts.llm, sys, user);
    if (aiRes.ok === false) {
      if (collected.length > 0) {
        return { ok: true, names: collected, passesUsed };
      }
      return { ok: false, error: aiRes.error };
    }

    const rawNames = normalizeDiscoveredNames(aiRes.data, askCap);
    let addedThisPass = 0;
    for (const name of rawNames) {
      const sl = slugifyName(name);
      if (!sl || sessionSlugs.has(sl)) continue;
      sessionSlugs.add(sl);
      collected.push(name);
      addedThisPass += 1;
      if (collected.length >= opts.maxCount) break;
    }

    if (addedThisPass === 0) break;
  }

  if (collected.length === 0) {
    return {
      ok: false,
      error:
        'Discovery found no new products (everything suggested may already exist in the catalog by slug). Try a narrower/broader categoryHint, or add devices manually.',
    };
  }

  return { ok: true, names: collected.slice(0, opts.maxCount), passesUsed };
}
