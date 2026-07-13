import type { DateInfo, MediaItem, SettingsValues } from 'src/types';

import { createMeetingSections } from 'src/helpers/media-sections';
import { uuid } from 'src/shared/vanilla';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

// Generic, non-JW-content placeholder thumbnails (inline SVGs, not bundled
// files) so demo mode never ships or displays real jw.org media.
const demoThumbnail = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="hsl(${hue},45%,55%)"/></svg>`,
  )}`;

const DEMO_SECTION_ITEM_TITLES: Partial<Record<string, string[]>> = {
  ayfm: ['Sample field ministry video'],
  lac: [
    'Sample congregation Bible study segment',
    'Sample living as Christians video',
  ],
  tgw: ['Sample video illustration', 'Sample discussion point'],
};

const getWeekDay = (offset = 0): SettingsValues['mwDay'] => {
  const day = new Date().getDay();
  const isoDay = day === 0 ? 6 : day - 1; // Monday=0 .. Sunday=6
  return String((isoDay + offset) % 7) as SettingsValues['mwDay'];
};

const buildDemoDateInfo = (): DateInfo => {
  const dateInfo: DateInfo = {
    date: new Date(),
    mediaSections: [],
    status: 'complete',
  };

  createMeetingSections(dateInfo);

  let hue = 200;
  dateInfo.mediaSections.forEach((section) => {
    const titles = DEMO_SECTION_ITEM_TITLES[section.config.uniqueId];
    if (!titles) return;
    section.items = titles.map((title): MediaItem => {
      hue = (hue + 40) % 360;
      return {
        isImage: true,
        thumbnailUrl: demoThumbnail(hue),
        title,
        type: 'media',
        uniqueId: uuid(),
      };
    });
  });

  return dateInfo;
};

/**
 * Seeds a fake congregation with placeholder (non-JW-content) meeting media,
 * so the app can be launched and screenshotted without a real congregation
 * or any network access. Only runs when `M3_DEMO_MODE` is set (see
 * `src/boot/demo-mode.ts`). Resets any previously seeded demo state first,
 * so repeated launches (e.g. during local testing) stay idempotent.
 */
export const seedDemoData = () => {
  const congregationSettingsStore = useCongregationSettingsStore();
  const currentStateStore = useCurrentStateStore();
  const jwStore = useJwStore();

  congregationSettingsStore.congregations = {};
  jwStore.lookupPeriod = {};

  const demoId = congregationSettingsStore.createCongregation();
  const settings = congregationSettingsStore.congregations[demoId];
  if (!settings) return;

  settings.congregationName = 'Sample Congregation';
  settings.congregationNameModified = true;
  // mwDay is today, so the demo date is treated as a real meeting day; weDay
  // just needs a value to satisfy required-settings validation.
  settings.mwDay = getWeekDay();
  settings.mwStartTime = '19:00' as SettingsValues['mwStartTime'];
  settings.weDay = getWeekDay(3);
  settings.weStartTime = '10:00' as SettingsValues['weStartTime'];

  currentStateStore.currentCongregation = demoId;
  jwStore.lookupPeriod[demoId] = [buildDemoDateInfo()];
};
