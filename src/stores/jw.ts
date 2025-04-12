import type {
  CacheList,
  DateInfo,
  DynamicMediaObject,
  FontName,
  JwLangCode,
  JwLanguage,
  JwMepsLanguage,
  MediaLink,
  MediaSection,
  Publication,
  PublicationFetcher,
  PublicationFiles,
  SettingsValues,
  UrlVariables,
} from 'src/types';
import type { Songbook } from 'stores/current-state';

import { defineStore } from 'pinia';
import { MAX_SONGS } from 'src/constants/jw';
import { isMwMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  fetchJwLanguages,
  fetchMemorials,
  fetchPubMediaLinks,
  fetchYeartext,
} from 'src/utils/api';
import {
  dateFromString,
  datesAreSame,
  getDateDiff,
  isInPast,
} from 'src/utils/date';
import { findBestResolution, isMediaLink } from 'src/utils/jw';

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
  jwMepsLanguages: CacheList<JwMepsLanguage>;
  jwSongs: Partial<Record<JwLangCode, CacheList<MediaLink>>>;
  lookupPeriod: Partial<Record<string, DateInfo[]>>;
  memorials: Partial<Record<number, `${number}/${number}/${number}`>>;
  urlVariables: UrlVariables;
  yeartexts: Partial<Record<number, Partial<Record<JwLangCode, string>>>>;
}

export function addUniqueById<T extends { uniqueId: string }>(
  targetArray: (T | undefined)[],
  sourceArray: (T | undefined)[],
): void {
  sourceArray.forEach((item) => {
    if (!targetArray.some((obj) => obj?.uniqueId === item?.uniqueId)) {
      targetArray.push(item);
    }
  });
}

export function deduplicateById<T extends { uniqueId: string }>(
  array: T[],
): void {
  for (let i = array.length - 1; i >= 0; i--) {
    if (array.findIndex((obj) => obj?.uniqueId === array[i]?.uniqueId) !== i) {
      array.splice(i, 1);
    }
  }
}

/**
 * Replaces existing media items in the target array with the matching item
 * from the source array, if the existing item is a placeholder (has no fileUrl).
 * If there is no match at all, the item from the source array will be added to
 * the target array.
 * @param targetArray The array to search and modify
 * @param sourceArray The array of items to search for matches
 */
export function replaceMissingMediaByPubMediaId(
  targetArray: DynamicMediaObject[],
  sourceArray: DynamicMediaObject[],
): void {
  sourceArray.forEach((item) => {
    const index = targetArray.findIndex(
      (obj) => obj?.pubMediaId === item?.pubMediaId,
    );

    if (index !== -1) {
      const existing = targetArray[index];
      // Replace only if it's a placeholder (fileUrl is the same as pubMediaId) and has no children
      if (
        existing?.fileUrl === existing?.pubMediaId &&
        !existing?.children?.length
      ) {
        targetArray[index] = item;
      }
    } else {
      // Add new item if no match at all
      targetArray.push(item);
    }
  });
}

