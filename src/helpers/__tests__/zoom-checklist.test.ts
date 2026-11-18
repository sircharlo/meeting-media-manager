import type { SettingsValues } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { getMeetingStartToday } from 'src/helpers/date';
import { getAfterMeetingSettingsAskedAt } from 'src/helpers/zoom';
import { getPendingMeetingSettingsTime } from 'src/helpers/zoom-meeting-day';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { useZoomStateStore } from 'stores/zoom-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as DateHelpers from '../date';
import type * as ZoomHelpers from '../zoom';

import { getZoomChecklistNotice } from '../zoom-checklist';

vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<typeof DateHelpers>()),
  getMeetingStartToday: vi.fn(),
}));

// What the sequences leave Zoom in stays real: the checklist goes by it.
vi.mock('src/helpers/zoom', async (importOriginal) => ({
  ...(await importOriginal<typeof ZoomHelpers>()),
  getAfterMeetingSettingsAskedAt: vi.fn(),
}));

vi.mock('src/helpers/zoom-meeting-day', () => ({
  getPendingMeetingSettingsTime: vi.fn(),
}));

vi.mock('src/helpers/error-catcher', () => ({ errorCatcher: vi.fn() }));

const MINUTE = 60 * 1000;
// Thursday's meeting, at 19:30; background music stops a minute before.
const MEETING_START = new Date(2026, 9, 15, 19, 30);
const MUSIC_STOPS = MEETING_START.getTime() - MINUTE;

const BEFORE_ITEMS = [
  'quick-actions-checklist-mute-zoom-participants',
  'quick-actions-checklist-disallow-unmute-zoom-participants',
  'quick-actions-checklist-unmute-kh-audio',
  'quick-actions-checklist-activate-kh-video-zoom',
];
const AFTER_ITEMS = [
  'quick-actions-checklist-disconnect-zoom-audio',
  'quick-actions-checklist-unmute-zoom-participants',
  'quick-actions-checklist-allow-unmute-zoom-participants',
  'quick-actions-checklist-mute-kh-audio',
  'quick-actions-checklist-deactivate-kh-video',
];

const at = (hours: number, minutes: number) => {
  const now = new Date(2026, 9, 15, hours, minutes);
  vi.setSystemTime(now);
  return now;
};

const useSettings = (overrides: Partial<SettingsValues> = {}) => {
  useCongregationSettingsStore().congregations['test-cong'] = {
    ...structuredClone(defaultSettings),
    enableMeetingQuickActions: true,
    enableMusicButton: true,
    zoomMeetingManagerAutomateMeetingAudioSettings: true,
    zoomMeetingManagerAutomatePostMeetingAudioSettings: true,
    zoomMeetingManagerEnable: true,
    zoomMicOffTitle: 'Unmute',
    zoomMicOnTitle: 'Mute',
    zoomVideoOffTitle: 'Start Video',
    zoomVideoOnTitle: 'Stop Video',
    ...overrides,
  };
};

