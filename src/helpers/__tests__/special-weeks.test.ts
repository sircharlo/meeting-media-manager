import type { SettingsValues, SpecialDayRole } from 'src/types';

import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { formatDate } from 'src/utils/date';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isMwMeetingDay, isWeMeetingDay } from '../date';
import {
  getSpecialDayRole,
  getSpecialWeek,
  isMovedMeetingDay,
} from '../special-weeks';

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

const CONGREGATION_ID = 'test-cong';

// Midweek meeting on Wednesday ('2', Monday being '0'), weekend on Sunday.
// The circuit overseer visits the week of Tuesday 8 December 2026, the
// Memorial is on Thursday 2 April 2026, and a fetched Memorial falls on
// Saturday 20 March 2027.
const useSettings = (overrides: Partial<SettingsValues> = {}) => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      coWeek: '2026/12/08',
      memorialDate: '2026/04/02',
      mwDay: '2',
      weDay: '6',
      ...overrides,
    },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  useJwStore().memorials = { 2027: '2027/03/20' };
};

const day = (key: string) => new Date(`${key}T12:00:00`.replaceAll('/', '-'));

const roleOf = (key: string) => {
  const week = getSpecialWeek(day(key));
  return week ? getSpecialDayRole(day(key), week) : undefined;
};

describe('special weeks', () => {
  beforeEach(() => {
    setActivePinia(
      createTestingPinia({ createSpy: vi.fn, stubActions: false }),
    );
    useSettings();
  });

  it.each<[string, SpecialDayRole | undefined]>([
    ['2026/12/07', 'co-other'],
    ['2026/12/08', 'co-midweek'],
    ['2026/12/09', 'co-moved'],
    ['2026/12/11', 'co-other'],
    ['2026/12/13', 'co-weekend'],
    ['2026/03/31', 'memorial-other'],
    ['2026/04/01', 'memorial-replaced'],
    ['2026/04/02', 'memorial'],
    ['2026/04/05', 'memorial-other'],
    ['2027/03/17', 'memorial-other'],
    ['2027/03/20', 'memorial'],
    ['2027/03/21', 'memorial-replaced'],
    ['2026/12/15', undefined],
    ['2026/12/06', undefined],
  ])('gives %s the role %s', (key, role) => {
    expect(roleOf(key)).toBe(role);
  });

  it('describes the week: its kind, Monday, key day and replaced meeting', () => {
    const co = getSpecialWeek(day('2026/12/11'));
    expect(co?.kind).toBe('co');
    expect(formatDate(co?.monday, 'YYYY/MM/DD')).toBe('2026/12/07');
    expect(formatDate(co?.keyDate, 'YYYY/MM/DD')).toBe('2026/12/08');
    expect(co?.replacedMeeting).toBeUndefined();

    expect(getSpecialWeek(day('2026/03/30'))?.replacedMeeting).toBe('mw');
    expect(getSpecialWeek(day('2027/03/15'))?.replacedMeeting).toBe('we');
  });

  it('has no special weeks for a profile that does not fetch meeting media', () => {
    useSettings({ disableMediaFetching: true });

    expect(getSpecialWeek(day('2026/12/08'))).toBeUndefined();
    expect(getSpecialWeek(day('2026/04/02'))).toBeUndefined();
  });

  it('marks only the moved or replaced meeting days', () => {
    expect(isMovedMeetingDay('co-moved')).toBe(true);
    expect(isMovedMeetingDay('memorial-replaced')).toBe(true);
    expect(isMovedMeetingDay('co-other')).toBe(false);
    expect(isMovedMeetingDay('memorial')).toBe(false);
    expect(isMovedMeetingDay(undefined)).toBe(false);
  });

  it.each<[string, boolean, boolean]>([
    ['2026/12/08', true, false],
    ['2026/12/09', false, false],
    ['2026/12/13', false, true],
    ['2026/12/16', true, false],
    ['2026/04/01', false, false],
    ['2026/04/05', false, true],
    ['2027/03/17', true, false],
    ['2027/03/21', false, false],
  ])(
    'keeps %s as a midweek meeting: %s, weekend meeting: %s',
    (key, midweek, weekend) => {
      expect(isMwMeetingDay(day(key))).toBe(midweek);
      expect(isWeMeetingDay(day(key))).toBe(weekend);
    },
  );
});
