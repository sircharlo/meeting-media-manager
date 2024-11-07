import type {
  CacheList,
  DateInfo,
  DynamicMediaObject,
  JwLangCode,
  JwLanguage,
  MediaLink,
  PublicationFetcher,
  PublicationFiles,
  UrlVariables,
} from 'src/types';

import { defineStore } from 'pinia';
import { date } from 'quasar';
import { MAX_SONGS } from 'src/constants/jw';
import { fetchJwLanguages, fetchYeartext } from 'src/helpers/api';
import {
  dateFromString,
  isCoWeek,
  isMwMeetingDay,
  shouldUpdateList,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  findBestResolution,
  getPubMediaLinks,
  isMediaLink,
} from 'src/helpers/jw-media';
import { useCurrentStateStore } from 'src/stores/current-state';

const { getDateDiff } = date;

export function uniqueById<T extends { uniqueId: string }>(array: T[]): T[] {
  return array.reduce((unique: T[], o: T) => {
    if (!unique.some((obj) => obj.uniqueId === o.uniqueId)) {
      unique.push(o);
    }
    return unique;
  }, []);
}

const oldDate = new Date(0);

interface Store {
  additionalMediaMaps: Record<string, Record<string, DynamicMediaObject[]>>;
  customDurations: Record<
    string,
    Record<string, Record<string, { max: number; min: number }>>
  >;
  jwLanguages: CacheList<JwLanguage>;
  jwSongs: Partial<Record<JwLangCode, CacheList<MediaLink>>>;
  lookupPeriod: Record<string, DateInfo[]>;
  mediaSort: Record<string, Record<string, string[]>>;
  urlVariables: UrlVariables;
  yeartexts: Partial<Record<number, Partial<Record<JwLangCode, string>>>>;
}

export const useJwStore = defineStore('jw-store', {
  actions: {
    addToAdditionMediaMap(mediaArray: DynamicMediaObject[]) {
      try {
        const currentState = useCurrentStateStore();
        if (!mediaArray.length || !currentState.selectedDateObject) return;
        const coWeek = isCoWeek(currentState.selectedDateObject?.date);
        if (coWeek) {
          if (isMwMeetingDay(currentState.selectedDateObject?.date)) {
            mediaArray.forEach((media) => {
              media.section = 'circuitOverseer';
              media.sectionOriginal = 'circuitOverseer';
            });
          }
        }
        if (!this.additionalMediaMaps[currentState.currentCongregation])
          this.additionalMediaMaps[currentState.currentCongregation] = {};
        if (
          !this.additionalMediaMaps[currentState.currentCongregation][
            currentState.selectedDate
          ]
        )
          this.additionalMediaMaps[currentState.currentCongregation][
            currentState.selectedDate
          ] = [];
        const currentArray =
          this.additionalMediaMaps[currentState.currentCongregation][
            currentState.selectedDate
          ];
        this.additionalMediaMaps[currentState.currentCongregation][
          currentState.selectedDate
        ] = uniqueById([...currentArray, ...mediaArray]);
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
        const currentState = useCurrentStateStore();
        if (
          uniqueId &&
          currentState.currentCongregation &&
          currentState.selectedDate &&
          this.additionalMediaMaps[currentState.currentCongregation] &&
          this.additionalMediaMaps[currentState.currentCongregation][
            currentState.selectedDate
          ]
        ) {
          const currentArray =
            this.additionalMediaMaps[currentState.currentCongregation][
              currentState.selectedDate
            ];
          this.additionalMediaMaps[currentState.currentCongregation][
            currentState.selectedDate
          ] = uniqueById(
            currentArray.filter((media) => media.uniqueId !== uniqueId),
          );
        }
      } catch (e) {
        errorCatcher(e);
      }
    },
    resetSort() {
      try {
        const currentState = useCurrentStateStore();
        if (
          currentState.currentCongregation &&
          currentState.selectedDate &&
          this.mediaSort[currentState.currentCongregation]
        ) {
          this.mediaSort[currentState.currentCongregation][
            currentState.selectedDate
          ] = [];
        }
        (currentState.selectedDateObject?.dynamicMedia ?? [])
          .filter((item) => item.sectionOriginal)
          .filter((item) => item.section !== item.sectionOriginal)
          .forEach((item) => {
            item.section = item.sectionOriginal;
          });
      } catch (e) {
        errorCatcher(e);
      }
    },
    showCurrentDayHiddenMedia() {
      const currentState = useCurrentStateStore();
      const { currentCongregation, selectedDate, selectedDateObject } =
        currentState;
      if (!currentCongregation || !selectedDateObject?.date || !selectedDate)
        return;
      this.lookupPeriod?.[currentCongregation]
        ?.find(
          (day) =>
            getDateDiff(day.date, selectedDateObject?.date, 'days') === 0,
        )
        ?.dynamicMedia?.forEach((media) => {
          media.hidden = false;
        });
      this.additionalMediaMaps?.[currentCongregation]?.[selectedDate]?.forEach(
        (media) => {
          media.hidden = false;
        },
      );
    },
    async updateJwLanguages() {
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
              const pubMediaLinks = await getPubMediaLinks(songbook);
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
        if (!currentState.currentSettings) return;

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

        for (const result of results) {
          if (result.status === 'fulfilled') {
            const { wtlocale, yeartext } = result.value;
            if (yeartext) {
              if (!this.yeartexts[year]) {
                this.yeartexts[year] = {};
              }
              const { default: sanitizeHtml } = await import('sanitize-html');

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
        period.forEach((day: { date: Date | string }) => {
          if (day.date) day.date = dateFromString(day.date);
        });
      });
    },
  },
  state: (): Store => {
    return {
      additionalMediaMaps: {},
      customDurations: {},
      jwLanguages: { list: [], updated: oldDate },
      jwSongs: {},
      lookupPeriod: {},
      mediaSort: {},
      urlVariables: {
        base: 'jw.org',
        mediator: 'https://b.jw-cdn.org/apis/mediator',
        pubMedia: 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS',
      },
      yeartexts: {},
    };
  },
});
