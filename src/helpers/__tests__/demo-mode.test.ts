import type { DateInfo } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { getTodaysMeetingStartDateTime } from 'src/helpers/date';
import { formatDate } from 'src/utils/date';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useDemoModeStore } from 'stores/demo-mode';
import { useJwStore } from 'stores/jw';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as DateHelpers from '../date';

import {
  disableDemoMode,
  finishLastSong,
  getSeededDemoCongregationId,
  jumpToLastSong,
  jumpToPreMeeting,
  removeDemoCongregationData,
  resetDemo,
  seedDemoData,
} from '../demo-mode';

const { musicStoreMock } = vi.hoisted(() => ({
  musicStoreMock: {
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
  },
}));

vi.mock('boot/i18n', () => ({
  i18n: {
    global: {
      t: (key: string) => key,
    },
  },
}));

vi.mock('stores/music', () => ({
  useMusicStore: () => musicStoreMock,
}));

vi.mock('src/helpers/date', async (importOriginal) => {
  const actual = await importOriginal<typeof DateHelpers>();
  return {
    ...actual,
    getTodaysMeetingStartDateTime: vi.fn(),
  };
});

const TODAY = new Date('2026-08-21T12:00:00');
const MEETING_START = new Date(2026, 7, 21, 19, 0, 0, 0).getTime();
const LAST_SONG_DURATION = 187;

const createDemoDay = (): DateInfo =>
  ({
    date: TODAY,
    mediaSections: [
      {
        config: { uniqueId: 'tgw' },
        items: [
          { fileUrl: 'file:///photo.jpg', type: 'media', uniqueId: 'photo' },
          {
            duration: LAST_SONG_DURATION,
            fileUrl: 'file:///last-song.mp4',
            tag: { type: 'song', value: 7 },
            type: 'media',
            uniqueId: 'last-song',
          },
        ],
      },
    ],
    status: 'complete',
  }) as unknown as DateInfo;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
  setActivePinia(createPinia());

  vi.mocked(getTodaysMeetingStartDateTime).mockReturnValue(
    new Date(MEETING_START),
  );

  const currentState = useCurrentStateStore();
  const jwStore = useJwStore();
  currentState.currentCongregation = 'demo';
  currentState.selectedDate = formatDate(TODAY, 'YYYY/MM/DD');
  jwStore.lookupPeriod['demo'] = [createDemoDay()];
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(getTodaysMeetingStartDateTime).mockReset();
  musicStoreMock.stopMusic.mockClear();
  musicStoreMock.playMusic.mockClear();
});

describe('demo meeting-stage transitions', () => {
  it('does nothing while demo mode is disabled', () => {
    const demoMode = useDemoModeStore();
    const currentState = useCurrentStateStore();

    jumpToPreMeeting();

    expect(demoMode.stage).toBe('reset');
    expect(demoMode.now).toBe(TODAY.getTime());
    expect(currentState.mediaPlaying.action).toBe('');
  });

  it('jumps the simulated clock to 4 minutes before the meeting start', () => {
    useDemoModeStore().activate();
    const demoMode = useDemoModeStore();

    jumpToPreMeeting();

    expect(demoMode.stage).toBe('pre-meeting');
    expect(demoMode.now).toBe(MEETING_START - 4 * 60 * 1000);
  });

  it('starts playing the last song near its end', () => {
    useDemoModeStore().activate();
    const demoMode = useDemoModeStore();
    const currentState = useCurrentStateStore();

    jumpToLastSong();

    expect(demoMode.stage).toBe('last-song');
    expect(demoMode.now).toBe(MEETING_START + 105 * 60 * 1000 - 35 * 1000);
    expect(currentState.mediaPlaying.action).toBe('play');
    expect(currentState.mediaPlaying.uniqueId).toBe('last-song');
    expect(currentState.mediaPlaying.currentPosition).toBe(
      LAST_SONG_DURATION - 35,
    );
  });

  it('records the last song end and moves to the after-meeting stage', () => {
    useDemoModeStore().activate();
    const demoMode = useDemoModeStore();
    const currentState = useCurrentStateStore();
    const quickActions = useMeetingQuickActionsStore();

    jumpToLastSong();
    finishLastSong();

    const lastSongEndedAt = MEETING_START + 105 * 60 * 1000 - 35 * 1000;
    expect(demoMode.stage).toBe('after-song');
    expect(demoMode.now).toBe(lastSongEndedAt);
    expect(quickActions.lastSongEndedAt).toBe(lastSongEndedAt);
    expect(currentState.mediaPlaying.action).toBe('');
    expect(currentState.mediaPlaying.uniqueId).toBe('');
  });

  it('resets clock, stage, media playback, and quick-actions scope', () => {
    useDemoModeStore().activate();
    const demoMode = useDemoModeStore();
    const currentState = useCurrentStateStore();
    const quickActions = useMeetingQuickActionsStore();

    jumpToLastSong();
    quickActions.toggleItemChecked('task-1');
    resetDemo();

    expect(demoMode.stage).toBe('reset');
    expect(demoMode.now).toBe(TODAY.getTime());
    expect(currentState.mediaPlaying.action).toBe('');
    expect(currentState.mediaPlaying.uniqueId).toBe('');
    expect(quickActions.isItemChecked('task-1')).toBe(false);
    expect(musicStoreMock.stopMusic).toHaveBeenCalled();
  });

  it('turns demo mode off entirely, unlike a stage reset', () => {
    const demoMode = useDemoModeStore();
    const currentState = useCurrentStateStore();
    demoMode.activate();
    jumpToLastSong();
    expect(demoMode.enabled).toBe(true);

    disableDemoMode();

    expect(demoMode.enabled).toBe(false);
    expect(demoMode.stage).toBe('reset');
    expect(demoMode.now).toBe(TODAY.getTime());
    expect(currentState.mediaPlaying.action).toBe('');
    expect(musicStoreMock.stopMusic).toHaveBeenCalled();
  });

  it('removes the seeded demo congregation and its cached data', async () => {
    seedDemoData();
    const demoId = getSeededDemoCongregationId();
    const congregationSettings = useCongregationSettingsStore();
    const jwStore = useJwStore();
    const currentState = useCurrentStateStore();

    expect(demoId).not.toBe('');
    expect(Object.keys(congregationSettings.congregations)).toEqual([demoId]);
    // The demo congregation must never show the post-setup quick-start tour
    // (it would overlay the README screenshot).
    expect(congregationSettings.quickStartTourSeen[demoId]).toBe(true);
    expect(jwStore.lookupPeriod[demoId]).toBeDefined();
    expect(currentState.currentCongregation).toBe(demoId);

    await removeDemoCongregationData();

    expect(Object.keys(congregationSettings.congregations)).toHaveLength(0);
    expect(jwStore.lookupPeriod[demoId]).toBeUndefined();
    expect(currentState.currentCongregation).toBe('');
    expect(getSeededDemoCongregationId()).toBe('');
  });

  it('does not remove anything when no demo congregation was seeded', async () => {
    const congregationSettings = useCongregationSettingsStore();
    const demoId = getSeededDemoCongregationId();
    expect(demoId).toBe('');

    await removeDemoCongregationData();

    expect(Object.keys(congregationSettings.congregations)).toHaveLength(0);
  });
});
