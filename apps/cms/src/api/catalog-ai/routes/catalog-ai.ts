/**
 * POST /api/catalog-ai/generate — draft Device rows + optional Top 5 refresh (published devices only).
 * Headers (either): `Authorization: Bearer <admin JWT>` while logged into the admin panel,
 *   or `X-Catalog-Ai-Secret` matching env `CATALOG_AI_SECRET` (for scripts).
 * Body JSON: { category, devices: [{ name, slug? }], dryRun?, refreshTop5?, replaceExistingDevices? }
 * LLM env: ANTHROPIC_API_KEY + optional ANTHROPIC_MODEL (Claude, preferred when key is set),
 *   or OPENAI_API_KEY + optional OPENAI_MODEL. Optional CATALOG_AI_LLM=anthropic|openai to force provider.
 * Other: optional `CATALOG_AI_SECRET` for non-admin scripts (curl); admin UI uses your session JWT.
 */
export default {
  type: 'content-api',
  /** Without this, Strapi mounts routes at `/api/generate` and `/api/health` instead of `/api/catalog-ai/...`. */
  prefix: '/catalog-ai',
  routes: [
    {
      method: 'POST',
      path: '/generate',
      handler: 'catalog-ai.generate',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/health',
      handler: 'catalog-ai.health',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
  ],
};
