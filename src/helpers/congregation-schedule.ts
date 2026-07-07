import type {
  CongregationMeeting,
  CongregationSearchResult,
  MeetingLanguage,
  MeetingSearchResponse,
  NormalizedSchedule,
  ScheduleDetails,
  SettingsValues,
} from 'src/types';

import { i18n } from 'boot/i18n';
import { storeToRefs } from 'pinia';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { log } from 'src/shared/vanilla';
import { fetchJson } from 'src/utils/api';
import { isInPast } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';

import { updateLookupPeriod } from './date';
import { errorCatcher } from './error-catcher';

let meetingLanguagesPromise: null | Promise<Map<string, string>> = null;

type SyncableScheduleSettings = SettingsValues & {
  congregationName: string;
};

export const getMeetingLanguageMap = async () => {
  meetingLanguagesPromise ??= (async () => {
    const languages =
      (await fetchJson<MeetingLanguage[]>(
        'https://hub.jw.org/meetings/api/languages',
        undefined,
        useCurrentStateStore().online,
      )) || [];
    return new Map(
      languages.map((language) => [language.languageGuid, language.code]),
    );
  })();
  return meetingLanguagesPromise;
};

export const normalizeSchedule = (
  schedule: ScheduleDetails,
): NormalizedSchedule => {
  const normalized: NormalizedSchedule = {
    current: null,
    future: null,
  };

  if (schedule.current) {
    normalized.current = {
      mwDay: `${schedule.current.midweek.weekday - 1}`,
      mwStartTime: schedule.current.midweek.time,
      weDay: `${schedule.current.weekend.weekday - 1}`,
      weStartTime: schedule.current.weekend.time,
    };
  }

  if (schedule.future && schedule.futureDate) {
    if (isInPast(schedule.futureDate, true)) {
      normalized.current = {
        mwDay: `${schedule.future.midweek.weekday - 1}`,
        mwStartTime: schedule.future.midweek.time,
        weDay: `${schedule.future.weekend.weekday - 1}`,
        weStartTime: schedule.future.weekend.time,
      };
    } else {
      normalized.future = {
        date: schedule.futureDate.replaceAll(
          '-',
          '/',
        ) as `${number}/${number}/${number}`,
        mwDay: `${schedule.future.midweek.weekday - 1}`,
        mwStartTime: schedule.future.midweek.time,
        weDay: `${schedule.future.weekend.weekday - 1}`,
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
    const settings = currentSettings.value;

    if (!canSyncMeetingSchedule(settings, online.value, force)) return false;

    const suggestions = await fetchCongregationSuggestions(
      settings.congregationName,
    );
    const exactMatch = getExactCongregationMatch(
      suggestions,
      settings.congregationName,
    );
    if (!exactMatch) return false;

    const response = await fetchMeetingLocations(exactMatch.congregationGuid);
    const selectedMeeting = findOnlineCongregationMeeting(
      response,
      settings.congregationName,
    );
    if (!selectedMeeting) return false;

    const normalized = normalizeOnlineMeetingSchedule(selectedMeeting);
    const changes = applyScheduleToSettings(settings, normalized);
    await handleScheduleSyncChanges(changes);

    return changes.currentChanged || changes.futureChanged;
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'syncMeetingSchedule' } },
    });
    return false;
  }
};

const canSyncMeetingSchedule = (
  currentSettings: null | SettingsValues | undefined,
  online: boolean,
  force: boolean,
): currentSettings is SyncableScheduleSettings => {
  if (!currentSettings || !online) return false;
  if (!force && !currentSettings.enableAutomaticMeetingScheduleUpdates)
    return false;
  if (
    currentSettings.congregationNameModified ||
    !currentSettings.congregationName
  )
    return false;

  if (!currentSettings.meetingScheduleChangeDate) return true;

  log(
    '🔄 [syncMeetingSchedule] Skipping lookup as a future change is already scheduled.',
    'congregationSchedule',
    'log',
  );
  return false;
};

const findOnlineCongregationMeeting = (
  response: MeetingSearchResponse | null,
  congregationName: string,
) => {
  const congregationOnlineInfo = response?.items?.find((item) =>
    item.congregationMeetings.some(
      (meeting) => meeting.name === congregationName,
    ),
  );

  return congregationOnlineInfo?.congregationMeetings.find(
    (meeting) => meeting.name === congregationName,
  );
};

const getExactCongregationMatch = (
  suggestions: CongregationSearchResult[],
  congregationName: string,
) =>
  suggestions.find(
    (result) => result.name.toLowerCase() === congregationName.toLowerCase(),
  );

const getOnlineMeetingWeekday = (weekday: number) =>
  weekday === 0 ? 7 : weekday;

const handleScheduleSyncChanges = async (changes: {
  currentChanged: boolean;
  futureChanged: boolean;
}) => {
  notifyScheduleSyncChanges(changes);

  if (!changes.currentChanged && !changes.futureChanged) return;

  updateLookupPeriod({ reset: true });
  const { fetchMedia } = await import('./jw-media');
  await fetchMedia();
};

const normalizeOnlineMeetingSchedule = (selectedMeeting: CongregationMeeting) =>
  normalizeSchedule({
    changeStamp: null,
    current: {
      midweek: {
        time: selectedMeeting.midweekMeetingTime.slice(
          0,
          5,
        ) as `${number}:${number}`,
        weekday: getOnlineMeetingWeekday(selectedMeeting.midweekMeetingDay),
      },
      weekend: {
        time: selectedMeeting.weekendMeetingTime.slice(
          0,
          5,
        ) as `${number}:${number}`,
        weekday: getOnlineMeetingWeekday(selectedMeeting.weekendMeetingDay),
      },
    },
    future: null,
    futureDate: null,
  });

const notifyScheduleSyncChanges = (changes: {
  currentChanged: boolean;
  futureChanged: boolean;
}) => {
  if (changes.currentChanged) {
    createTemporaryNotification({
      message: i18n.global.t('meeting-current-schedule-updated'),
      timeout: 10000,
      type: 'info',
    });
  }

  if (changes.futureChanged) {
    createTemporaryNotification({
      message: i18n.global.t('meeting-future-schedule-updated'),
      timeout: 10000,
      type: 'info',
    });
  }
};

export const fetchCongregationSuggestions = async (keywords: string) =>
  (await fetchJson<CongregationSearchResult[]>(
    'https://hub.jw.org/meetings/api/congregations',
    new URLSearchParams({
      congregationName: keywords,
    }),
    useCurrentStateStore().online,
  )) || [];

export const fetchMeetingLocations = async (
  meetingLocationEventGuid: string,
): Promise<MeetingSearchResponse | null> => {
  if (!meetingLocationEventGuid)
    return { hasResultsOutsideViewport: false, items: [] };

  const details = await fetchJson<MeetingSearchResponse>(
    'https://hub.jw.org/meetings/api/meeting-search',
    new URLSearchParams({
      first: '20',
      meetingLocationEventGuid,
    }),
    useCurrentStateStore().online,
  );

  return {
    hasResultsOutsideViewport: details?.hasResultsOutsideViewport || false,
    items: details?.items || [],
  };
};
