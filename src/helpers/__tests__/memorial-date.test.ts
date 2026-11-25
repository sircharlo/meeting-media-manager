import type { SettingsValues } from 'src/types';

import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetDateRemindersClosedThisSession } from '../date-reminders';
import {
  getNextRemoteMemorial,
  isMemorialDateMissing,
  isMemorialReminderSeason,
  isMemorialWeekOver,
  syncMemorialDate,
  updateMemorialDates,
  whenMemorialDatesUpdated,
} from '../memorial-date';

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

const CONGREGATION_ID = 'test-cong';

// The 2026 Memorial is on Thursday 2 April; the 2027 one on Saturday 20 March.
const MEMORIAL_2026 = '2026/04/02';
const MEMORIAL_2027 = '2027/03/20';

type MemorialDate = SettingsValues['memorialDate'];

const setUp = ({
  memorialDate = null,
  memorials = {},
  today,
}: {
  memorialDate?: MemorialDate;
  memorials?: Partial<Record<number, NonNullable<MemorialDate>>>;
  today: string;
}) => {
  vi.setSystemTime(new Date(`${today}T10:00:00`));
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings, memorialDate },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  useJwStore().memorials = memorials;
};

const memorialDate = () => useCurrentStateStore().currentSettings?.memorialDate;

const memorialReminderSnooze = () =>
  useCongregationSettingsStore().dateReminderSnoozes[CONGREGATION_ID]
    ?.memorialDate;

describe('memorial date', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(
      createTestingPinia({ createSpy: vi.fn, stubActions: false }),
    );
    resetDateRemindersClosedThisSession();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isMemorialWeekOver', () => {
    it.each([
      // Today, the Memorial, whether its week is over
      ['2026-04-03', MEMORIAL_2026, false], // Friday of the same week
      ['2026-04-05', MEMORIAL_2026, false], // Sunday of the same week
      ['2026-04-06', MEMORIAL_2026, true], // the next Monday
      ['2026-04-05', '2026/04/05', false], // on a Sunday, that same Sunday
      ['2026-04-06', '2026/04/05', true], // on last Sunday
    ])('on %s, the week of %s is over: %s', (today, date, expected) => {
      vi.setSystemTime(new Date(`${today}T10:00:00`));
      expect(isMemorialWeekOver(date)).toBe(expected);
    });
  });

  describe('getNextRemoteMemorial', () => {
    it("gives this year's Memorial until its week is over", () => {
      setUp({
        memorials: { 2026: MEMORIAL_2026, 2027: MEMORIAL_2027 },
        today: '2026-04-05',
      });
      expect(getNextRemoteMemorial()).toBe(MEMORIAL_2026);
    });

    it("then gives next year's", () => {
      setUp({
        memorials: { 2026: MEMORIAL_2026, 2027: MEMORIAL_2027 },
        today: '2026-04-06',
      });
      expect(getNextRemoteMemorial()).toBe(MEMORIAL_2027);
    });

    it("gives nothing when next year's isn't known yet", () => {
      setUp({ memorials: { 2026: MEMORIAL_2026 }, today: '2026-04-06' });
      expect(getNextRemoteMemorial()).toBeUndefined();
    });
  });

  describe('syncMemorialDate', () => {
    it('fills an empty date with the next fetched Memorial', () => {
      setUp({ memorials: { 2026: MEMORIAL_2026 }, today: '2026-02-01' });
      syncMemorialDate();
      expect(memorialDate()).toBe(MEMORIAL_2026);
    });

    it('keeps a date still to come, even one that differs from the fetched one', () => {
      setUp({
        memorialDate: '2026/04/03',
        memorials: { 2026: MEMORIAL_2026 },
        today: '2026-02-01',
      });
      syncMemorialDate();
      expect(memorialDate()).toBe('2026/04/03');
    });

    it('keeps a date earlier in the current week', () => {
      setUp({
        memorialDate: MEMORIAL_2026,
        memorials: { 2026: MEMORIAL_2026, 2027: MEMORIAL_2027 },
        today: '2026-04-04',
      });
      syncMemorialDate();
      expect(memorialDate()).toBe(MEMORIAL_2026);
    });

    it("replaces a date on or before last Sunday with next year's, when known", () => {
      setUp({
        memorialDate: MEMORIAL_2026,
        memorials: { 2026: MEMORIAL_2026, 2027: MEMORIAL_2027 },
        today: '2026-04-06',
      });
      syncMemorialDate();
      expect(memorialDate()).toBe(MEMORIAL_2027);
      expect(memorialReminderSnooze()).toBeUndefined();
    });

    it('clears a past date with no newer one, and holds the reminder until next year', () => {
      setUp({
        memorialDate: MEMORIAL_2026,
        memorials: { 2026: MEMORIAL_2026 },
        today: '2026-04-06',
      });
      syncMemorialDate();
      expect(memorialDate()).toBeNull();
      expect(memorialReminderSnooze()).toBe(new Date(2027, 0, 1).getTime());
    });

    it('clears a past date entered by hand when nothing was fetched', () => {
      setUp({ memorialDate: '2026/04/05', today: '2026-04-06' });
      syncMemorialDate();
      expect(memorialDate()).toBeNull();
    });

    it("doesn't hold the reminder for a date from a year already gone", () => {
      setUp({ memorialDate: '2025/04/12', today: '2026-01-10' });
      syncMemorialDate();
      expect(memorialDate()).toBeNull();
      expect(memorialReminderSnooze()).toBeUndefined();
    });
  });

  describe('updateMemorialDates', () => {
    it('syncs the date once the fetch is done, and only then resolves', async () => {
      setUp({ today: '2026-02-01' });
      const jwStore = useJwStore();
      let finishFetch: () => void = vi.fn();
      vi.mocked(jwStore.updateMemorials).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finishFetch = () => {
              jwStore.memorials = { 2026: MEMORIAL_2026 };
              resolve();
            };
          }),
      );

      void updateMemorialDates(true);
      const updated = vi.fn();
      void whenMemorialDatesUpdated().then(updated);
      await Promise.resolve();

      expect(updated).not.toHaveBeenCalled();
      expect(memorialDate()).toBeNull();

      finishFetch();
      await whenMemorialDatesUpdated();

      expect(updated).toHaveBeenCalled();
      expect(memorialDate()).toBe(MEMORIAL_2026);
    });
  });

  describe('isMemorialReminderSeason', () => {
    it.each([
      ['2026-01-01', true],
      ['2026-03-15', true],
      ['2026-04-20', true],
      ['2026-04-21', false],
      ['2026-11-25', false],
      ['2026-12-31', false],
    ])('on %s: %s', (date, expected) => {
      expect(isMemorialReminderSeason(new Date(`${date}T10:00:00`))).toBe(
        expected,
      );
    });
  });

  describe('isMemorialDateMissing', () => {
    it('is missing in season with no date set', () => {
      setUp({ today: '2026-02-01' });
      expect(isMemorialDateMissing()).toBe(true);
    });

    it('is not missing once a date is set', () => {
      setUp({ memorialDate: MEMORIAL_2026, today: '2026-02-01' });
      expect(isMemorialDateMissing()).toBe(false);
    });

    it('is not asked for out of season', () => {
      setUp({ today: '2026-04-21' });
      expect(isMemorialDateMissing()).toBe(false);
    });

    it("is not asked for once this year's fetched Memorial is over", () => {
      setUp({ memorials: { 2026: MEMORIAL_2026 }, today: '2026-04-14' });
      expect(isMemorialDateMissing()).toBe(false);
    });
  });
});
