<template>
  <q-dialog v-model="open">
    <div
      class="bg-secondary-contrast column fit-snugly large-overlay q-px-none"
    >
      <div class="text-h6 col-shrink full-width q-px-md q-pt-lg">
        {{ $t('add-media-study-bible') }}
      </div>
      <div class="col-shrink full-width q-px-md q-py-md">
        {{ $t('add-media-study-bible-explain') }}
      </div>
      <div
        v-if="bibleBook"
        class="text-h6 col-shrink full-width q-px-md q-py-md"
      >
        {{ $t('media-gallery') }} -
        {{
          localeBibleBooks[bibleBook]?.standardName ||
          bibleBooks[bibleBook].standardName
        }}{{ bibleBookChapter ? ' ' + bibleBookChapter : '' }}
      </div>
      <div
        v-if="!!(loadingProgress < 1 && Object.keys(bibleBooks).length === 0)"
        class="col-shrink full-width q-px-md q-pb-md row justify-center"
      >
        <q-spinner color="primary" size="md" />
      </div>
      <div class="q-px-md overflow-auto col full-width flex items-start">
        <template v-if="bibleBookChapter">
          <template
            v-for="bibleBookChapterVerseId in bibleBookChapterVerseIds
              .filter((bibleBookChapterVerseId) =>
                bibleBookChapterVerseId.startsWith(
                  bibleBook.toString().padStart(2, '0') +
                    bibleBookChapter.toString().padStart(3, '0'),
                ),
              )
              .sort()"
            :key="bibleBookChapterVerseId"
          >
            <div class="text-h6 row q-px-md">
              {{ bibleBookChapter }}:{{
                parseInt(bibleBookChapterVerseId.slice(5) ?? '')
              }}{{
                bibleBookChapterVerseId.includes('-')
                  ? '-' +
                    parseInt(
                      bibleBookChapterVerseId.split('-')[1].slice(2, 5),
                    ) +
                    ':' +
                    parseInt(bibleBookChapterVerseId.split('-')[1].slice(5))
                  : ''
              }}
            </div>
            <div class="row q-px-md full-width">
              <template
                v-for="mediaItem in bibleBookMedia.filter((m) =>
                  m.source
                    .split(',')
                    .some((s) => s.includes(bibleBookChapterVerseId)),
                )"
                :key="mediaItem.id"
              >
                <div class="col-xs-4 col-sm-3 col-md-2 col-lg-2 col-xl-1">
                  <div
                    v-ripple
                    :class="{
                      'cursor-pointer': true,
                      'rounded-borders-lg': true,
                      'full-height': true,
                      'bg-accent-100': hoveredMediaItem === mediaItem.id,
                      'relative-position': true,
                    }"
                    flat
                    @click="
                      selectedMediaItems.includes(mediaItem)
                        ? selectedMediaItems.splice(
                            selectedMediaItems.indexOf(mediaItem),
                            1,
                          )
                        : selectedMediaItems.push(mediaItem)
                    "
                    @mouseout="hoveredMediaItem = 0"
                    @mouseover="hoveredMediaItem = mediaItem.id"
                  >
                    <q-card-section
                      :class="{
                        'q-pa-sm': true,
                      }"
                    >
                      <q-img
                        :class="{
                          'study-bible-item': true,
                          'study-bible-item-selected':
                            selectedMediaItems.includes(mediaItem),
                        }"
                        :src="
                          getBestImageUrl(
                            {
                              sqr:
                                localeBibleBookMedia.find(
                                  (m) => m.docID === mediaItem.docID,
                                )?.thumbnail.sizes ?? mediaItem.thumbnail.sizes,
                            },
                            'md',
                          )
                        "
                      >
                        <q-badge
                          v-if="mediaItem.type === 'video'"
                          class="q-mt-sm q-ml-sm bg-semi-black rounded-borders-sm"
                          style="padding: 5px !important"
                        >
                          <q-icon
                            class="q-mr-xs"
                            color="white"
                            name="mmm-play"
                          />
                          {{ $t('video') }}
                        </q-badge>
                        <q-checkbox
                          v-if="selectedMediaItems.includes(mediaItem)"
                          v-model="selectedMediaItems"
                          color="primary"
                          :val="mediaItem"
                        />
                      </q-img>
                    </q-card-section>
                    <q-card-section class="q-pa-sm">
                      <div class="text-subtitle2 q-mb-xs">
                        {{
                          localeBibleBookMedia.find(
                            (m) => m.docID === mediaItem.docID,
                          )?.label || mediaItem.label
                        }}
                      </div>
                    </q-card-section>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </template>
        <div v-else-if="bibleBook" class="row q-px-md">
          <q-spinner
            v-if="!bibleBookChapters.length"
            color="primary"
            size="md"
          />
          <q-btn
            v-for="chapter in bibleBookChapters"
            v-else
            :key="chapter"
            class="rounded-borders-sm q-mr-xs q-mb-xs"
            color="primary"
            :label="parseInt(chapter)"
            style="width: 3em; height: 3em"
            unelevated
            @click="bibleBookChapter = parseInt(chapter)"
          />
        </div>
        <div v-else class="row q-col-gutter-md q-px-md">
          <template
            v-for="[bookNr, book] in Object.entries(bibleBooks)"
            :key="bookNr"
          >
            <div
              v-if="book.hasMultimedia"
              class="col-xs-4 col-sm-3 col-md-2 col-lg-2 col-xl-1"
            >
              <div
                v-ripple
                :class="{
                  'cursor-pointer': true,
                  'rounded-borders-lg': true,
                  'full-height': true,
                  'bg-accent-100': hoveredBibleBook === bookNr,
                }"
                flat
                @click="getBibleBookMedia(+bookNr)"
                @mouseout="hoveredBibleBook = ''"
                @mouseover="hoveredBibleBook = bookNr"
              >
                <q-card-section class="q-pa-sm">
                  <q-img
                    class="rounded-borders"
                    :src="
                      getBestImageUrl(
                        bibleBookImagesToImageTypeSizes(book.images),
                        'md',
                      )
                    "
                  >
                  </q-img>
                </q-card-section>
                <q-card-section class="q-pa-sm">
                  <div class="text-subtitle2 q-mb-xs">
                    {{
                      localeBibleBooks[+bookNr]?.standardName ||
                      book.standardName
                    }}
                  </div>
                </q-card-section>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div class="row q-px-md q-py-md col-shrink full-width">
        <div class="col"></div>
        <div class="col text-right q-gutter-x-sm">
          <q-btn
            v-if="bibleBook"
            color="primary"
            flat
            :label="$t('back')"
            @click="resetBibleBook()"
          />
          <q-btn
            v-if="selectedMediaItems.length"
            v-close-popup
            color="primary"
            :label="$t('add') + ' (' + selectedMediaItems.length + ')'"
            @click="addSelectedMediaItems()"
          />
          <q-btn
            v-else
            v-close-popup
            color="negative"
            flat
            :label="$t('cancel')"
            @click="resetBibleBook()"
          />
        </div>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
