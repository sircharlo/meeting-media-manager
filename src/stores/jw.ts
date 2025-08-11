import type {
  CacheList,
  DateInfo,
  FontName,
  JwLangCode,
  JwLanguage,
  JwMepsLanguage,
  MediaItem,
  MediaLink,
  MediaSectionIdentifier,
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
  findMediaSection,
  getOrCreateMediaSection,
} from 'src/helpers/media-sections';
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

export function addUniqueByIdToTop<T extends { uniqueId: string }>(
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
 * Replaces existing media items across all sections in the target day with matching items
 * from the newMediaItems, if the existing item is a placeholder (has no fileUrl).
 * If there is no match at all, the item from the source array will be added to
 * the appropriate section.
 * @param targetDay The day object containing mediaSections to search and modify
 * @param newMediaItems Record of section identifiers to arrays of new media items
 */
export function replaceMissingMediaByPubMediaId(
  targetDay: DateInfo,
  newMediaItems: Record<string, MediaItem[]> | undefined,
): void {
  // Iterate through all new media items from all sections
  if (!newMediaItems) return;
  console.log(
    '🔍 [replaceMissingMediaByPubMediaId] newMediaItems',
    newMediaItems,
  );
  console.log(
    '🔍 [replaceMissingMediaByPubMediaId] targetDay.mediaSections',
    targetDay.mediaSections,
  );
  for (const sectionId in newMediaItems) {
    const sectionItems = newMediaItems[sectionId];
    if (!sectionItems || !targetDay.mediaSections) continue;
    console.log(
      '🔍 [replaceMissingMediaByPubMediaId] sourceArray',
      sectionItems,
    );

    // Process each item in the section
    sectionItems.forEach((item) => {
      if (item.source !== 'dynamic') return;

      // Determine the correct target section based on the item's originalSection property
      // If children, use the first child's originalSection
      const targetSectionId = item.children?.length
        ? item.children[0]?.originalSection || 'tgw'
        : item.originalSection || 'tgw'; // Default to 'tgw' if no section assigned
      const targetSection = findMediaSection(
        targetDay.mediaSections,
        targetSectionId,
      );

      if (!targetSection?.items) {
        console.warn(
          `Target section ${targetSectionId} not found in mediaSections`,
        );
        return;
      }

      // Handle items without pubMediaId (use uniqueId matching)
      if (!item.pubMediaId) {
        const fileUrlIndex = targetSection.items.findIndex(
          (t) => t.uniqueId === item.uniqueId,
        );
        if (fileUrlIndex === -1) {
          // Add to the correct section if no match found
          targetSection.items.push(item);
        } else {
          // check for duplicates
          const lastIndex = targetSection.items.findLastIndex(
            (t) => t.uniqueId === item.uniqueId,
          );
          if (lastIndex > fileUrlIndex) {
            targetSection.items.splice(lastIndex, 1);
          }
        }
        return;
      }

      // Handle items with pubMediaId
      const index = targetSection.items.findIndex(
        (obj) => obj?.pubMediaId === item?.pubMediaId,
      );

      if (index !== -1) {
        const existing = targetSection.items[index];
        // Replace only if it's a placeholder (fileUrl is the same as pubMediaId) and has no children
        if (
          existing?.fileUrl === existing?.pubMediaId &&
          !existing?.children?.length
        ) {
          targetSection.items[index] = item;
        }
      } else {
        // Add new item to the correct section if no match found
        targetSection.items.push(item);
      }
    });
  }

  // Sort all sections by sortOrderOriginal to maintain paragraph order
  Object.values(targetDay.mediaSections).forEach((section) => {
    if (section?.items) {
      // Debug logging for sorting
      console.log(
        '🔍 [replaceMissingMediaByPubMediaId] Before sorting section items:',
        section.items.map((item) => ({
          isSong: item.tag?.type === 'song',
          sortOrderOriginal: item.sortOrderOriginal,
          title: item.title,
        })),
      );

      section.items.sort((a, b) => {
        const aOrder =
          typeof a.sortOrderOriginal === 'number' ? a.sortOrderOriginal : 0;
        const bOrder =
          typeof b.sortOrderOriginal === 'number' ? b.sortOrderOriginal : 0;
        return aOrder - bOrder;
      });

      // Debug logging after sorting
      console.log(
        '🔍 [replaceMissingMediaByPubMediaId] After sorting section items:',
        section.items.map((item) => ({
          isSong: item.tag?.type === 'song',
          sortOrderOriginal: item.sortOrderOriginal,
          title: item.title,
        })),
      );
    }
  });
}

export const useJwStore = defineStore('jw-store', {
  actions: {
    addToAdditionMediaMap(
      mediaArray: MediaItem[],
      section: MediaSectionIdentifier | undefined,
      currentCongregation: string,
      selectedDateObject: DateInfo | null,
      coWeek: boolean,
    ) {
      try {
        // Early exit if no media or selected date object
        if (!mediaArray.length || !selectedDateObject) return;

        // Ensure lookupPeriod for current congregation exists
        if (!this.lookupPeriod[currentCongregation]) {
          this.lookupPeriod[currentCongregation] = [];
        }

        // Find or create the period object for the selected date
        let period = this.lookupPeriod[currentCongregation].find((d) =>
          datesAreSame(d.date, selectedDateObject.date),
        );

        if (!period) {
          console.log(
            '🔄 [addToAdditionMediaMap] No period found, creating new one',
          );
          period = {
            ...selectedDateObject,
            mediaSections: [],
          };
          this.lookupPeriod[currentCongregation].push(period);
        }

        // Determine the target section
        let targetSection: MediaSectionIdentifier = 'imported-media';
        if (coWeek) {
          targetSection =
            section ||
            (isMwMeetingDay(selectedDateObject.date) ||
            isWeMeetingDay(selectedDateObject.date)
              ? 'circuit-overseer'
              : 'imported-media');
        } else if (section) {
          targetSection = section;
        }

        const targetSectionContainer = getOrCreateMediaSection(
          period.mediaSections,
          targetSection,
        );

        console.log(
          '🔄 [addToAdditionMediaMap] Target section:',
          targetSection,
          targetSectionContainer,
        );

        targetSectionContainer.items ??= [];
        const sectionMedia = targetSectionContainer.items;
        const currentCount = sectionMedia.length;
        mediaArray.forEach((media, index) => {
          if (!media) return;
          media.sortOrderOriginal = `${targetSection}-${currentCount + index}`;
        });

        // Add media items to the section
        addUniqueByIdToTop(sectionMedia, mediaArray);
      } catch (e) {
        errorCatcher(e);
      }
    },
    clearAdditionalMediaForSelectedDate(
      currentCongregation: string,
      selectedDateObject: DateInfo | null,
    ) {
      if (!currentCongregation || !selectedDateObject?.mediaSections) return;

      // Clear all sections except the standard meeting sections
      selectedDateObject.mediaSections.forEach((section) => {
        const sectionId = section.config.uniqueId as MediaSectionIdentifier;
        if (
          sectionId !== 'wt' &&
          sectionId !== 'tgw' &&
          sectionId !== 'ayfm' &&
          sectionId !== 'lac' &&
          sectionId !== 'circuit-overseer'
        ) {
          const sectionData = findMediaSection(
            selectedDateObject.mediaSections,
            sectionId,
          );
          if (sectionData) {
            sectionData.items = [];
          }
        }
      });
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
          !selectedDateObject?.mediaSections
        )
          return;

        // Remove the item from all sections
        selectedDateObject.mediaSections.forEach((section) => {
          if (!section.items) return;
          const index = section.items.findIndex(
            (item: MediaItem) => item.uniqueId === uniqueId,
          );
          if (index !== undefined && index !== -1) {
            section.items.splice(index, 1);
          }
        });

        // No need to deduplicate since we're working with sections now
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

      if (!currentDay?.mediaSections) return;

      // Show all hidden media in all sections
      Object.values(currentDay.mediaSections).forEach((sectionMedia) => {
        sectionMedia.items?.forEach((media: MediaItem) => {
          if (media.hidden) {
            media.hidden = false;
          }

          if (media.children?.some((child: MediaItem) => child.hidden)) {
            media.children.forEach((child: MediaItem) => {
              if (child.hidden) child.hidden = false;
            });
          }
        });
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

        const { default: DOMPurify } = await import('dompurify');
        for (const result of results) {
          if (result.status === 'fulfilled') {
            const { wtlocale, yeartext } = result.value;
            if (yeartext) {
              if (!this.yeartexts[year]) {
                this.yeartexts[year] = {};
              }

              this.yeartexts[year][wtlocale] = DOMPurify.sanitize(yeartext, {
                ALLOWED_ATTR: ['class'],
                ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
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
          '/fonts/wt-clear-text/1.029/Wt-ClearText-Bold.woff2',
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
