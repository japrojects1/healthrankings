import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Main,
  Typography,
  Textarea,
} from '@strapi/design-system';
import { getFetchClient, useNotification } from '@strapi/strapi/admin';

/** The shape the /article-ai/generate endpoint returns inside `article`. */
type PreviewedArticle = {
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

export default function ArticleAiWriter() {
  const { toggleNotification } = useNotification();
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState('');
  const [previewOnly, setPreviewOnly] = useState(true);
  // Default to publishing immediately when the editor turns preview off — saving
  // a draft is the rarer path and was the most common cause of "I generated an
  // article but it doesn't show on the site".
  const [publish, setPublish] = useState(true);
  const [generateHeroImage, setGenerateHeroImage] = useState(false);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishingPreview, setPublishingPreview] = useState(false);
  /** Held draft from the most recent successful preview, ready to publish in one click. */
  const [previewedArticle, setPreviewedArticle] = useState<PreviewedArticle | null>(null);
  const [previewedSlug, setPreviewedSlug] = useState<string | null>(null);

  const previewSummary = useMemo(() => {
    if (!previewedArticle) return null;
    const title = (previewedArticle.title || '').trim();
    return title ? title : `(slug: ${previewedSlug || 'unknown'})`;
  }, [previewedArticle, previewedSlug]);

  const run = async () => {
    if (brief.trim().length < 20) {
      toggleNotification({
        type: 'warning',
        title: 'Add more context',
        message: 'Write at least a short paragraph: topic, audience, angle, and must-haves.',
      });
      return;
    }

    const body: Record<string, unknown> = {
      brief: brief.trim(),
      previewOnly,
      publish: previewOnly ? false : publish,
      generateHeroImage: previewOnly ? false : generateHeroImage,
    };
    if (tone.trim()) {
      body.tone = tone.trim();
    }

    setLoading(true);
    setOutput('');
    setPreviewedArticle(null);
    setPreviewedSlug(null);
    try {
      const { post } = getFetchClient();
      const res = await post('/api/article-ai/generate', body);
      setOutput(JSON.stringify(res.data, null, 2));
      const data = res.data || {};
      const ok = data.ok !== false;
      if (ok && data.previewOnly === true && data.article && typeof data.article === 'object') {
        setPreviewedArticle(data.article as PreviewedArticle);
        setPreviewedSlug(typeof data.slug === 'string' ? data.slug : null);
      }
      const saved = data.previewOnly === false && ok;
      const withHero = saved && typeof data.heroImageFileId === 'number';
      toggleNotification({
        type: !ok ? 'danger' : 'success',
        title: !ok
          ? 'Article AI returned an error'
          : previewOnly
            ? 'Preview ready — click Publish this draft to save it'
            : saved
              ? publish
                ? withHero
                  ? 'Article published with hero image'
                  : 'Article published'
                : withHero
                  ? 'Draft created with hero image'
                  : 'Draft article created'
              : 'Done',
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        'Request failed';
      toggleNotification({
        type: 'danger',
        title: 'Article AI error',
        message: String(msg),
      });
      try {
        setOutput(JSON.stringify(e?.response?.data ?? { error: String(msg) }, null, 2));
      } catch {
        setOutput(String(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  const publishPreview = async () => {
    if (!previewedArticle) return;
    const body: Record<string, unknown> = {
      ...previewedArticle,
      generateHeroImage,
      heroVisualHint: brief.trim() || previewedArticle.subtitle || previewedArticle.title,
    };
    setPublishingPreview(true);
    try {
      const { post } = getFetchClient();
      const res = await post('/api/article-ai/publish', body);
      setOutput(JSON.stringify(res.data, null, 2));
      const data = res.data || {};
      const ok = data.ok !== false;
      const withHero = ok && typeof data.heroImageFileId === 'number';
      toggleNotification({
        type: ok ? 'success' : 'danger',
        title: ok
          ? withHero
            ? 'Article published with hero image'
            : 'Article published — visit /articles to see it'
          : 'Publish failed',
      });
      if (ok) {
        setPreviewedArticle(null);
        setPreviewedSlug(null);
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        'Request failed';
      toggleNotification({
        type: 'danger',
        title: 'Publish failed',
        message: String(msg),
      });
      try {
        setOutput(JSON.stringify(e?.response?.data ?? { error: String(msg) }, null, 2));
      } catch {
        setOutput(String(msg));
      }
    } finally {
      setPublishingPreview(false);
    }
  };

  return (
    <Main>
      <Box padding={8} maxWidth={960}>
        <Flex direction="column" gap={6}>
          <Flex direction="column" gap={2}>
            <Typography variant="alpha" tag="h1">
              Article AI writer
            </Typography>
            <Typography variant="omega" textColor="neutral600">
              Describe what the piece should cover; the model drafts title, SEO fields, and a full HTML body
              (same rendering as imported articles). Preview first to review the draft, then click
              &ldquo;Publish this draft&rdquo; to push it live to <code>/articles</code> without
              regenerating. Or turn off preview to publish in one step.
            </Typography>
          </Flex>

          <Field.Root name="brief">
            <Field.Label>Article brief</Field.Label>
            <Textarea
              name="brief"
              placeholder={`Example:\n\nAudience: adults 50+ managing mild hypertension at home.\nAngle: practical guide to home blood pressure monitoring — when to measure, how to sit, what numbers mean, when to call a doctor.\nMust mention: validated cuffs, morning vs evening readings, white-coat effect.\nTone: reassuring, not alarmist. No invented statistics.`}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBrief(e.target.value)}
              value={brief}
              style={{ minHeight: 200 }}
            />
            <Field.Hint>Minimum ~20 characters; more detail yields better drafts.</Field.Hint>
          </Field.Root>

          <Field.Root name="tone">
            <Field.Label>Optional tone / guardrails</Field.Label>
            <Textarea
              name="tone"
              placeholder="e.g. US English, second person sparingly, avoid product endorsements"
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTone(e.target.value)}
              value={tone}
            />
          </Field.Root>

          <Flex direction="column" gap={3}>
            <Box tag="label" htmlFor="preview-only" style={{ cursor: 'pointer' }}>
              <Flex gap={2} alignItems="center">
                <Checkbox
                  id="preview-only"
                  checked={previewOnly}
                  onCheckedChange={(v) => {
                    const on = v === true;
                    setPreviewOnly(on);
                    if (on) {
                      setGenerateHeroImage(false);
                    } else {
                      setPublish(true);
                    }
                  }}
                />
                <Typography variant="omega">
                  Preview only (call the model, show JSON — do not save to Strapi)
                </Typography>
              </Flex>
            </Box>
            <Box tag="label" htmlFor="publish-now" style={{ cursor: 'pointer' }}>
              <Flex gap={2} alignItems="center">
                <Checkbox
                  id="publish-now"
                  checked={publish}
                  disabled={previewOnly}
                  onCheckedChange={(v) => setPublish(v === true)}
                />
                <Typography variant="omega" textColor={previewOnly ? 'neutral500' : undefined}>
                  Publish immediately (otherwise saves as draft)
                </Typography>
              </Flex>
            </Box>
            <Box tag="label" htmlFor="hero-image" style={{ cursor: 'pointer' }}>
              <Flex gap={2} alignItems="center">
                <Checkbox
                  id="hero-image"
                  checked={generateHeroImage}
                  onCheckedChange={(v) => setGenerateHeroImage(v === true)}
                />
                <Typography variant="omega">
                  Generate hero image (OpenAI DALL·E; requires OPENAI_API_KEY on the server)
                </Typography>
              </Flex>
            </Box>
          </Flex>

          <Flex gap={2} wrap="wrap">
            <Button variant="default" onClick={run} loading={loading} disabled={loading || publishingPreview}>
              Run
            </Button>
            <Button
              variant="success-light"
              onClick={publishPreview}
              loading={publishingPreview}
              disabled={!previewedArticle || loading || publishingPreview}
            >
              Publish this draft
            </Button>
          </Flex>

          {previewedArticle ? (
            <Box
              padding={4}
              background="success100"
              hasRadius
              style={{ border: '1px solid #a7f3d0' }}
            >
              <Flex direction="column" gap={1}>
                <Typography variant="pi" fontWeight="bold" textColor="success700">
                  Preview ready to publish
                </Typography>
                <Typography variant="omega" textColor="neutral800">
                  {previewSummary}
                </Typography>
                <Typography variant="pi" textColor="neutral600">
                  Slug:&nbsp;<code>{previewedSlug || '—'}</code> · Click{' '}
                  <strong>Publish this draft</strong> to save it to Strapi as published. The
                  article appears at <code>/articles</code> within seconds.
                </Typography>
              </Flex>
            </Box>
          ) : null}

          <Field.Root name="out">
            <Field.Label>Response JSON</Field.Label>
            <Textarea
              style={{ fontFamily: 'ui-monospace, monospace', minHeight: 280 }}
              readOnly
              value={output}
              placeholder="Run to see the API response…"
            />
          </Field.Root>
        </Flex>
      </Box>
    </Main>
  );
}
