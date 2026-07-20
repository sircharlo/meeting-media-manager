import type {
  DateInfo,
  DownloadProgressItems,
  JwLanguage,
  JwSite,
  MediaItem,
  MediaLink,
  MeetingCheckStatuses,
  SettingsItem,
  SettingsItems,
  SettingsValues,
} from 'src/types';

import { defineStore } from 'pinia';
import { LONG_MEDIA_DURATION } from 'src/constants/jw';
import { settingsDefinitions } from 'src/constants/settings';
import { isMwMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { dismissAllTemporaryNotifications } from 'src/helpers/notifications';
import { datesAreSame, formatDate } from 'src/utils/date';
import {
  getAdditionalMediaPath,
  getCachedUserDataPath,
  isFileUrl,
  registerCachePathProvider,
} from 'src/utils/fs';
import { isEmpty, isUUID } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';

const { cancelAllDownloads, fs, join } = globalThis.electronApi;
const { ensureDir } = fs;

export interface MediaPlayingState {
  action: MediaPlayingStateAction;
  currentPosition: number;
  /**
   * `Date.now()` timestamp at which `currentPosition` was last set from a
   * media window report. Lets consumers extrapolate the real, current
   * position (accounting for report throttling/round-trip time) instead of
   * treating `currentPosition` as still accurate by the time they read it.
   */
  currentPositionUpdatedAt: number;
  pan: Partial<{ x: number; y: number }>;
  /**
   * Set to the current `playToken` once `currentPosition` (driven by the
   * media window's `current-time` reports) is observed actually advancing
   * for that play request, not just reporting a value. Lets consumers like
   * the media preview wait for confirmed, moving playback instead of
   * assuming playback started as soon as it was requested.
   */
  playbackConfirmedToken: number;
  playbackRate: number;
  /** Bumped whenever a genuinely new playback request starts. */
  playToken: number;
  seekTo: number;
  shouldLoop: boolean;
  slideshowAudioUrl: string;
  subtitlesUrl: string;
  uniqueId: string;
  url: string;
  zoom: number;
}

export type MediaPlayingStateAction =
  '' | 'mirroringWebsite' | 'pause' | 'play' | 'previewingWebsite';

export interface Songbook {
  fileformat: 'MP3' | 'MP4';
  pub: 'sjj' | 'sjjm';
  signLanguage: boolean;
}

interface Store {
  autoReturnFromWebsite: boolean;
  currentCongregation: string;
  downloadProgress: DownloadProgressItems;
  extractedFiles: Partial<Record<string, string>>;
  ffmpegPath: string;
  lastCacheClearAt: number;
  lookupInProgress: boolean;
  mediaPlaying: MediaPlayingState;
  mediaWindowCustomBackground: string;
  mediaWindowVisible: boolean;
  meetingCheckStatus: MeetingCheckStatuses;
  meetingDay: boolean;
  online: boolean;
  onlyShowInvalidSettings: boolean;
  pinyinActive: boolean;
  selectedDate: string;
  timerWindowVisible: boolean;
  websiteSelection: JwSite;
}

const settingDefinitionEntries = Object.entries(settingsDefinitions) as [
  keyof SettingsItems,
  SettingsItem,
][];

export const useCurrentStateStore = defineStore('current-state', {
  actions: {
    areDependenciesSatisfied(
      settingsDefinition: SettingsItem,
      congregation: string,
    ): boolean {
      const congregationSettingsStore = useCongregationSettingsStore();
      if (!settingsDefinition.depends) return true;

      if (Array.isArray(settingsDefinition.depends)) {
        return settingsDefinition.depends.every(
          (dep) => congregationSettingsStore.congregations[congregation]?.[dep],
        );
      }

      return !!congregationSettingsStore.congregations[congregation]?.[
        settingsDefinition.depends
      ];
    },
    async getDatedAdditionalMediaDirectory(destDate?: string) {
      try {
        // Falling back to '' here (e.g. right after a congregation switch,
        // before selectedDate has initialized) is dangerous: callers join()
        // it with a filename, producing a bare relative path that Node
        // resolves against process.cwd() - the app's own install directory
        // in a packaged build. Default to today instead of ever returning
        // an unusable empty directory.
        if (!destDate) destDate = this.selectedDate || undefined;
        const additionalMediaPath = await getAdditionalMediaPath();
        const dateString = formatDate(
          destDate ? new Date(destDate) : new Date(),
          'YYYYMMDD',
        );
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

        for (const [
          settingsDefinitionId,
          settingsDefinition,
        ] of settingDefinitionEntries) {
          if (!settingsDefinition.rules?.includes('notEmpty')) continue;

          if (
            this.areDependenciesSatisfied(
              settingsDefinition,
              congregation as string,
            ) &&
            this.isSettingInvalid(
              settingsDefinitionId,
              settingsDefinition,
              congregation as string,
            )
          ) {
            invalidSettings.add(settingsDefinitionId);
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
        if (isMwMeetingDay(dateInfo.date)) return 'mw';
        if (isWeMeetingDay(dateInfo.date)) return 'we';
        return null;
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
    isSettingInvalid(
      settingsDefinitionId: keyof SettingsItems,
      settingsDefinition: SettingsItem,
      congregation: string,
    ): boolean {
      const { urlVariables } = useJwStore();
      const congregationSettingsStore = useCongregationSettingsStore();

      if (
        settingsDefinitionId === 'baseUrl' &&
        !(urlVariables?.base && urlVariables?.mediator)
      ) {
        return true;
      }

      const settingValue =
        congregationSettingsStore.congregations[congregation]?.[
          settingsDefinitionId
        ];

      if (isEmpty(settingValue)) {
        const isSkipRule =
          settingsDefinition.rules?.includes('regular') &&
          congregationSettingsStore.congregations[congregation]
            ?.disableMediaFetching;

        if (!isSkipRule) {
          return true;
        }
      }

      return false;
    },
    setCongregation: async function (value: number | string) {
      if (!value) return false;

      // Cancel all pending downloads from the previous congregation
      cancelAllDownloads();
      this.downloadProgress = {};
      this.meetingCheckStatus = {};

      // Dismiss all active notifications when changing congregation
      dismissAllTemporaryNotifications();

      this.currentCongregation = value.toString();
      await getCachedUserDataPath();
      return this.getInvalidSettings(this.currentCongregation).length > 0;
    },
    setTimerWindowVisible(visible: boolean) {
      this.timerWindowVisible = visible;
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

      const scenesAreUUIDS = configuredScenes.every((element) =>
        isUUID(element),
      );
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
    // Single source of truth for "is a meeting refresh doing anything right
    // now" - covers checking meeting dates and downloading files, so the
    // island button, the popup, and the cache auto-clear guard can never
    // disagree with each other.
    hasActiveMediaWork(): boolean {
      if (Object.values(this.meetingCheckStatus).includes('checking')) {
        return true;
      }
      return Object.values(this.downloadProgress).some(
        (item) =>
          !item.complete &&
          !item.error &&
          (!item.loaded || !item.total || item.loaded < item.total),
      );
    },
    isSelectedDayToday(): boolean {
      try {
        const selectedDateObj = this.selectedDateObject;
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
        (media) =>
          (media.duration ?? 0) < LONG_MEDIA_DURATION && // Filter out long media
          !media.children?.length && // Filter out media with children
          !isFileUrl(media.fileUrl), // Filter out media with valid file URLs
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
        const selectedDateObj = this.selectedDateObject;
        if (!selectedDateObj?.date) return null;
        if (isMwMeetingDay(selectedDateObj.date)) return 'mw';
        if (isWeMeetingDay(selectedDateObj.date)) return 'we';
        return null;
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
    yeartext(): null | string | undefined {
      const { yeartexts } = useJwStore();

      if (this.currentLangObject?.isSignLanguage || !this.currentSettings)
        return null;

      const year = new Date().getFullYear();
      const textsForYear = yeartexts[year];
      if (!textsForYear) return;

      const { lang, langFallback } = this.currentSettings;

      return textsForYear[lang] || (langFallback && textsForYear[langFallback]);
    },
  },
  persist: {
    pick: ['pinyinActive'],
  },
  state: (): Store => {
    return {
      autoReturnFromWebsite: false,
      currentCongregation: '',
      downloadProgress: {},
      extractedFiles: {},
      ffmpegPath: '',
      lastCacheClearAt: 0,
      lookupInProgress: false,
      mediaPlaying: {
        action: '',
        currentPosition: 0,
        currentPositionUpdatedAt: 0,
        pan: { x: 0, y: 0 },
        playbackConfirmedToken: 0,
        playbackRate: 1,
        playToken: 0,
        seekTo: 0,
        shouldLoop: false,
        slideshowAudioUrl: '',
        subtitlesUrl: '',
        uniqueId: '',
        url: '',
        zoom: 1,
      },
      mediaWindowCustomBackground: '',
      mediaWindowVisible: true,
      meetingCheckStatus: {},
      meetingDay: false,
      online: true,
      onlyShowInvalidSettings: false,
      pinyinActive: false,
      selectedDate: formatDate(new Date(), 'YYYY/MM/DD'),
      timerWindowVisible: false,
      websiteSelection: undefined,
    };
  },
});

registerCachePathProvider(
  () => useCurrentStateStore().currentSettings?.cacheFolder ?? undefined,
);