// Types
import type {
  BibleBook,
  BibleBookImage,
  BibleBookMedia,
  BibleBooksResult,
  ImageTypeSizes,
  MediaSection,
  PublicationFetcher,
} from 'src/types';

import { whenever } from '@vueuse/core';
import { storeToRefs } from 'pinia';
// Composables
import { fetchJson, fetchRaw } from 'src/helpers/api';
import { errorCatcher } from 'src/helpers/error-catcher';
import { camelToKebabCase } from 'src/helpers/general';
// Helpers
import {
  downloadAdditionalRemoteVideo,
  getBestImageUrl,
  getJwMediaInfo,
  getPubMediaLinks,
} from 'src/helpers/jw-media';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
// Packages
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

// Stores
const jwStore = useJwStore();
const { urlVariables } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

// Props
const props = defineProps<{
  section?: MediaSection;
}>();

const open = defineModel<boolean>({ default: false });

const bibleBook = ref(0);
const bibleBookChapter = ref(0);
const bibleBookMedia = ref<BibleBookMedia[]>([]);
const bibleBooks = ref<Record<number, BibleBook>>({});
const loadingProgress = ref<number>(0);
const hoveredBibleBook = ref('');
const hoveredMediaItem = ref(0);

const selectedMediaItems = ref<BibleBookMedia[]>([]);

