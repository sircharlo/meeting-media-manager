import type { RESOLUTIONS } from 'src/constants/settings';
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
  UrlVariables,
} from 'src/types';
import type { Songbook } from 'stores/current-state';

import { defineStore } from 'pinia';
import { MAX_SONGS } from 'src/constants/jw';
import { isMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  findMediaSection,
  getOrCreateMediaSection,
} from 'src/helpers/media-sections';
import { isFetchNetworkError } from 'src/shared/network-errors';
import {
  extractCssUrls,
  findIconUrlInCss,
  getYeartextFontUrlsFromCss,
  log,
} from 'src/shared/vanilla';
import {
  fetchJwLanguages,
  fetchMemorials,
  fetchPubMediaLinks,
  fetchRaw,
  fetchYeartext,
} from 'src/utils/api';
import {
  dateFromString,
  datesAreSame,
  getDateDiff,
  isInPast,
} from 'src/utils/date';
import { createDebouncedStorage } from 'src/utils/debounced-storage';
import { findBestResolution, isMediaLink } from 'src/utils/jw';
import { isDemoModeActive } from 'stores/demo-mode';

const oldDate = new Date(0);

// Debounce the jw store's persistence so bursts of mutations (e.g. the
// day-by-day schedule population during a media refresh) collapse into a
// single synchronous localStorage write instead of one per mutation. The
// write is flushed on window close so a clean shutdown never loses the last
// mutation.
//
// FE-10 (full-audit-2026-09-04.md): a forced-quit/OS-shutdown/main-process
// crash can skip both `beforeunload` and `pagehide`, discarding up to
// JW_STORE_PERSIST_DEBOUNCE_MS of the latest mutation - accepted
// intentionally, not overlooked. An Electron `before-quit`/`will-quit`
// main-process hook can't close this gap either: those are graceful-exit
// hooks too, and don't fire for the exact scenarios this risk describes
// (a force-kill, OS shutdown, or crash bypasses them the same way it
// bypasses the DOM events above). The only way to fully close this window
// is a synchronous write on every mutation, which is the performance
// problem this debounce exists to solve. Impact is bounded to re-fetchable
// JW.org cache data (meeting schedule, songs, yeartexts), not irreplaceable
// user input, so the tradeoff is accepted as-is.
const JW_STORE_PERSIST_DEBOUNCE_MS = 500;
const jwStoreStorage = createDebouncedStorage(
  window.localStorage,
  JW_STORE_PERSIST_DEBOUNCE_MS,
);

window.addEventListener('beforeunload', jwStoreStorage.flush);
window.addEventListener('pagehide', jwStoreStorage.flush);

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
  try {
    if (!cacheList) return true; // No cache list, update
    if (!cacheList.updated) return true; // No update date, update
    try {
      if (Number.isNaN(new Date(cacheList.updated).getTime())) return true; // Invalid date, update
    } catch (error) {
      log(
        'cacheList.updated is not a valid date',
        'jw',
        'log',
        cacheList.updated,
        error,
      );
      return true; // Error parsing date, update
    }
    return (
      !cacheList?.list?.length ||
      getDateDiff(new Date(), cacheList.updated, 'months') > months
    ); // True if list is empty or old enough, false otherwise
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          args: { cacheList, months },
          name: 'shouldUpdateList',
        },
      },
    });
    return true; // Error checking, update
  }
};

interface Store {
  jwBibleFiles: Partial<Record<JwLangCode, CacheList<Partial<Publication>>>>;
  jwIconsUrl: string;
  jwLanguages: CacheList<JwLanguage>;
  jwMepsLanguages: CacheList<JwMepsLanguage>;
  jwSongs: Partial<Record<JwLangCode, CacheList<MediaLink>>>;
  lookupPeriod: Partial<Record<string, DateInfo[]>>;
  memorials: Partial<Record<number, `${number}/${number}/${number}`>>;
  urlVariables: UrlVariables;
  yeartextFontUrls: Partial<Record<FontName, string>>;
  yeartexts: Partial<Record<number, Partial<Record<JwLangCode, string>>>>;
}

/**
 * Inserts the unique items from sourceArray into targetArray at the given
 * index, preserving their relative order and skipping items whose uniqueId
 * already exists in targetArray (or earlier in sourceArray itself).
 */
