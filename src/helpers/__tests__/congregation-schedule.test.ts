import { describe, expect, it } from 'vitest';

import { normalizeSchedule } from '../congregation-schedule';

describe('normalizeSchedule', () => {
  it('correctly maps 1-indexed Monday-first weekdays to Monday-based 0-indexed settings days', () => {
    // 1 = Monday -> "0"
    // 2 = Tuesday -> "1"
    // 3 = Wednesday -> "2"
    // 7 = Sunday -> "6"
    const schedule = {
      changeStamp: null,
      current: {
        midweek: {
          time: '19:00' as const,
          weekday: 2, // Tuesday
        },
        weekend: {
          time: '10:00' as const,
          weekday: 7, // Sunday
        },
      },
      future: null,
      futureDate: null,
    };

    const normalized = normalizeSchedule(schedule);

    expect(normalized.current).toEqual({
      mwDay: '1', // Tuesday (Monday = 0, Tuesday = 1)
      mwStartTime: '19:00',
      weDay: '6', // Sunday (Sunday = 6)
      weStartTime: '10:00',
    });
  });
});
