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
import {
  fetchJwLanguages,
  fetchPubMediaLinks,
  fetchYeartext,
} from 'src/utils/api';
import { dateFromString, getDateDiff } from 'src/utils/date';
import { isFileUrl } from 'src/utils/fs';
import { findBestResolution, getPubId, isMediaLink } from 'src/utils/jw';
import { useCurrentStateStore } from 'stores/current-state';

const oldDate = new Date(0);

/**
 * Checks if a caches list should be updated
 * @param list The cache list to check
 * @param months How many months should pass before updating
 * @returns Whether the list should be updated
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
  jwBibleAudioFiles: Partial<
    Record<JwLangCode, CacheList<Partial<Publication>>>
  >;
  jwLanguages: CacheList<JwLanguage>;
  jwSongs: Partial<Record<JwLangCode, CacheList<MediaLink>>>;
  lookupPeriod: Partial<Record<string, DateInfo[]>>;
  urlVariables: UrlVariables;
  watchedMediaSections: Partial<
    Record<string, Partial<Record<string, Record<string, MediaSection>>>>
  >;
  yeartexts: Partial<Record<number, Partial<Record<JwLangCode, string>>>>;
}

export function uniqueById<T extends { uniqueId: string }>(array: T[]): T[] {
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
        const { currentCongregation, selectedDateObject } =
          useCurrentStateStore();

        // Early exit if no media or selected date object
        if (!mediaArray.length || !selectedDateObject) return;

        // Handle circuit overseer week logic
        const coWeek = isCoWeek(selectedDateObject.date);
        if (coWeek && isMwMeetingDay(selectedDateObject.date)) {
          mediaArray.forEach((media) => {
            media.section = section || 'circuitOverseer';
            media.sectionOriginal = section || 'circuitOverseer';
          });
        }

        // Ensure lookupPeriod for current congregation exists
        if (!this.lookupPeriod[currentCongregation]) {
          this.lookupPeriod[currentCongregation] = [];
        }

        // Find or create the period object for the selected date
        let period = this.lookupPeriod[currentCongregation].find(
          (d) => getDateDiff(d.date, selectedDateObject.date, 'days') === 0,
        );

        if (!period) {
          period = { ...selectedDateObject, dynamicMedia: [] };
          this.lookupPeriod[currentCongregation].push(period);
        }

        // Ensure dynamicMedia array exists
        if (!period.dynamicMedia) {
          period.dynamicMedia = [];
        }

        // Merge mediaArray into dynamicMedia, ensuring uniqueness by ID
        period.dynamicMedia = uniqueById([
          ...mediaArray,
          ...period.dynamicMedia,
        ]);
      } catch (e) {
        errorCatcher(e);
      }
    },
    clearCurrentDayAdditionalMedia() {
      const currentState = useCurrentStateStore();
      const { currentCongregation, selectedDate } = currentState;

      // Early exit if required data is missing
      if (!currentCongregation || !selectedDate) return;

      // Find the day matching the selected date
      const day = this.lookupPeriod?.[currentCongregation]?.find(
        (day) => getDateDiff(day.date, selectedDate, 'days') === 0,
      );

      // Filter out media with source 'additional' if day and dynamicMedia exist
      if (day?.dynamicMedia) {
        day.dynamicMedia = day.dynamicMedia.filter(
          (media) => media.source !== 'additional',
        );
      }
    },
    removeFromAdditionMediaMap(uniqueId: string) {
      try {
        const { currentCongregation, selectedDate } = useCurrentStateStore();

        // Early exit if required data is missing
        if (!uniqueId || !currentCongregation || !selectedDate) return;

        // Find the day matching the selected date
        const day = this.lookupPeriod?.[currentCongregation]?.find(
          (day) => getDateDiff(day.date, selectedDate, 'days') === 0,
        );

        // Remove media with the specified uniqueId if day and dynamicMedia exist
        if (day?.dynamicMedia) {
          day.dynamicMedia = uniqueById(
            day.dynamicMedia.filter((media) => media.uniqueId !== uniqueId),
          );
        }
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

      const getFontUrl = (type: 'base' | 'mediator', path = '') => {
        const url = urlVariables[type];
        if (!type || !url) return '';
        try {
          const baseUrl = type === 'base' ? `https://wol.${url}` : url;
          const hostname = new URL(baseUrl).hostname;
          return `https://${hostname}${path}`;
        } catch (error) {
          errorCatcher(error);
          return '';
        }
      };

      return {
        'JW-Icons': getFontUrl(
          'base',
          '/assets/fonts/jw-icons-external-1970474.woff',
        ),
        'Wt-ClearText-Bold': getFontUrl(
          'mediator',
          '/fonts/wt-clear-text/1.024/Wt-ClearText-Bold.woff2',
        ),
      };
    },
    missingMedia: (state) => {
      const { currentCongregation, selectedDate, selectedDateObject } =
        useCurrentStateStore();
      if (!currentCongregation || !selectedDate || !selectedDateObject) {
        return [];
      }
      const allMediaItems =
        state.lookupPeriod?.[currentCongregation]?.find(
          (day) =>
            getDateDiff(day.date, selectedDateObject?.date, 'days') === 0,
        )?.dynamicMedia || [];
      return allMediaItems.filter(
        (media) => !media.children?.length && !isFileUrl(media.fileUrl),
      );
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
      jwBibleAudioFiles: {},
      jwLanguages: { list: [], updated: oldDate },
      jwSongs: {},
      lookupPeriod: {},
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
