import type { SettingsValues } from 'src/types';

import { devMeetingOverride } from 'src/helpers/dev-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMeetingStartToday, isMwMeetingDay, isWeMeetingDay } from '../date';

const { currentStateMock } = vi.hoisted(() => ({
  currentStateMock: {
    currentCongregation: 'congregation-1',
    currentSettings: {} as Partial<SettingsValues>,
  },
}));

vi.mock('boot/i18n', () => ({ i18n: { global: { t: (key: string) => key } } }));
vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));
vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => currentStateMock,
}));
vi.mock('stores/jw', () => ({ useJwStore: () => ({ lookupPeriod: {} }) }));

// Thursday 26 November 2026, 14:00: no meeting by the profile's schedule.
const NOW = new Date(2026, 10, 26, 14);
const TOMORROW = new Date(2026, 10, 27, 14);

describe("the Dev actions popup's meeting override", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    currentStateMock.currentSettings = {
      mwStartTime: '19:00',
      weStartTime: '10:00',
    };
  });

  afterEach(() => {
    devMeetingOverride.value = null;
    vi.useRealTimers();
  });

  it('makes today a meeting day starting when the developer said', () => {
    const startsAt = NOW.getTime() + 10 * 60 * 1000;
    devMeetingOverride.value = { startsAt, type: 'we' };

    expect(isWeMeetingDay(NOW)).toBe(true);
    expect(isMwMeetingDay(NOW)).toBe(false);
    expect(getMeetingStartToday()?.getTime()).toBe(startsAt);
  });

  it('leaves the other days to the real schedule', () => {
    devMeetingOverride.value = { startsAt: NOW.getTime(), type: 'mw' };

    expect(isMwMeetingDay(TOMORROW)).toBe(false);
    expect(getMeetingStartToday(TOMORROW)).toBeNull();
  });

  it('goes back to the real schedule once cleared', () => {
    devMeetingOverride.value = { startsAt: NOW.getTime(), type: 'mw' };
    devMeetingOverride.value = null;

    expect(isMwMeetingDay(NOW)).toBe(false);
    expect(getMeetingStartToday()).toBeNull();
  });
});