export function addUniqueByIdAt<T extends { uniqueId: string }>(
  targetArray: (T | undefined)[],
  sourceArray: (T | undefined)[],
  index: number,
): void {
  const newItems: (T | undefined)[] = [];
  for (const item of sourceArray) {
    const alreadyExists =
      targetArray.some((obj) => obj?.uniqueId === item?.uniqueId) ||
      newItems.some((obj) => obj?.uniqueId === item?.uniqueId);
    if (!alreadyExists) newItems.push(item);
  }
  if (!newItems.length) return;
  targetArray.splice(index, 0, ...newItems);
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
 * from the newMediaItems, if the existing item is a placeholder (has no fileUrl) or if the
 * incoming item's own content has changed (see hasDynamicMediaContentChanged) - preserving
 * the existing item's `hidden`/`sortOrderOriginal` state in the latter case, since those are
 * user customizations rather than JW.org-sourced content.
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
  for (const sectionId in newMediaItems) {
    const sectionItems = newMediaItems[sectionId];
    if (!sectionItems || !targetDay.mediaSections) continue;

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
        log(
          `Target section ${targetSectionId} not found in mediaSections`,
          'jw',
          'warn',
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

      if (index === -1) {
        // Add new item to the correct section if no match found
        targetSection.items.push(item);
      } else {
        const existing = targetSection.items[index];
        if (!existing) return;

        // Replace unconditionally if it's still a placeholder (fileUrl is the
        // same as pubMediaId) and has no children.
        if (
          existing.fileUrl === existing.pubMediaId &&
          !existing.children?.length
        ) {
          targetSection.items[index] = item;
        } else if (hasDynamicMediaContentChanged(existing, item)) {
          // Already resolved (e.g. downloaded), but JW.org's own data for
          // this pubMediaId has genuinely changed - adopt the new content
          // while keeping the user's hidden/sort-order state.
          targetSection.items[index] = {
            ...item,
            hidden: existing.hidden,
            sortOrderOriginal: existing.sortOrderOriginal,
          };
        }
      }
    });
  }

  // Sort all sections by sortOrderOriginal to maintain paragraph order
  Object.values(targetDay.mediaSections).forEach((section) => {
    if (section?.items) {
      section.items.sort((a, b) => {
        const aOrder =
          typeof a.sortOrderOriginal === 'number' ? a.sortOrderOriginal : 0;
        const bOrder =
          typeof b.sortOrderOriginal === 'number' ? b.sortOrderOriginal : 0;
        return aOrder - bOrder;
      });
    }
  });
}

/**
 * Whether a freshly-fetched dynamic media item's own content looks different
 * from the already-stored item it matched by pubMediaId. `duration` and
 * `title` are populated directly from JW.org's own source data (not
 * user-editable), so a difference here is a real upstream change - e.g. a
 * corrected video/caption for the same pubMediaId slot - not routine
 * per-fetch noise. This is intentionally conservative: it only compares
 * fields the app already treats as content identity elsewhere, rather than a
 * full field-by-field diff, so it can't misfire on user customizations like
 * `hidden`/`sortOrderOriginal`.
 * @param existing The already-stored media item
 * @param incoming The newly-fetched media item matched to it by pubMediaId
 */
function hasDynamicMediaContentChanged(
  existing: MediaItem,
  incoming: MediaItem,
): boolean {
  return (
    existing.duration !== incoming.duration || existing.title !== incoming.title
  );
}

