import { describe, expect, it } from 'vitest';

import { computeElapsedSeconds, computePauseDuration } from '../useTimer';

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