beforeEach(() => {
  vi.useFakeTimers();
  at(19, 0);
  setActivePinia(createPinia());
  useSettings();
  useCurrentStateStore().currentCongregation = 'test-cong';
  vi.mocked(getMeetingStartToday).mockReturnValue(new Date(MEETING_START));
  vi.mocked(getPendingMeetingSettingsTime).mockReturnValue(MUSIC_STOPS);
  vi.mocked(getAfterMeetingSettingsAskedAt).mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('before the meeting', () => {
  it.each(BEFORE_ITEMS)('says M³ does "%s" when the music stops', (itemId) => {
    expect(getZoomChecklistNotice(itemId, 'before')).toEqual({
      at: MUSIC_STOPS,
      kind: 'music-stop',
    });
  });

  it('says nothing once the meeting settings are done, skipped or past', () => {
    vi.mocked(getPendingMeetingSettingsTime).mockReturnValue(null);

    for (const itemId of BEFORE_ITEMS) {
      expect(getZoomChecklistNotice(itemId, 'before')).toBeNull();
    }
  });

  it("says nothing about the microphone and the video while M³ doesn't know their buttons", () => {
    useSettings({ zoomMicOnTitle: null, zoomVideoOffTitle: null });

    expect(
      getZoomChecklistNotice(
        'quick-actions-checklist-unmute-kh-audio',
        'before',
      ),
    ).toBeNull();
    expect(
      getZoomChecklistNotice(
        'quick-actions-checklist-activate-kh-video-zoom',
        'before',
      ),
    ).toBeNull();
    expect(
      getZoomChecklistNotice(
        'quick-actions-checklist-mute-zoom-participants',
        'before',
      ),
    ).not.toBeNull();
  });
});

describe('after the meeting', () => {
  beforeEach(() => {
    at(21, 15);
  });

  it.each(AFTER_ITEMS)(
    'says M³ does "%s" when the user starts background music',
    (itemId) => {
      expect(getZoomChecklistNotice(itemId, 'after')).toEqual({
        kind: 'music-start',
      });
    },
  );

  it('still says so when music only started before the meeting', () => {
    vi.mocked(getAfterMeetingSettingsAskedAt).mockReturnValue(
      MEETING_START.getTime() - 30 * MINUTE,
    );

    expect(
      getZoomChecklistNotice(
        'quick-actions-checklist-disconnect-zoom-audio',
        'after',
      ),
    ).toEqual({ kind: 'music-start' });
  });

  it('says nothing once music started after the meeting began', () => {
    vi.mocked(getAfterMeetingSettingsAskedAt).mockReturnValue(
      new Date(2026, 9, 15, 21, 10).getTime(),
    );

    for (const itemId of AFTER_ITEMS) {
      expect(getZoomChecklistNotice(itemId, 'after')).toBeNull();
    }
  });

  it('says nothing when background music is off, since nothing starts it', () => {
    useSettings({ enableMusicButton: false });

    expect(
      getZoomChecklistNotice(
        'quick-actions-checklist-disconnect-zoom-audio',
        'after',
      ),
    ).toBeNull();
  });

  it("says nothing about unmuting everyone when M³ doesn't ask them to", () => {
    useSettings({ zoomMeetingManagerPostMeetingAskToUnmute: false });

    expect(
      getZoomChecklistNotice(
        'quick-actions-checklist-unmute-zoom-participants',
        'after',
      ),
    ).toBeNull();
    expect(
      getZoomChecklistNotice(
        'quick-actions-checklist-allow-unmute-zoom-participants',
        'after',
      ),
    ).toEqual({ kind: 'music-start' });
  });
});

describe('items M³ already did, or leaves to the user', () => {
  it('says a task M³ ticked itself is done, even with the automations off', () => {
    const itemId = 'quick-actions-checklist-unmute-kh-audio';
    useMeetingQuickActionsStore().setItemCheckedAutomatically(itemId, true);
    useSettings({ zoomMeetingManagerEnable: false });

    expect(getZoomChecklistNotice(itemId, 'before')).toEqual({ kind: 'done' });
  });

  it('says nothing when the user unticks a task they ticked themselves', () => {
    const itemId = 'quick-actions-checklist-unmute-kh-audio';
    useMeetingQuickActionsStore().setItemChecked(itemId, true);

    expect(getZoomChecklistNotice(itemId, 'before')).toBeNull();
  });

  it.each<[string, Partial<SettingsValues>]>([
    ['the Zoom Meeting Manager is off', { zoomMeetingManagerEnable: false }],
    [
      'the matching automation is off',
      {
        zoomMeetingManagerAutomateMeetingAudioSettings: false,
        zoomMeetingManagerAutomatePostMeetingAudioSettings: false,
      },
    ],
  ])('says nothing when %s', (_reason, overrides) => {
    useSettings(overrides);

    expect(getZoomChecklistNotice(BEFORE_ITEMS[0] ?? '', 'before')).toBeNull();
    expect(getZoomChecklistNotice(AFTER_ITEMS[0] ?? '', 'after')).toBeNull();
  });

  it('says nothing while the automations are paused', () => {
    useZoomStateStore().pauseAutomations('test-cong', [], false, true);

    expect(getZoomChecklistNotice(BEFORE_ITEMS[0] ?? '', 'before')).toBeNull();
  });

  it("says nothing about the user's own tasks", () => {
    expect(getZoomChecklistNotice('custom-task', 'before')).toBeNull();
    expect(getZoomChecklistNotice('custom-task', 'after')).toBeNull();
  });
});