const localeUrl = ref('');
const localeBibleBooks = ref<Record<number, BibleBook>>({});
const localeBibleBookMedia = ref<BibleBookMedia[]>([]);

const i18n = useI18n();

const baseUrl = computed(() => {
  return `https://www.${urlVariables.value.base}/en/library/bible/study-bible/books/`;
});

whenever(open, () => {
  resetBibleBook();
  getLocaleData();
  getBibleBooks();
});

const getLocaleData = async () => {
  const primaryLocale = currentState.currentLangObject?.symbol;

  const fallbackLocale = jwStore.jwLanguages.list.find(
    (lang) => lang.langcode === currentSettings.value?.langFallback,
  )?.symbol;
  const appLocale = camelToKebabCase(i18n.locale.value);

  const currentLocale = localeBibleBooks.value[40]?.url.split('/')[1];
  if (primaryLocale === 'en' || primaryLocale === currentLocale) return;
  try {
    const html = await fetchRaw(baseUrl.value)
      .then((response) => {
        if (!response.ok) return null;
        return response.text();
      })
      .catch(() => null);

    if (!html) return;

    const { load } = await import('cheerio');
    const $ = load(html);
    localeUrl.value =
      $(`link[rel="alternate"][hreflang=${primaryLocale}]`)[0]?.attribs?.href ||
      $(`link[rel="alternate"][hreflang=${fallbackLocale}]`)[0]?.attribs
        ?.href ||
      $(`link[rel="alternate"][hreflang=${appLocale}]`)[0]?.attribs?.href;

    if (
      !localeUrl.value ||
      localeUrl.value === baseUrl.value ||
      localeUrl.value.startsWith(
        `https://www.${urlVariables.value.base}/${currentLocale}/`,
      )
    ) {
      return;
    }

    const result = await fetchJson<BibleBooksResult>(
      `${localeUrl.value}json/data`,
    );
    localeBibleBooks.value = result?.editionData.books || {};
  } catch (e) {
    errorCatcher(e);
  }
};

const bibleBookImagesToImageTypeSizes = (
  images: BibleBookImage[],
): ImageTypeSizes => {
  const imageTypeSizes: ImageTypeSizes = {};
  images.forEach((image) => {
    imageTypeSizes[image.type] = image.sizes;
  });
  return imageTypeSizes;
};

const getBibleBooks = async () => {
  if (Object.keys(bibleBooks.value).length) return;
  try {
    const result = await fetchJson<BibleBooksResult>(
      `${baseUrl.value}json/data`,
    );
    bibleBooks.value = result?.editionData.books || {};
  } catch (error) {
    errorCatcher(error);
  } finally {
    loadingProgress.value = 1;
  }
};

const resetBibleBook = (close = false) => {
  bibleBook.value = 0;
  bibleBookChapter.value = 0;
  bibleBookMedia.value = [];
  localeBibleBookMedia.value = [];
  selectedMediaItems.value = [];
  if (close) open.value = false;
};

const getLocaleBibleBookMedia = async (book: number) => {
  if (!localeUrl.value) return;

  try {
    const result = await fetchJson<BibleBooksResult>(
      `${localeUrl.value}/json/multimedia/${book}`,
    );
    if (!result) return;

    const key = Object.keys(result.ranges)[0];
    if (!key) return;

    localeBibleBookMedia.value = result.ranges[key].multimedia;
  } catch (e) {
    // Fallback to English
  }
};

