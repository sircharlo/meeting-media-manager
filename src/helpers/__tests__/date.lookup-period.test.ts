import type { DateInfo, SettingsValues } from 'src/types';

import { formatDate } from 'src/utils/date';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { updateLookupPeriod } from '../date';

const { currentStateMock, jwStoreMock } = vi.hoisted(() => ({
  currentStateMock: {
    currentCongregation: 'congregation-1',
    currentSettings: {} as Partial<SettingsValues>,
    getMeetingType: (): 'mw' | 'we' | null => null,
  },
  jwStoreMock: {
    lookupPeriod: {} as Partial<Record<string, DateInfo[]>>,
  },
}));

vi.mock('boot/i18n', () => ({ i18n: { global: { t: (key: string) => key } } }));
vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));
vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => currentStateMock,
}));
vi.mock('stores/jw', () => ({ useJwStore: () => jwStoreMock }));

const lookupKeys = () =>
  (jwStoreMock.lookupPeriod['congregation-1'] ?? []).map((day) =>
    formatDate(day.date, 'YYYY/MM/DD'),
  );

// Monday 23 November 2026 to Sunday 29 November 2026.
const WEEKDAYS = Array.from(
  { length: 7 },
  (_, index) => new Date(2026, 10, 23 + index, 12),
);

describe('updateLookupPeriod', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    jwStoreMock.lookupPeriod = { 'congregation-1': [] };
    currentStateMock.currentSettings = { meteredConnection: false };
    currentStateMock.getMeetingType = () => null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(WEEKDAYS.map((date) => [formatDate(date, 'dddd'), date]))(
    'holds six full weeks from this Monday on a %s',
    (_weekday, today) => {
      vi.setSystemTime(today);

      updateLookupPeriod();

      const keys = lookupKeys();
      expect(keys).toHaveLength(42);
      expect(keys[0]).toBe('2026/11/23');
      expect(keys.at(-1)).toBe('2027/01/03');
    },
  );

  // A meeting day still waiting for its media used to get a second, empty
  // entry, which the date picker showed as "not ready yet".
  it("doesn't add a second entry for a day that has no media yet", () => {
    vi.setSystemTime(new Date(2026, 10, 24, 12));
    const waiting: DateInfo = {
      date: new Date(2026, 10, 26),
      mediaSections: [],
      status: null,
    };
    jwStoreMock.lookupPeriod = { 'congregation-1': [waiting] };
    currentStateMock.getMeetingType = () => 'mw';

    updateLookupPeriod();
    updateLookupPeriod();

    const keys = lookupKeys();
    expect(keys).toHaveLength(42);
    expect(new Set(keys).size).toBe(42);
    expect(
      jwStoreMock.lookupPeriod['congregation-1']?.filter(
        (day) => formatDate(day.date, 'YYYY/MM/DD') === '2026/11/26',
      ),
    ).toEqual([waiting]);
  });

  it('holds just the current week on a metered connection', () => {
    vi.setSystemTime(new Date(2026, 10, 24, 12));
    currentStateMock.currentSettings = { meteredConnection: true };

    updateLookupPeriod();

    const keys = lookupKeys();
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026/11/23');
    expect(keys.at(-1)).toBe('2026/11/29');
  });
});
