import type {
  DateInfo,
  DownloadedFile,
  DownloadProgressItems,
  DynamicMediaObject,
  MediaLink,
  SettingsItem,
  SettingsItems,
  SettingsValues,
} from 'src/types';

import { defineStore } from 'pinia';
import { date } from 'quasar';
import { settingsDefinitions } from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getAdditionalMediaPath } from 'src/helpers/fs';
import { formatTime } from 'src/helpers/mediaPlayback';
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useJwStore } from 'src/stores/jw';

const { formatDate, getDateDiff } = date;
const { fs, path } = window.electronApi;

interface Store {
  currentCongregation: string;
  currentSongRemainingTime: string;
  downloadedFiles: Partial<
    Record<string, DownloadedFile | Promise<DownloadedFile>>
  >;
  downloadProgress: DownloadProgressItems;
  extractedFiles: Partial<Record<string, string>>;
  mediaPlayingAction: '' | 'pause' | 'play' | 'website';
  mediaPlayingCurrentPosition: number;
  mediaPlayingPanzoom: Partial<Record<string, number>>;
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
  watchFolderMedia: Record<string, DynamicMediaObject[]>;
}

interface Songbook {
  fileformat: 'MP3' | 'MP4';
  pub: 'sjj' | 'sjjm';
  signLanguage: boolean;
}

const settingDefinitionEntries = Object.entries(settingsDefinitions) as [
  keyof SettingsItems,
  SettingsItem,
][];

export const useCurrentStateStore = defineStore('current-state', {
  actions: {
    async getDatedAdditionalMediaDirectory() {
      try {
        if (!this.selectedDate) return '';
        const additionalMediaPath = await getAdditionalMediaPath();
        const dateString = formatDate(new Date(this.selectedDate), 'YYYYMMDD');
        const datedAdditionalMediaDirectory = path.join(
          additionalMediaPath,
          this.currentCongregation,
          dateString,
        );
        await fs.ensureDir(datedAdditionalMediaDirectory);
        return datedAdditionalMediaDirectory;
      } catch (error) {
        errorCatcher(error);
        return '';
      }
    },
    getInvalidSettings(
      congregation?: number | string,
    ): (keyof SettingsValues)[] {
      try {
        if (!congregation) congregation = this.currentCongregation;
        if (!congregation) return [];
        const invalidSettings = new Set<keyof SettingsValues>();
        const { urlVariables } = useJwStore();
        const congregationSettingsStore = useCongregationSettingsStore();
        for (const [
          settingsDefinitionId,
          settingsDefinition,
        ] of settingDefinitionEntries) {
          if (settingsDefinition.rules?.includes('notEmpty')) {
            if (
              (settingsDefinitionId === 'baseUrl' &&
                !(urlVariables?.base && urlVariables?.mediator)) ||
              (!congregationSettingsStore.congregations[congregation]?.[
                settingsDefinitionId
              ]?.toString() &&
                (!settingsDefinition.rules?.includes('regular') ||
                  !congregationSettingsStore.congregations[congregation]
                    ?.disableMediaFetching))
            ) {
              invalidSettings.add(settingsDefinitionId);
            }
          }
        }
        return [...invalidSettings];
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
    congregationIsSelected: (state) => {
      return state.currentCongregation;
    },
    currentSettings: (state) => {
      const congregationSettingsStore = useCongregationSettingsStore();
      return Object.keys(congregationSettingsStore.congregations).length > 0
        ? congregationSettingsStore.congregations[state.currentCongregation]
        : null;
    },
    currentSongbook(): Songbook {
      const notSignLanguageSongbook: Songbook = {
        fileformat: 'MP3',
        pub: 'sjjm',
        signLanguage: false,
      };
      try {
        const signLanguageSongbook: Songbook = {
          fileformat: 'MP4',
          pub: 'sjj',
          signLanguage: true,
        };
        const jwStore = useJwStore();
        const currentLanguage = this.currentSettings?.lang;
        if (!currentLanguage || !jwStore.jwLanguages) {
          return notSignLanguageSongbook;
        }

        const currentLanguageIsSignLanguage = !!jwStore.jwLanguages.list?.find(
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
    currentSongs(): MediaLink[] {
      const jwStore = useJwStore();
      const currentLanguage = this.currentSettings?.lang;
      if (!currentLanguage) return [];
      return jwStore.jwSongs[currentLanguage]?.list || [];
    },
    mediaPaused: (state) => {
      return (
        state.mediaPlayingUrl !== '' && state.mediaPlayingAction === 'pause'
      );
    },
    mediaPlaying: (state) => {
      return (
        state.mediaPlayingUrl !== '' || state.mediaPlayingAction === 'website'
      );
    },
    musicRemainingTime: (state) => {
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
    selectedDateObject: (state): DateInfo | null => {
      const jwStore = useJwStore();
      if (!jwStore.lookupPeriod?.[state.currentCongregation]?.length) {
        return null;
      }
      return (
        jwStore.lookupPeriod?.[state.currentCongregation]?.find(
          (day) => getDateDiff(day.date, state.selectedDate, 'days') === 0,
        ) ||
        jwStore.lookupPeriod[state.currentCongregation]?.[0] ||
        null
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
      selectedDate: formatDate(new Date(), 'YYYY/MM/DD'),
      timeRemainingBeforeMusicStop: 0,
      watchFolderMedia: {},
    };
  },
});
