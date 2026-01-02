import type { GeoRecord } from 'src/types';

import { i18n } from 'boot/i18n';
import { storeToRefs } from 'pinia';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { fetchJson } from 'src/utils/api';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

export const syncMeetingSchedule = async (force = false) => {
  try {
    const currentState = useCurrentStateStore();
    const { currentSettings, online } = storeToRefs(currentState);

    if (!currentSettings.value || !online.value) return false;

    // Only sync if enabled or forced
    if (!force && !currentSettings.value.enableAutomaticMeetingScheduleUpdates)
      return false;

    // Only sync if name hasn't been modified
    if (
      currentSettings.value.congregationNameModified ||
      !currentSettings.value.congregationName
    )
      return false;

    // Skip if a future change is already scheduled
    if (currentSettings.value.meetingScheduleChangeDate) {
      console.log(
        '🔄 [syncMeetingSchedule] Skipping lookup as a future change is already scheduled.',
      );
      return false;
    }

    const response = await fetchMeetingLocations(
      currentSettings.value.congregationName,
    );

    const congregationOnlineInfo = response?.geoLocationList?.find(
      (loc) =>
        loc.properties.orgName === currentSettings.value?.congregationName,
    );

    if (congregationOnlineInfo) {
      const { schedule } = congregationOnlineInfo.properties;
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
        currentSettings.value.mwDay !== newMwDay ||
        currentSettings.value.mwStartTime !== newMwTime ||
        currentSettings.value.weDay !== newWeDay ||
        currentSettings.value.weStartTime !== newWeTime
      ) {
        currentSettings.value.mwDay = newMwDay as `${number}`;
        currentSettings.value.mwStartTime = newMwTime;
        currentSettings.value.weDay = newWeDay as `${number}`;
        currentSettings.value.weStartTime = newWeTime;
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
          currentSettings.value.meetingScheduleChangeDate !== newFutureDate ||
          currentSettings.value.meetingScheduleChangeMwDay !== newFutureMwDay ||
          currentSettings.value.meetingScheduleChangeMwStartTime !==
            newFutureMwTime ||
          currentSettings.value.meetingScheduleChangeWeDay !== newFutureWeDay ||
          currentSettings.value.meetingScheduleChangeWeStartTime !==
            newFutureWeTime
        ) {
          currentSettings.value.meetingScheduleChangeDate =
            newFutureDate as `${number}/${number}/${number}`;
          currentSettings.value.meetingScheduleChangeMwDay =
            newFutureMwDay as `${number}`;
          currentSettings.value.meetingScheduleChangeMwStartTime =
            newFutureMwTime;
          currentSettings.value.meetingScheduleChangeWeDay =
            newFutureWeDay as `${number}`;
          currentSettings.value.meetingScheduleChangeWeStartTime =
            newFutureWeTime;
          currentSettings.value.meetingScheduleChangeOnce = false;
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
