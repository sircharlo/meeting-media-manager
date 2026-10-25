import type { DateInfo } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import {
  getMeetingStartToday,
  getTodaysMeetingStartDateTime,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import {
  type MediaPlayingState,
  useCurrentStateStore,
} from 'stores/current-state';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as DateHelpers from '../date';

import {
  getAfterPanelCloseTime,
  getMusicStartMeetingConflict,
  getTodaysChecklistMode,
  getTodaysScheduledMeetingEndDateTime,
  predictLastSongEndDateTime,
  updateChecklistFromZoom,
} from '../meeting-quick-actions';

vi.mock('src/helpers/date', async (importOriginal) => {
  const actual = await importOriginal<typeof DateHelpers>();
  return {
    ...actual,
    getMeetingStartToday: vi.fn(),
    getTodaysMeetingStartDateTime: vi.fn(),
  };
});

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

const createDateInfoWithSong = (duration?: number): DateInfo =>
  ({
    date: new Date(),
    mediaSections: [
      {
        items: [
          {
            duration,
            tag: { type: 'song' },
            type: 'media',
            uniqueId: 'last-song',
          },
        ],
      },
    ],
    status: null,
  }) as unknown as DateInfo;

const createPlayingState = (
  overrides: Partial<MediaPlayingState> = {},
): MediaPlayingState =>
  ({
    action: 'play',
    currentPosition: 0,
    currentPositionUpdatedAt: Date.now(),
    duration: 0,
    pan: {},
    playbackConfirmedToken: 1,
    playbackRate: 1,
    playToken: 1,
    seekTo: 0,
    shouldLoop: false,
    slideshowAudioUrl: '',
    subtitlesUrl: '',
    uniqueId: 'last-song',
    url: 'file:///last-song.mp3',
    zoom: 1,
    ...overrides,
  }) as MediaPlayingState;

describe('predictLastSongEndDateTime', () => {
  it('returns null when the last song duration is unknown', () => {
    expect(
      predictLastSongEndDateTime(
        createPlayingState(),
        createDateInfoWithSong(),
      ),
    ).toBeNull();
  });

  it('returns a Date when a known song has nearly zero remaining time', () => {
    const before = Date.now();
    const result = predictLastSongEndDateTime(
      createPlayingState({ currentPosition: 1 }),
      createDateInfoWithSong(1),
    );

    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('uses the supplied clock when calculating the remaining song time', () => {
    const now = 1_000_000;
    const result = predictLastSongEndDateTime(
      createPlayingState({
        currentPosition: 10,
        currentPositionUpdatedAt: now,
      }),
      createDateInfoWithSong(30),
      now,
    );

    expect(result?.getTime()).toBe(now + 20_000);
  });
});

describe('predictLastSongEndDateTime with several visible items', () => {
  const NOW = 1_000_000;

  const item = (
    uniqueId: string,
    duration: number | undefined,
    extra: Record<string, unknown> = {},
  ) => ({ duration, type: 'media', uniqueId, ...extra });
  const song = (uniqueId: string, duration?: number) =>
    item(uniqueId, duration, { tag: { type: 'song' } });

  const day = (...sections: Record<string, unknown>[][]): DateInfo =>
    ({
      date: new Date(),
      mediaSections: sections.map((items) => ({ items })),
      status: null,
    }) as unknown as DateInfo;

  const predict = (
    dateInfo: DateInfo | null | undefined,
    overrides: Partial<MediaPlayingState> = {},
  ) =>
    predictLastSongEndDateTime(
      createPlayingState({
        currentPosition: 10,
        currentPositionUpdatedAt: NOW,
        uniqueId: 'video',
        ...overrides,
      }),
      dateInfo,
      NOW,
    )?.getTime();

  // Opening song, a video, the last song, then a trailing image.
  const meeting = () =>
    day(
      [song('opening', 180), item('video', 60)],
      [item('talk', 120), song('last', 200), item('image', 0)],
    );

  it('returns null without a day or without visible items', () => {
    expect(predict(undefined)).toBeUndefined();
    expect(predict(day([item('video', 60, { hidden: true })]))).toBeUndefined();
  });

  it('returns null when no visible item is a song', () => {
    expect(
      predict(
        day([item('video', 60), { ...song('hidden', 30), hidden: true }]),
      ),
    ).toBeUndefined();
  });

  it('adds up what is left of the current item and everything up to the end of the last song', () => {
    // 50s left of the video, then the 120s talk and the 200s last song.
    expect(predict(meeting())).toBe(NOW + (50 + 120 + 200) * 1000);
  });

  it('ignores items after the last song', () => {
    expect(predict(meeting(), { uniqueId: 'last' })).toBe(
      NOW + (200 - 10) * 1000,
    );
  });

  it('returns null once playback has moved past the last song', () => {
    expect(predict(meeting(), { uniqueId: 'image' })).toBeUndefined();
  });

  it('returns null when nothing has played yet or the item is not on the list', () => {
    expect(predict(meeting(), { action: '' })).toBeUndefined();
    expect(predict(meeting(), { uniqueId: '' })).toBeUndefined();
    expect(predict(meeting(), { uniqueId: 'elsewhere' })).toBeUndefined();
  });

  it('returns null when the current item or one before the last song has no known duration', () => {
    const unknownCurrent = day([item('video', 0), song('last', 200)]);
    const unknownBetween = day([
      item('video', 60),
      item('talk', undefined),
      song('last', 200),
    ]);

    expect(predict(unknownCurrent)).toBeUndefined();
    expect(predict(unknownBetween)).toBeUndefined();
  });

  it('extrapolates a playing item at its playback rate, but not a paused one', () => {
    const playing = predict(meeting(), {
      currentPositionUpdatedAt: NOW - 4000,
      playbackRate: 2,
    });
    const paused = predict(meeting(), {
      action: 'pause',
      currentPositionUpdatedAt: NOW - 4000,
      playbackRate: 2,
    });

    // 4s of playing at 2x moved 8s further into the video.
    expect(playing).toBe(NOW + (50 - 8 + 120 + 200) * 1000);
    expect(paused).toBe(NOW + (50 + 120 + 200) * 1000);
  });

  it('treats a missing playback rate as 1x and a missing position as the start', () => {
    expect(
      predict(meeting(), {
        currentPosition: undefined,
        currentPositionUpdatedAt: NOW - 4000,
        playbackRate: undefined,
      } as unknown as Partial<MediaPlayingState>),
    ).toBe(NOW + (60 - 4 + 120 + 200) * 1000);
  });

  it('does not extrapolate without a position report time, nor backwards from one in the future', () => {
    expect(predict(meeting(), { currentPositionUpdatedAt: 0 })).toBe(
      NOW + (50 + 120 + 200) * 1000,
    );
    expect(predict(meeting(), { currentPositionUpdatedAt: NOW + 5000 })).toBe(
      NOW + (50 + 120 + 200) * 1000,
    );
  });

  it('never counts a negative remainder for the current item', () => {
    expect(predict(meeting(), { currentPosition: 90 })).toBe(
      NOW + (120 + 200) * 1000,
    );
  });
});

describe('getMusicStartMeetingConflict', () => {
  const start = new Date(2026, 7, 21, 19, 0, 0, 0);
  const STOP_BUFFER_SECONDS = 60;
  const minutesIn = (minutes: number) =>
    new Date(start.getTime() + minutes * 60 * 1000);
  const conflictAt = (minutes: number, lastSongEndedAt: null | number = null) =>
    getMusicStartMeetingConflict(
      minutesIn(minutes),
      STOP_BUFFER_SECONDS,
      lastSongEndedAt,
    );

  beforeEach(() => {
    vi.mocked(getMeetingStartToday).mockReturnValue(start);
  });

  afterEach(() => {
    vi.mocked(getMeetingStartToday).mockReset();
  });

  it('never stands in the way on a day without a meeting', () => {
    vi.mocked(getMeetingStartToday).mockReturnValue(null);

    expect(conflictAt(30)).toBeNull();
  });

  it('lets music start before it is due to stop for the meeting', () => {
    expect(conflictAt(-1.5)).toBeNull();
  });

  it('refuses in the last moments before the meeting, when music stops anyway', () => {
    expect(conflictAt(-1)).toBe('final-approach');
    expect(conflictAt(-0.1)).toBe('final-approach');
  });

  it('asks during the meeting until a minute after its last song ended', () => {
    const songEndedAt = minutesIn(100).getTime();

    expect(conflictAt(0)).toBe('meeting');
    expect(conflictAt(100.9, songEndedAt)).toBe('meeting');
    expect(conflictAt(101, songEndedAt)).toBeNull();
  });

  it('ignores a last song that ended before the meeting (a test run)', () => {
    expect(conflictAt(30, minutesIn(-20).getTime())).toBe('meeting');
  });

  it('without a last song, asks until half an hour after the scheduled end', () => {
    expect(conflictAt(105 + 29)).toBe('meeting');
    expect(conflictAt(105 + 30)).toBeNull();
  });
});

describe('getAfterPanelCloseTime', () => {
  const hour = 60 * 60 * 1000;
  const scheduledEnd = new Date(2026, 9, 25, 20, 45);
  const lastSongEndedAt = scheduledEnd.getTime() - 10 * 60 * 1000;
  const runningLong = new Date(scheduledEnd.getTime() + 90 * 60 * 1000);

  it.each([
    {
      ends: { lastSongEndedAt, predictedEnd: null, scheduledEnd },
      expected: lastSongEndedAt + hour,
      when: 'an hour after the last song ended',
    },
    {
      ends: { lastSongEndedAt: null, predictedEnd: null, scheduledEnd },
      expected: scheduledEnd.getTime() + hour,
      when: 'without a last song, an hour after the planned end',
    },
    {
      ends: { lastSongEndedAt: null, predictedEnd: runningLong, scheduledEnd },
      expected: runningLong.getTime() + hour,
      when: 'an hour after the last song of a meeting running long',
    },
    {
      ends: { lastSongEndedAt: null, predictedEnd: null, scheduledEnd: null },
      expected: null,
      when: 'never when nothing is known of the end',
    },
  ])('closes $when', ({ ends, expected }) => {
    expect(getAfterPanelCloseTime(ends)).toBe(expected);
  });
});

describe('getTodaysScheduledMeetingEndDateTime', () => {
  it.each(['midweek', 'weekend'])(
    'adds 105 minutes for a %s meeting',
    async () => {
      const start = new Date(2026, 7, 21, 19, 30, 0, 0);
      vi.mocked(getTodaysMeetingStartDateTime).mockReturnValueOnce(start);

      const result = getTodaysScheduledMeetingEndDateTime();

      expect(result?.getTime()).toBe(start.getTime() + 105 * 60 * 1000);
    },
  );

  // FE-19 (full-audit-2026-09-05.md): this outer catch used to call
  // errorCatcher(error) bare, with no Sentry grouping context, unlike every
  // inner catch in the migration files this pass also fixed.
  it('reports a thrown error with its own function name as Sentry grouping context', () => {
    vi.mocked(getTodaysMeetingStartDateTime).mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const result = getTodaysScheduledMeetingEndDateTime();

    expect(result).toBeNull();
    expect(errorCatcher).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: expect.objectContaining({
          fn: expect.objectContaining({
            name: 'getTodaysScheduledMeetingEndDateTime',
          }),
        }),
      }),
    );
  });
});

