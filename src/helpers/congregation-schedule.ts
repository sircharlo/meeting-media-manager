import type { GeoRecord } from 'src/types';

import { i18n } from 'boot/i18n';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { fetchJson } from 'src/utils/api';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

export const syncMeetingSchedule = async (force = false) => {
  try {
    const currentState = useCurrentStateStore();
    const { currentSettings, online } = currentState;

    if (!currentSettings || !online) return false;

    // Only sync if enabled or forced
    if (!force && !currentSettings.enableAutomaticMeetingScheduleUpdates)
      return false;

    // Only sync if name hasn't been modified
    if (
      currentSettings.congregationNameModified ||
      !currentSettings.congregationName
    )
      return false;

    // Skip if a future change is already scheduled
    if (currentSettings.meetingScheduleChangeDate) {
      console.log(
        '🔄 [syncMeetingSchedule] Skipping lookup as a future change is already scheduled.',
      );
      return false;
    }

    const response = await fetchMeetingLocations(
      currentSettings.congregationName,
    );

    const congregation = response?.geoLocationList?.find(
      (loc) => loc.properties.orgName === currentSettings.congregationName,
    );

    if (congregation) {
      const { schedule } = congregation.properties;
      let currentChangesMade = false;
      let futureChangesMade = false;

      // Ensure current schedule exists
      if (!schedule.current) return false;

      // Check current schedule
      const newMwDay = `${schedule.current.midweek.weekday - 1}`;
      const newMwTime = schedule.current.midweek.time;
      const newWeDay = `${schedule.current.weekend.weekday - 1}`;
      const newWeTime = schedule.current.weekend.time;

      if (
        currentSettings.mwDay !== newMwDay ||
        currentSettings.mwStartTime !== newMwTime ||
        currentSettings.weDay !== newWeDay ||
        currentSettings.weStartTime !== newWeTime
      ) {
        currentSettings.mwDay = newMwDay as `${number}`;
        currentSettings.mwStartTime = newMwTime;
        currentSettings.weDay = newWeDay as `${number}`;
        currentSettings.weStartTime = newWeTime;
        currentChangesMade = true;
      }

      // Check future schedule
      if (schedule.future && schedule.futureDate) {
        const newFutureDate = schedule.futureDate.replace(/-/g, '/');
        const newFutureMwDay = `${schedule.future.midweek.weekday - 1}`;
        const newFutureMwTime = schedule.future.midweek.time;
        const newFutureWeDay = `${schedule.future.weekend.weekday - 1}`;
        const newFutureWeTime = schedule.future.weekend.time;

        if (
          currentSettings.meetingScheduleChangeDate !== newFutureDate ||
          currentSettings.meetingScheduleChangeMwDay !== newFutureMwDay ||
          currentSettings.meetingScheduleChangeMwStartTime !==
            newFutureMwTime ||
          currentSettings.meetingScheduleChangeWeDay !== newFutureWeDay ||
          currentSettings.meetingScheduleChangeWeStartTime !== newFutureWeTime
        ) {
          currentSettings.meetingScheduleChangeDate =
            newFutureDate as `${number}/${number}/${number}`;
          currentSettings.meetingScheduleChangeMwDay =
            newFutureMwDay as `${number}`;
          currentSettings.meetingScheduleChangeMwStartTime = newFutureMwTime;
          currentSettings.meetingScheduleChangeWeDay =
            newFutureWeDay as `${number}`;
          currentSettings.meetingScheduleChangeWeStartTime = newFutureWeTime;
          currentSettings.meetingScheduleChangeOnce = false;
          futureChangesMade = true;
        }
      }

      if (currentChangesMade) {
        createTemporaryNotification({
          icon: 'mmm-info',
          message: (i18n.global.t as (key: string) => string)(
            'meeting-current-schedule-updated',
          ),
          timeout: 10000,
          type: 'info',
        });
      }

      if (futureChangesMade) {
        createTemporaryNotification({
          icon: 'mmm-info',
          message: (i18n.global.t as (key: string) => string)(
            'meeting-future-schedule-updated',
          ),
          timeout: 10000,
          type: 'info',
        });
      }

      return currentChangesMade || futureChangesMade;
    }
  } catch (error) {
    console.error('❌ [syncMeetingSchedule] Error:', error);
    return false;
  }
};

export const fetchMeetingLocations = async (
  keywords: string,
): Promise<null | { geoLocationList: GeoRecord[] }> => {
  const jwStore = useJwStore();
  const { urlVariables } = jwStore;

  const response = await fetchJson<{ geoLocationList: GeoRecord[] }>(
    `https://apps.${urlVariables.base || 'jw.org'}/api/public/meeting-search/weekly-meetings`,
    new URLSearchParams({
      includeSuggestions: 'true',
      keywords,
      latitude: '0',
      longitude: '0',
      searchLanguageCode: '',
    }),
    useCurrentStateStore().online,
  );

  return response;
};
