import type {
  DateInfo,
  DynamicMediaObject,
  JwLanguage,
  MediaLink,
  PublicationFetcher,
} from 'src/types';

import { getLanguages, getYeartext } from 'boot/axios';
import { defineStore, storeToRefs } from 'pinia';
import { date } from 'quasar';
import sanitizeHtml from 'sanitize-html';
import { MAX_SONGS } from 'src/constants/jw';
import { dateFromString, isCoWeek, isMwMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { findBestResolution, getPubMediaLinks } from 'src/helpers/jw-media';
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

export const useJwStore = defineStore('jw-store', {
  actions: {
    addToAdditionMediaMap(mediaArray: DynamicMediaObject[]) {
      try {
        if (!mediaArray.length) return;
        const currentState = useCurrentStateStore();
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
        const { currentCongregation, selectedDate, selectedDateObject } =
          storeToRefs(currentState);
        if (
          currentCongregation.value &&
          selectedDate.value &&
          this.mediaSort[currentCongregation.value]
        ) {
          this.mediaSort[currentCongregation.value][selectedDate.value] = [];
        }
        (selectedDateObject.value?.dynamicMedia ?? [])
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
        const now = new Date();
        const monthsSinceUpdated = getDateDiff(
          now,
          this.jwLanguages.updated,
          'months',
        );
        if (monthsSinceUpdated > 3 || !this.jwLanguages?.list?.length) {
          this.jwLanguages = {
            list: await getLanguages(),
            updated: now,
          };
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
        for (const fileformat of ['MP4', 'MP3']) {
          try {
            const langwritten = currentState.currentSettings.lang as string;
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
              const songbook = {
                fileformat,
                langwritten,
                pub: currentState.currentSongbook.pub,
              } as PublicationFetcher;
              const pubMediaLinks = await getPubMediaLinks(songbook);
              if (!pubMediaLinks || !pubMediaLinks.files) {
                continue;
              }

              const mediaItemLinks = (
                pubMediaLinks.files[langwritten][fileformat] as MediaLink[]
              ).filter((mediaLink) => mediaLink.track < MAX_SONGS);
              const filteredMediaItemLinks = mediaItemLinks.reduce<MediaLink[]>(
                (acc, mediaLink) => {
                  if (!acc.some((m) => m.track === mediaLink.track)) {
                    const bestItem = findBestResolution(
                      mediaItemLinks.filter((m) => m.track === mediaLink.track),
                    ) as MediaLink | null;
                    if (bestItem) acc.push(bestItem);
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
    async updateYeartext(lang?: string) {
      try {
        const currentState = useCurrentStateStore();
        const currentLang = currentState.currentSettings?.lang || lang;
        if (!currentLang) return;
        const currentYear = new Date().getFullYear();
        this.yeartexts[currentYear] ??= {};
        if (!this.yeartexts[currentYear][currentLang]) {
          const yeartextRequest = await getYeartext(currentLang, currentYear);
          if (yeartextRequest?.content) {
            this.yeartexts[currentYear][currentLang] = sanitizeHtml(
              yeartextRequest.content,
              {
                allowedAttributes: {
                  p: ['class'],
                },
                allowedTags: ['b', 'i', 'em', 'strong', 'p'],
              },
            );
          }
        }
      } catch (error) {
        errorCatcher(error);
      }
    },
  },
  persist: {
    afterHydrate: (ctx) => {
      // Convert date strings to Date objects in state
      if (ctx.store.$state.jwLanguages.updated)
        ctx.store.$state.jwLanguages.updated = dateFromString(
          ctx.store.$state.jwLanguages.updated,
        );
      if (ctx.store.$state.jwSongs.updated)
        ctx.store.$state.jwSongs.updated = dateFromString(
          ctx.store.$state.jwSongs.updated,
        );
      Object.entries(
        ctx.store.$state.lookupPeriod as Record<string, DateInfo[]>,
      ).forEach(([, period]) => {
        period.forEach((day: { date: Date | string }) => {
          if (day.date) day.date = dateFromString(day.date);
        });
      });
    },
  },
  state: () => {
    return {
      additionalMediaMaps: {} as Record<
        string,
        Record<string, DynamicMediaObject[]>
      >,
      customDurations: {} as Record<
        string,
        Record<string, Record<string, { max: number; min: number }>>
      >,
      jwLanguages: {
        list: [],
        updated: oldDate,
      } as { list: JwLanguage[]; updated: Date },
      jwSongs: {} as Record<
        string,
        {
          list: MediaLink[];
          updated: Date;
        }
      >,
      lookupPeriod: {} as Record<string, DateInfo[]>,
      mediaSort: {} as Record<string, Record<string, string[]>>,
      yeartexts: {} as Record<number, Record<string, string>>,
    };
  },
});
