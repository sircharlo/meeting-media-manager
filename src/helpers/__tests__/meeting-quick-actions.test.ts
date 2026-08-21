import type { DateInfo } from 'src/types';
import type { MediaPlayingState } from 'stores/current-state';

import { getTodaysMeetingStartDateTime } from 'src/helpers/date';
import { describe, expect, it, vi } from 'vitest';

import type * as DateHelpers from '../date';

import {
  getTodaysScheduledMeetingEndDateTime,
  predictLastSongEndDateTime,
} from '../meeting-quick-actions';

vi.mock('src/helpers/date', async (importOriginal) => {
  const actual = await importOriginal<typeof DateHelpers>();
  return {
    ...actual,
    getTodaysMeetingStartDateTime: vi.fn(),
  };
});

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
});
