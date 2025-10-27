import type { DateInfo, SettingsValues } from 'src/types';

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

export function isCoWeek(
  lookupDate?: Date | string | { getTime: () => number },
) {
  try {
    if (!lookupDate) return false;

    // Debug logging to help identify the issue
    if (
      lookupDate &&
      typeof lookupDate === 'object' &&
      !(lookupDate instanceof Date)
    ) {
      console.warn('🔍 [isCoWeek] Received non-Date object:', {
        constructor: (
          lookupDate as unknown as { constructor: { name: string } }
        ).constructor?.name,
        keys: Object.keys(lookupDate),
        type: typeof lookupDate,
        value: lookupDate,
      });
    }

    const newLookupDate = dateFromString(lookupDate);
    const currentState = useCurrentStateStore();
    const coWeekSet = !!currentState.currentSettings?.coWeek;
    if (!coWeekSet) return false;
    const coWeekTuesday = dateFromString(
      currentState.currentSettings?.coWeek ?? undefined,
    );
    const coMonday = getSpecificWeekday(coWeekTuesday, 0);
    const lookupWeekMonday = getSpecificWeekday(newLookupDate, 0);
    return datesAreSame(coMonday, lookupWeekMonday);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
}

const shouldUseChangedMeetingSchedule = (lookupDate?: Date | string) => {
  if (!lookupDate) return false;
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

export const isReplacedByMemorial = (lookupDate?: Date) => {
  try {
    const currentState = useCurrentStateStore();
    if (
      !lookupDate ||
      currentState.currentSettings?.disableMediaFetching ||
      !currentState.currentSettings?.memorialDate
    ) {
      return false;
    }

    lookupDate = dateFromString(lookupDate);
    const memorialDate = dateFromString(
      currentState.currentSettings.memorialDate,
    );

    const memorialInWeekend = [0, 6].includes(memorialDate.getDay());
    const lookupDateInWeekend = [0, 6].includes(lookupDate.getDay());

    if (memorialInWeekend !== lookupDateInWeekend) return false;
    return datesAreSame(
      getSpecificWeekday(lookupDate, 0),
      getSpecificWeekday(memorialDate, 0),
    );
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const isMwMeetingDay = (lookupDate?: Date) => {
  try {
    const currentState = useCurrentStateStore();
    if (!lookupDate || currentState.currentSettings?.disableMediaFetching) {
      return false;
    }

    if (isReplacedByMemorial(lookupDate)) return false;

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

export const isWeMeetingDay = (lookupDate?: Date) => {
  try {
    const currentState = useCurrentStateStore();
    if (!lookupDate || currentState.currentSettings?.disableMediaFetching) {
      return false;
    }

    if (isReplacedByMemorial(lookupDate)) return false;

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

export const isMeetingDay = (lookupDate?: Date) => {
  try {
    const currentState = useCurrentStateStore();
    if (!lookupDate || currentState.currentSettings?.disableMediaFetching) {
      return false;
    }
    return isMwMeetingDay(lookupDate) || isWeMeetingDay(lookupDate);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export function updateLookupPeriod({
  allCongregations,
  onlyForWeekIncluding,
  reset,
}: {
  allCongregations?: boolean;
  onlyForWeekIncluding?: string;
  reset?: boolean;
} = {}) {
  try {
    const { lookupPeriod } = useJwStore();

    if (!lookupPeriod || typeof lookupPeriod !== 'object') return;

    // --- Handle "reset for all congregations" mode ---
    if (reset && allCongregations) {
      const congregationIds = Object.keys(lookupPeriod).filter(
        (id) => id && Array.isArray(lookupPeriod[id]),
      );

      console.log(
        `🔄 [updateLookupPeriod] Resetting dynamic media for ${congregationIds.length} congregations`,
      );

      for (const congId of congregationIds) {
        console.log(
          `🔄 [updateLookupPeriod] Resetting dynamic media for congregation ${congId}`,
        );
        try {
          const days = lookupPeriod[congId];
          if (!Array.isArray(days)) {
            console.log(
              `🔄 [updateLookupPeriod] Invalid days for congregation ${congId}`,
            );
            continue;
          }
          console.log(
            `🔄 [updateLookupPeriod] Found ${days.length} days for congregation ${congId}`,
          );

          for (const day of days) {
            console.log(
              `🔄 [updateLookupPeriod] Resetting dynamic media for day ${day.date}`,
            );
            resetDay(day);
          }

          lookupPeriod[congId] = days.filter(Boolean);
        } catch (error) {
          console.error(
            `🔄 [updateLookupPeriod] Failed to reset dynamic media for congregation ${congId}:`,
            error,
          );
          errorCatcher(error);
        }
      }

      console.log(
        '✅ [updateLookupPeriod] Dynamic media reset completed for all congregations',
      );
      return; // Exit early — no need for single-congregation flow
    }

    // --- Single-congregation logic ---
    const { currentCongregation, currentSettings } = useCurrentStateStore();
    if (!currentCongregation || !currentSettings) return;

    updateMeetingScheduleIfNeeded(currentSettings);

    if (!lookupPeriod[currentCongregation]) {
      lookupPeriod[currentCongregation] = [];
    }

    const currentDate = new Date();
    extendLookupPeriod(
      currentCongregation,
      currentDate,
      currentSettings,
      lookupPeriod,
    );

    if (reset) {
      const days = onlyForWeekIncluding
        ? getDaysForWeek(
            lookupPeriod[currentCongregation],
            onlyForWeekIncluding,
          )
        : lookupPeriod[currentCongregation];

      if (!days.length) return;

      days.forEach(resetDay);
    }
  } catch (error) {
    errorCatcher(error);
  }
}

function countMedia(day: DateInfo) {
  return (
    day.mediaSections?.reduce((sum, s) => sum + (s.items?.length || 0), 0) || 0
  );
}

function extendLookupPeriod(
  congregation: string,
  currentDate: Date,
  settings: SettingsValues,
  lookupPeriod: Partial<Record<string, DateInfo[]>>,
) {
  if (!lookupPeriod?.[congregation]) return;
  const { getMeetingType } = useCurrentStateStore();
  const DAYS_AHEAD =
    (settings.meteredConnection ? 1 : DAYS_IN_FUTURE) + currentDate.getDay();

  const existingDates = new Set(
    lookupPeriod[congregation]
      .filter((d) => {
        if (!getMeetingType(d.date)) return true;
        const items = d.mediaSections?.flatMap((s) => s.items || []);
        return items?.length > 0;
      })
      .map((d) => formatDate(d.date, 'YYYY/MM/DD')),
  );

  const newDays = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const date = addToDate(getSpecificWeekday(currentDate, 0), { day: i });
    return { date, mediaSections: [], status: null } satisfies DateInfo;
  }).filter((d) => !existingDates.has(formatDate(d.date, 'YYYY/MM/DD')));

  lookupPeriod[congregation] = [
    ...lookupPeriod[congregation],
    ...newDays,
  ].filter(
    (d) => getDateDiff(d.date, getSpecificWeekday(currentDate, 0), 'days') >= 0,
  );
}

function getDaysForWeek(days: DateInfo[], dateStr: string) {
  const monday = getSpecificWeekday(dateFromString(dateStr), 0);
  return days.filter((d) => {
    const weekMonday = getSpecificWeekday(d.date, 0);
    return datesAreSame(monday, weekMonday) || datesAreSame(monday, d.date);
  });
}

function resetDay(day: DateInfo) {
  try {
    const totalBefore = countMedia(day);
    day.status = null;

    if (day.mediaSections) {
      day.mediaSections.forEach((s) => {
        s.items = (s.items || []).filter((i) => i.source !== 'dynamic');
      });
      day.mediaSections = day.mediaSections.filter((s) => s.items?.length);
    }

    const removed = totalBefore - countMedia(day);
    if (removed > 0) console.log(`🗑️ Removed ${removed} dynamic items`);
  } catch (error) {
    errorCatcher(error);
  }
}

function updateMeetingScheduleIfNeeded(settings: SettingsValues) {
  const { meetingScheduleChangeDate: changeDate } = settings;
  if (!changeDate) return;

  const hasExpired =
    (!settings.meetingScheduleChangeOnce && isInPast(changeDate, true)) ||
    (settings.meetingScheduleChangeOnce &&
      isInPast(addToDate(changeDate, { day: 7 }), true));

  if (!hasExpired) return;

  // Apply new schedule (if not one-time)
  if (!settings.meetingScheduleChangeOnce) {
    settings.mwDay = settings.meetingScheduleChangeMwDay ?? settings.mwDay;
    settings.mwStartTime =
      settings.meetingScheduleChangeMwStartTime ?? settings.mwStartTime;
    settings.weDay = settings.meetingScheduleChangeWeDay ?? settings.weDay;
    settings.weStartTime =
      settings.meetingScheduleChangeWeStartTime ?? settings.weStartTime;
  }

  // Clear change fields
  Object.assign(settings, {
    meetingScheduleChangeDate: null,
    meetingScheduleChangeMwDay: null,
    meetingScheduleChangeMwStartTime: null,
    meetingScheduleChangeOnce: false,
    meetingScheduleChangeWeDay: null,
    meetingScheduleChangeWeStartTime: null,
  });
}

export const remainingTimeBeforeMeetingStart = () => {
  try {
    const currentState = useCurrentStateStore();
    const meetingDay =
      !!currentState.isSelectedDayToday &&
      !!currentState.selectedDayMeetingType;
    if (meetingDay) {
      const now = new Date();
      const weMeeting = currentState.selectedDayMeetingType === 'we';
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
