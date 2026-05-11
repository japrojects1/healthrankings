import { anthropicMessagesJson } from './anthropic-client';
import type { ResolvedCatalogLlm } from './llm-config';
import { openAiChatJson } from './openai-client';
import { buildDiscoverModelsSystemPrompt, buildDiscoverModelsUserPrompt } from './prompts';

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

export async function discoverProductNames(opts: {
  llm: Exclude<ResolvedCatalogLlm, { error: string }>;
  categorySlug: string;
  categoryHint: string;
  maxCount: number;
}): Promise<{ ok: true; names: string[] } | { ok: false; error: string }> {
  const sys = buildDiscoverModelsSystemPrompt();
  const user = buildDiscoverModelsUserPrompt(opts.categorySlug, opts.categoryHint, opts.maxCount);

  const aiRes =
    opts.llm.provider === 'anthropic'
      ? await anthropicMessagesJson<DiscoverPayload>({
          apiKey: opts.llm.apiKey,
          model: opts.llm.model,
          system: sys,
          user,
          maxTokens: 4096,
        })
      : await openAiChatJson<DiscoverPayload>({
          apiKey: opts.llm.apiKey,
          model: opts.llm.model,
          system: sys,
          user,
        });

  if (aiRes.ok === false) {
    return { ok: false, error: aiRes.error };
  }

  const names = normalizeDiscoveredNames(aiRes.data, opts.maxCount);
  if (names.length === 0) {
    return {
      ok: false,
      error:
        'Discovery returned no products. Try a clearer categoryHint, or enter device names manually.',
    };
  }

  return { ok: true, names };
}
