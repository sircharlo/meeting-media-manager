<template>
  <q-dialog v-model="open">
    <div
      class="bg-secondary-contrast column fit-snugly large-overlay q-px-none"
    >
      <div class="text-h6 col-shrink full-width q-px-md q-pt-lg">
        <template v-if="!bibleBook">
          {{ $t('add-media-study-bible') }}
        </template>
        <template v-else>
          {{ $t('media-gallery') }} -
          {{ bibleBooks[bibleBook].BookDisplayTitle }}
        </template>
      </div>
      <div class="col-shrink full-width q-px-md q-py-md">
        <template v-if="!bibleBook || !bibleBookChapter">
          {{ $t('add-media-study-bible-explain') }}
        </template>
        <template v-else>
          <div class="text-subtitle1">
            {{ bibleBooks[bibleBook].BookDisplayTitle }} - {{ $t('chapter') }}
            {{ bibleBookChapter }}
          </div>
        </template>
      </div>
      <div
        v-if="!!(loadingProgress < 1 && Object.keys(bibleBooks).length === 0)"
        class="col-shrink full-width q-px-md q-pb-md row justify-center"
      >
        <q-spinner color="primary" size="md" />
      </div>
      <div class="q-pr-scroll overflow-auto col full-width items-start">
        <template v-if="bibleBookChapter">
          <template
            v-for="[label, mediaItems] in groupedMediaItems"
            :key="label"
          >
            <div class="text-subtitle1 col q-px-md">
              {{ bibleBookChapter }}:{{ label }}
            </div>
            <div class="row q-px-md">
              <template
                v-for="mediaItem in mediaItems"
                :key="mediaItem.MultimediaId"
              >
                <!-- <div class="text-h6 col q-px-md">
                {{ bibleBookChapter }}:{{ mediaItem.FormattedVerseLabel }}
              </div> -->
                <div class="col-xs-4 col-sm-3 col-md-2 col-lg-2 col-xl-1">
                  <div
                    v-ripple
                    :class="{
                      'cursor-pointer': true,
                      'rounded-borders-lg': true,
                      'bg-accent-100': hoveredMediaItem === mediaItem,
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
                    @mouseout="(hoveredMediaItem = undefined)"
                    @mouseover="(hoveredMediaItem = mediaItem)"
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
                        :src="mediaItem.CoverPictureFilePath"
                      >
                        <q-badge
                          v-if="mediaItem.CategoryType < 0"
                          class="q-mt-sm q-ml-sm q-pa-xs bg-semi-black rounded-borders-sm"
                        >
                          {{ $t('video') }}
                        </q-badge>
                        <q-checkbox
                          v-if="selectedMediaItems.includes(mediaItem)"
                          v-model="selectedMediaItems"
                          color="primary"
                          :val="mediaItem"
                        />
                        <div
                          class="absolute-bottom text-caption gradient-transparent-to-black"
                        >
                          {{ mediaItem.Label }}
                        </div>
                      </q-img>
                    </q-card-section>
                    <!-- <q-card-section class="q-pa-sm">
                      <div class="text-subtitle2 q-mb-xs">
                        {{
                          mediaItem.Label
                        }}
                      </div>
                    </q-card-section> -->
                  </div>
                </div>
              </template>
            </div>
          </template>
        </template>
        <div v-else-if="bibleBook" class="row q-px-md">
          <q-btn
            v-for="chapter in selectedBookChapters"
            :key="chapter"
            class="rounded-borders-sm q-mr-xs q-mb-xs"
            color="primary"
            :label="chapter"
            style="width: 3em; height: 3em"
            unelevated
            @click="(bibleBookChapter = chapter)"
          />
        </div>
        <div v-else class="row q-col-gutter-md full-width">
          <template
            v-for="[bookNr, book] in Object.entries(bibleBooks)"
            :key="bookNr"
          >
            <div class="col-xs-6 col-sm-4 col-md-3 col-lg-2 col-xl-1">
              <div
                v-ripple
                :class="{
                  'cursor-pointer': true,
                  'rounded-borders-lg': true,
                  'full-height': true,
                  'bg-accent-100': hoveredBibleBook === bookNr,
                }"
                flat
                @click="(bibleBook = parseInt(bookNr))"
                @mouseout="(hoveredBibleBook = '')"
                @mouseover="(hoveredBibleBook = bookNr)"
              >
                <q-img class="rounded-borders" :src="book.CoverPictureFilePath">
                  <div
                    class="absolute-bottom text-subtitle2 gradient-transparent-to-black"
                  >
                    {{ book.BookDisplayTitle }}
                  </div>
                </q-img>
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
  // MediaSection,
  MultimediaItem,
} from 'src/types';

