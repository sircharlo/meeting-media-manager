import type { CacheList, DateInfo } from 'src/types';

import { date, type DateLocale } from 'quasar';
import { DAYS_IN_FUTURE } from 'src/constants/date';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';

import { errorCatcher } from './error-catcher';

const { addToDate, buildDate, extractDate, formatDate, getDateDiff } = date;

export const dateFromString = (lookupDate?: Date | string | undefined) => {
  try {
    if (!lookupDate) {
      const now = new Date();
      lookupDate = buildDate(
        {
          day: now.getDate(),
          hours: 0,
          minutes: 0,
          month: now.getMonth() + 1,
          seconds: 0,
          year: now.getFullYear(),
        },
        false,
      );
    }
    let dateBuilder;
    if (typeof lookupDate === 'string') {
      dateBuilder = new Date(lookupDate);
      dateBuilder = buildDate(
        {
          day: dateBuilder.getDate(),
          hours: 0,
          minutes: 0,
          month: dateBuilder.getMonth() + 1,
          seconds: 0,
          year: dateBuilder.getFullYear(),
        },
        false,
      );
    } else {
      dateBuilder = lookupDate;
    }
    const outputDate = buildDate(
      {
        day: dateBuilder.getDate(),
        hours: 0,
        minutes: 0,
        month: dateBuilder.getMonth() + 1,
        seconds: 0,
        year: dateBuilder.getFullYear(),
      },
      false,
    );
    return outputDate;
  } catch (error) {
    errorCatcher(error);
    return new Date();
  }
};

/**
 * Checks if a caches list should be updated
 * @param list The cache list to check
 * @param months How many months should pass before updating
 * @returns Wether the list should be updated
 */
export const shouldUpdateList = (
  list: CacheList | undefined,
  months: number,
) => {
  if (!list) return true;
  return (
    !list.list.length ||
    getDateDiff(new Date(), list.updated, 'months') > months
  );
};

