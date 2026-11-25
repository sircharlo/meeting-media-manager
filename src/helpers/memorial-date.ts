import type { SettingsValues } from 'src/types';

import { snoozeDateReminder } from 'src/helpers/date-reminders';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { dateFromString, getSpecificWeekday, isInPast } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

type MemorialDate = NonNullable<SettingsValues['memorialDate']>;

/** The last day of the season for the Memorial date reminder: April 20. */
const MEMORIAL_REMINDER_SEASON_END = { day: 20, month: 3 };

/**
 * Whether the Memorial's Monday-to-Sunday week is over: it fell on or before
 * last Sunday.
 */
export const isMemorialWeekOver = (date: Date | string) =>
  isInPast(getSpecificWeekday(date, 6));

/**
 * The next Memorial among the dates fetched from the repository: this
 * year's until its week is over, then next year's.
 */
export const getNextRemoteMemorial = (): MemorialDate | undefined => {
  const { memorials } = useJwStore();
  const year = new Date().getFullYear();
  const thisYears = memorials[year];
  if (thisYears && !isMemorialWeekOver(thisYears)) return thisYears;
  return memorials[year + 1];
};

/**
 * Keeps the current profile's Memorial date current. A date whose week isn't
 * over yet is kept as it is, even one entered by hand. An empty date, or one
 * that fell on or before last Sunday, becomes the next Memorial among the
 * fetched dates. With no newer date to take its place, a past date is
 * cleared, and the reminder to add one stays quiet until the next year (this
 * year's Memorial is over).
 */
export const syncMemorialDate = () => {
  try {
    const { currentCongregation, currentSettings } = useCurrentStateStore();
    if (!currentSettings) return;

    const currentDate = currentSettings.memorialDate;
    if (currentDate && !isMemorialWeekOver(currentDate)) return;

    const nextDate = getNextRemoteMemorial();
    if (nextDate) {
      currentSettings.memorialDate = nextDate;
      return;
    }

    if (!currentDate) return;
    currentSettings.memorialDate = null;
    snoozeDateReminder(
      currentCongregation,
      'memorialDate',
      new Date(dateFromString(currentDate).getFullYear() + 1, 0, 1),
    );
    log(
      `📅 Cleared the past Memorial date ${currentDate}: no newer date was found`,
      'jw',
      'info',
    );
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'syncMemorialDate' } } });
  }
};

let memorialDatesUpdate: Promise<void> = Promise.resolve();

/**
 * Fetches the Memorial dates from the repository when they're due for a
 * refresh, then syncs the current profile's date with them.
 */
export const updateMemorialDates = (online: boolean) => {
  memorialDatesUpdate = useJwStore()
    .updateMemorials(online)
    .then(syncMemorialDate);
  return memorialDatesUpdate;
};

/**
 * Resolves once the latest fetch of the Memorial dates is done and applied,
 * so the reminder never asks for a date M³ is about to fill in itself.
 */
export const whenMemorialDatesUpdated = () => memorialDatesUpdate;

/** Whether it's the time of year to ask for the Memorial date: January 1 to April 20. */
export const isMemorialReminderSeason = (date = new Date()) => {
  const { day, month } = MEMORIAL_REMINDER_SEASON_END;
  return (
    date.getMonth() < month ||
    (date.getMonth() === month && date.getDate() <= day)
  );
};

/**
 * Whether the current profile should be reminded to add the Memorial date:
 * it's the season for it, no date is set, and this year's Memorial isn't
 * already known to be over.
 */
export const isMemorialDateMissing = () => {
  const { currentSettings } = useCurrentStateStore();
  if (!currentSettings || currentSettings.memorialDate) return false;
  if (!isMemorialReminderSeason()) return false;
  const thisYears = useJwStore().memorials[new Date().getFullYear()];
  return !thisYears || !isMemorialWeekOver(thisYears);
};
