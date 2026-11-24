import type { DateInfo, SettingsValues } from 'src/types';

import { i18n } from 'boot/i18n';
import { WEEKS_TO_FETCH } from 'src/constants/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
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

import { createTemporaryNotification } from './notifications';

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
      errorCatcher(new Error('isCoWeek: Received non-Date object'), {
        contexts: {
          fn: {
            constructor: (
              lookupDate as unknown as { constructor: { name: string } }
            ).constructor?.name,
            keys: Object.keys(lookupDate),
            name: 'isCoWeek',
            type: typeof lookupDate,
            value: lookupDate,
          },
        },
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

const isWeekendDay = (date: Date) => [0, 6].includes(date.getDay());

/**
 * The Memorial held in the same Monday-to-Sunday week as this date, if any,
 * from the yearly dates M³ fetched and the one in the settings.
 */
export const getMemorialInWeek = (lookupDate?: Date | string) => {
  try {
    const currentState = useCurrentStateStore();
    const jwStore = useJwStore();
    if (!lookupDate || currentState.currentSettings?.disableMediaFetching) {
      return undefined;
    }

    const lookupWeekMonday = getSpecificWeekday(dateFromString(lookupDate), 0);
    const memorialDate = [
      currentState.currentSettings?.memorialDate,
      ...Object.values(jwStore.memorials ?? {}),
    ].find(
      (date) =>
        !!date && datesAreSame(lookupWeekMonday, getSpecificWeekday(date, 0)),
    );
    return memorialDate ? dateFromString(memorialDate) : undefined;
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'getMemorialInWeek' } } });
    return undefined;
  }
};

/**
 * The Memorial replaces the meeting in its own half of the week: the
 * midweek meeting for a Memorial on a weekday, the weekend meeting for one
 * on a weekend.
 */
