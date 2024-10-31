import type {
  DateInfo,
  DownloadedFile,
  DownloadProgressItems,
  SettingsValues,
} from 'src/types';

import { defineStore } from 'pinia';
import { date } from 'quasar';
import { settingsDefinitions } from 'src/constants/settings';
import { electronApi } from 'src/helpers/electron-api';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getAdditionalMediaPath } from 'src/helpers/fs';
import { formatTime } from 'src/helpers/mediaPlayback';
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useJwStore } from 'src/stores/jw';

const { formatDate, getDateDiff } = date;
const { fs, path } = electronApi;

interface Store {
  currentCongregation: string;
  currentSongRemainingTime: string;
  downloadedFiles: Record<string, DownloadedFile | Promise<DownloadedFile>>;
  downloadProgress: DownloadProgressItems;
  extractedFiles: Record<string, Promise<string>>;
  mediaPlayingAction: string;
  mediaPlayingCurrentPosition: number;
  mediaPlayingPanzoom: Record<string, number>;
  mediaPlayingSeekTo: number;
  mediaPlayingSubtitlesUrl: string;
  mediaPlayingUniqueId: string;
  mediaPlayingUrl: string;
  mediaWindowCustomBackground: string;
  mediaWindowVisible: boolean;
  meetingDay: boolean;
  musicPlaying: boolean;
  musicStarting: boolean;
  musicStopping: boolean;
  online: boolean;
  onlyShowInvalidSettings: boolean;
  selectedDate: string;
  timeRemainingBeforeMusicStop: number;
}

export const useCurrentStateStore = defineStore('current-state', {
  actions: {
    getInvalidSettings(congregation?: number | string) {
      try {
        if (!congregation) congregation = this.currentCongregation;
        if (!congregation) return [];
        const invalidSettings = [];
        for (const [settingsDefinitionId, settingsDefinition] of Object.entries(
          settingsDefinitions,
        )) {
          if (settingsDefinition.rules?.includes('notEmpty')) {
            const congregationSettingsStore = useCongregationSettingsStore();
            if (
              !congregationSettingsStore.congregations[congregation]?.[
                settingsDefinitionId as keyof SettingsValues
              ]?.toString() &&
              (!settingsDefinition.rules?.includes('regular') ||
                !congregationSettingsStore.congregations[congregation]
                  ?.disableMediaFetching)
            ) {
              invalidSettings.push(settingsDefinitionId);
            }
          }
        }
        return invalidSettings as (keyof SettingsValues)[];
      } catch (error) {
        errorCatcher(error);
        return [];
      }
    },
    invalidSettings(congregation?: number | string) {
      if (!congregation) congregation = this.currentCongregation;
      if (!congregation) return false;
      return this.getInvalidSettings(congregation).length > 0;
    },
    setCongregation(value: number | string) {
      if (!value) return false;
      this.currentCongregation = value.toString();
      return this.getInvalidSettings(this.currentCongregation).length > 0;
    },
  },

  getters: {
    congregationIsSelected(state) {
      return state.currentCongregation;
    },
    currentSettings(state) {
      const congregationSettingsStore = useCongregationSettingsStore();
      return Object.keys(congregationSettingsStore.congregations).length > 0
        ? congregationSettingsStore.congregations[state.currentCongregation]
        : null;
    },
    currentSongbook() {
      const notSignLanguageSongbook = {
        fileformat: 'mp3',
        pub: 'sjjm',
        signLanguage: false,
      };
      try {
        const signLanguageSongbook = {
          fileformat: 'mp4',
          pub: 'sjj',
          signLanguage: true,
        };
        const jwStore = useJwStore();
        const currentLanguage = this.currentSettings?.lang as string;
        if (!currentLanguage || !jwStore.jwLanguages)
          return notSignLanguageSongbook;
        const currentLanguageIsSignLanguage = !!jwStore.jwLanguages?.list?.find(
          (l) => l.langcode === currentLanguage,
        )?.isSignLanguage;
        return currentLanguageIsSignLanguage
          ? signLanguageSongbook
          : notSignLanguageSongbook;
      } catch (error) {
        errorCatcher(error);
        return notSignLanguageSongbook;
      }
    },
    currentSongs() {
      const jwStore = useJwStore();
      const currentLanguage = this.currentSettings?.lang as string;
      if (!currentLanguage) return [];
      return jwStore.jwSongs[currentLanguage]?.list || [];
    },
    getDatedAdditionalMediaDirectory(state) {
      try {
        if (!state.selectedDate) return '';
        const additionalMediaPath = getAdditionalMediaPath();
        const dateString = formatDate(new Date(state.selectedDate), 'YYYYMMDD');
        const datedAdditionalMediaDirectory = path.join(
          additionalMediaPath,
          state.currentCongregation,
          dateString,
        );
        fs.ensureDirSync(datedAdditionalMediaDirectory);
        return datedAdditionalMediaDirectory;
      } catch (error) {
        errorCatcher(error);
        return '';
      }
    },
    mediaPaused(state) {
      return (
        state.mediaPlayingUrl !== '' && state.mediaPlayingAction === 'pause'
      );
    },
    mediaPlaying(state) {
      return (
        state.mediaPlayingUrl !== '' || state.mediaPlayingAction === 'website'
      );
    },
    musicRemainingTime(state) {
      try {
        if (state.musicStarting) return 'music.starting';
        if (state.musicStopping) return 'music.stopping';
        if (state.meetingDay && state.timeRemainingBeforeMusicStop > 0)
          return formatTime(state.timeRemainingBeforeMusicStop);
        return state.currentSongRemainingTime;
      } catch (error) {
        errorCatcher(error);
        return '..:..';
      }
    },
    selectedDateObject(state): DateInfo | null {
      const jwStore = useJwStore();
      if (!jwStore.lookupPeriod?.[state.currentCongregation]?.length) {
        return null;
      }
      return (
        jwStore.lookupPeriod?.[state.currentCongregation]?.find(
          (day) => getDateDiff(day.date, state.selectedDate, 'days') === 0,
        ) || jwStore.lookupPeriod[state.currentCongregation][0]
      );
    },
  },
  state: (): Store => {
    return {
      currentCongregation: '',
      currentSongRemainingTime: '..:..',
      downloadedFiles: {},
      downloadProgress: {},
      extractedFiles: {},
      mediaPlayingAction: '',
      mediaPlayingCurrentPosition: 0,
      mediaPlayingPanzoom: { scale: 1, x: 0, y: 0 },
      mediaPlayingSeekTo: 0,
      mediaPlayingSubtitlesUrl: '',
      mediaPlayingUniqueId: '',
      mediaPlayingUrl: '',
      mediaWindowCustomBackground: '',
      mediaWindowVisible: true,
      meetingDay: false,
      musicPlaying: false,
      musicStarting: false,
      musicStopping: false,
      online: true,
      onlyShowInvalidSettings: false,
      selectedDate: date.formatDate(new Date(), 'YYYY/MM/DD'),
      timeRemainingBeforeMusicStop: 0,
    };
  },
});