export const useJwStore = defineStore('jw-store', {
  actions: {
    addToAdditionMediaMap(
      mediaArray: MediaItem[],
      section: MediaSectionIdentifier | undefined,
      currentCongregation: string,
      selectedDateObject: DateInfo | null,
      coWeek: boolean,
      appendToEnd = false,
    ) {
      try {
        // Early exit if no media or selected date object
        if (!mediaArray.length || !selectedDateObject) return;

        // Ensure lookupPeriod for current congregation exists
        this.lookupPeriod[currentCongregation] ??= [];

        // Find or create the period object for the selected date
        let period = this.lookupPeriod[currentCongregation].find((d) =>
          datesAreSame(d.date, selectedDateObject.date),
        );

        if (!period) {
          log(
            '🔄 [addToAdditionMediaMap] No period found, creating new one',
            'jw',
            'log',
          );
          period = {
            ...selectedDateObject,
            mediaSections: [],
          };
          this.lookupPeriod[currentCongregation].push(period);
        }
        // An existing period found above can predate mediaSections being
        // populated (e.g. a stub created elsewhere before the schedule
        // fetch filled it in) - date.ts's own helpers guard the same field
        // with `?.` for this reason; getOrCreateMediaSection below doesn't.
        period.mediaSections ??= [];

        // Determine the target section
        let targetSection: MediaSectionIdentifier = 'imported-media';
        if (coWeek) {
          targetSection =
            section ||
            (isMeetingDay(selectedDateObject.date)
              ? 'circuit-overseer'
              : 'imported-media');
        } else if (section) {
          targetSection = section;
        }

        const targetSectionContainer = getOrCreateMediaSection(
          period.mediaSections,
          targetSection,
        );

        log(
          '🔄 [addToAdditionMediaMap] Target section:',
          'jw',
          'log',
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
        if (appendToEnd) {
          // e.g. a closing song: goes after everything else in the section
          addUniqueByIdAt(sectionMedia, mediaArray, sectionMedia.length);
        } else {
          // Keep an opening song in first place instead of bumping it down
          const isFirstSection =
            period.mediaSections[0] === targetSectionContainer;
          const songIsFirst = sectionMedia[0]?.tag?.type === 'song';
          const insertIndex = isFirstSection && songIsFirst ? 1 : 0;
          addUniqueByIdAt(sectionMedia, mediaArray, insertIndex);
        }
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
        const additionalItems = section.items?.filter(
          (item) => item.source === 'additional',
        );
        if (additionalItems?.length) {
          section.items =
            section.items?.filter((item) => item.source !== 'additional') ?? [];
        }
      });
    },
    deleteMediaItems(
      uniqueIds: string[],
      currentCongregation: string,
      selectedDateObject: DateInfo | null,
    ) {
      try {
        if (
          !uniqueIds.length ||
          !currentCongregation ||
          !selectedDateObject?.mediaSections
        )
          return;

        selectedDateObject.mediaSections.forEach((section) => {
          if (!section.items) return;
          section.items = section.items.filter(
            (item: MediaItem) => !uniqueIds.includes(item.uniqueId),
          );
        });
      } catch (e) {
        errorCatcher(e);
      }
    },
    hideMediaItems(
      uniqueIds: string[],
      currentCongregation: string,
      selectedDateObject: DateInfo | null,
    ) {
      try {
        if (
          !uniqueIds.length ||
          !currentCongregation ||
          !selectedDateObject?.mediaSections
        )
          return;

        selectedDateObject.mediaSections.forEach((section) => {
          if (!section.items) return;
          section.items.forEach((item: MediaItem) => {
            if (uniqueIds.includes(item.uniqueId)) {
              item.hidden = true;
            }
            if (item.children?.length) {
              item.children.forEach((child: MediaItem) => {
                if (uniqueIds.includes(child.uniqueId)) {
                  child.hidden = true;
                }
              });
            }
          });
        });
      } catch (e) {
        errorCatcher(e);
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
    async updateJwIconsUrl() {
      try {
        // This whole method exists to get the *current* truth after a
        // cached/default URL just failed - fetchRaw's cache has no TTL, so
        // reusing it here could wedge the session on an already-dead URL
        // (from an earlier call) until restart. Always fetch fresh.
        const wolUrl = `https://wol.${this.urlVariables.base}/en/wol/h/r1/lp-e`;
        const response = await fetchRaw(wolUrl);
        if (!response.ok) return;

        const html = await response.text();
        const cssUrls = extractCssUrls(html, this.urlVariables.base);

        for (const cssUrl of cssUrls) {
          try {
            const cssResponse = await fetchRaw(cssUrl);
            if (!cssResponse.ok) continue;
            const cssText = await cssResponse.text();
            const fontUrl = findIconUrlInCss(cssText, cssUrl);
            if (fontUrl) {
              this.jwIconsUrl = fontUrl;
              return; // Found it, we can stop
            }
          } catch (e) {
            errorCatcher(e, {
              contexts: {
                fn: {
                  args: { cssUrl },
                  name: 'updateJwIconsUrl - cssUrl',
                },
              },
            });
          }
        }
      } catch (e) {
        errorCatcher(e, {
          contexts: {
            fn: {
              args: {},
              name: 'updateJwIconsUrl - main',
            },
          },
        });
      }
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
    async updateJwSongs({
      currentSongbook,
      force = false,
      lang,
      maxRes,
      online,
    }: {
      currentSongbook: Songbook;
      force?: boolean;
      lang: JwLangCode;
      maxRes: (typeof RESOLUTIONS)[number];
      online: boolean;
    }) {
      try {
        if (!online) return;
        if (!lang || !currentSongbook?.pub) {
          errorCatcher('No current settings or songbook defined');
          return;
        }
        const formats: (keyof PublicationFiles)[] = ['MP4', 'MP3'];
        for (const fileformat of formats) {
          try {
            this.jwSongs[lang] ??= { list: [], updated: oldDate };

            // Check if the song list has been updated in the last month
            const now = new Date();
            const monthsSinceUpdated = getDateDiff(
              now,
              this.jwSongs[lang].updated || oldDate,
              'months',
            );

            // Fetch media links only if the song list hasn't been updated in over a month or if force is true
            if (monthsSinceUpdated > 1 || force) {
              const songbook: PublicationFetcher = {
                fileformat,
                langwritten: lang,
                pub: currentSongbook.pub,
              };
              const pubMediaLinks = await fetchPubMediaLinks(
                songbook,
                this.urlVariables.pubMedia,
                online,
              );
              if (!pubMediaLinks?.files) {
                continue;
              }

              const mediaItemLinks = (
                pubMediaLinks.files[lang]?.[fileformat] || []
              )
                .filter(isMediaLink)
                .filter((mediaLink) => mediaLink.track > 0)
                .filter((mediaLink) => mediaLink.track < MAX_SONGS);
              const filteredMediaItemLinks = mediaItemLinks.reduce<MediaLink[]>(
                (acc, mediaLink) => {
                  if (!acc.some((m) => m.track === mediaLink.track)) {
                    const bestItem = findBestResolution(
                      mediaItemLinks.filter((m) => m.track === mediaLink.track),
                      maxRes,
                    );
                    if (isMediaLink(bestItem)) acc.push(bestItem);
                  }
                  return acc;
                },
                [],
              );
              this.jwSongs[lang] = {
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
        const currentYear = new Date().getFullYear();
        const currentMemorialDate = this.memorials[currentYear];
        if (!currentMemorialDate || isInPast(currentMemorialDate)) {
          const result = await fetchMemorials();
          if (result) this.memorials = result;
        }
      } catch (e) {
        errorCatcher(e);
      }
    },
    async updateYeartext({
      isSignLanguage,
      lang,
      langFallback,
      online,
    }: {
      isSignLanguage: boolean | undefined;
      lang: JwLangCode | null | undefined;
      langFallback: JwLangCode | null | undefined;
      online: boolean;
    }) {
      try {
        if (!online || !lang || isSignLanguage || isDemoModeActive()) return;

        const year = new Date().getFullYear();
        const promises: Promise<{ wtlocale: JwLangCode; yeartext?: string }>[] =
          [];

        const langs = new Set<JwLangCode>(['E', lang]);

        if (langFallback) {
          langs.add(langFallback);
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
              this.yeartexts[year] ??= {};

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
    async updateYeartextFontUrls() {
      try {
        const wolUrl = `https://wol.${this.urlVariables.base}/en/wol/h/r1/lp-e`;
        const response = await fetchRaw(wolUrl, undefined, true);
        if (!response.ok) return;

        const html = await response.text();
        const cssUrls = extractCssUrls(html, this.urlVariables.base);

        for (const cssUrl of cssUrls) {
          try {
            const cssResponse = await fetchRaw(cssUrl, undefined, true);
            if (!cssResponse.ok) continue;
            const cssText = await cssResponse.text();
            this.yeartextFontUrls = {
              ...this.yeartextFontUrls,
              ...getYeartextFontUrlsFromCss(cssText),
            };
          } catch (e) {
            if (isFetchNetworkError(e)) continue;
            errorCatcher(e, {
              contexts: {
                fn: { args: { cssUrl }, name: 'updateYeartextFontUrls' },
              },
            });
          }
        }
      } catch (e) {
        if (isFetchNetworkError(e)) return;
        errorCatcher(e, {
          contexts: { fn: { name: 'updateYeartextFontUrls - main' } },
        });
      }
    },
  },
  getters: {
    fontUrls: (state): Record<FontName, string> => {
      // SEC-3 (full-audit-2026-09-04.md): pinned rather than `@latest` -
      // static font bytes are lower risk than the pdf-parse worker script
      // above, but an unpinned CDN reference still means an unreviewed
      // future version gets served automatically. Fontsource publishes every
      // font package under one synchronized version number (confirmed via
      // `npm view`, matching this project's own pinned
      // `@fontsource-variable/inter`/`noto-serif` dependencies), so a single
      // constant covers all of them - bump it when those dependencies bump.
      const FONTSOURCE_VERSION = '5.3.0';
      const jsdelivr = (font: string, file: string) =>
        `https://cdn.jsdelivr.net/fontsource/fonts/${font}@${FONTSOURCE_VERSION}/${file}`;

      return {
        AbyssinicaSIL: jsdelivr('abyssinica-sil', 'latin-400-normal.woff2'),
        // No hardcoded fallback here: The website rotates this asset's hash
        // periodically, so a baked-in URL inevitably goes stale and 404s.
        // jwIconsUrl is discovered dynamically via updateJwIconsUrl().
        'jw-icons-all': state.jwIconsUrl,
        NotoNaskhArabic: jsdelivr(
          'noto-naskh-arabic:vf',
          'arabic-wght-normal.woff2',
        ),
        NotoNastaliqUrdu: jsdelivr(
          'noto-nastaliq-urdu:vf',
          'arabic-wght-normal.woff2',
        ),
        NotoSans: jsdelivr('noto-sans:vf', 'latin-wght-normal.woff2'),
        NotoSansBengali: jsdelivr(
          'noto-sans-bengali:vf',
          'bengali-wght-normal.woff2',
        ),
        NotoSansGurmukhi: jsdelivr(
          'noto-sans-gurmukhi:vf',
          'gurmukhi-wght-normal.woff2',
        ),
        NotoSansMalayalam: jsdelivr(
          'noto-sans-malayalam:vf',
          'malayalam-wght-normal.woff2',
        ),
        NotoSansOriya: jsdelivr(
          'noto-sans-oriya:vf',
          'oriya-wght-normal.woff2',
        ),
        NotoSansSC: jsdelivr(
          'noto-sans-sc',
          'chinese-simplified-400-normal.woff',
        ),
        NotoSansTamil: jsdelivr(
          'noto-sans-tamil:vf',
          'tamil-wght-normal.woff2',
        ),
        NotoSansTC: jsdelivr(
          'noto-sans-tc',
          'chinese-traditional-400-normal.woff',
        ),
        NotoSansTelugu: jsdelivr(
          'noto-sans-telugu:vf',
          'telugu-wght-normal.woff2',
        ),
        NotoSerifArmenian: jsdelivr(
          'noto-serif-armenian:vf',
          'armenian-wght-normal.woff2',
        ),
        NotoSerifDevanagari: jsdelivr(
          'noto-serif-devanagari:vf',
          'devanagari-wght-normal.woff2',
        ),
        NotoSerifGujarati: jsdelivr(
          'noto-serif-gujarati:vf',
          'gujarati-wght-normal.woff2',
        ),
        NotoSerifHebrew: jsdelivr(
          'noto-serif-hebrew:vf',
          'hebrew-wght-normal.woff2',
        ),
        NotoSerifKannada: jsdelivr(
          'noto-serif-kannada:vf',
          'kannada-wght-normal.woff2',
        ),
        NotoSerifKhmer: jsdelivr(
          'noto-serif-khmer:vf',
          'khmer-wght-normal.woff2',
        ),
        NotoSerifSinhala: jsdelivr(
          'noto-serif-sinhala:vf',
          'sinhala-wght-normal.woff2',
        ),
        // No hardcoded fallback here either: these paths are versioned
        // (e.g. /1.000/, /1.029/) and the website bumps that version
        // periodically, so a baked-in URL inevitably goes stale. Discovered
        // dynamically via updateYeartextFontUrls(), same as the other
        // WT/Manna yeartext fonts below.
        'Wt-BaeumMyungjo': state.yeartextFontUrls['Wt-BaeumMyungjo'] || '',
        'Wt-ClearText-Bold': state.yeartextFontUrls['Wt-ClearText-Bold'] || '',
        ...state.yeartextFontUrls,
      } as Record<FontName, string>;
    },
  },
  persist: {
    afterHydrate: (ctx) => {
      const state = ctx.store.$state as Store;
      // Convert date strings to Date objects in state
      if (state.jwLanguages.updated)
        state.jwLanguages.updated = dateFromString(state.jwLanguages.updated);
      Object.values(state.jwSongs).forEach((lang) => {
        lang.updated = lang.updated ? dateFromString(lang.updated) : oldDate;
      });
      Object.entries(state.lookupPeriod).forEach(([, period]) => {
        period?.forEach((day: { date: Date | string }) => {
          try {
            if (day.date) {
              // Convert the string back to a Date object
              day.date = new Date(day.date);
            }
          } catch (error) {
            errorCatcher(error);
            day.date = new Date();
          }
        });
      });
    },
    omit: ['jwBibleFiles', 'jwMepsLanguages'],
    storage: jwStoreStorage,
  },
  state: (): Store => {
    return {
      jwBibleFiles: {},
      jwIconsUrl: '',
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
      yeartextFontUrls: {},
      yeartexts: {},
    };
  },
});
