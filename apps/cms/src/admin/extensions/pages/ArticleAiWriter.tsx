import { useState } from 'react';
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

export default function ArticleAiWriter() {
  const { toggleNotification } = useNotification();
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState('');
  const [previewOnly, setPreviewOnly] = useState(true);
  const [publish, setPublish] = useState(false);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

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
    };
    if (tone.trim()) {
      body.tone = tone.trim();
    }

    setLoading(true);
    setOutput('');
    try {
      const { post } = getFetchClient();
      const res = await post('/api/article-ai/generate', body);
      setOutput(JSON.stringify(res.data, null, 2));
      const saved = res.data?.previewOnly === false && res.data?.ok === true;
      toggleNotification({
        type: res.data?.ok === false ? 'danger' : 'success',
        title:
          res.data?.ok === false
            ? 'Article AI returned an error'
            : previewOnly
              ? 'Preview ready'
              : saved
                ? publish
                  ? 'Article published'
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

  return (
    <Main>
      <Box padding={8} maxWidth={960}>
        <Flex direction="column" gap={6}>
          <Flex direction="column" gap={2}>
            <Typography variant="alpha" tag="h1">
              Article AI writer
            </Typography>
            <Typography variant="omega" textColor="neutral600">
              Describe what the piece should cover; the model drafts title, SEO fields, and a full Markdown body.
              Preview first, then turn off preview to save a Strapi draft (or publish in one step).
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
                    if (on) setPublish(false);
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
          </Flex>

          <Flex gap={2}>
            <Button variant="default" onClick={run} loading={loading} disabled={loading}>
              Run
            </Button>
          </Flex>

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
