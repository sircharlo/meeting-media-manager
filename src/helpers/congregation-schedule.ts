import type {
  GeoRecord,
  NormalizedSchedule,
  ScheduleDetails,
  SettingsValues,
} from 'src/types';

import { i18n } from 'boot/i18n';
import { storeToRefs } from 'pinia';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { fetchJson } from 'src/utils/api';
import { isInPast } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

export const normalizeSchedule = (
  schedule: ScheduleDetails,
): NormalizedSchedule => {
  const normalized: NormalizedSchedule = {
    current: null,
    future: null,
  };

  if (schedule.current) {
    normalized.current = {
      mwDay: `${schedule.current.midweek.weekday - 1}` as `${number}`,
      mwStartTime: schedule.current.midweek.time,
      weDay: `${schedule.current.weekend.weekday - 1}` as `${number}`,
      weStartTime: schedule.current.weekend.time,
    };
  }

  if (schedule.future && schedule.futureDate) {
    if (isInPast(schedule.futureDate, true)) {
      normalized.current = {
        mwDay: `${schedule.future.midweek.weekday - 1}` as `${number}`,
        mwStartTime: schedule.future.midweek.time,
        weDay: `${schedule.future.weekend.weekday - 1}` as `${number}`,
        weStartTime: schedule.future.weekend.time,
      };
    } else {
      normalized.future = {
        date: schedule.futureDate.replace(
          /-/g,
          '/',
        ) as `${number}/${number}/${number}`,
        mwDay: `${schedule.future.midweek.weekday - 1}` as `${number}`,
        mwStartTime: schedule.future.midweek.time,
        weDay: `${schedule.future.weekend.weekday - 1}` as `${number}`,
        weStartTime: schedule.future.weekend.time,
      };
    }
  }

  return normalized;
};

export const applyScheduleToSettings = (
  currentSettings: SettingsValues,
  normalized: NormalizedSchedule,
): { currentChanged: boolean; futureChanged: boolean } => {
  let currentChanged = false;
  let futureChanged = false;

  if (normalized.current) {
    const { mwDay, mwStartTime, weDay, weStartTime } = normalized.current;
    if (
      currentSettings.mwDay !== mwDay ||
      currentSettings.mwStartTime !== mwStartTime ||
      currentSettings.weDay !== weDay ||
      currentSettings.weStartTime !== weStartTime
    ) {
      currentSettings.mwDay = mwDay;
      currentSettings.mwStartTime = mwStartTime;
      currentSettings.weDay = weDay;
      currentSettings.weStartTime = weStartTime;
      currentChanged = true;
    }
  }

  if (normalized.future) {
    const {
      date,
      mwDay: fMwDay,
      mwStartTime: fMwStartTime,
      weDay: fWeDay,
      weStartTime: fWeStartTime,
    } = normalized.future;

    if (
      currentSettings.meetingScheduleChangeDate !== date ||
      currentSettings.meetingScheduleChangeMwDay !== fMwDay ||
      currentSettings.meetingScheduleChangeMwStartTime !== fMwStartTime ||
      currentSettings.meetingScheduleChangeWeDay !== fWeDay ||
      currentSettings.meetingScheduleChangeWeStartTime !== fWeStartTime
    ) {
      currentSettings.meetingScheduleChangeDate = date;
      currentSettings.meetingScheduleChangeMwDay = fMwDay;
      currentSettings.meetingScheduleChangeMwStartTime = fMwStartTime;
      currentSettings.meetingScheduleChangeWeDay = fWeDay;
      currentSettings.meetingScheduleChangeWeStartTime = fWeStartTime;
      currentSettings.meetingScheduleChangeOnce = false;
      futureChanged = true;
    }
  }

  return { currentChanged, futureChanged };
};

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
      const normalized = normalizeSchedule(
        congregationOnlineInfo.properties.schedule,
      );

      const { currentChanged, futureChanged } = applyScheduleToSettings(
        currentSettings.value,
        normalized,
      );

      if (currentChanged) {
        createTemporaryNotification({
          icon: 'mmm-info',
          message: (i18n.global.t as (key: string) => string)(
            'meeting-current-schedule-updated',
          ),
          timeout: 10000,
          type: 'info',
        });
      }

      if (futureChanged) {
        createTemporaryNotification({
          icon: 'mmm-info',
          message: (i18n.global.t as (key: string) => string)(
            'meeting-future-schedule-updated',
          ),
          timeout: 10000,
          type: 'info',
        });
      }

      return currentChanged || futureChanged;
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
