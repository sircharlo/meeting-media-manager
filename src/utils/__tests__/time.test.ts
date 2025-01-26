import { describe, expect, it } from 'vitest';

import { formatTime, timeToSeconds } from '../time';

describe('formatTime', () => {
  it('should format time in seconds to a string in the format of "hh:mm:ss" or "mm:ss"', () => {
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(73)).toBe('01:13');
    expect(formatTime(0)).toBe('00:00');
  });
});

describe('timeToSeconds', () => {
  it('should convert time string to seconds', () => {
    expect(timeToSeconds('01:01:01')).toBe(3661);
    expect(timeToSeconds('01:13')).toBe(73);
    expect(timeToSeconds('00:00')).toBe(0);
  });
});
