<template>
  <q-dialog v-model="open">
    <div
      class="items-center q-pb-lg q-px-lg q-gutter-y-lg bg-secondary-contrast large-overlay"
    >
      <div class="text-h6 row">{{ $t('add-media-study-bible') }}</div>
      <div class="row">{{ $t('add-media-study-bible-explain') }}</div>
      <div v-if="bibleBook" class="text-h6 row">
        {{ $t('media-gallery') }} -
        {{
          localeBibleBooks[bibleBook]?.standardName ||
          bibleBooks[bibleBook].standardName
        }}
      </div>
      <div
        v-if="!!(loadingProgress < 1 && Object.keys(bibleBooks).length === 0)"
        class="text-center row items-center justify-center"
      >
        <q-spinner color="primary" size="md" />
      </div>
      <div class="row">
        <q-scroll-area
          :bar-style="barStyle"
          :thumb-style="thumbStyle"
          style="width: 100vw; height: 40vh"
        >
          <div v-if="bibleBook" class="row q-col-gutter-md">
            <template v-for="mediaItem in bibleBookMedia" :key="mediaItem.id">
              <div class="col-xs-4 col-sm-3 col-md-2 col-lg-2 col-xl-1">
                <div
                  v-ripple
                  :class="{
                    'cursor-pointer': true,
                    'rounded-borders-lg': true,
                    'full-height': true,
                    'bg-accent-100': hoveredMediaItem === mediaItem.id,
                  }"
                  flat
                  @click="addStudyBibleMedia(mediaItem)"
                  @mouseout="hoveredMediaItem = 0"
                  @mouseover="hoveredMediaItem = mediaItem.id"
                >
                  <q-card-section class="q-pa-sm">
                    <q-img
                      :src="
                        getBestImageUrl(
                          { sqr: mediaItem.thumbnail.sizes },
                          'md',
                        )
                      "
                      class="rounded-borders"
                    >
                      <q-badge
                        v-if="mediaItem.type === 'video'"
                        class="q-mt-sm q-ml-sm bg-semi-black rounded-borders-sm"
                        style="padding: 5px !important"
                      >
                        <q-icon class="q-mr-xs" color="white" name="mmm-play" />
                        {{ $t('video') }}
                      </q-badge>
                    </q-img>
                  </q-card-section>
                  <q-card-section class="q-pa-sm">
                    <div class="text-subtitle2 q-mb-xs">
                      {{ mediaItem.label }}
                    </div>
                  </q-card-section>
                </div>
              </div>
            </template>
          </div>
          <div v-else class="row q-col-gutter-md">
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
                      :src="
                        getBestImageUrl(
                          bibleBookImagesToImageTypeSizes(book.images),
                          'md',
                        )
                      "
                      class="rounded-borders"
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
        </q-scroll-area>
      </div>
      <div class="row items-center">
        <div class="col"></div>
        <div class="col text-right">
          <q-btn
            v-if="bibleBook"
            :label="$t('back')"
            color="primary"
            flat
            @click="resetBibleBook()"
          />
          <q-btn v-close-popup :label="$t('cancel')" color="negative" flat />
        </div>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
// Packages
import { computed, ref } from 'vue';

// Composables
import { useScrollbar } from 'src/composables/useScrollbar';

// Helpers
import {
  downloadAdditionalRemoteVideo,
  getBestImageUrl,
  getJwMediaInfo,
  getPubMediaLinks,
} from 'src/helpers/jw-media';

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
import { fetchJson, fetchRaw } from 'src/helpers/api';
import { errorCatcher } from 'src/helpers/error-catcher';
import { camelToKebabCase } from 'src/helpers/general';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
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

const { barStyle, thumbStyle } = useScrollbar();

const bibleBook = ref(0);
const bibleBookMedia = ref<BibleBookMedia[]>([]);
const bibleBooks = ref<Record<number, BibleBook>>({});
const loadingProgress = ref<number>(0);
const hoveredBibleBook = ref('');
const hoveredMediaItem = ref(0);

const localeUrl = ref('');
const localeBibleBooks = ref<Record<number, BibleBook>>({});

const i18n = useI18n();

const baseUrl = computed(() => {
  return `https://www.${urlVariables.value.base}/en/library/bible/study-bible/books/`;
});

whenever(open, () => {
  getLocaleData();
  getBibleBooks();
});

const getLocaleData = async () => {
  const primaryLocale = jwStore.jwLanguages.list.find(
    (lang) => lang.langcode === currentSettings.value?.lang,
  )?.symbol;

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
    )
      return;

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
  bibleBookMedia.value = [];
  if (close) open.value = false;
};

const getBibleBookMedia = async (book: number) => {
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

const addStudyBibleMedia = async (mediaItem: BibleBookMedia) => {
  console.log('mediaItem', mediaItem);
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
        const [mediaLinks, { thumbnail, title }] = await Promise.all([
          getPubMediaLinks(fetcher),
          getJwMediaInfo(fetcher),
        ]);
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
    resetBibleBook(true);
  } catch (error) {
    errorCatcher(error);
  }
};
</script>
