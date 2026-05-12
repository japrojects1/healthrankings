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

type DiscoverPreviewRow = { name: string; slug: string };

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
  /** When true, catalog-ai creates Strapi devices as published (visible on the public site). When false, drafts until you publish in the CMS. */
  const [publishDevices, setPublishDevices] = useState(true);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  /** After “Discover devices”, user picks which names to create (no second discovery call). */
  const [pendingDiscover, setPendingDiscover] = useState<DiscoverPreviewRow[] | null>(null);
  const [selectedDiscoverSlugs, setSelectedDiscoverSlugs] = useState<Set<string>>(new Set());
  /** Category slug when the current pending list was fetched — blocks add if user changed category. */
  const [pendingDiscoverCategory, setPendingDiscoverCategory] = useState<string | null>(null);

  const effectiveCategory =
    categorySelect === PRESET_CUSTOM
      ? customSlug.trim().toLowerCase()
      : categorySelect.trim().toLowerCase();

  const validateCategory = (): boolean => {
    if (!isValidDeviceCategorySlug(effectiveCategory)) {
      toggleNotification({
        type: 'warning',
        title: 'Invalid category slug',
        message:
          'Use lowercase kebab-case (letters, digits, hyphens only), 2–96 characters — e.g. continuous-glucose-monitors.',
      });
      return false;
    }
    return true;
  };

  const discoverDevices = async () => {
    if (!validateCategory()) return;
    if (categoryHint.trim().length < MIN_CATEGORY_HINT_LENGTH) {
      toggleNotification({
        type: 'warning',
        title: 'Describe the category',
        message: `AI discovery needs a category hint of at least ${MIN_CATEGORY_HINT_LENGTH} characters (what products to include, audience, region).`,
      });
      return;
    }

    const body: Record<string, unknown> = {
      category: effectiveCategory,
      devices: [],
      discoverModels: true,
      dryRun: true,
      refreshTop5: false,
      replaceExistingDevices: false,
      publishDevices,
      categoryHint: categoryHint.trim(),
    };

    setLoading(true);
    setOutput('');
    try {
      const { post } = getFetchClient();
      const res = await post('/api/catalog-ai/generate', body);
        setOutput(JSON.stringify(res.data, null, 2));
        const ok = res.data?.ok !== false;
        if (!ok) {
          setPendingDiscover(null);
          setSelectedDiscoverSlugs(new Set());
          setPendingDiscoverCategory(null);
          toggleNotification({ type: 'danger', title: 'Discovery failed', message: String(res.data?.error || 'Error') });
          return;
        }
      const raw = res.data?.wouldProcess;
      const rows: DiscoverPreviewRow[] = Array.isArray(raw)
        ? raw
            .map((r: unknown) => {
              const o = r as { name?: string; slug?: string };
              const name = String(o?.name ?? '').trim();
              const slug = String(o?.slug ?? '').trim();
              return name ? { name, slug: slug || name } : null;
            })
            .filter(Boolean) as DiscoverPreviewRow[]
        : [];
      setPendingDiscover(rows);
      setSelectedDiscoverSlugs(new Set(rows.map((r) => r.slug)));
      setPendingDiscoverCategory(effectiveCategory);
      toggleNotification({
        type: 'success',
        title: 'Devices found',
        message:
          rows.length === 0
            ? 'No new names returned — try a broader category hint or check existing catalog.'
            : `Review ${rows.length} suggested name(s) below, uncheck any you do not want, then add to the category.`,
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        'Request failed';
      toggleNotification({ type: 'danger', title: 'Catalog AI error', message: String(msg) });
      try {
        setOutput(JSON.stringify(e?.response?.data ?? { error: String(msg) }, null, 2));
      } catch {
        setOutput(String(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  const addSelectedDiscoverToCategory = async () => {
    if (!validateCategory()) return;
    if (pendingDiscoverCategory && pendingDiscoverCategory !== effectiveCategory) {
      toggleNotification({
        type: 'warning',
        title: 'Category changed',
        message: 'You changed the category after discovering devices. Run “Discover devices” again for this category.',
      });
      return;
    }
    if (!pendingDiscover || pendingDiscover.length === 0) {
      toggleNotification({
        type: 'warning',
        title: 'Nothing to add',
        message: 'Run “Discover devices” first, then select names to create.',
      });
      return;
    }
    const picked = pendingDiscover.filter((r) => selectedDiscoverSlugs.has(r.slug));
    if (picked.length === 0) {
      toggleNotification({
        type: 'warning',
        title: 'Select at least one device',
        message: 'Use the checkboxes next to the names you want to add.',
      });
      return;
    }

    const body: Record<string, unknown> = {
      category: effectiveCategory,
      devices: picked.map(({ name }) => ({ name })),
      discoverModels: false,
      dryRun: false,
      refreshTop5,
      replaceExistingDevices: replaceExisting,
      publishDevices,
    };
    if (categoryHint.trim()) {
      body.categoryHint = categoryHint.trim();
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
        title: ok ? 'Devices added' : 'Catalog AI returned an error',
        message: ok
          ? 'Draft device rows were created (one LLM review per device). See response JSON for details.'
          : String(res.data?.error || 'Error'),
      });
      if (ok) {
        setPendingDiscover(null);
        setSelectedDiscoverSlugs(new Set());
        setPendingDiscoverCategory(null);
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        'Request failed';
      toggleNotification({ type: 'danger', title: 'Catalog AI error', message: String(msg) });
      try {
        setOutput(JSON.stringify(e?.response?.data ?? { error: String(msg) }, null, 2));
      } catch {
        setOutput(String(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleDiscoverSlug = (slug: string, on: boolean) => {
    setSelectedDiscoverSlugs((prev) => {
      const next = new Set(prev);
      if (on) next.add(slug);
      else next.delete(slug);
      return next;
    });
  };

  const selectAllDiscover = (on: boolean) => {
    if (!pendingDiscover) return;
    setSelectedDiscoverSlugs(on ? new Set(pendingDiscover.map((r) => r.slug)) : new Set());
  };

  const run = async () => {
    if (!validateCategory()) return;

    if (discoverModels) {
      return;
    }

    const names = deviceLines.split('\n').map((l) => l.trim()).filter(Boolean);
    if (names.length === 0) {
      toggleNotification({
        type: 'warning',
        title: 'Add device names',
        message: 'Enter one device name per line, or turn on “Discover models with AI” and use Discover devices.',
      });
      return;
    }

    const devices = names.map((name) => ({ name }));

    const body: Record<string, unknown> = {
      category: effectiveCategory,
      devices,
      discoverModels: false,
      refreshTop5,
      replaceExistingDevices: replaceExisting,
      publishDevices,
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
        title: ok ? (dryRun ? 'Dry run complete' : 'Catalog AI finished') : 'Catalog AI returned an error',
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
              Use a preset category slug or define a new kebab-case slug. With AI discovery: step 1 — choose category
              and hint, click <strong>Discover devices</strong> to load suggested product names (nothing saved yet).
              Step 2 — review the list, uncheck any you do not want, then click <strong>Add selected to category</strong>
              to create devices with AI reviews (one LLM call per device). Use <strong>Publish on save</strong> below so
              new rows are published immediately on the live site; otherwise they stay drafts until you publish in
              Content Manager. The manual list is for typing names yourself without discovery.
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
                ? `Required for discovery — at least ${MIN_CATEGORY_HINT_LENGTH} characters. Also used when generating reviews for devices you add.`
                : 'Optional for manual lists; recommended for custom categories.'}
            </Field.Hint>
          </Field.Root>

          <Box tag="label" htmlFor="discover" style={{ cursor: 'pointer' }}>
            <Flex gap={2} alignItems="flex-start">
              <Checkbox
                id="discover"
                checked={discoverModels}
                onCheckedChange={(v) => {
                  const on = v === true;
                  setDiscoverModels(on);
                  if (!on) {
                    setPendingDiscover(null);
                    setSelectedDiscoverSlugs(new Set());
                    setPendingDiscoverCategory(null);
                  }
                }}
              />
              <Flex direction="column" gap={1}>
                <Typography variant="omega">Discover models with AI (up to 25)</Typography>
                <Typography variant="omega" textColor="neutral600">
                  The server loads devices already in this category (and all catalog slugs), asks the model for new
                  product names, filters duplicates, and may retry a few times. Use <strong>Discover devices</strong> to
                  preview names, then <strong>Add selected to category</strong> only for the ones you want — no second
                  discovery pass when you add.
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
            <Box tag="label" htmlFor="dry-run" style={{ cursor: discoverModels ? 'not-allowed' : 'pointer' }}>
              <Flex gap={2} alignItems="flex-start">
                <Checkbox
                  id="dry-run"
                  checked={dryRun}
                  disabled={discoverModels}
                  onCheckedChange={(v) => setDryRun(v === true)}
                />
                <Flex direction="column" gap={1}>
                  <Typography variant="omega" textColor={discoverModels ? 'neutral500' : undefined}>
                    Dry run
                  </Typography>
                  <Typography variant="omega" textColor="neutral600">
                    {discoverModels
                      ? 'Not used while “Discover models” is on — use Discover devices, then Add selected.'
                      : 'When checked: validate the manual list only (no AI, no saves). When unchecked: create draft devices with AI reviews.'}
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
            <Box tag="label" htmlFor="publish-devices" style={{ cursor: 'pointer' }}>
              <Flex gap={2} alignItems="flex-start">
                <Checkbox
                  id="publish-devices"
                  checked={publishDevices}
                  onCheckedChange={(v) => setPublishDevices(v === true)}
                />
                <Flex direction="column" gap={1}>
                  <Typography variant="omega">Publish on save (live on public site)</Typography>
                  <Typography variant="omega" textColor="neutral600">
                    When on, new devices are created as <strong>Published</strong> so <code>/devices/your-slug</code> works
                    right away. When off, they are <strong>Draft</strong> until you use Publish in the Strapi entry
                    editor.
                  </Typography>
                </Flex>
              </Flex>
            </Box>
          </Flex>

          {discoverModels ? (
            <Flex direction="column" gap={4}>
              <Flex gap={2} flexWrap="wrap" alignItems="center">
                <Button variant="default" onClick={discoverDevices} loading={loading} disabled={loading}>
                  Discover devices
                </Button>
                {pendingDiscover && pendingDiscover.length > 0 ? (
                  <Button
                    variant="secondary"
                    onClick={addSelectedDiscoverToCategory}
                    loading={loading}
                    disabled={loading || selectedDiscoverSlugs.size === 0}
                  >
                    {`Add selected to category (${selectedDiscoverSlugs.size})`}
                  </Button>
                ) : null}
              </Flex>
              {pendingDiscover && pendingDiscover.length > 0 ? (
                <Field.Root name="discover-pick">
                  <Field.Label>Suggested devices (uncheck to skip)</Field.Label>
                  <Box paddingTop={2} paddingBottom={2}>
                    <Box tag="label" htmlFor="discover-select-all" style={{ cursor: 'pointer' }}>
                      <Flex gap={2} alignItems="center" paddingBottom={2}>
                        <Checkbox
                          id="discover-select-all"
                          checked={
                            selectedDiscoverSlugs.size === pendingDiscover.length && pendingDiscover.length > 0
                          }
                          onCheckedChange={(v) => selectAllDiscover(v === true)}
                        />
                        <Typography variant="omega">Select all</Typography>
                      </Flex>
                    </Box>
                    <Flex direction="column" gap={2}>
                      {pendingDiscover.map((row) => (
                        <Box key={row.slug} tag="label" htmlFor={`discover-${row.slug}`} style={{ cursor: 'pointer' }}>
                          <Flex gap={2} alignItems="flex-start">
                            <Checkbox
                              id={`discover-${row.slug}`}
                              checked={selectedDiscoverSlugs.has(row.slug)}
                              onCheckedChange={(v) => toggleDiscoverSlug(row.slug, v === true)}
                            />
                            <Flex direction="column" gap={0}>
                              <Typography variant="omega" fontWeight="semiBold">
                                {row.name}
                              </Typography>
                              <Typography variant="omega" textColor="neutral600">
                                {`slug: ${row.slug}`}
                              </Typography>
                            </Flex>
                          </Flex>
                        </Box>
                      ))}
                    </Flex>
                  </Box>
                  <Field.Hint>
                    These names came from the last discovery run for this category. Add selected runs AI reviews and
                    saves drafts in Strapi.
                  </Field.Hint>
                </Field.Root>
              ) : null}
            </Flex>
          ) : (
            <Flex gap={2}>
              <Button variant="default" onClick={run} loading={loading} disabled={loading}>
                Run
              </Button>
            </Flex>
          )}

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
