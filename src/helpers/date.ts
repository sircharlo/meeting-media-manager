import type { DateInfo, MediaItem } from 'src/types';

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

export function updateLookupPeriod(
  reset = false,
  {
    onlyForWeekIncluding,
    targeted,
  }: {
    onlyForWeekIncluding: string;
    targeted: boolean;
  } = {
    onlyForWeekIncluding: '',
    targeted: false,
  },
) {
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
    if (!lookupPeriod[currentCongregation]) {
      lookupPeriod[currentCongregation] = [];
    }

    const isRelevantMedia = (meeting: string, media: MediaItem[]) => {
      // Since MediaItem doesn't have section property, we'll just check if there's any media
      return media.length > 0;
    };

    const existingDates = new Set(
      lookupPeriod[currentCongregation]
        .filter((d) => {
          if (!d.meeting) return true;
          const allMedia: MediaItem[] = [];
          if (d.mediaSections) {
            d.mediaSections.forEach((sectionMedia) => {
              allMedia.push(...(sectionMedia.items || []));
            });
          }
          return isRelevantMedia(d.meeting, allMedia);
        })
        .map((d) => formatDate(d.date, 'YYYY/MM/DD')),
    );
    const currentDate = new Date();

    const futureDates: DateInfo[] = Array.from(
      {
        length:
          (currentSettings?.meteredConnection ? 1 : DAYS_IN_FUTURE) +
          currentDate.getDay(),
      },
      (_, i) => {
        const dayDate = addToDate(getSpecificWeekday(currentDate, 0), {
          day: i,
        });
        return {
          complete: false,
          date: dayDate,
          error: false,
          mediaSections: [],
          meeting: isMwMeetingDay(dayDate)
            ? 'mw'
            : isWeMeetingDay(dayDate)
              ? 'we'
              : false,
          today: datesAreSame(dayDate, new Date()),
        } satisfies DateInfo;
      },
    ).filter((day) => !existingDates.has(formatDate(day.date, 'YYYY/MM/DD')));

    lookupPeriod[currentCongregation] = [
      ...lookupPeriod[currentCongregation],
      ...futureDates,
    ].filter(
      (day) =>
        getDateDiff(day.date, getSpecificWeekday(currentDate, 0), 'days') >= 0,
    );

    const todayDate = lookupPeriod[currentCongregation].find((d) =>
      datesAreSame(d.date, new Date()),
    );
    if (todayDate) todayDate.today = true;

    function getTargetedDays() {
      console.group('🎯 Targeted Days Selection');
      if (!lookupPeriod[currentCongregation]) {
        console.log('⚠️ No lookup period found for current congregation');
        return [];
      }

      console.log(
        '📅 Getting targeted days for week including:',
        onlyForWeekIncluding,
      );

      const mondayOfTargetedWeek = getSpecificWeekday(
        dateFromString(onlyForWeekIncluding),
        0,
      );

      console.log(
        '📍 Target week Monday:',
        mondayOfTargetedWeek.toISOString().split('T')[0],
      );

      const result = lookupPeriod[currentCongregation].filter((day) => {
        const mondayOfLookupWeek = getSpecificWeekday(day.date, 0);
        const isTargetWeek =
          datesAreSame(mondayOfTargetedWeek, mondayOfLookupWeek) ||
          datesAreSame(mondayOfTargetedWeek, day.date);

        if (isTargetWeek) {
          console.log(
            `  ✓ Including day: ${day.date.toISOString().split('T')[0]}`,
          );
        }

        return isTargetWeek;
      });
      console.groupEnd();
      return result;
    }

    function getAllDays() {
      console.group('🌍 All Days Selection');
      console.log('📋 Getting all days for congregation');
      const result = lookupPeriod[currentCongregation];
      console.groupEnd();
      return result;
    }

    function resetDay(day: DateInfo) {
      console.group(
        `📅 Resetting Day - ${day.date.toISOString().split('T')[0]}`,
      );
      // Get total media count before reset
      let beforeDynamicCount = 0;
      if (day.mediaSections) {
        day.mediaSections.forEach((sectionMedia) => {
          beforeDynamicCount += sectionMedia.items?.length || 0;
        });
      }

      // Reset status flags
      day.complete = false;
      day.error = false;

      // Remove dynamic media from all sections
      if (day.mediaSections) {
        day.mediaSections.forEach((sectionMedia) => {
          if (sectionMedia?.items?.length) {
            for (let i = sectionMedia.items?.length - 1; i >= 0; i--) {
              if (sectionMedia.items?.[i]?.source === 'dynamic') {
                sectionMedia.items?.splice(i, 1);
              }
            }
          }
        });
      }

      // Get total media count after reset
      let afterDynamicCount = 0;
      if (day.mediaSections) {
        day.mediaSections.forEach((sectionMedia) => {
          afterDynamicCount += sectionMedia.items?.length || 0;
        });
      }

      // Remove all sections that have no items if they are meeting sections and its a meeting day
      if (day.meeting) {
        day.mediaSections = day.mediaSections.filter((section) => {
          return !!section.items?.length;
        });
      }

      const removedCount = beforeDynamicCount - afterDynamicCount;
      if (removedCount > 0) {
        console.log(`🗑️ Removed ${removedCount} dynamic media items`);
      }

      // Set meeting type
      day.meeting = isMwMeetingDay(day.date)
        ? 'mw'
        : isWeMeetingDay(day.date)
          ? 'we'
          : false;

      // Update today flag
      day.today = datesAreSame(day.date, new Date());

      console.log(
        `📝 Set meeting type: ${day.meeting || 'none'}, today: ${day.today}`,
      );
      console.groupEnd();
    }

    if (reset) {
      console.group('🔄 Lookup Period Reset');
      console.log('📋 Reset parameters:', {
        currentCongregation,
        targeted,
      });

      const daysToReset = targeted ? getTargetedDays() : getAllDays() || [];
      if (!daysToReset.length) {
        console.log('⚠️ No days found to reset');
        console.groupEnd();
        return;
      }

      console.log(`📅 Found ${daysToReset.length} days to reset`);

      daysToReset.forEach((day, index) => {
        console.log(
          `🛠️  Resetting day ${index + 1}/${daysToReset.length}:`,
          day?.date?.toISOString().split('T')[0],
        );
        resetDay(day);
      });

      console.log('✅ Reset process completed');
      console.groupEnd();
    }
  } catch (error) {
    errorCatcher(error);
  } finally {
    // Ensure any open console groups are closed
    if (reset) {
      console.groupEnd();
    }
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
