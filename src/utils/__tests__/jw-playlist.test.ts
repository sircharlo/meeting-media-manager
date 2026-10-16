import { describe, expect, it } from 'vitest';

import { getJwPlaylistItemTrim } from '../jw-playlist';

const SECOND = 10_000_000;

describe('getJwPlaylistItemTrim', () => {
  it('trims start and end against the media length', () => {
    expect(
      getJwPlaylistItemTrim({
        BaseDurationTicks: 120 * SECOND,
        DurationTicks: 90 * SECOND,
        EndTrimOffsetTicks: 20 * SECOND,
        StartTrimOffsetTicks: 10 * SECOND,
      }),
    ).toEqual({ durationTicks: 120 * SECOND, EndTime: 100, StartTime: 10 });
  });

  it('falls back to DurationTicks when the media length is 0 or missing', () => {
    for (const BaseDurationTicks of [0, undefined]) {
      expect(
        getJwPlaylistItemTrim({
          BaseDurationTicks,
          DurationTicks: 90 * SECOND,
          EndTrimOffsetTicks: 30 * SECOND,
          StartTrimOffsetTicks: 0,
        }),
      ).toEqual({ durationTicks: 90 * SECOND, EndTime: 60, StartTime: null });
    }
  });

  it('leaves untrimmed ends as null', () => {
    expect(
      getJwPlaylistItemTrim({
        BaseDurationTicks: 60 * SECOND,
        DurationTicks: 60 * SECOND,
        EndTrimOffsetTicks: 0,
        StartTrimOffsetTicks: 0,
      }),
    ).toEqual({ durationTicks: 60 * SECOND, EndTime: null, StartTime: null });
  });

  it('ignores an end trim longer than the media', () => {
    expect(
      getJwPlaylistItemTrim({
        BaseDurationTicks: 10 * SECOND,
        DurationTicks: 10 * SECOND,
        EndTrimOffsetTicks: 20 * SECOND,
        StartTrimOffsetTicks: 0,
      }).EndTime,
    ).toBeNull();
  });

  it('reports an unknown length as 0, with no end trim', () => {
    expect(
      getJwPlaylistItemTrim({
        BaseDurationTicks: 0,
        DurationTicks: 0,
        EndTrimOffsetTicks: 5 * SECOND,
        StartTrimOffsetTicks: 2 * SECOND,
      }),
    ).toEqual({ durationTicks: 0, EndTime: null, StartTime: 2 });
  });
});
