import { describe, expect, it } from 'vitest';

import { formatAheadBehind } from '../useTimerAheadBehindText';

const t = (key: string, named?: Record<string, unknown>) =>
  named ? `${key}:${named.humanFriendlyMinutes}` : key;

describe('formatAheadBehind', () => {
  it('is empty when the indicator has nothing to say', () => {
    expect(formatAheadBehind(null, t)).toBe('');
    expect(formatAheadBehind(undefined, t)).toBe('');
  });

  it('rounds to whole minutes and calls under a minute on time', () => {
    expect(formatAheadBehind(0.4, t)).toBe('on-time');
    expect(formatAheadBehind(-0.49, t)).toBe('on-time');
  });

  it('tells behind from ahead', () => {
    expect(formatAheadBehind(2.6, t)).toBe('minutes-behind:3');
    expect(formatAheadBehind(-1.2, t)).toBe('minutes-ahead:1');
  });
});
