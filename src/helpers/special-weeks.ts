import type { SpecialDayRole, SpecialWeek } from 'src/types';

import {
  getMemorialInWeek,
  isCoWeek,
  isScheduledMwDay,
  isScheduledWeDay,
  isWeMeetingDay,
} from 'src/helpers/date';
import {
  dateFromString,
  datesAreSame,
  getSpecificWeekday,
} from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';

/** The circuit overseer's visit or the Memorial week this date is in. */
export const getSpecialWeek = (date?: Date): SpecialWeek | undefined => {
  if (!date) return undefined;
  const { currentSettings } = useCurrentStateStore();
  if (currentSettings?.disableMediaFetching) return undefined;

  const monday = getSpecificWeekday(date, 0);
  const memorial = getMemorialInWeek(date);
  if (memorial) {
    const memorialOnWeekend = [0, 6].includes(memorial.getDay());
    return {
      keyDate: memorial,
      kind: 'memorial',
      monday,
      replacedMeeting: memorialOnWeekend ? 'we' : 'mw',
    };
  }

  if (currentSettings?.coWeek && isCoWeek(date)) {
    return {
      keyDate: dateFromString(currentSettings.coWeek),
      kind: 'co',
      monday,
    };
  }

  return undefined;
};

const getCoDayRole = (date: Date, week: SpecialWeek): SpecialDayRole => {
  if (datesAreSame(date, week.keyDate)) return 'co-midweek';
  if (isWeMeetingDay(date)) return 'co-weekend';
  if (isScheduledMwDay(date)) return 'co-moved';
  return 'co-other';
};

const getMemorialDayRole = (date: Date, week: SpecialWeek): SpecialDayRole => {
  if (datesAreSame(date, week.keyDate)) return 'memorial';
  const isReplacedMeetingDay =
    week.replacedMeeting === 'we'
      ? isScheduledWeDay(date)
      : isScheduledMwDay(date);
  return isReplacedMeetingDay ? 'memorial-replaced' : 'memorial-other';
};

/** What this day is within its special week. */
export const getSpecialDayRole = (
  date: Date,
  week: SpecialWeek,
): SpecialDayRole =>
  week.kind === 'co'
    ? getCoDayRole(date, week)
    : getMemorialDayRole(date, week);

/**
 * A day whose meeting moved or was replaced this week, so its page is
 * empty: the usual midweek day of the CO's visit, or the meeting day the
 * Memorial replaces.
 */
export const isMovedMeetingDay = (role?: SpecialDayRole) =>
  role === 'co-moved' || role === 'memorial-replaced';
