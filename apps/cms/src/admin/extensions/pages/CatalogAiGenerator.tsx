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
import {
  DEVICE_CATEGORY_ENUM,
  MIN_CATEGORY_HINT_LENGTH,
  isValidDeviceCategorySlug,
} from '../../../catalog-ai/constants';

const PRESET_CUSTOM = '__custom__';

export default function CatalogAiGenerator() {
  const { toggleNotification } = useNotification();
  const [categorySelect, setCategorySelect] = useState<string>(DEVICE_CATEGORY_ENUM[0]);
  const [customSlug, setCustomSlug] = useState('');
  const [categoryHint, setCategoryHint] = useState('');
  const [discoverModels, setDiscoverModels] = useState(false);
  const [deviceLines, setDeviceLines] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [refreshTop5, setRefreshTop5] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveCategory =
    categorySelect === PRESET_CUSTOM
      ? customSlug.trim().toLowerCase()
      : categorySelect.trim().toLowerCase();

  const run = async () => {
    if (!isValidDeviceCategorySlug(effectiveCategory)) {
      toggleNotification({
        type: 'warning',
        title: 'Invalid category slug',
        message:
          'Use lowercase kebab-case (letters, digits, hyphens only), 2–96 characters — e.g. continuous-glucose-monitors.',
      });
      return;
    }

    if (discoverModels) {
      if (categoryHint.trim().length < MIN_CATEGORY_HINT_LENGTH) {
        toggleNotification({
          type: 'warning',
          title: 'Describe the category',
          message: `AI discovery needs a category hint of at least ${MIN_CATEGORY_HINT_LENGTH} characters (what products to include, audience, region).`,
        });
        return;
      }
    } else {
      const names = deviceLines.split('\n').map((l) => l.trim()).filter(Boolean);
      if (names.length === 0) {
        toggleNotification({
          type: 'warning',
          title: 'Add device names or enable discovery',
          message: 'Enter one device name per line, or turn on “Discover models with AI”.',
        });
        return;
      }
    }

    const names = deviceLines.split('\n').map((l) => l.trim()).filter(Boolean);
    const devices = discoverModels ? [] : names.map((name) => ({ name }));

    const body: Record<string, unknown> = {
      category: effectiveCategory,
      devices,
      discoverModels,
      refreshTop5,
      replaceExistingDevices: replaceExisting,
    };
    if (categoryHint.trim()) {
      body.categoryHint = categoryHint.trim();
    }
    if (dryRun) {
      body.dryRun = true;
    }

    setLoading(true);
    setOutput('');
    try {
      const { post } = getFetchClient();
      const res = await post('/api/catalog-ai/generate', body);
      setOutput(JSON.stringify(res.data, null, 2));
      const ok = res.data?.ok !== false;
      toggleNotification({
        type: ok ? 'success' : 'danger',
        title: ok
          ? dryRun
            ? discoverModels
              ? 'Discovery preview complete'
              : 'Dry run complete'
            : 'Catalog AI finished'
          : 'Catalog AI returned an error',
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        'Request failed';
      toggleNotification({
        type: 'danger',
        title: 'Catalog AI error',
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
              Device catalog AI
            </Typography>
            <Typography variant="omega" textColor="neutral600">
              Use a preset category slug or define a new kebab-case slug. Optionally let the AI propose up to 25
              product names from your description, then generate a draft review for each (max 25 per run). Manual dry
              runs skip all AI; discovery dry runs show the suggested list only.
            </Typography>
          </Flex>

          <Field.Root name="category">
            <Field.Label>Category slug</Field.Label>
            <Box paddingTop={1}>
              <select
                style={{ width: '100%', maxWidth: 480, padding: '8px 10px', borderRadius: 4 }}
                value={categorySelect}
                onChange={(e) => setCategorySelect(e.target.value)}
              >
                {DEVICE_CATEGORY_ENUM.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={PRESET_CUSTOM}>Custom slug…</option>
              </select>
            </Box>
            {categorySelect === PRESET_CUSTOM ? (
              <Box paddingTop={2}>
                <input
                  type="text"
                  placeholder="e.g. continuous-glucose-monitors"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  style={{ width: '100%', maxWidth: 480, padding: '8px 10px', borderRadius: 4 }}
                />
              </Box>
            ) : null}
            <Field.Hint>Lowercase kebab-case ID stored on each device and used for Top 5.</Field.Hint>
          </Field.Root>

          <Field.Root name="categoryHint">
            <Field.Label>Category hint (for AI)</Field.Label>
            <Textarea
              name="categoryHint"
              placeholder={
                discoverModels
                  ? `Required for discovery (≥${MIN_CATEGORY_HINT_LENGTH} chars). Example: US consumer continuous glucose monitors (CGM): prescription and direct-to-consumer kits, include major brands and representative models.`
                  : 'Optional. Helps reviews stay on-topic for new categories — audience, product type, region.'
              }
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCategoryHint(e.target.value)}
              value={categoryHint}
              style={{ minHeight: discoverModels ? 120 : 72 }}
            />
            <Field.Hint>
              {discoverModels
                ? `Required — at least ${MIN_CATEGORY_HINT_LENGTH} characters so the model knows which products to list.`
                : 'Optional for manual device lists; recommended for custom categories.'}
            </Field.Hint>
          </Field.Root>

          <Box tag="label" htmlFor="discover" style={{ cursor: 'pointer' }}>
            <Flex gap={2} alignItems="flex-start">
              <Checkbox
                id="discover"
                checked={discoverModels}
                onCheckedChange={(v) => setDiscoverModels(v === true)}
              />
              <Flex direction="column" gap={1}>
                <Typography variant="omega">Discover models with AI (up to 25)</Typography>
                <Typography variant="omega" textColor="neutral600">
                  One AI pass proposes product names for this category; then each gets its own review draft.
                  Ignores the manual device list below. Turn off dry run to create rows (many LLM calls).
                </Typography>
              </Flex>
            </Flex>
          </Box>

          <Field.Root name="devices">
            <Field.Label>Device names (one per line)</Field.Label>
            <Textarea
              name="devices"
              placeholder={'Example Oximeter A\nExample Oximeter B'}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDeviceLines(e.target.value)}
              value={deviceLines}
              disabled={discoverModels}
              style={{ opacity: discoverModels ? 0.55 : 1 }}
            />
            <Field.Hint>Disabled while discovery is on.</Field.Hint>
          </Field.Root>

          <Flex direction="column" gap={3}>
            <Box tag="label" htmlFor="dry-run" style={{ cursor: 'pointer' }}>
              <Flex gap={2} alignItems="flex-start">
                <Checkbox
                  id="dry-run"
                  checked={dryRun}
                  onCheckedChange={(v) => setDryRun(v === true)}
                />
                <Flex direction="column" gap={1}>
                  <Typography variant="omega">Dry run</Typography>
                  <Typography variant="omega" textColor="neutral600">
                    Manual list: validate only (no AI, no saves). With discovery: one AI call to preview suggested
                    models only — no per-device reviews or database writes.
                  </Typography>
                </Flex>
              </Flex>
            </Box>
            <Box tag="label" htmlFor="top5" style={{ cursor: 'pointer' }}>
              <Flex gap={2} alignItems="center">
                <Checkbox
                  id="top5"
                  checked={refreshTop5}
                  onCheckedChange={(v) => setRefreshTop5(v === true)}
                />
                <Typography variant="omega">
                  Refresh published Category Top 5 for this category (uses published devices only)
                </Typography>
              </Flex>
            </Box>
            <Box tag="label" htmlFor="replace" style={{ cursor: 'pointer' }}>
              <Flex gap={2} alignItems="center">
                <Checkbox
                  id="replace"
                  checked={replaceExisting}
                  onCheckedChange={(v) => setReplaceExisting(v === true)}
                />
                <Typography variant="omega">
                  Replace existing devices when the slug already exists (deletes the old document first)
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
              style={{ fontFamily: 'ui-monospace, monospace', minHeight: 240 }}
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