describe('the meeting checklist and the Zoom Meeting Manager', () => {
  const meetingStart = new Date('2026-10-09T19:00:00');
  const at = (time: string) => {
    vi.setSystemTime(new Date(`2026-10-09T${time}`));
  };

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

  // What the in-meeting and before/after-meeting settings report, in order.
  const applyMeetingSettings = () => {
    updateChecklistFromZoom({ audioJoined: true });
    updateChecklistFromZoom({ hostMicOn: true });
    updateChecklistFromZoom({ hostVideoOn: true });
    updateChecklistFromZoom({
      participantsCanUnmute: false,
      participantsMuted: true,
    });
  };
  const applyPostMeetingSettings = () => {
    updateChecklistFromZoom({ audioJoined: false, hostMicOn: false });
    updateChecklistFromZoom({ hostVideoOn: false });
    updateChecklistFromZoom({
      participantsCanUnmute: true,
      participantsMuted: true,
    });
    updateChecklistFromZoom({ participantsMuted: false });
  };

  const checked = (ids: string[]) => {
    const quickActions = useMeetingQuickActionsStore();
    return ids.filter((id) => quickActions.isItemChecked(id));
  };

  const getSettings = () => {
    const settings = useCurrentStateStore().currentSettings;
    if (!settings) throw new Error('No congregation settings');
    return settings;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    at('18:00:00');
    setActivePinia(createPinia());
    useCongregationSettingsStore().congregations['test-cong'] =
      structuredClone(defaultSettings);
    useCurrentStateStore().currentCongregation = 'test-cong';
    vi.mocked(getTodaysMeetingStartDateTime).mockReturnValue(meetingStart);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(getTodaysMeetingStartDateTime).mockReset();
  });

  it('counts actions for the before-meeting checklist until 5 minutes into the meeting', () => {
    expect(getTodaysChecklistMode(new Date('2026-10-09T19:04:59'))).toBe(
      'before',
    );
    expect(getTodaysChecklistMode(new Date('2026-10-09T19:05:00'))).toBe(
      'after',
    );

    vi.mocked(getTodaysMeetingStartDateTime).mockReturnValue(null);
    expect(getTodaysChecklistMode(new Date('2026-10-09T19:00:00'))).toBeNull();
  });

  it('ticks the before-meeting items as the in-meeting settings are applied', () => {
    at('18:59:00');
    applyMeetingSettings();

    expect(checked(BEFORE_ITEMS)).toEqual(BEFORE_ITEMS);
    expect(checked(AFTER_ITEMS)).toEqual([]);
    const quickActions = useMeetingQuickActionsStore();
    expect(
      BEFORE_ITEMS.every((id) => quickActions.isItemCheckedAutomatically(id)),
    ).toBe(true);
  });

  it("doesn't count joining computer audio as the Kingdom Hall audio being on", () => {
    at('18:59:00');
    updateChecklistFromZoom({ audioJoined: true });
    expect(checked(['quick-actions-checklist-unmute-kh-audio'])).toEqual([]);

    updateChecklistFromZoom({ hostMicOn: true });
    expect(checked(['quick-actions-checklist-unmute-kh-audio'])).toEqual([
      'quick-actions-checklist-unmute-kh-audio',
    ]);
  });

  it('unticks before-meeting items that a later action undid', () => {
    applyMeetingSettings();
    // Background music started again before the meeting.
    applyPostMeetingSettings();

    expect(checked(BEFORE_ITEMS)).toEqual([]);
    expect(checked(AFTER_ITEMS)).toEqual([]);
  });

  it('ticks the after-meeting items only for what happens after the meeting', () => {
    // Background music starting before the meeting...
    at('17:50:00');
    applyPostMeetingSettings();
    at('18:59:00');
    applyMeetingSettings();
    expect(checked(AFTER_ITEMS)).toEqual([]);

    // ...and again after it.
    at('20:45:00');
    applyPostMeetingSettings();

    expect(checked(AFTER_ITEMS)).toEqual(AFTER_ITEMS);
    // The before-meeting checklist still shows what was done before.
    expect(checked(BEFORE_ITEMS)).toEqual(BEFORE_ITEMS);
  });

  it('leaves custom and hidden items alone', () => {
    const settings = getSettings();
    const videoItem = settings.meetingQuickActionsChecklistBefore.find(
      (item) => item.id === 'quick-actions-checklist-activate-kh-video-zoom',
    );
    if (!videoItem) throw new Error('No video item');
    videoItem.enabled = false;
    settings.meetingQuickActionsChecklistBefore.push({
      categoryId: 'quick-actions-category-kh-av',
      enabled: true,
      id: 'custom-item',
      isDefault: false,
      label: 'Turn on the stage lights',
    });

    applyMeetingSettings();

    expect(checked([videoItem.id, 'custom-item'])).toEqual([]);
  });

  it('does nothing without a meeting today or with the quick actions off', () => {
    vi.mocked(getTodaysMeetingStartDateTime).mockReturnValue(null);
    applyMeetingSettings();
    expect(checked(BEFORE_ITEMS)).toEqual([]);

    vi.mocked(getTodaysMeetingStartDateTime).mockReturnValue(meetingStart);
    getSettings().enableMeetingQuickActions = false;
    applyMeetingSettings();
    expect(checked(BEFORE_ITEMS)).toEqual([]);
  });
});
