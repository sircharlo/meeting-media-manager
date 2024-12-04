import type {
  CacheList,
  DateInfo,
  DynamicMediaObject,
  FontName,
  JwLangCode,
  JwLanguage,
  MediaLink,
  MediaSection,
  Publication,
  PublicationFetcher,
  PublicationFiles,
  UrlVariables,
} from 'src/types';

import { defineStore } from 'pinia';
import { MAX_SONGS } from 'src/constants/jw';
import { isCoWeek, isMwMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import {
  fetchJwLanguages,
  fetchPubMediaLinks,
  fetchYeartext,
} from 'src/utils/api';
import { dateFromString, getDateDiff } from 'src/utils/date';
import { isFileUrl } from 'src/utils/fs';
import { findBestResolution, getPubId, isMediaLink } from 'src/utils/jw';

const oldDate = new Date(0);

/**
 * Checks if a caches list should be updated
 * @param list The cache list to check
 * @param months How many months should pass before updating
 * @returns Wether the list should be updated
 */
export const shouldUpdateList = (
  cacheList: CacheList | undefined,
  months: number,
) => {
  if (!cacheList) return true;
  return (
    !cacheList?.list?.length ||
    getDateDiff(new Date(), cacheList?.updated, 'months') > months
  );
};

interface Store {
  additionalMediaMaps: Partial<
    Record<string, Partial<Record<string, DynamicMediaObject[]>>>
  >;
  customDurations: Partial<
    Record<
      string,
      Partial<Record<string, Record<string, { max: number; min: number }>>>
    >
  >;
  jwBibleAudioFiles: Partial<
    Record<JwLangCode, CacheList<Partial<Publication>>>
  >;
  jwLanguages: CacheList<JwLanguage>;
  jwSongs: Partial<Record<JwLangCode, CacheList<MediaLink>>>;
  lookupPeriod: Partial<Record<string, DateInfo[]>>;
  mediaSort: Partial<Record<string, Partial<Record<string, string[]>>>>;
  urlVariables: UrlVariables;
  watchedMediaSections: Partial<
    Record<string, Partial<Record<string, Record<string, MediaSection>>>>
  >;
  yeartexts: Partial<Record<number, Partial<Record<JwLangCode, string>>>>;
}

function uniqueById<T extends { uniqueId: string }>(array: T[]): T[] {
  return array.reduce((unique: T[], o: T) => {
    if (!unique.some((obj) => obj.uniqueId === o.uniqueId)) {
      unique.push(o);
    }
    return unique;
  }, []);
}

export const useJwStore = defineStore('jw-store', {
  actions: {
    addToAdditionMediaMap(
      mediaArray: DynamicMediaObject[],
      section: MediaSection | undefined,
    ) {
      try {
        const { currentCongregation, selectedDate, selectedDateObject } =
          useCurrentStateStore();
        if (!mediaArray.length || !selectedDateObject) return;
        const coWeek = isCoWeek(selectedDateObject?.date);
        if (coWeek) {
          if (isMwMeetingDay(selectedDateObject?.date)) {
            mediaArray.forEach((media) => {
              media.section = section || 'circuitOverseer';
              media.sectionOriginal = section || 'circuitOverseer';
            });
          }
        }
        if (!this.additionalMediaMaps[currentCongregation])
          this.additionalMediaMaps[currentCongregation] = {};
        if (!this.additionalMediaMaps[currentCongregation][selectedDate])
          this.additionalMediaMaps[currentCongregation][selectedDate] = [];
        const currentArray =
          this.additionalMediaMaps[currentCongregation][selectedDate];
        this.additionalMediaMaps[currentCongregation][selectedDate] =
          uniqueById([...currentArray, ...mediaArray]);
      } catch (e) {
        errorCatcher(e);
      }
    },
    clearCurrentDayAdditionalMedia() {
      const currentState = useCurrentStateStore();
      const { currentCongregation, selectedDate } = currentState;
      if (
        !currentCongregation ||
        !selectedDate ||
        !this.additionalMediaMaps?.[currentCongregation]?.[selectedDate]?.length
      )
        return;
      this.additionalMediaMaps[currentCongregation][selectedDate] = [];
    },
    removeFromAdditionMediaMap(uniqueId: string) {
      try {
        const { currentCongregation, selectedDate } = useCurrentStateStore();
        if (
          uniqueId &&
          currentCongregation &&
          selectedDate &&
          this.additionalMediaMaps[currentCongregation]?.[selectedDate]
        ) {
          const currentArray =
            this.additionalMediaMaps[currentCongregation][selectedDate];
          this.additionalMediaMaps[currentCongregation][selectedDate] =
            uniqueById(
              currentArray.filter((media) => media.uniqueId !== uniqueId),
            );
        }
      } catch (e) {
        errorCatcher(e);
      }
    },
    resetSort() {
      try {
        const {
          currentCongregation,
          selectedDate,
          selectedDateObject,
          watchFolderMedia,
        } = useCurrentStateStore();
        if (
          currentCongregation &&
          selectedDate &&
          this.mediaSort[currentCongregation]
        ) {
          this.mediaSort[currentCongregation][selectedDate] = [];
        }
        (selectedDateObject?.dynamicMedia ?? [])
          .filter(
            (item) =>
              item.sectionOriginal && item.section !== item.sectionOriginal,
          )
          .forEach((item) => {
            item.section = item.sectionOriginal;
          });

        (watchFolderMedia[selectedDate] ?? [])
          .filter(
            (item) =>
              item.sectionOriginal && item.section !== item.sectionOriginal,
          )
          .forEach((item) => {
            item.section = item.sectionOriginal;
          });

        (this.additionalMediaMaps[currentCongregation]?.[selectedDate] ?? [])
          .filter(
            (item) =>
              item.sectionOriginal && item.section !== item.sectionOriginal,
          )
          .forEach((item) => {
            item.section = item.sectionOriginal;
          });
      } catch (e) {
        errorCatcher(e);
      }
    },
    showCurrentDayHiddenMedia() {
      const currentState = useCurrentStateStore();
      const {
        currentCongregation,
        selectedDate,
        selectedDateObject,
        watchFolderMedia,
      } = currentState;
      if (!currentCongregation || !selectedDateObject?.date || !selectedDate)
        return;
      this.lookupPeriod?.[currentCongregation]
        ?.find(
          (day) =>
            getDateDiff(day.date, selectedDateObject?.date, 'days') === 0,
        )
        ?.dynamicMedia?.filter((media) => media.hidden)
        ?.forEach((media) => {
          media.hidden = false;
        });
      this.additionalMediaMaps?.[currentCongregation]?.[selectedDate]
        ?.filter((media) => media.hidden)
        ?.forEach((media) => {
          media.hidden = false;
        });
      watchFolderMedia?.[selectedDate]
        ?.filter((media) => media.hidden)
        ?.forEach((media) => {
          media.hidden = false;
        });
    },
    async updateJwLanguages() {
      if (!useCurrentStateStore().online) return;
      try {
        if (shouldUpdateList(this.jwLanguages, 3)) {
          const result = await fetchJwLanguages(this.urlVariables.base);
          if (result) {
            this.jwLanguages = { list: result, updated: new Date() };
          }
        }
      } catch (e) {
        errorCatcher(e);
      }
    },
    async updateJwSongs(force = false) {
      try {
        const currentState = useCurrentStateStore();
        if (!currentState.online) return;
        if (
          !currentState.currentSettings?.lang ||
          !currentState.currentSongbook?.pub
        ) {
          errorCatcher('No current settings or songbook defined');
          return;
        }
        const formats: (keyof PublicationFiles)[] = ['MP4', 'MP3'];
        for (const fileformat of formats) {
          try {
            const langwritten = currentState.currentSettings.lang;
            this.jwSongs[langwritten] ??= { list: [], updated: oldDate };

            // Check if the song list has been updated in the last month
            const now = new Date();
            const monthsSinceUpdated = getDateDiff(
              now,
              this.jwSongs[langwritten].updated,
              'months',
            );

            // Fetch media links only if the song list hasn't been updated in over a month or if force is true
            if (monthsSinceUpdated > 1 || force) {
              const songbook: PublicationFetcher = {
                fileformat,
                langwritten,
                pub: currentState.currentSongbook.pub,
              };
              const pubMediaLinks = await fetchPubMediaLinks(
                songbook,
                this.urlVariables.pubMedia,
                currentState.online,
              );
              if (!pubMediaLinks) {
                const downloadId = getPubId(songbook, true);
                currentState.downloadProgress[downloadId] = {
                  error: true,
                  filename: downloadId,
                };
              }
              if (!pubMediaLinks || !pubMediaLinks.files) {
                continue;
              }

              const mediaItemLinks = (
                pubMediaLinks.files[langwritten]?.[fileformat] || []
              )
                .filter(isMediaLink)
                .filter((mediaLink) => mediaLink.track < MAX_SONGS);
              const filteredMediaItemLinks = mediaItemLinks.reduce<MediaLink[]>(
                (acc, mediaLink) => {
                  if (!acc.some((m) => m.track === mediaLink.track)) {
                    const bestItem = findBestResolution(
                      mediaItemLinks.filter((m) => m.track === mediaLink.track),
                      currentState.currentSettings?.maxRes,
                    );
                    if (isMediaLink(bestItem)) acc.push(bestItem);
                  }
                  return acc;
                },
                [],
              );
              this.jwSongs[langwritten] = {
                list: filteredMediaItemLinks,
                updated: now,
              };
            }
          } catch (error) {
            errorCatcher(error);
            continue;
          }
          break;
        }
      } catch (error) {
        errorCatcher(error);
      }
    },
    async updateYeartext() {
      try {
        const currentState = useCurrentStateStore();
        if (!currentState.currentSettings || !currentState.online) return;

        const year = new Date().getFullYear();
        const promises: Promise<{ wtlocale: JwLangCode; yeartext?: string }>[] =
          [];

        const langs = new Set<JwLangCode>([
          currentState.currentSettings.lang,
          'E',
        ]);

        if (currentState.currentSettings.langFallback) {
          langs.add(currentState.currentSettings.langFallback);
        }

        langs.forEach((lang) => {
          if (!this.yeartexts[year]?.[lang]) {
            promises.push(fetchYeartext(lang, this.urlVariables.base));
          }
        });

        const results = await Promise.allSettled(promises);

        const { default: sanitizeHtml } = await import('sanitize-html');
        for (const result of results) {
          if (result.status === 'fulfilled') {
            const { wtlocale, yeartext } = result.value;
            if (yeartext) {
              if (!this.yeartexts[year]) {
                this.yeartexts[year] = {};
              }

              this.yeartexts[year][wtlocale] = sanitizeHtml(yeartext, {
                allowedAttributes: { p: ['class'] },
                allowedTags: ['b', 'i', 'em', 'strong', 'p'],
              });
            }
          }
        }
      } catch (error) {
        errorCatcher(error);
      }
    },
  },
  getters: {
    fontUrls: (state): Record<FontName, string> => {
      const { urlVariables } = state;
      const mediatorBaseUrl = urlVariables.mediator
        ? new URL(urlVariables.mediator).hostname
        : '';
      return {
        'JW-Icons': urlVariables.base
          ? `https://wol.${urlVariables.base}/assets/fonts/jw-icons-external-1970474.woff`
          : '',
        'Wt-ClearText-Bold': mediatorBaseUrl
          ? `https://${mediatorBaseUrl}/fonts/wt-clear-text/1.024/Wt-ClearText-Bold.woff2`
          : '',
      };
    },
    missingMedia: (state) => {
      const { currentCongregation, selectedDate, selectedDateObject } =
        useCurrentStateStore();
      if (!currentCongregation || !selectedDate || !selectedDateObject) {
        return [];
      }
      const allMediaItems = (
        state.lookupPeriod?.[currentCongregation]?.find(
          (day) =>
            getDateDiff(day.date, selectedDateObject?.date, 'days') === 0,
        )?.dynamicMedia || []
      ).concat(
        state.additionalMediaMaps?.[currentCongregation]?.[selectedDate] || [],
      );
      return allMediaItems.filter((media) => !isFileUrl(media.fileUrl));
    },
    yeartext: (state) => {
      const year = new Date().getFullYear();
      if (!state.yeartexts[year]) return;
      const { currentSettings } = useCurrentStateStore();
      if (!currentSettings) return;
      const primary = state.yeartexts[year][currentSettings.lang];
      const fallback = currentSettings.langFallback
        ? state.yeartexts[year][currentSettings.langFallback]
        : '';
      const english = state.yeartexts[year]['E'];
      return primary || fallback || english;
    },
  },
  persist: {
    afterHydrate: (ctx) => {
      const state = ctx.store.$state as Store;
      // Convert date strings to Date objects in state
      if (state.jwLanguages.updated)
        state.jwLanguages.updated = dateFromString(state.jwLanguages.updated);
      Object.values(state.jwSongs).forEach((lang) => {
        lang.updated = dateFromString(lang.updated);
      });
      Object.entries(state.lookupPeriod).forEach(([, period]) => {
        period?.forEach((day: { date: Date | string }) => {
          if (day.date) day.date = dateFromString(day.date);
        });
      });
    },
  },
  state: (): Store => {
    return {
      additionalMediaMaps: {},
      customDurations: {},
      jwBibleAudioFiles: {},
      jwLanguages: { list: [], updated: oldDate },
      jwSongs: {},
      lookupPeriod: {},
      mediaSort: {},
      urlVariables: {
        base: 'jw.org',
        mediator: 'https://b.jw-cdn.org/apis/mediator',
        pubMedia: 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS',
      },
      watchedMediaSections: {},
      yeartexts: {},
    };
  },
});
