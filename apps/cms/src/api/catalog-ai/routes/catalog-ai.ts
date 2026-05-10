/**
 * POST /api/catalog-ai/generate — draft Device rows + optional Top 5 refresh (published devices only).
 * Headers: X-Catalog-Ai-Secret (must match env CATALOG_AI_SECRET).
 * Body JSON: { category, devices: [{ name, slug? }], dryRun?, refreshTop5?, replaceExistingDevices? }
 * LLM env: ANTHROPIC_API_KEY + optional ANTHROPIC_MODEL (Claude, preferred when key is set),
 *   or OPENAI_API_KEY + optional OPENAI_MODEL. Optional CATALOG_AI_LLM=anthropic|openai to force provider.
 * Other: CATALOG_AI_SECRET.
 */
export default {
  routes: [
    {
      method: 'POST',
      path: '/generate',
      handler: 'catalog-ai.generate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/health',
      handler: 'catalog-ai.health',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