export const useJwStore = defineStore('jw-store', {
  actions: {
    addToAdditionMediaMap(
      mediaArray: DynamicMediaObject[],
      section: MediaSection | undefined,
      currentCongregation: string,
      selectedDateObject: DateInfo | null,
      coWeek: boolean,
    ) {
      try {
        // Early exit if no media or selected date object
        if (!mediaArray.length || !selectedDateObject) return;

        // Handle circuit overseer week logic
        if (coWeek) {
          mediaArray.forEach((media) => {
            if (!media) return;
            media.section =
              section ||
              (isMwMeetingDay(selectedDateObject.date) ||
              isWeMeetingDay(selectedDateObject.date)
                ? 'circuitOverseer'
                : 'additional');
            media.sectionOriginal = section || 'circuitOverseer';
          });
        }

        // Ensure lookupPeriod for current congregation exists
        if (!this.lookupPeriod[currentCongregation]) {
          this.lookupPeriod[currentCongregation] = [];
        }

        // Find or create the period object for the selected date
        let period = this.lookupPeriod[currentCongregation].find((d) =>
          datesAreSame(d.date, selectedDateObject.date),
        );

        if (!period) {
          period = { ...selectedDateObject, dynamicMedia: [] };
          this.lookupPeriod[currentCongregation].push(period);
        }

        const getAdditionalCount = () => {
          return (
            (this.lookupPeriod[currentCongregation] || [])
              .find((d) => datesAreSame(d.date, selectedDateObject.date))
              ?.dynamicMedia.filter((m) => m.section === 'additional').length ||
            0
          );
        };

        if (Array.isArray(period.dynamicMedia)) {
          mediaArray.forEach((media, index) => {
            if (!media) return;
            media.sortOrderOriginal =
              'additional-' + getAdditionalCount() + '-' + index;
          });
          addUniqueById(period.dynamicMedia, mediaArray);
        }
      } catch (e) {
        errorCatcher(e);
      }
    },
    clearAdditionalMediaForSelectedDate(
      currentCongregation: string,
      selectedDateObject: DateInfo | null,
    ) {
      if (!currentCongregation || !selectedDateObject?.dynamicMedia) return;

      for (let i = selectedDateObject.dynamicMedia.length - 1; i >= 0; i--) {
        if (selectedDateObject.dynamicMedia[i]?.source === 'additional') {
          selectedDateObject.dynamicMedia.splice(i, 1);
        }
      }
    },
    removeFromAdditionMediaMap(
      uniqueId: string,
      currentCongregation: string,
      selectedDateObject: DateInfo | null,
    ) {
      try {
        if (
          !uniqueId ||
          !currentCongregation ||
          !selectedDateObject?.dynamicMedia
        )
          return;

        for (let i = selectedDateObject.dynamicMedia.length - 1; i >= 0; i--) {
          if (selectedDateObject.dynamicMedia[i]?.uniqueId === uniqueId) {
            selectedDateObject.dynamicMedia.splice(i, 1);
          }
        }

        deduplicateById(selectedDateObject.dynamicMedia);
      } catch (e) {
        errorCatcher(e);
      }
    },
    showHiddenMediaForSelectedDate(
      currentCongregation: string,
      selectedDateObject: DateInfo | null,
    ) {
      if (!currentCongregation || !selectedDateObject?.date) return;

      const currentDay = this.lookupPeriod?.[currentCongregation]?.find((day) =>
        datesAreSame(day.date, selectedDateObject.date),
      );

      if (!currentDay?.dynamicMedia) return;

      currentDay.dynamicMedia.forEach((media) => {
        if (media.hidden) {
          media.hidden = false;
        }

        if (media.children?.some((child) => child.hidden)) {
          media.children.forEach((child) => {
            if (child.hidden) child.hidden = false;
          });
        }
      });
    },
    async updateJwLanguages(online: boolean) {
      if (!online) return;
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
    async updateJwSongs(
      online: boolean,
      currentSettings: null | SettingsValues | undefined,
      currentSongbook: Songbook,
      force = false,
    ) {
      try {
        if (!online) return;
        if (!currentSettings?.lang || !currentSongbook?.pub) {
          errorCatcher('No current settings or songbook defined');
          return;
        }
        const formats: (keyof PublicationFiles)[] = ['MP4', 'MP3'];
        for (const fileformat of formats) {
          try {
            const langwritten = currentSettings.lang;
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
                pub: currentSongbook.pub,
              };
              const pubMediaLinks = await fetchPubMediaLinks(
                songbook,
                this.urlVariables.pubMedia,
                online,
              );
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
                      currentSettings?.maxRes,
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
    async updateMemorials(online: boolean) {
      if (!online) return;
      try {
        let year = new Date().getFullYear();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (this.memorials[year] && isInPast(this.memorials[year]!)) {
          year++;
        }
        if (!this.memorials[year]) {
          const result = await fetchMemorials();
          if (result) this.memorials = result;
        }
      } catch (e) {
        errorCatcher(e);
      }
    },
    async updateYeartext(
      online: boolean,
      currentSettings: null | SettingsValues | undefined,
      currentLangObject: JwLanguage | undefined,
    ) {
      try {
        if (!currentSettings || !online) return;

        if (currentLangObject?.isSignLanguage) return;

        const year = new Date().getFullYear();
        const promises: Promise<{ wtlocale: JwLangCode; yeartext?: string }>[] =
          [];

        const langs = new Set<JwLangCode>([currentSettings.lang, 'E']);

        if (currentSettings.langFallback) {
          langs.add(currentSettings.langFallback);
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
      jwMepsLanguages: { list: [], updated: oldDate },
      jwSongs: {},
      lookupPeriod: {},
      memorials: {},
      urlVariables: {
        base: 'jw.org',
        mediator: 'https://b.jw-cdn.org/apis/mediator',
        pubMedia: 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS',
      },
      yeartexts: {},
    };
  },
});
