/** Mirrors `apps/cms/src/api/device/content-types/device/schema.json` enum (keep in sync). */
export const DEVICE_CATEGORY_ENUM = [
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

export type DeviceCategoryEnum = (typeof DEVICE_CATEGORY_ENUM)[number];

export const CATEGORY_TOP5_TITLE: Record<string, string> = {
  'blood-pressure-monitors': 'Top 5 Blood Pressure Monitors',
  'body-composition-scales': 'Top 5 Smart Scales & Body Composition Monitors',
  'pulse-oximeters': 'Top 5 Pulse Oximeters',
  'breathing-trainers': 'Top 5 Breathing Trainers',
  'tens-units': 'Top 5 TENS Units',
  thermometers: 'Top 5 Thermometers',
  'water-flossers': 'Top 5 Water Flossers',
  'home-test-kits': 'Top 5 Home Test Kits',
  'gps-alert-systems': 'Top 5 GPS Alert Systems',
  'massage-devices': 'Top 5 Massage Devices',
  supplements: 'Top 5 Supplement Picks',
  'fertility-reproductive': 'Top 5 Fertility & Reproductive Health Devices',
  other: 'Top 5 Devices (Other)',
};

export const MAX_DEVICES_PER_REQUEST = 25;
