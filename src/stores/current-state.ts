import type {
  DateInfo,
  DownloadedFile,
  DownloadProgressItems,
  JwLanguage,
  JwSite,
  MediaItem,
  MediaLink,
  SettingsItem,
  SettingsItems,
  SettingsValues,
} from 'src/types';

import { defineStore } from 'pinia';
import { settingsDefinitions } from 'src/constants/settings';
import { isMwMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { datesAreSame, formatDate } from 'src/utils/date';
import {
  getAdditionalMediaPath,
  isFileUrl,
  setCachedUserDataPath,
} from 'src/utils/fs';
import { isEmpty, isUUID } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';

const { fs, path } = window.electronApi;
const { ensureDir } = fs;
const { join } = path;

export interface MediaPlayingState {
  action: MediaPlayingStateAction;
  currentPosition: number;
  pan: Partial<{ x: number; y: number }>;
  seekTo: number;
  subtitlesUrl: string;
  uniqueId: string;
  url: string;
  zoom: number;
}

export type MediaPlayingStateAction =
  | ''
  | 'mirroringWebsite'
  | 'pause'
  | 'play'
  | 'previewingWebsite';

export interface Songbook {
  fileformat: 'MP3' | 'MP4';
  pub: 'sjj' | 'sjjm';
  signLanguage: boolean;
}

interface Store {
  autoReturnFromWebsite: boolean;
  currentCongregation: string;
  downloadedFiles: Partial<
    Record<string, DownloadedFile | Promise<DownloadedFile>>
  >;
  downloadProgress: DownloadProgressItems;
  extractedFiles: Partial<Record<string, string>>;
  ffmpegPath: string;
  mediaPlaying: MediaPlayingState;
  mediaWindowCustomBackground: string;
  mediaWindowVisible: boolean;
  meetingDay: boolean;
  online: boolean;
  onlyShowInvalidSettings: boolean;
  selectedDate: string;
  websiteSelection: JwSite;
}

const settingDefinitionEntries = Object.entries(settingsDefinitions) as [
  keyof SettingsItems,
  SettingsItem,
][];

export const useCurrentStateStore = defineStore('current-state', {
  actions: {
    async getDatedAdditionalMediaDirectory(destDate?: string) {
      try {
        if (!destDate) destDate = this.selectedDate;
        if (!destDate) return '';
        const additionalMediaPath = await getAdditionalMediaPath(
          this.currentSettings?.cacheFolder,
        );
        const dateString = formatDate(new Date(destDate), 'YYYYMMDD');
        const datedAdditionalMediaDirectory = join(
          additionalMediaPath,
          this.currentCongregation,
          dateString,
        );
        await ensureDir(datedAdditionalMediaDirectory);
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
            // Check if dependencies are satisfied before applying notEmpty validation
            const dependenciesSatisfied =
              !settingsDefinition.depends ||
              (Array.isArray(settingsDefinition.depends)
                ? settingsDefinition.depends.every(
                    (dep) =>
                      congregationSettingsStore.congregations[
                        congregation as string
                      ]?.[dep],
                  )
                : congregationSettingsStore.congregations[congregation]?.[
                    settingsDefinition.depends
                  ]);

            // Only apply notEmpty validation if dependencies are satisfied
            if (dependenciesSatisfied) {
              if (
                (settingsDefinitionId === 'baseUrl' &&
                  !(urlVariables?.base && urlVariables?.mediator)) ||
                (isEmpty(
                  congregationSettingsStore.congregations[congregation]?.[
                    settingsDefinitionId
                  ],
                ) &&
                  (!settingsDefinition.rules?.includes('regular') ||
                    !congregationSettingsStore.congregations[congregation]
                      ?.disableMediaFetching))
              ) {
                invalidSettings.add(settingsDefinitionId);
              }
            }
          }
        }
        return [...invalidSettings];
      } catch (error) {
        errorCatcher(error);
        return [];
      }
    },
    getMeetingType(lookupDate?: Date): 'mw' | 'we' | null {
      try {
        if (!lookupDate || !(lookupDate instanceof Date)) return null;
        const jwStore = useJwStore();
        if (!this.currentCongregation || !jwStore.lookupPeriod) return null;
        const congregationLookupPeriod =
          jwStore.lookupPeriod[this.currentCongregation];
        if (!congregationLookupPeriod) return null;
        const dateInfo = congregationLookupPeriod.find((day) =>
          datesAreSame(day.date, lookupDate),
        );
        if (!dateInfo?.date || !(dateInfo.date instanceof Date)) return null;
        return isMwMeetingDay(dateInfo.date)
          ? 'mw'
          : isWeMeetingDay(dateInfo.date)
            ? 'we'
            : null;
      } catch (error) {
        errorCatcher(error);
        return null;
      }
    },
    invalidSettings(congregation?: number | string) {
      if (!congregation) congregation = this.currentCongregation;
      if (!congregation) return false;
      return this.getInvalidSettings(congregation).length > 0;
    },
    setCongregation: async function (value: number | string) {
      if (!value) return false;
      this.currentCongregation = value.toString();
      await setCachedUserDataPath();
      return this.getInvalidSettings(this.currentCongregation).length > 0;
    },
  },
  getters: {
    additionalScenes(): string[] {
      const { scenes } = useObsStateStore();
      const configuredScenes = [
        this.currentSettings?.obsCameraScene,
        this.currentSettings?.obsMediaScene,
        this.currentSettings?.obsImageScene,
      ].filter((s): s is string => !!s);

      const scenesAreUUIDS = configuredScenes.every(isUUID);
      return scenes
        .filter(
          (scene) =>
            !configuredScenes.includes(
              (scenesAreUUIDS && scene.sceneUuid
                ? scene.sceneUuid.toString()
                : scene.sceneName?.toString()) || '',
            ),
        )
        .map(
          (scene): string =>
            (scenesAreUUIDS && scene.sceneUuid
              ? scene.sceneUuid.toString()
              : scene.sceneName?.toString()) || '',
        )
        .filter(Boolean);
    },
    configuredScenesAreAllUUIDs(): boolean {
      const configuredScenes = [
        this.currentSettings?.obsCameraScene,
        this.currentSettings?.obsImageScene,
        this.currentSettings?.obsMediaScene,
      ].filter((s): s is string => !!s);
      if (!configuredScenes.length) return true;
      return configuredScenes.every((scene) => isUUID(scene));
    },
    congregationIsSelected: (state) => {
      return state.currentCongregation;
    },
    countItemsForSelectedDate(): number {
      if (!this.selectedDateObject?.mediaSections) return 0;

      let count = 0;

      Object.values(this.selectedDateObject.mediaSections).forEach(
        (sectionMedia) => {
          count += sectionMedia.items?.length || 0;
        },
      );

      return count;
    },
    countItemsHiddenForSelectedDate(): number {
      if (!this.selectedDateObject?.mediaSections) return 0;

      let count = 0;

      Object.values(this.selectedDateObject.mediaSections).forEach(
        (sectionMedia) => {
          sectionMedia.items?.forEach((item: MediaItem) => {
            if (item.hidden) count++;

            if (item.children) {
              count += item.children.filter(
                (child: MediaItem) => child.hidden,
              ).length;
            }
          });
        },
      );

      return count;
    },

    currentLangObject(): JwLanguage | undefined {
      const jwStore = useJwStore();
      return jwStore.jwLanguages.list.find(
        (l) => l.langcode === this.currentSettings?.lang,
      );
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
    isSelectedDayToday(): boolean {
      try {
        const selectedDateObj = this.selectedDateObject as DateInfo | null;
        if (!selectedDateObj?.date) return false;
        return datesAreSame(selectedDateObj.date, new Date());
      } catch (error) {
        errorCatcher(error);
        return false;
      }
    },
    // Direct access to media sections - no need for getter methods anymore
    // Use selectedDateObject.mediaSections directly for all media
    // Use selectedDateObject.mediaSections.find(s => s.config.uniqueId === section)?.items.filter(item => !item.hidden) for visible media
    mediaIsPlaying: (state) => {
      return (
        state.mediaPlaying.url !== '' ||
        state.mediaPlaying.action === 'mirroringWebsite' ||
        state.mediaPlaying.action === 'previewingWebsite'
      );
    },
    mediaPaused: (state) => {
      return (
        state.mediaPlaying.url !== '' && state.mediaPlaying.action === 'pause'
      );
    },
    missingMedia(state): MediaItem[] {
      if (
        !state.currentCongregation ||
        !this.selectedDateObject?.mediaSections
      ) {
        return [];
      }

      const allMedia: MediaItem[] = [];
      Object.values(this.selectedDateObject.mediaSections).forEach(
        (sectionMedia) => {
          allMedia.push(...(sectionMedia.items || []));
        },
      );

      return allMedia.filter(
        (media) => !media.children?.length && !isFileUrl(media.fileUrl),
      );
    },
    selectedDateObject: (state): DateInfo | null => {
      const jwStore = useJwStore();
      if (
        !state.selectedDate ||
        !jwStore.lookupPeriod?.[state.currentCongregation]?.length
      ) {
        return null;
      }
      return (
        jwStore.lookupPeriod?.[state.currentCongregation]?.find((day) =>
          datesAreSame(day.date, state.selectedDate),
        ) ||
        jwStore.lookupPeriod[state.currentCongregation]?.[0] ||
        null
      );
    },
    selectedDayMeetingType(): 'mw' | 'we' | null {
      try {
        const selectedDateObj = this.selectedDateObject as DateInfo | null;
        if (!selectedDateObj?.date) return null;
        return isMwMeetingDay(selectedDateObj.date)
          ? 'mw'
          : isWeMeetingDay(selectedDateObj.date)
            ? 'we'
            : null;
      } catch (error) {
        errorCatcher(error);
        return null;
      }
    },
    someItemsHiddenForSelectedDate(): boolean {
      if (!this.selectedDateObject?.mediaSections) return false;

      return Object.values(this.selectedDateObject.mediaSections).some(
        (sectionMedia) =>
          sectionMedia.items?.some(
            (item: MediaItem) =>
              item.hidden ||
              item.children?.some((child: MediaItem) => child.hidden),
          ),
      );
    },
    yeartext(): string | undefined {
      const { yeartexts } = useJwStore();

      const year = new Date().getFullYear();
      if (!yeartexts[year]) return;
      if (this.currentLangObject?.isSignLanguage) return;
      if (!this.currentSettings) return;
      const primary = yeartexts[year][this.currentSettings.lang];
      const fallback = this.currentSettings.langFallback
        ? yeartexts[year][this.currentSettings.langFallback]
        : '';
      const english = yeartexts[year]['E'];
      return primary || fallback || english;
    },
  },
  state: (): Store => {
    return {
      autoReturnFromWebsite: false,
      currentCongregation: '',
      downloadedFiles: {},
      downloadProgress: {},
      extractedFiles: {},
      ffmpegPath: '',
      mediaPlaying: {
        action: '',
        currentPosition: 0,
        pan: { x: 0, y: 0 },
        seekTo: 0,
        subtitlesUrl: '',
        uniqueId: '',
        url: '',
        zoom: 1,
      },
      mediaWindowCustomBackground: '',
      mediaWindowVisible: true,
      meetingDay: false,
      online: true,
      onlyShowInvalidSettings: false,
      selectedDate: formatDate(new Date(), 'YYYY/MM/DD'),
      websiteSelection: undefined,
    };
  },
});
