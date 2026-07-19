import type { DateInfo, MediaItem, SettingsValues, Tag } from 'src/types';

import { createMeetingSections } from 'src/helpers/media-sections';
import { uuid } from 'src/shared/vanilla';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

// Generic, non-JW-content placeholder thumbnails (inline SVGs, not bundled
// files) so demo mode never ships or displays real website media.
const demoThumbnail = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="hsl(${hue},45%,55%)"/></svg>`,
  )}`;

interface DemoItemSeed {
  // Videos get a simulated runtime for the thumbnail-corner overlay; images
  // don't (real still images never carry a duration).
  duration?: number;
  // Literal, per-item hue — not computed/incremented — so the screenshot's
  // pixels are identical on every run (needed for the CI diff check that
  // skips opening a PR when nothing actually changed).
  hue: number;
  tag?: Tag;
  title: string;
}

const DEMO_SECTION_ITEMS: Partial<Record<string, DemoItemSeed[]>> = {
  ayfm: [{ duration: 143, hue: 320, title: 'Sample AYFM video' }],
  lac: [
    {
      duration: 214,
      hue: 40,
      tag: { type: 'song', value: 89 },
      title: 'Sample LAC song',
    },
    {
      hue: 80,
      tag: { type: 'paragraph', value: 3 },
      title: 'Sample LAC photo',
    },
  ],
  tgw: [
    {
      duration: 187,
      hue: 240,
      tag: { type: 'song', value: 7 },
      title: 'Sample TGW song',
    },
    { hue: 280, title: 'Sample TGW photo' },
  ],
};

// Demonstrates a collapsed media group (e.g. a multi-image jwpub extract) —
// cbs:false + a non-empty children array + extractCaption is what
// useMediaSection.ts reads to render a group starting collapsed.
const DEMO_GROUP_COVER_HUE = 120;
const DEMO_GROUP_CHILDREN = [
  { hue: 0, title: 'Sample TGW photo 1' },
  { hue: 160, title: 'Sample TGW photo 2' },
  { hue: 200, title: 'Sample TGW photo 3' },
];

const getWeekDay = (offset = 0): SettingsValues['mwDay'] => {
  const day = new Date().getDay();
  const isoDay = day === 0 ? 6 : day - 1; // Monday=0 .. Sunday=6
  return String((isoDay + offset) % 7) as SettingsValues['mwDay'];
};

const buildDemoDateInfo = (
  jwStore: ReturnType<typeof useJwStore>,
  congId: string,
): DateInfo => {
  const dateInfo: DateInfo = {
    date: new Date(),
    mediaSections: [],
    status: 'complete',
  };

  // createMeetingSections() calls getMeetingType(), which looks the date up
  // in jwStore.lookupPeriod[congId] to decide mw vs we — so the entry has to
  // be registered *before* computing sections, or the lookup finds nothing,
  // meetingType comes back null, and no sections (and thus no items) are
  // ever created.
  jwStore.lookupPeriod[congId] = [dateInfo];
  createMeetingSections(dateInfo);

  dateInfo.mediaSections.forEach((section) => {
    const items = DEMO_SECTION_ITEMS[section.config.uniqueId];
    if (!items) return;
    section.items = items.map(({ duration, hue, tag, title }): MediaItem => {
      // Images use fileUrl for display (that's the file itself); videos use
      // thumbnailUrl and get a duration for the runtime overlay.
      const isImage = duration === undefined;
      const thumbnail = demoThumbnail(hue);
      return {
        duration,
        fileUrl: isImage ? thumbnail : undefined,
        isImage,
        tag,
        thumbnailUrl: isImage ? undefined : thumbnail,
        title,
        type: 'media',
        uniqueId: uuid(),
      };
    });

    if (section.config.uniqueId === 'tgw') {
      section.items.push({
        cbs: false,
        children: DEMO_GROUP_CHILDREN.map(({ hue, title }): MediaItem => ({
          fileUrl: demoThumbnail(hue),
          isImage: true,
          title,
          type: 'media',
          uniqueId: uuid(),
        })),
        extractCaption: 'Sample TGW photo group',
        fileUrl: demoThumbnail(DEMO_GROUP_COVER_HUE),
        isImage: true,
        title: 'Sample TGW photo group',
        type: 'media',
        uniqueId: uuid(),
      });
    }
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
  // Show the play button on media items in the screenshot; off by default.
  settings.enableMediaDisplayButton = true;

  currentStateStore.currentCongregation = demoId;
  buildDemoDateInfo(jwStore, demoId);
};
