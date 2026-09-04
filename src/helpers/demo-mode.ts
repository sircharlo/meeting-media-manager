import type {
  DateInfo,
  MediaItem,
  SettingsValues,
  SongItem,
  Tag,
} from 'src/types';

import { removeCongregationCache } from 'src/helpers/cleanup';
import { getTodaysMeetingStartDateTime } from 'src/helpers/date';
import { createMeetingSections } from 'src/helpers/media-sections';
import { uuid } from 'src/shared/vanilla';
import { getVisibleMeetingItems } from 'src/utils/media';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import {
  type MediaPlayingState,
  useCurrentStateStore,
} from 'stores/current-state';
import { useDemoModeStore } from 'stores/demo-mode';
import { useJwStore } from 'stores/jw';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { useMusicStore } from 'stores/music';

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
 * `src/boot/demo-mode.ts`) or when a developer enables demo mode from the
 * dev-only Demo menu. Resets any previously seeded demo state first, so
 * repeated launches (e.g. during local testing) stay idempotent.
 */
// Id of the congregation created by the most recent seedDemoData() call, so
// disabling demo mode at runtime can offer to remove exactly that profile
// and its cached media (a dev may have other congregations around it).
let seededCongregationId = '';

/** The congregation id created by the most recent seedDemoData() call. */
export const getSeededDemoCongregationId = () => seededCongregationId;

export const seedDemoData = () => {
  const congregationSettingsStore = useCongregationSettingsStore();
  const currentStateStore = useCurrentStateStore();
  const jwStore = useJwStore();

  congregationSettingsStore.congregations = {};
  jwStore.lookupPeriod = {};

  const demoId = congregationSettingsStore.createCongregation();
  seededCongregationId = demoId;
  // Demo mode exists for automated screenshots and dev testing — never
  // overlay the post-setup quick-start tour on the demo congregation.
  congregationSettingsStore.markQuickStartTourSeen(demoId);
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

let demoAudioUrl: string | undefined;

const getDemoAudioUrl = () => {
  if (demoAudioUrl) return demoAudioUrl;

  const sampleRate = 4000;
  const sampleCount = sampleRate * 35;
  const bytes = new Uint8Array(44 + sampleCount);
  const view = new DataView(bytes.buffer);
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index++) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + sampleCount, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeText(36, 'data');
  view.setUint32(40, sampleCount, true);
  bytes.fill(128, 44);

  let binary = '';
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  demoAudioUrl = `data:audio/wav;base64,${globalThis.btoa(binary)}`;
  return demoAudioUrl;
};

export const getDemoSongLibrary = (): SongItem[] => [
  {
    duration: 35,
    path: 'demo-background-music.wav',
    remoteUrl: getDemoAudioUrl(),
    title: 'Demo background music',
  },
];

// ─── Demo meeting-stage transitions ─────────────────────────────────────────
// Shared by the meeting quick-actions demo controls (MeetingQuickActionsPanel
// .vue) and the dev-only Demo menu (src/boot/dev-menu.ts), so the simulated
// meeting state moves identically no matter which surface triggers it.

const getDemoLastSong = () => {
  const items = getVisibleMeetingItems(
    useCurrentStateStore().selectedDateObject,
  );
  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index];
    if (item?.tag?.type === 'song') return item;
  }
  return null;
};

/**
 * Stops any demo audio, resets the quick-actions scope and simulated
 * meeting state. No-op for the stage/clock parts unless demo mode is
 * enabled (setVirtualTime/reset guard on `enabled`).
 */
export const resetDemo = () => {
  const currentState = useCurrentStateStore();
  const demoMode = useDemoModeStore();
  // A reset must cancel an in-flight/playing demo track as well as resetting
  // the simulated meeting state; otherwise the next demo run inherits the
  // previous audio operation and cannot auto-start cleanly.
  useMusicStore().stopMusic(false, 0);
  useMeetingQuickActionsStore().resetCurrentScope();
  currentState.mediaPlaying = {
    ...currentState.mediaPlaying,
    action: '',
    currentPosition: 0,
    currentPositionUpdatedAt: 0,
    uniqueId: '',
    url: '',
  };
  demoMode.reset();
};

/**
 * Turns demo mode off entirely: resets the simulated meeting state, stops
 * any demo audio, and flips the store's `enabled` flag back off (the quick
 * actions' Reset button only resets the stage — it keeps demo mode on).
 */
export const disableDemoMode = () => {
  resetDemo();
  useDemoModeStore().deactivate();
};

/** Jumps the simulated clock to 4 minutes before the meeting start. */
export const jumpToPreMeeting = () => {
  const demoMode = useDemoModeStore();
  const start = getTodaysMeetingStartDateTime(new Date(demoMode.now));
  if (!start) return;
  demoMode.setVirtualTime(start.getTime() - 4 * 60 * 1000, 'pre-meeting');
};

/**
 * Jumps the simulated clock to the start of the meeting's last song (35
 * seconds in) and starts playing it, so the after-meeting panel trigger can
 * be exercised.
 */
export const jumpToLastSong = () => {
  const demoMode = useDemoModeStore();
  const currentState = useCurrentStateStore();
  const start = getTodaysMeetingStartDateTime(new Date(demoMode.now));
  const lastSong = getDemoLastSong();
  if (!start || !lastSong?.duration) return;
  const virtualNow = start.getTime() + 105 * 60 * 1000 - 35 * 1000;
  demoMode.setVirtualTime(virtualNow, 'last-song');
  currentState.mediaPlaying = {
    ...currentState.mediaPlaying,
    action: 'play',
    currentPosition: Math.max(0, lastSong.duration - 35),
    currentPositionUpdatedAt: virtualNow,
    playbackConfirmedToken: currentState.mediaPlaying.playToken + 1,
    playToken: currentState.mediaPlaying.playToken + 1,
    uniqueId: lastSong.uniqueId,
    url: lastSong.fileUrl || lastSong.streamUrl || 'demo://last-song',
  } satisfies MediaPlayingState;
};

/** Records the last song as ended and moves to the after-meeting stage. */
export const finishLastSong = () => {
  const demoMode = useDemoModeStore();
  const currentState = useCurrentStateStore();
  useMeetingQuickActionsStore().recordLastSongEnded(demoMode.now);
  currentState.mediaPlaying = {
    ...currentState.mediaPlaying,
    action: '',
    currentPosition: 0,
    currentPositionUpdatedAt: 0,
    uniqueId: '',
    url: '',
  };
  demoMode.setVirtualTime(demoMode.now, 'after-song');
};

/**
 * Removes the seeded demo congregation: its profile, its session caches
 * (lookup period, quick-start tour flag, announcements — cleaned up by
 * deleteCongregation() itself, see FE-3/FE-4 in full-audit-2026-09-04.md),
 * and its per-congregation cached folders on disk — mirroring the app's
 * canonical congregation deletion in DialogCongregationSwitcher. No-op when
 * nothing was seeded this session.
 */
export const removeDemoCongregationData = async () => {
  const demoId = seededCongregationId;
  if (!demoId) return;

  const congregationSettingsStore = useCongregationSettingsStore();
  const currentStateStore = useCurrentStateStore();

  congregationSettingsStore.deleteCongregation(demoId);
  if (currentStateStore.currentCongregation === demoId) {
    // Triggers MainLayout's currentCongregation watcher, which shows the
    // congregation switcher — the pristine, demo-free starting state.
    currentStateStore.currentCongregation = '';
  }
  seededCongregationId = '';
  await removeCongregationCache(demoId);
};
