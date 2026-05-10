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

/** Keep in sync with `apps/cms/src/api/device/content-types/device/schema.json` category enum. */
const DEVICE_CATEGORIES = [
  'blood-pressure-monitors',
  'body-composition-scales',
  'pulse-oximeters',
  'breathing-trainers',
  'tens-units',
  'thermometers',
  'water-flossers',
  'home-test-kits',
  'gps-alert-systems',
  'massage-devices',
  'supplements',
  'fertility-reproductive',
  'other',
] as const;

export default function CatalogAiGenerator() {
  const { toggleNotification } = useNotification();
  const [category, setCategory] = useState<string>(DEVICE_CATEGORIES[0]);
  const [deviceLines, setDeviceLines] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [refreshTop5, setRefreshTop5] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const names = deviceLines.split('\n').map((l) => l.trim()).filter(Boolean);
    if (names.length === 0) {
      toggleNotification({
        type: 'warning',
        title: 'Add device names',
        message: 'Enter one device name per line.',
      });
      return;
    }

    const devices = names.map((name) => ({ name }));
    const body: Record<string, unknown> = {
      category,
      devices,
      refreshTop5,
      replaceExistingDevices: replaceExisting,
    };
    if (dryRun) {
      body.dryRun = true;
    }

    setLoading(true);
    setOutput('');
    try {
      const { post } = getFetchClient();
      const res = await post('/api/catalog-ai/generate', body);
      setOutput(JSON.stringify(res.data, null, 2));
      toggleNotification({
        type: 'success',
        title: dryRun ? 'Dry run complete' : 'Catalog AI finished',
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
              Creates draft Device entries from names using your server-side LLM (e.g. Claude). A truly new
              category slug still requires updating the Device and Category Top 5 enums in code, then redeploying
              the CMS.
            </Typography>
          </Flex>

          <Field.Root name="category">
            <Field.Label>Category</Field.Label>
            <Box paddingTop={1}>
              <select
                style={{ width: '100%', maxWidth: 480, padding: '8px 10px', borderRadius: 4 }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {DEVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Box>
            <Field.Hint>Must match an existing Device category enum value.</Field.Hint>
          </Field.Root>

          <Field.Root name="devices">
            <Field.Label>Device names (one per line)</Field.Label>
            <Textarea
              name="devices"
              placeholder={'Example Oximeter A\nExample Oximeter B'}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDeviceLines(e.target.value)}
              value={deviceLines}
            />
          </Field.Root>

          <Flex direction="column" gap={3}>
            <Box tag="label" htmlFor="dry-run" style={{ cursor: 'pointer' }}>
              <Flex gap={2} alignItems="center">
                <Checkbox
                  id="dry-run"
                  checked={dryRun}
                  onCheckedChange={(v) => setDryRun(v === true)}
                />
                <Typography variant="omega">
                  Dry run (validate only — no AI call, no database writes)
                </Typography>
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
