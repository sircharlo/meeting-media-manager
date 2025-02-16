import type {
  CacheList,
  DateInfo,
  DynamicMediaObject,
  FontName,
  JwLangCode,
  JwLanguage,
  JwMepsLanguage,
  MediaLink,
  MediaSectionIdentifier,
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
import { dateFromString, datesAreSame, getDateDiff } from 'src/utils/date';
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
  jwMepsLanguages: CacheList<JwMepsLanguage>;
  jwSongs: Partial<Record<JwLangCode, CacheList<MediaLink>>>;
  lookupPeriod: Partial<Record<string, DateInfo[]>>;
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

export const useJwStore = defineStore('jw-store', {
  actions: {
    addToAdditionMediaMap(
      mediaArray: DynamicMediaObject[],
      section: MediaSectionIdentifier | undefined,
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
            if (!media) return;
            media.section = section || 'circuitOverseer';
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
    clearAdditionalMediaForSelectedDate() {
      const currentState = useCurrentStateStore();
      const { currentCongregation, selectedDateObject } = currentState;

      if (!currentCongregation || !selectedDateObject?.dynamicMedia) return;

      for (let i = selectedDateObject.dynamicMedia.length - 1; i >= 0; i--) {
        if (selectedDateObject.dynamicMedia[i]?.source === 'additional') {
          selectedDateObject.dynamicMedia.splice(i, 1);
        }
      }
    },
    removeFromAdditionMediaMap(uniqueId: string) {
      try {
        const { currentCongregation, selectedDateObject } =
          useCurrentStateStore();

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
    showHiddenMediaForSelectedDate() {
      const currentState = useCurrentStateStore();
      const { currentCongregation, selectedDateObject } = currentState;

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

        if (currentState.currentLangObject?.isSignLanguage) return;

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
    yeartext: (state) => {
      const year = new Date().getFullYear();
      if (!state.yeartexts[year]) return;
      const { currentLangObject, currentSettings } = useCurrentStateStore();
      if (currentLangObject?.isSignLanguage) return;
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
      jwMepsLanguages: { list: [], updated: oldDate },
      jwSongs: {},
      lookupPeriod: {},
      urlVariables: {
        base: 'jw.org',
        mediator: 'https://b.jw-cdn.org/apis/mediator',
        pubMedia: 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS',
      },
      yeartexts: {},
    };
  },
});
