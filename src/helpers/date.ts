import type { DateInfo } from 'src/types';

import { DAYS_IN_FUTURE } from 'src/constants/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import {
  addToDate,
  dateFromString,
  datesAreSame,
  formatDate,
  getDateDiff,
  getSpecificWeekday,
  isInPast,
} from 'src/utils/date';

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
        const dayDate = addToDate(dateFromString(), { day: i });
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
      meetingStartDateTime.setHours(hours ?? 0, minutes, 0, 0);
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