export const isInPast = (lookupDate: Date) => {
  try {
    if (!lookupDate) return false;
    const now = dateFromString();
    return getDateDiff(lookupDate, now, 'days') < 0;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const getWeekDay = (lookupDate: Date) => {
  try {
    if (!lookupDate) return '0';
    const currentState = useCurrentStateStore();
    if (!lookupDate) {
      lookupDate = currentState.selectedDateObject?.date || new Date();
    }

    const dayNumber =
      lookupDate.getDay() === 0
        ? lookupDate.getDay() + 6
        : lookupDate.getDay() - 1;
    return dayNumber.toString();
  } catch (error) {
    errorCatcher(error);
    return '0';
  }
};

export function datesAreSame(date1: Date, date2: Date) {
  try {
    if (!date1 || !date2) throw new Error('Missing date for comparison');
    return date1.toDateString() === date2.toDateString();
  } catch (error) {
    errorCatcher(error);
    return false;
  }
}

export function getSpecificWeekday(
  lookupDate: Date | string,
  desiredWeekday: number,
) {
  try {
    if (!lookupDate) return new Date();
    if (desiredWeekday === null) throw new Error('No desired weekday');
    lookupDate = dateFromString(lookupDate);
    desiredWeekday++;
    desiredWeekday = desiredWeekday === 7 ? 0 : desiredWeekday;
    const difference = (lookupDate.getDay() - desiredWeekday + 7) % 7;
    const newDate = new Date(lookupDate.valueOf());
    newDate.setDate(newDate.getDate() - difference);
    return newDate;
  } catch (error) {
    errorCatcher(error);
    return new Date();
  }
}

export function isCoWeek(lookupDate: Date) {
  try {
    if (!lookupDate) return false;
    lookupDate = dateFromString(lookupDate);
    const currentState = useCurrentStateStore();
    const coWeekSet = !!currentState.currentSettings?.coWeek;
    if (!coWeekSet) return false;
    const coWeekTuesday = dateFromString(
      currentState.currentSettings?.coWeek ?? undefined,
    );
    const coMonday = getSpecificWeekday(coWeekTuesday, 0);
    const lookupWeekMonday = getSpecificWeekday(lookupDate, 0);
    return datesAreSame(coMonday, lookupWeekMonday);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
}

export const isMwMeetingDay = (lookupDate: Date) => {
  try {
    const currentState = useCurrentStateStore();
    if (!lookupDate || currentState.currentSettings?.disableMediaFetching)
      return false;
    lookupDate = dateFromString(lookupDate);
    const coWeek = isCoWeek(lookupDate);
    if (coWeek) {
      const coWeekTuesday = dateFromString(
        currentState.currentSettings?.coWeek ?? undefined,
      );
      return datesAreSame(coWeekTuesday, lookupDate);
    } else {
      return currentState.currentSettings?.mwDay === getWeekDay(lookupDate);
    }
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const isWeMeetingDay = (lookupDate: Date) => {
  try {
    const currentState = useCurrentStateStore();
    if (!lookupDate || currentState.currentSettings?.disableMediaFetching)
      return false;
    lookupDate = dateFromString(lookupDate);
    return currentState.currentSettings?.weDay === getWeekDay(lookupDate);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export function updateLookupPeriod(reset = false) {
  try {
    const { currentCongregation } = useCurrentStateStore();
    if (!currentCongregation) return;
    const { lookupPeriod } = useJwStore();
    if (!lookupPeriod[currentCongregation]?.length || reset)
      lookupPeriod[currentCongregation] = [];
    lookupPeriod[currentCongregation] = lookupPeriod[
      currentCongregation
    ]?.filter((day) => {
      return !isInPast(day.date);
    });
    const futureDates: DateInfo[] = Array.from(
      { length: DAYS_IN_FUTURE },
      (_, i): DateInfo => {
        const dayDate = addToDate(
          buildDate({ hour: 0, milliseconds: 0, minute: 0, second: 0 }),
          { day: i },
        );
        return {
          complete: false,
          date: dayDate,
          dynamicMedia: [],
          error: false,
          meeting: isMwMeetingDay(dayDate)
            ? 'mw'
            : isWeMeetingDay(dayDate)
              ? 'we'
              : false,
          today: datesAreSame(dayDate, new Date()),
        };
      },
    );
    lookupPeriod[currentCongregation].push(
      ...futureDates.filter(
        (day) =>
          !lookupPeriod[currentCongregation]
            ?.map((d) => formatDate(d.date, 'YYYY/MM/DD'))
            .includes(formatDate(day.date, 'YYYY/MM/DD')),
      ),
    );
    const todayDate = lookupPeriod[currentCongregation]?.find((d) =>
      datesAreSame(new Date(d.date), new Date()),
    );
    if (todayDate) todayDate.today = true;
  } catch (error) {
    errorCatcher(error);
  }
}

export const getLocalDate = (dateObj: Date | string, locale: DateLocale) => {
  const parsedDate =
    typeof dateObj === 'string' ? extractDate(dateObj, 'YYYY/MM/DD') : dateObj;
  return formatDate(parsedDate, 'D MMMM YYYY', locale);
};

export const remainingTimeBeforeMeetingStart = () => {
  try {
    const currentState = useCurrentStateStore();
    const meetingDay =
      !!currentState.selectedDateObject?.today &&
      !!currentState.selectedDateObject?.meeting;
    if (meetingDay) {
      const now = new Date();
      const weMeeting = currentState.selectedDateObject?.meeting === 'we';
      const meetingStartTime = weMeeting
        ? currentState.currentSettings?.weStartTime
        : currentState.currentSettings?.mwStartTime;
      if (!meetingStartTime) return 0;
      const [hours, minutes] = meetingStartTime.split(':').map(Number);
      const meetingStartDateTime = new Date(now);
      meetingStartDateTime.setHours(hours, minutes, 0, 0);
      const dateDiff = getDateDiff(meetingStartDateTime, now, 'seconds');
      return dateDiff;
    } else {
      return 0;
    }
  } catch (error) {
    errorCatcher(error);
    return 0;
  }
};

export const friendlyDayToJsDay = (day?: number) => {
  try {
    if (!day) day = -1;
    const firstDay = day === 6 ? 0 : parseInt(day.toString()) + 1;
    const correctedFirstDay = firstDay > 7 ? firstDay - 7 : firstDay;
    return correctedFirstDay;
  } catch (error) {
    errorCatcher(error);
    return 0;
  }
};
