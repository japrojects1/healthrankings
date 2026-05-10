import type { Core } from '@strapi/strapi';
import { resolveCatalogAiLlm } from '../../../catalog-ai/llm-config';
import { runCatalogAiGenerate } from '../../../catalog-ai/handler';

function requireCatalogSecret(ctx: any): boolean {
  const secret = process.env.CATALOG_AI_SECRET?.trim();
  const hdr = String(ctx.request.headers['x-catalog-ai-secret'] ?? '').trim();
  if (!secret || hdr !== secret) {
    ctx.status = 401;
    ctx.body = { ok: false, error: 'Missing or invalid X-Catalog-Ai-Secret header.' };
    return false;
  }
  return true;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async generate(ctx: any) {
    if (!requireCatalogSecret(ctx)) return;
    const body = ctx.request.body;
    const result = await runCatalogAiGenerate(strapi, body);
    const ok = result.ok !== false;
    ctx.status = ok ? 200 : 400;
    ctx.body = result;
  },

  async health(ctx: any) {
    if (!requireCatalogSecret(ctx)) return;
    const llm = resolveCatalogAiLlm();
    ctx.body = {
      ok: true,
      configured: !('error' in llm),
      llm: 'error' in llm ? null : { provider: llm.provider, model: llm.model },
      configureHint: 'error' in llm ? llm.error : undefined,
      hasAnthropicKey: Boolean(String(process.env.ANTHROPIC_API_KEY || '').trim()),
      hasOpenAiKey: Boolean(String(process.env.OPENAI_API_KEY || '').trim()),
    };
  },
});
