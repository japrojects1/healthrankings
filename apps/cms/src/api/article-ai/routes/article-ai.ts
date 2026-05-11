/**
 * POST /api/article-ai/generate — draft (or publish) Article from an editor brief.
 * Auth matches catalog-ai: admin Bearer JWT from the panel, or `X-Catalog-Ai-Secret` when `CATALOG_AI_SECRET` is set.
 * Body JSON: { brief: string, previewOnly?: boolean, publish?: boolean, tone?: string }
 * LLM keys: same as catalog-ai (ANTHROPIC_API_KEY / OPENAI_API_KEY, optional CATALOG_AI_LLM).
 */
export default {
  type: 'content-api',
  prefix: '/article-ai',
  routes: [
    {
      method: 'POST',
      path: '/generate',
      handler: 'article-ai.generate',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/health',
      handler: 'article-ai.health',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
  ],
};
