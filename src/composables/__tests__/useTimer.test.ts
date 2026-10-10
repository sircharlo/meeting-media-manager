import { describe, expect, it } from 'vitest';

import {
  computeElapsedSeconds,
  computePauseDuration,
  formatMinutesSeconds,
  getSectionDurationWarning,
  normalizePartDuration,
} from '../useTimer';

// FE-8 (full-audit-2026-09-04.md): both computations are wall-clock diffs,
// not monotonic ones - a backward system-clock jump (DST fallback, NTP
// correction, manual time change) would otherwise make them negative,
// garbling the timer display (negative minutes/seconds in count-up mode,
// remaining time appearing to jump upward in countdown mode) or pushing
// timerStartTime into the future. Extracted as pure functions specifically
// so this is testable without instantiating the full useTimer() composable
// (broadcast channel, i18n, Pinia store, useIntervalFn) - no prior test
// file existed for this composable.
describe('computeElapsedSeconds', () => {
  it('returns the normal forward elapsed time', () => {
    const startTime = 1000;
    const now = startTime + 65_000;

    expect(computeElapsedSeconds(now, startTime)).toBe(65);
  });

  it('clamps to 0 instead of going negative on a backward clock jump', () => {
    const startTime = 100_000;
    const now = startTime - 5_000; // system clock jumped backward

    expect(computeElapsedSeconds(now, startTime)).toBe(0);
  });

  it('returns 0 when now equals startTime', () => {
    expect(computeElapsedSeconds(1000, 1000)).toBe(0);
  });
});

describe('computePauseDuration', () => {
  it('returns the normal forward pause duration', () => {
    const pausedTime = 1000;
    const now = pausedTime + 12_000;

    expect(computePauseDuration(now, pausedTime)).toBe(12_000);
  });

  it('clamps to 0 instead of going negative when the clock jumped backward while paused', () => {
    const pausedTime = 100_000;
    const now = pausedTime - 30_000;

    expect(computePauseDuration(now, pausedTime)).toBe(0);
  });
});

describe('normalizePartDuration', () => {
  it('keeps whole, non-negative minutes and allows 0 (a skipped part)', () => {
    expect(normalizePartDuration(5)).toBe(5);
    expect(normalizePartDuration(0)).toBe(0);
    expect(normalizePartDuration('7')).toBe(7);
    expect(normalizePartDuration(4.6)).toBe(5);
  });

  it('turns anything unusable into 0', () => {
    expect(normalizePartDuration(-3)).toBe(0);
    expect(normalizePartDuration('')).toBe(0);
    expect(normalizePartDuration(undefined)).toBe(0);
    expect(normalizePartDuration(Number.NaN)).toBe(0);
  });
});

describe('getSectionDurationWarning', () => {
  it('warns when the parts do not add up to the section, counsel included', () => {
    // 3 Apply Yourself parts share 12 minutes (15 minus 3 minutes of counsel)
    expect(
      getSectionDurationWarning('ayfm', 3, {
        'ayfm-1': 4,
        'ayfm-2': 4,
        'ayfm-3': 4,
      }),
    ).toBe(false);
    expect(
      getSectionDurationWarning('ayfm', 3, {
        'ayfm-1': 4,
        'ayfm-2': 4,
        'ayfm-3': 5,
      }),
    ).toBe(true);
  });

  it('only counts the active parts and treats missing ones as 0', () => {
    expect(
      getSectionDurationWarning('lac', 1, { 'lac-1': 15, 'lac-2': 99 }),
    ).toBe(false);
    expect(getSectionDurationWarning('lac', 2, { 'lac-1': 15 })).toBe(false);
    expect(getSectionDurationWarning('lac', 2, { 'lac-1': 20 })).toBe(true);
  });
});

describe('formatMinutesSeconds', () => {
  it('pads minutes and seconds and never goes negative', () => {
    expect(formatMinutesSeconds(0)).toBe('00:00');
    expect(formatMinutesSeconds(65)).toBe('01:05');
    expect(formatMinutesSeconds(3600)).toBe('60:00');
    expect(formatMinutesSeconds(-5)).toBe('00:00');
    expect(formatMinutesSeconds(59.9)).toBe('00:59');
  });
});