const getBibleBookMedia = async (book: number) => {
  getLocaleBibleBookMedia(book);
  bibleBook.value = book;
  loadingProgress.value = 0;

  try {
    const result = await fetchJson<BibleBooksResult>(
      `${baseUrl.value}/json/multimedia/${book}`,
    );
    if (!result) {
      resetBibleBook();
      return;
    }

    const key = Object.keys(result.ranges)[0];
    if (!key) {
      resetBibleBook();
      return;
    }

    bibleBookMedia.value = result.ranges[key].multimedia;
  } catch (e) {
    errorCatcher(e);
    resetBibleBook();
  } finally {
    loadingProgress.value = 1;
  }
};

const bibleBookChapterVerseIds = computed(() => {
  const chapterVerseIds = new Set<string>();
  bibleBookMedia.value.forEach((mediaItem) => {
    mediaItem.source.split(',').forEach((chapterVerseId) => {
      if (
        bibleBook.value.toString().padStart(2, '0') !==
        chapterVerseId.slice(0, 2)
      )
        return;
      chapterVerseIds.add(chapterVerseId);
    });
  });
  return Array.from(chapterVerseIds);
});

const bibleBookChapters = computed(() => {
  const chapters = new Set<string>();
  bibleBookChapterVerseIds.value.forEach((chapterId) => {
    chapters.add(chapterId.slice(2, 5));
  });
  return Array.from(chapters).sort();
});

const addSelectedMediaItems = async () => {
  for (const mediaItem of selectedMediaItems.value) {
    await addStudyBibleMedia(
      localeBibleBookMedia.value.find((m) => m.docID === mediaItem.docID) ??
        mediaItem,
    );
  }
  resetBibleBook(true);
};

const addStudyBibleMedia = async (mediaItem: BibleBookMedia) => {
  try {
    let fetcher: PublicationFetcher | undefined;
    if (typeof mediaItem.resource.src == 'string') {
      const src =
        getBestImageUrl({ sqr: mediaItem.resource.sizes }, 'md') ||
        mediaItem.resource.src;
      window.dispatchEvent(
        new CustomEvent<{
          files: { filename?: string; filetype?: string; path: string }[];
          section?: MediaSection;
        }>('localFiles-browsed', {
          detail: {
            files: [
              {
                filename:
                  mediaItem.label + window.electronApi.path.extname(src),
                path: src,
              },
            ],
            section: props.section,
          },
        }),
      );
    } else {
      const src = mediaItem.resource.src[0];
      if (typeof src === 'string') {
        const { docid, issue, pub, track } = Object.fromEntries(
          new URL(src).searchParams,
        );
        fetcher = {
          docid: docid ? parseInt(docid) : undefined,
          fileformat: 'MP4',
          issue,
          langwritten: currentSettings.value?.lang || 'E',
          pub,
          track: track ? parseInt(track) : undefined,
        };
      } else {
        fetcher = {
          docid: src.docid ? parseInt(src.docid) : undefined,
          fileformat: 'MP4',
          langwritten: currentSettings.value?.lang || 'E',
          pub: src.pub,
          track: src.track ? parseInt(src.track) : undefined,
        };
      }

      if (fetcher) {
        let [mediaLinks, { thumbnail, title }] = await Promise.all([
          getPubMediaLinks(fetcher),
          getJwMediaInfo(fetcher),
        ]);
        if (!mediaLinks) {
          [mediaLinks, { thumbnail, title }] = await Promise.all([
            getPubMediaLinks({
              ...fetcher,
              langwritten: currentSettings.value?.langFallback || 'E',
            }),
            getJwMediaInfo({
              ...fetcher,
              langwritten: currentSettings.value?.langFallback || 'E',
            }),
          ]);
        }
        await downloadAdditionalRemoteVideo(
          mediaLinks?.files?.[currentSettings.value?.lang || 'E']?.['MP4'] ||
            [],
          thumbnail,
          false,
          title,
          props.section,
        );
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};
</script>