export const isReplacedByMemorial = (lookupDate?: Date) => {
  try {
    if (!lookupDate) return false;
    const memorialDate = getMemorialInWeek(lookupDate);
    if (!memorialDate) return false;
    return (
      isWeekendDay(memorialDate) === isWeekendDay(dateFromString(lookupDate))
    );
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const isMemorialDay = (lookupDate?: Date | string) => {
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

    return datesAreSame(lookupDate, memorialDate);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

/**
 * Whether this is the congregation's midweek meeting day by its schedule,
 * before a circuit overseer's visit or the Memorial moves or replaces the
 * meeting.
 */
export const isScheduledMwDay = (lookupDate?: Date) => {
  try {
    if (!lookupDate) return false;
    lookupDate = dateFromString(lookupDate);
    const { currentSettings } = useCurrentStateStore();
    const mwDay = shouldUseChangedMeetingSchedule(lookupDate)
      ? (currentSettings?.meetingScheduleChangeMwDay ?? currentSettings?.mwDay)
      : currentSettings?.mwDay;
    return mwDay === getWeekDay(lookupDate);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

/** Same as isScheduledMwDay, for the weekend meeting. */
export const isScheduledWeDay = (lookupDate?: Date) => {
  try {
    if (!lookupDate) return false;
    lookupDate = dateFromString(lookupDate);
    const { currentSettings } = useCurrentStateStore();
    const changedWeDay = currentSettings?.meetingScheduleChangeWeDay;
    const weDay =
      changedWeDay && shouldUseChangedMeetingSchedule(lookupDate)
        ? changedWeDay
        : currentSettings?.weDay;
    return weDay === getWeekDay(lookupDate);
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
    if (isCoWeek(lookupDate)) {
      const coWeekTuesday = dateFromString(
        currentState.currentSettings?.coWeek ?? undefined,
      );
      return datesAreSame(coWeekTuesday, lookupDate);
    }
    return isScheduledMwDay(lookupDate);
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

    return isScheduledWeDay(lookupDate);
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
  congregationIds,
  multipleCongregations,
  onlyForWeekIncluding,
  reset,
}: {
  congregationIds?: string[];
  multipleCongregations?: boolean;
  onlyForWeekIncluding?: string;
  reset?: boolean;
} = {}) {
  try {
    const { lookupPeriod } = useJwStore();

    if (!lookupPeriod || typeof lookupPeriod !== 'object') return;

    if (reset && multipleCongregations) {
      resetAllCongregations(lookupPeriod, congregationIds);
      return;
    }

    const { currentCongregation, currentSettings } = useCurrentStateStore();
    if (!currentCongregation || !currentSettings) return;

    updateMeetingScheduleIfNeeded(currentSettings);

    lookupPeriod[currentCongregation] ??= [];

    extendLookupPeriod(
      currentCongregation,
      new Date(),
      currentSettings,
      lookupPeriod,
    );

    if (reset) {
      resetSingleCongregation(
        lookupPeriod[currentCongregation],
        onlyForWeekIncluding,
      );
    }
  } catch (error) {
    errorCatcher(error);
  }
}

function countMedia(day: DateInfo) {
  return (
    day.mediaSections?.reduce((sum, s) => sum + (s.items?.length ?? 0), 0) || 0
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
  // Whole weeks from this week's Monday, whatever today's weekday is. A
  // metered connection keeps just the current week: meetings after tomorrow
  // still aren't fetched there (see shouldSkipMeteredMeeting in jw-media.ts).
  const DAYS_AHEAD = (settings.meteredConnection ? 1 : WEEKS_TO_FETCH) * 7;

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

function resetAllCongregations(
  lookupPeriod: Partial<Record<string, (DateInfo | undefined)[]>>,
  congregationIds?: string[],
) {
  const targetCongregationIds = Object.keys(lookupPeriod).filter(
    (id) =>
      id &&
      Array.isArray(lookupPeriod[id]) &&
      (!congregationIds || congregationIds.includes(id)),
  );

  log(
    `🔄 [updateLookupPeriod] Resetting dynamic media for ${targetCongregationIds.length} congregations`,
    'dateHelpers',
    'log',
  );

  for (const congId of targetCongregationIds) {
    try {
      const days = lookupPeriod[congId];
      if (!Array.isArray(days)) continue;

      days.forEach((day) => day && resetDay(day));
      lookupPeriod[congId] = days.filter(Boolean);
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            congId,
            name: 'resetAllCongregations',
          },
        },
      });
    }
  }

  log(
    '✅ [updateLookupPeriod] Dynamic media reset completed for all congregations',
    'dateHelpers',
    'log',
  );
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
    if (removed > 0)
      log(`🗑️ Removed ${removed} dynamic items`, 'dateHelpers', 'log');
  } catch (error) {
    errorCatcher(error);
  }
}

function resetSingleCongregation(
  days: DateInfo[],
  onlyForWeekIncluding?: string,
) {
  const targetDays = onlyForWeekIncluding
    ? getDaysForWeek(days, onlyForWeekIncluding)
    : days;

  if (targetDays.length) {
    targetDays.forEach((day) => resetDay(day));
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

  // Notify user
  createTemporaryNotification({
    deferWhileDialogOpen: true,
    message: i18n.global.t('meeting-schedule-change-applied'),
    timeout: 10_000,
    type: 'info',
  });

  // Clear change fields
  Object.assign(settings, {
    meetingScheduleChangeDate: null,
    meetingScheduleChangeMwDay: null,
    meetingScheduleChangeMwStartTime: null,
    meetingScheduleChangeOnce: false,
    meetingScheduleChangeWeDay: null,
    meetingScheduleChangeWeStartTime: null,
  });

  // Update lookup period
  updateLookupPeriod({ reset: true });
}

// When a meeting of the given type held on `now`'s date starts, or null if
// no start time is configured for it.
const getMeetingStartOn = (now: Date, meetingType: 'mw' | 'we') => {
  const { currentSettings } = useCurrentStateStore();
  const meetingStartTimes = shouldUseChangedMeetingSchedule(now)
    ? {
        mw:
          currentSettings?.meetingScheduleChangeMwStartTime ??
          currentSettings?.mwStartTime,
        we:
          currentSettings?.meetingScheduleChangeWeStartTime ??
          currentSettings?.weStartTime,
      }
    : {
        mw: currentSettings?.mwStartTime,
        we: currentSettings?.weStartTime,
      };
  const meetingStartTime = meetingStartTimes[meetingType];
  if (!meetingStartTime) return null;

  const [hours, minutes] = meetingStartTime.split(':').map(Number);
  const meetingStartDateTime = new Date(now);
  meetingStartDateTime.setHours(hours ?? 0, minutes, 0, 0);
  return meetingStartDateTime;
};

// Today's meeting start time as an actual Date, or null if today isn't a
// meeting day or no start time is configured. Shared by
// remainingTimeBeforeMeetingStart() and anything that needs to display the
// planned start time itself, not just a countdown to it.
export const getTodaysMeetingStartDateTime = (
  referenceDate = new Date(),
): Date | null => {
  try {
    const currentState = useCurrentStateStore();
    const meetingDay =
      !!currentState.isSelectedDayToday &&
      !!currentState.selectedDayMeetingType;
    if (!meetingDay) return null;

    return getMeetingStartOn(
      new Date(referenceDate),
      currentState.selectedDayMeetingType === 'we' ? 'we' : 'mw',
    );
  } catch (error) {
    errorCatcher(error);
    return null;
  }
};

/**
 * Today's meeting start time, going by the calendar date itself rather than
 * the day selected in the media calendar (which getTodaysMeetingStartDateTime
 * requires to be today); null if today isn't a meeting day or no start time
 * is configured.
 */
export const getMeetingStartToday = (referenceDate = new Date()) => {
  try {
    const now = new Date(referenceDate);
    if (isMwMeetingDay(now)) return getMeetingStartOn(now, 'mw');
    if (isWeMeetingDay(now)) return getMeetingStartOn(now, 'we');
    return null;
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'getMeetingStartToday' } } });
    return null;
  }
};

export const remainingTimeBeforeMeetingStart = (referenceDate = new Date()) => {
  try {
    const meetingStartDateTime = getTodaysMeetingStartDateTime(referenceDate);
    if (!meetingStartDateTime) return 0;
    return getDateDiff(meetingStartDateTime, referenceDate, 'seconds');
  } catch (error) {
    errorCatcher(error);
    return 0;
  }
};
