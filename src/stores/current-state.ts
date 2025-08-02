import type {
  DateInfo,
  DownloadedFile,
  DownloadProgressItems,
  DynamicMediaObject,
  JwLanguage,
  MediaLink,
  MediaSectionIdentifier,
  SettingsItem,
  SettingsItems,
  SettingsValues,
} from 'src/types';

import { defineStore } from 'pinia';
import { standardSections } from 'src/constants/media';
import { settingsDefinitions } from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { datesAreSame, formatDate } from 'src/utils/date';
import { getAdditionalMediaPath, isFileUrl } from 'src/utils/fs';
import { isEmpty, isUUID } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';

const { fs, path } = window.electronApi;
const { ensureDir } = fs;
const { join } = path;

export interface MediaPlayingState {
  action: '' | 'pause' | 'play' | 'website';
  currentPosition: number;
  panzoom: Partial<{ scale: number; x: number; y: number }>;
  seekTo: number;
  subtitlesUrl: string;
  uniqueId: string;
  url: string;
}

export interface Songbook {
  fileformat: 'MP3' | 'MP4';
  pub: 'sjj' | 'sjjm';
  signLanguage: boolean;
}

interface Store {
  currentCongregation: string;
  downloadedFiles: Partial<
    Record<string, DownloadedFile | Promise<DownloadedFile>>
  >;
  downloadProgress: DownloadProgressItems;
  extractedFiles: Partial<Record<string, string>>;
  ffmpegPath: string;
  highlightedMediaId: string;
  mediaPlaying: MediaPlayingState;
  mediaWindowCustomBackground: string;
  mediaWindowVisible: boolean;
  meetingDay: boolean;
  online: boolean;
  onlyShowInvalidSettings: boolean;
  selectedDate: string;
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
    getAllMediaForSection(): Record<
      MediaSectionIdentifier,
      DynamicMediaObject[]
    > {
      if (!this.selectedDateObject) {
        return {
          additional: [],
          ayfm: [],
          circuitOverseer: [],
          lac: [],
          tgw: [],
          wt: [],
        };
      }

      const customSections =
        this.selectedDateObject.customSections
          ?.filter((m) => !standardSections.includes(m.uniqueId))
          .map((m) => m.uniqueId) || [];

      const sections = [...standardSections, ...[...new Set(customSections)]];

      return sections.reduce(
        (acc, section) => {
          if (!this.selectedDateObject?.dynamicMedia) return acc;
          acc[section] = this.selectedDateObject.dynamicMedia.filter(
            (m) => m.section === section,
          );
          return acc;
        },
        {} as Record<MediaSectionIdentifier, DynamicMediaObject[]>,
      );
    },
    getVisibleMediaForSection(): Record<
      MediaSectionIdentifier,
      DynamicMediaObject[]
    > {
      if (!this.selectedDateObject) {
        return {
          additional: [],
          ayfm: [],
          circuitOverseer: [],
          lac: [],
          tgw: [],
          wt: [],
        };
      }

      const standardSections: MediaSectionIdentifier[] = [
        'additional',
        'ayfm',
        'circuitOverseer',
        'lac',
        'tgw',
        'wt',
      ];

      const customSections = this.selectedDateObject.dynamicMedia
        .filter((m) => !standardSections.includes(m.section))
        .map((m) => m.section);

      const sections = [...standardSections, ...[...new Set(customSections)]];

      return sections.reduce(
        (acc, section) => {
          if (!this.selectedDateObject?.dynamicMedia) return acc;
          acc[section] = this.selectedDateObject.dynamicMedia.filter(
            (m) => m.section === section && !m.hidden,
          );
          return acc;
        },
        {} as Record<MediaSectionIdentifier, DynamicMediaObject[]>,
      );
    },
    mediaIsPlaying: (state) => {
      return (
        state.mediaPlaying.url !== '' || state.mediaPlaying.action === 'website'
      );
    },
    mediaPaused: (state) => {
      return (
        state.mediaPlaying.url !== '' && state.mediaPlaying.action === 'pause'
      );
    },
    missingMedia(state): DynamicMediaObject[] {
      if (
        !state.currentCongregation ||
        !this.selectedDateObject?.dynamicMedia
      ) {
        return [];
      }
      return this.selectedDateObject.dynamicMedia.filter(
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
    someItemsHiddenForSelectedDate(): boolean {
      return !!this.selectedDateObject?.dynamicMedia.some(
        (m) => m.hidden || m.children?.some((child) => child.hidden),
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
      currentCongregation: '',
      downloadedFiles: {},
      downloadProgress: {},
      extractedFiles: {},
      ffmpegPath: '',
      highlightedMediaId: '',
      mediaPlaying: {
        action: '',
        currentPosition: 0,
        panzoom: { scale: 1, x: 0, y: 0 },
        seekTo: 0,
        subtitlesUrl: '',
        uniqueId: '',
        url: '',
      },
      mediaWindowCustomBackground: '',
      mediaWindowVisible: true,
      meetingDay: false,
      online: true,
      onlyShowInvalidSettings: false,
      selectedDate: formatDate(new Date(), 'YYYY/MM/DD'),
    };
  },
});
