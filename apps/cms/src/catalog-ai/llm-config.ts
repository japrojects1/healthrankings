export type ResolvedCatalogLlm =
  | { provider: 'anthropic'; apiKey: string; model: string }
  | { provider: 'openai'; apiKey: string; model: string }
  | { error: string };

/**
 * Chooses which LLM backs catalog-ai:
 * - `CATALOG_AI_LLM=anthropic` → requires ANTHROPIC_API_KEY
 * - `CATALOG_AI_LLM=openai` → requires OPENAI_API_KEY
 * - unset → ANTHROPIC_API_KEY if present, else OPENAI_API_KEY (backward compatible)
 */
export function resolveCatalogAiLlm(): ResolvedCatalogLlm {
  const prefer = String(process.env.CATALOG_AI_LLM || '').trim().toLowerCase();
  const anthropicKey = String(process.env.ANTHROPIC_API_KEY || '').trim();
  const openaiKey = String(process.env.OPENAI_API_KEY || '').trim();

  const anthropicModel =
    String(process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514').trim() ||
    'claude-sonnet-4-20250514';
  const openaiModel =
    String(process.env.OPENAI_MODEL || 'gpt-4o-mini').trim() || 'gpt-4o-mini';

  if (prefer === 'anthropic') {
    if (!anthropicKey) {
      return { error: 'CATALOG_AI_LLM=anthropic but ANTHROPIC_API_KEY is not set on the CMS server.' };
    }
    return { provider: 'anthropic', apiKey: anthropicKey, model: anthropicModel };
  }
  if (prefer === 'openai') {
    if (!openaiKey) {
      return { error: 'CATALOG_AI_LLM=openai but OPENAI_API_KEY is not set on the CMS server.' };
    }
    return { provider: 'openai', apiKey: openaiKey, model: openaiModel };
  }

  if (anthropicKey) {
    return { provider: 'anthropic', apiKey: anthropicKey, model: anthropicModel };
  }
  if (openaiKey) {
    return { provider: 'openai', apiKey: openaiKey, model: openaiModel };
  }

  return {
    error:
      'No LLM API key on the CMS server. Set ANTHROPIC_API_KEY (Claude) or OPENAI_API_KEY. Optional: CATALOG_AI_LLM=anthropic|openai to force one provider.',
  };
}
