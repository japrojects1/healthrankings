import type { Core } from '@strapi/strapi';
import jwt from 'jsonwebtoken';

/**
 * Catalog-ai and article-ai routes use `config.auth: false` so the admin panel can call them with the admin JWT.
 * Authorization is enforced here: either a valid admin Bearer token or X-Catalog-Ai-Secret.
 */
export function isCatalogSecretOk(ctx: { request?: { headers?: Record<string, unknown> } }): boolean {
  const secret = process.env.CATALOG_AI_SECRET?.trim();
  const hdr = String(ctx.request?.headers?.['x-catalog-ai-secret'] ?? '').trim();
  return Boolean(secret && hdr === secret);
}

export function isAdminBearerOk(strapi: Core.Strapi, ctx: { request?: { headers?: Record<string, unknown> } }): boolean {
  const auth = String(ctx.request?.headers?.authorization ?? '');
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7).trim();
  if (!token) return false;
  const secret = strapi.config.get('admin.auth.secret') as string | undefined;
  if (!secret) return false;
  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function assertCatalogAiAccess(strapi: Core.Strapi, ctx: any): boolean {
  if (isCatalogSecretOk(ctx) || isAdminBearerOk(strapi, ctx)) return true;
  ctx.status = 401;
  ctx.body = {
    ok: false,
    error:
      'Missing or invalid credentials. Sign in to the admin panel, or send X-Catalog-Ai-Secret (same secret works for Device catalog AI and Article AI).',
  };
  return false;
}
