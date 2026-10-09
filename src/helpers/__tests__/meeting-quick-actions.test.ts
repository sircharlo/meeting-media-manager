import type { DateInfo } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { getTodaysMeetingStartDateTime } from 'src/helpers/date';
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
  getTodaysChecklistMode,
  getTodaysScheduledMeetingEndDateTime,
  predictLastSongEndDateTime,
  updateChecklistFromZoom,
} from '../meeting-quick-actions';

vi.mock('src/helpers/date', async (importOriginal) => {
  const actual = await importOriginal<typeof DateHelpers>();
  return {
    ...actual,
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
