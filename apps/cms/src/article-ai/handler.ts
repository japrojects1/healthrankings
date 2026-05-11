import type { Core } from '@strapi/strapi';
import { slugifyName } from '../catalog-ai/slugify';
import { anthropicMessagesJson } from '../catalog-ai/anthropic-client';
import { resolveCatalogAiLlm } from '../catalog-ai/llm-config';
import { openAiChatJson } from '../catalog-ai/openai-client';
import { buildArticleWriterSystemPrompt, buildArticleWriterUserPrompt } from './prompts';

export type ArticleAiGenerateBody = {
  /** What the article should cover — audience, angle, must-haves, tone, length, etc. */
  brief?: string;
  /** When true: call the LLM and return the draft fields, but do not write to Strapi. */
  previewOnly?: boolean;
  /** When true (and not previewOnly): create as published. Otherwise create a draft. */
  publish?: boolean;
  /** Optional extra tone or guardrails appended to the user prompt. */
  tone?: string;
};

type AiArticlePayload = {
  title?: string;
  slug?: string;
  subtitle?: string;
  tag?: string;
  topic?: string;
  metaDescription?: string;
  readTime?: string;
  authorLine?: string;
  body?: string;
};

function clampMetaDescription(s: string, max = 160): string {
  const t = String(s || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

async function uniqueArticleSlug(strapi: Core.Strapi, baseRaw: string): Promise<string> {
  const base = slugifyName(baseRaw) || 'article';
  for (let i = 0; i < 80; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing = await strapi.db.query('api::article.article').findOne({
      where: { slug: candidate },
      select: ['id'],
    });
    if (!existing) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function runArticleAiGenerate(
  strapi: Core.Strapi,
  rawBody: ArticleAiGenerateBody | unknown
): Promise<Record<string, unknown>> {
  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as ArticleAiGenerateBody;
  const brief = String(body.brief || '').trim();
  if (brief.length < 20) {
    return {
      ok: false,
      error: 'Brief is too short. Add a few sentences: topic, audience, angle, and anything that must appear.',
    };
  }

  const previewOnly = Boolean(body.previewOnly);
  const publish = Boolean(body.publish) && !previewOnly;
  const tone = String(body.tone || '').trim();

  const llm = resolveCatalogAiLlm();
  if ('error' in llm) {
    return { ok: false, error: llm.error };
  }

  const sys = buildArticleWriterSystemPrompt();
  const user = buildArticleWriterUserPrompt(brief, tone);

  const aiRes =
    llm.provider === 'anthropic'
      ? await anthropicMessagesJson<AiArticlePayload>({
          apiKey: llm.apiKey,
          model: llm.model,
          system: sys,
          user,
          maxTokens: 8192,
        })
      : await openAiChatJson<AiArticlePayload>({
          apiKey: llm.apiKey,
          model: llm.model,
          system: sys,
          user,
        });

  if (aiRes.ok === false) {
    return { ok: false, error: aiRes.error };
  }

  const ai = aiRes.data || {};
  const title = String(ai.title || '').trim();
  const bodyMd = String(ai.body || '').trim();
  if (!title) {
    return { ok: false, error: 'The model returned no title. Try again or clarify the brief.' };
  }
  if (!bodyMd) {
    return { ok: false, error: 'The model returned no body. Try again or ask for a shorter target length.' };
  }

  const slugBase = String(ai.slug || '').trim() || slugifyName(title);
  const resolvedSlug = await uniqueArticleSlug(strapi, slugBase);

  const subtitle = String(ai.subtitle || '').trim() || undefined;
  const tag = String(ai.tag || '').trim() || undefined;
  const topic = String(ai.topic || '').trim() || undefined;
  const metaDescription = clampMetaDescription(String(ai.metaDescription || '').trim() || subtitle || title);
  const readTime = String(ai.readTime || '').trim() || undefined;
  const authorLine = String(ai.authorLine || '').trim() || undefined;
  const today = new Date().toISOString().slice(0, 10);

  const draftData = {
    title,
    slug: resolvedSlug,
    ...(subtitle ? { subtitle } : {}),
    ...(tag ? { tag } : {}),
    ...(topic ? { topic } : {}),
    metaDescription,
    ...(readTime ? { readTime } : {}),
    ...(authorLine ? { authorLine } : {}),
    body: bodyMd,
    ...(publish ? { publishedDate: today } : {}),
  };

  if (previewOnly) {
    return {
      ok: true,
      previewOnly: true,
      llmProvider: llm.provider,
      model: llm.model,
      slug: resolvedSlug,
      article: draftData,
    };
  }

  try {
    const doc = await strapi.documents('api::article.article').create({
      data: draftData as Record<string, unknown>,
      ...(publish ? { status: 'published' as const } : {}),
    });
    const documentId = String((doc as any).documentId || '');
    return {
      ok: true,
      previewOnly: false,
      publish,
      llmProvider: llm.provider,
      model: llm.model,
      documentId,
      slug: resolvedSlug,
      article: draftData,
    };
  } catch (e: any) {
    return {
      ok: false,
      error: e?.message || String(e),
      slug: resolvedSlug,
      article: draftData,
    };
  }
}