import { whenever } from '@vueuse/core';
// import { storeToRefs } from 'pinia';
// Composables
// import { fetchJson } from 'src/helpers/api';
// import { fetchJson, fetchRaw } from 'src/helpers/api';
import { errorCatcher } from 'src/helpers/error-catcher';
// import { sorter } from 'src/helpers/general';
// import { camelToKebabCase } from 'src/helpers/general';
// Helpers
import {
  // addFullFilePathToMultimediaItem,
  // downloadAdditionalRemoteVideo,
  // getBestImageUrl,
  // getJwMediaInfo,
  // getPubMediaLinks,
  // getStudyBible,
  getStudyBibleBooks,
  getStudyBibleMedia,
} from 'src/helpers/jw-media';
// import { useCurrentStateStore } from 'src/stores/current-state';
// import { useJwStore } from 'src/stores/jw';
// Packages
import { computed, ref } from 'vue';
// import { useI18n } from 'vue-i18n';

// Stores
// const jwStore = useJwStore();
// const { urlVariables } = storeToRefs(jwStore);

// const currentState = useCurrentStateStore();
// const { currentSettings } = storeToRefs(currentState);

// Props
// const props = defineProps<{
//   section?: MediaSection;
// }>();

const open = defineModel<boolean>({ default: false });

const bibleBook = ref(0);
const bibleBookChapter = ref(0);
const bibleBookMedia = ref<MultimediaItem[]>([]);

const bibleBooks = ref<Record<number, MultimediaItem>>({});

const selectedBookChapters = computed(() => {
  return bibleBook.value
    ? bibleBookMedia.value
        .filter((item) => item.BookNumber === bibleBook.value)
        ?.map((item) => item.ChapterNumber || 0)
        .filter((value, index, self) => self.indexOf(value) === index)
    : [];
});

const selectedChapterMediaItems = computed(() => {
  if (!bibleBook.value || !bibleBookChapter.value) return [];

  const filteredItems = bibleBookMedia.value.filter(
    (item) =>
      item.BookNumber === bibleBook.value &&
      item.ChapterNumber === bibleBookChapter.value,
  );

  const combinedItems = filteredItems.reduce((acc: MultimediaItem[], item) => {
    const existing = acc.find((el) => el.MultimediaId === item.MultimediaId);
    if (!item.VerseNumber) return acc;
    if (existing) {
      existing.VerseNumbers?.push(item.VerseNumber);
    } else {
      acc.push({
        ...item,
        VerseNumbers: [item.VerseNumber],
      });
    }
    return acc;
  }, []);

  const formatVerses = (verseNumbers: number[]) => {
    const sorted = [...verseNumbers].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) {
        ranges.push(
          start === sorted[i - 1] ? `${start}` : `${start}-${sorted[i - 1]}`,
        );
        start = sorted[i];
      }
    }

    return ranges.join(', ');
  };

  combinedItems.forEach((item) => {
    if (!item.VerseNumbers) return;
    item.FormattedVerseLabel = formatVerses(item.VerseNumbers);
  });

  return combinedItems;
});

const groupedMediaItems = computed(() => {
  const groups = selectedChapterMediaItems.value.reduce(
    (groups: Record<string, MultimediaItem[]>, item) => {
      const label = item.FormattedVerseLabel || '';
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(item);
      return groups;
    },
    {},
  );
  return Object.entries(groups).sort((a, b) => {
    const parseRange = (str: string) => str.split('-').map(Number);
    const [aStart] = parseRange(a[0]);
    const [bStart] = parseRange(b[0]);

    return aStart - bStart;
  });
});

const loadingProgress = ref<number>(0);
const hoveredBibleBook = ref('');
const hoveredMediaItem = ref<MultimediaItem>();

const selectedMediaItems = ref<MultimediaItem[]>([]);

whenever(open, () => {
  resetBibleBook();
  getBibleBooks();
  getBibleMedia();
});

const getBibleBooks = async () => {
  if (Object.keys(bibleBooks.value).length) return;
  try {
    bibleBooks.value = await getStudyBibleBooks();
  } catch (error) {
    errorCatcher(error);
  }
};

const getBibleMedia = async () => {
  if (Object.keys(bibleBookMedia.value).length) return;
  try {
    bibleBookMedia.value = await getStudyBibleMedia();
  } catch (error) {
    errorCatcher(error);
  }
};

const addSelectedMediaItems = async () => {
  for (const mediaItem of selectedMediaItems.value) {
    await addStudyBibleMedia(mediaItem);
  }
  resetBibleBook(true);
};

const addStudyBibleMedia = async (mediaItem: MultimediaItem) => {
  console.log('addStudyBibleMedia', mediaItem);
};

const resetBibleBook = (close = false) => {
  bibleBook.value = 0;
  bibleBookChapter.value = 0;
  selectedMediaItems.value = [];
  if (close) open.value = false;
};
</script>
