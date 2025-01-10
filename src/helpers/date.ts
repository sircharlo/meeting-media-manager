import type { DateInfo } from 'src/types';

import { DAYS_IN_FUTURE } from 'src/constants/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  addToDate,
  dateFromString,
  datesAreSame,
  formatDate,
  getDateDiff,
  getSpecificWeekday,
  isInPast,
} from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

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

const shouldUseChangedMeetingSchedule = (lookupDate: Date | string) => {
  lookupDate = dateFromString(lookupDate);
  if (isInPast(lookupDate)) return false;

  const { currentSettings } = useCurrentStateStore();
  const changedDate = currentSettings?.meetingScheduleChangeDate;
  const changeOnce = currentSettings?.meetingScheduleChangeOnce;

  return (
    changedDate &&
    getDateDiff(lookupDate, changedDate, 'days') >= 0 &&
    (!changeOnce || getDateDiff(lookupDate, changedDate, 'days') < 7)
  );
};

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
    } else if (shouldUseChangedMeetingSchedule(lookupDate)) {
      return (
        (currentState.currentSettings?.meetingScheduleChangeMwDay ??
          currentState.currentSettings?.mwDay) === getWeekDay(lookupDate)
      );
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

    const changedWeDay =
      currentState.currentSettings?.meetingScheduleChangeWeDay;
    if (changedWeDay && shouldUseChangedMeetingSchedule(lookupDate)) {
      return changedWeDay === getWeekDay(lookupDate);
    } else {
      return currentState.currentSettings?.weDay === getWeekDay(lookupDate);
    }
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export function updateLookupPeriod(reset = false) {
  try {
    const { currentCongregation, currentSettings } = useCurrentStateStore();
    if (!currentCongregation || !currentSettings) return;

    if (
      currentSettings.meetingScheduleChangeDate &&
      ((!currentSettings.meetingScheduleChangeOnce &&
        isInPast(currentSettings.meetingScheduleChangeDate, true)) ||
        (currentSettings.meetingScheduleChangeOnce &&
          isInPast(
            addToDate(currentSettings.meetingScheduleChangeDate, { day: 7 }),
            true,
          )))
    ) {
      // Update meeting schedule
      if (!currentSettings.meetingScheduleChangeOnce) {
        currentSettings.mwDay =
          currentSettings.meetingScheduleChangeMwDay ?? currentSettings.mwDay;
        currentSettings.mwStartTime =
          currentSettings.meetingScheduleChangeMwStartTime ??
          currentSettings.mwStartTime;
        currentSettings.weDay =
          currentSettings.meetingScheduleChangeWeDay ?? currentSettings.weDay;
        currentSettings.weStartTime =
          currentSettings.meetingScheduleChangeWeStartTime ??
          currentSettings.weStartTime;
      }

      // Clear meeting schedule change settings
      currentSettings.meetingScheduleChangeDate = null;
      currentSettings.meetingScheduleChangeOnce = false;
      currentSettings.meetingScheduleChangeMwDay = null;
      currentSettings.meetingScheduleChangeMwStartTime = null;
      currentSettings.meetingScheduleChangeWeDay = null;
      currentSettings.meetingScheduleChangeWeStartTime = null;
    }

    const { lookupPeriod } = useJwStore();
    if (!lookupPeriod[currentCongregation]?.length || reset) {
      lookupPeriod[currentCongregation] = [];
    }

    lookupPeriod[currentCongregation] = lookupPeriod[
      currentCongregation
    ]?.filter((day) => !isInPast(getSpecificWeekday(day.date, 6)));
    const futureDates: DateInfo[] = Array.from(
      { length: DAYS_IN_FUTURE + dateFromString().getDay() },
      (_, i): DateInfo => {
        const dayDate = addToDate(getSpecificWeekday(dateFromString(), 0), {
          day: i,
        });
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
      const meetingStartTimes = shouldUseChangedMeetingSchedule(now)
        ? {
            mw:
              currentState.currentSettings?.meetingScheduleChangeMwStartTime ??
              currentState.currentSettings?.mwStartTime,
            we:
              currentState.currentSettings?.meetingScheduleChangeWeStartTime ??
              currentState.currentSettings?.weStartTime,
          }
        : {
            mw: currentState.currentSettings?.mwStartTime,
            we: currentState.currentSettings?.weStartTime,
          };
      const meetingStartTime = meetingStartTimes[weMeeting ? 'we' : 'mw'];
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
