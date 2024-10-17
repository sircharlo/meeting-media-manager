import type { DateInfo, DynamicMediaObject } from 'src/types';

import { storeToRefs } from 'pinia';
import { date, type DateLocale } from 'quasar';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';

import { errorCatcher } from './error-catcher';

const daysInFuture = 35;

const dateFromString = (lookupDate?: Date | string | undefined) => {
  try {
    if (!lookupDate) {
      const now = new Date();
      lookupDate = date.buildDate(
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
      dateBuilder = date.buildDate(
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
    const outputDate = date.buildDate(
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

const isInPast = (lookupDate: Date) => {
  try {
    if (!lookupDate) return false;
    const now = dateFromString();
    return date.getDateDiff(lookupDate, now, 'days') < 0;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const getWeekDay = (lookupDate: Date) => {
  try {
    if (!lookupDate) return '0';
    const currentState = useCurrentStateStore();
    const { selectedDateObject } = storeToRefs(currentState);
    if (!lookupDate) lookupDate = selectedDateObject.value?.date || new Date();
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

function getSpecificWeekday(lookupDate: Date | string, desiredWeekday: number) {
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

function datesAreSame(date1: Date, date2: Date) {
  try {
    if (!date1 || !date2) throw new Error('Missing date for comparison');
    return date1.toDateString() === date2.toDateString();
  } catch (error) {
    errorCatcher(error);
    return false;
  }
}

function isCoWeek(lookupDate: Date) {
  try {
    if (!lookupDate) return false;
    lookupDate = dateFromString(lookupDate);
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    const coWeekSet = !!currentSettings.value?.coWeek;
    if (!coWeekSet) return false;
    const coWeekTuesday = dateFromString(currentSettings.value?.coWeek);
    const coMonday = getSpecificWeekday(coWeekTuesday, 0);
    const lookupWeekMonday = getSpecificWeekday(lookupDate, 0);
    return datesAreSame(coMonday, lookupWeekMonday);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
}

const isMwMeetingDay = (lookupDate: Date) => {
  try {
    if (!lookupDate) return false;
    lookupDate = dateFromString(lookupDate);
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    const coWeek = isCoWeek(lookupDate);
    if (coWeek) {
      const coWeekTuesday = dateFromString(currentSettings.value?.coWeek);
      return datesAreSame(coWeekTuesday, lookupDate);
    } else {
      return currentSettings.value?.mwDay === getWeekDay(lookupDate);
    }
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const isWeMeetingDay = (lookupDate: Date) => {
  try {
    if (!lookupDate) return false;
    lookupDate = dateFromString(lookupDate);
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    return currentSettings.value?.weDay === getWeekDay(lookupDate);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

function updateLookupPeriod(reset = false) {
  try {
    const currentState = useCurrentStateStore();
    const { currentCongregation } = storeToRefs(currentState);
    if (!currentCongregation.value) return;
    const jwStore = useJwStore();
    const { lookupPeriod } = storeToRefs(jwStore);
    if (!lookupPeriod.value[currentCongregation.value]?.length || reset)
      lookupPeriod.value[currentCongregation.value] = [];
    lookupPeriod.value[currentCongregation.value] = lookupPeriod.value[
      currentCongregation.value
    ]?.filter((day) => {
      return !isInPast(day.date);
    });
    const futureDates = Array.from({ length: daysInFuture }, (_, i) => {
      const dayDate = date.addToDate(
        date.buildDate({ hour: 0, milliseconds: 0, minute: 0, second: 0 }),
        { day: i },
      );
      return {
        date: dayDate as Date,
        dynamicMedia: [] as DynamicMediaObject[],
        meeting: isMwMeetingDay(dayDate)
          ? 'mw'
          : isWeMeetingDay(dayDate)
            ? 'we'
            : false,
      };
    }) as DateInfo[];
    lookupPeriod.value[currentCongregation.value].push(
      ...futureDates.filter(
        (day) =>
          !lookupPeriod.value[currentCongregation.value]
            ?.map((d) => date.formatDate(d.date, 'YYYY/MM/DD'))
            .includes(date.formatDate(day.date, 'YYYY/MM/DD')),
      ),
    );
    const todayDate = lookupPeriod.value[currentCongregation.value]?.find((d) =>
      datesAreSame(new Date(d.date), new Date()),
    );
    if (todayDate) todayDate.today = true;
  } catch (error) {
    errorCatcher(error);
  }
}

const getLocalDate = (dateObj: Date | string, locale: DateLocale) => {
  const parsedDate =
    typeof dateObj === 'string'
      ? date.extractDate(dateObj, 'YYYY/MM/DD')
      : dateObj;
  return date.formatDate(parsedDate, 'D MMMM YYYY', locale);
};

const remainingTimeBeforeMeetingStart = () => {
  try {
    const currentState = useCurrentStateStore();
    const { currentSettings, selectedDateObject } = storeToRefs(currentState);
    const meetingDay =
      !!selectedDateObject.value?.today && !!selectedDateObject.value?.meeting;
    if (meetingDay) {
      const now = new Date();
      const weMeeting = selectedDateObject.value?.meeting === 'we';
      const meetingStartTime = weMeeting
        ? currentSettings.value?.weStartTime
        : currentSettings.value?.mwStartTime;
      const [hours, minutes] = meetingStartTime.split(':').map(Number);
      const meetingStartDateTime = new Date(now);
      meetingStartDateTime.setHours(hours, minutes, 0, 0);
      const dateDiff = date.getDateDiff(meetingStartDateTime, now, 'seconds');
      return dateDiff;
    } else {
      return 0;
    }
  } catch (error) {
    errorCatcher(error);
    return 0;
  }
};

export {
  dateFromString,
  datesAreSame,
  daysInFuture,
  getLocalDate,
  getSpecificWeekday,
  isCoWeek,
  isInPast,
  isMwMeetingDay,
  isWeMeetingDay,
  remainingTimeBeforeMeetingStart,
  updateLookupPeriod,
};
