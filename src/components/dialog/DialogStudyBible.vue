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
        {{ $t('media-gallery') }} - {{ bibleBooks[bibleBook].BookDisplayTitle
        }}{{ bibleBookChapter ? ' ' + bibleBookChapter : '' }}
      </div>
      <div
        v-if="!!(loadingProgress < 1 && Object.keys(bibleBooks).length === 0)"
        class="col-shrink full-width q-px-md q-pb-md row justify-center"
      >
        <q-spinner color="primary" size="md" />
      </div>
      <div class="q-pr-scroll overflow-auto col full-width items-start">
        {{ bibleBook }} - {{ bibleBookChapter }}
        <template v-if="bibleBookChapter">
          <!-- <div class="row q-px-md full-width"> -->
          <template v-for="(groups, labels) in groupedByLabel" :key="labels">
            <div>{{ labels }}</div>
            <div class="text-h6 col q-px-md">
              {{ bibleBookChapter }}:{{ labels }}
            </div>
            <div class="row q-px-md">
              <template v-for="{ MultimediaId } in groups" :key="MultimediaId">
                <div class="col-xs-4 col-sm-3 col-md-2 col-lg-2 col-xl-1">
                  <!-- <div class="row-xs-4 row-sm-3 row-md-2 row-lg-2 row-xl-1"> -->
                  <div
                    v-ripple
                    :class="{
                      'cursor-pointer': true,
                      'rounded-borders-lg': true,
                      // 'full-height': true,
                      'bg-accent-100': hoveredMediaItem === MultimediaId,
                      'relative-position': true,
                    }"
                    flat
                    @click="
                      selectedMediaItemIds.includes(MultimediaId)
                        ? selectedMediaItemIds.splice(
                            selectedMediaItemIds.indexOf(MultimediaId),
                            1,
                          )
                        : selectedMediaItemIds.push(MultimediaId)
                    "
                    @mouseout="(hoveredMediaItem = 0)"
                    @mouseover="(hoveredMediaItem = MultimediaId)"
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
                            selectedMediaItemIds.includes(MultimediaId),
                        }"
                        :src="allMediaItems[MultimediaId].CoverPictureFilePath"
                      >
                        <q-badge
                          v-if="allMediaItems[MultimediaId].CategoryType < 0"
                          color="negative"
                          floating
                          >{{
                            allMediaItems[MultimediaId].CategoryType * -1
                          }}</q-badge
                        >
                      </q-img>
                    </q-card-section>
                  </div>
                </div>
              </template>
            </div>
            <!-- </div>              </div> -->
          </template>
          <!-- <template
              v-for="mediaItem in selectedChapterMediaItems"
              :key="mediaItem"
            >
              !-- <pre> {{ mediaItem }}</pre> --
              <div class="col-xs-4 col-sm-3 col-md-2 col-lg-2 col-xl-1">
                <div
                  v-ripple
                  :class="{
                    'cursor-pointer': true,
                    'rounded-borders-lg': true,
                    'full-height': true,
                    'bg-accent-100':
                      hoveredMediaItem === mediaItem.MultimediaId,
                    'relative-position': true,
                  }"
                  flat
                  @click="
                    selectedMediaItemIds.includes(group)
                      ? selectedMediaItemIds.splice(
                          selectedMediaItemIds.indexOf(mediaItem),
                          1,
                        )
                      : selectedMediaItemIds.push(mediaItem)
                  "
                  @mouseout="hoveredMediaItem = 0"
                  @mouseover="hoveredMediaItem = mediaItem.MultimediaId"
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
                          selectedMediaItemIds.includes(mediaItem),
                      }"
                      :src="mediaItem.CoverPictureFilePath"
                    >
                      <q-badge
                        v-if="mediaItem.CategoryType < 0"
                        class="q-mt-sm q-ml-sm bg-semi-black rounded-borders-sm"
                        style="padding: 5px !important"
                      >
                        <q-icon class="q-mr-xs" color="white" name="mmm-play" />
                        {{ $t('video') }}
                      </q-badge>
                      <q-checkbox
                        v-if="selectedMediaItemIds.includes(mediaItem)"
                        v-model="selectedMediaItemIds"
                        color="primary"
                        :val="mediaItem"
                      />
                    </q-img>
                  </q-card-section>
                  <q-card-section class="q-pa-sm">
                    <div class="text-subtitle2 q-mb-xs">
                      {{ mediaItem.Label ?? mediaItem.Caption }}
                    </div>
                  </q-card-section>
                </div>
              </div>
            </template> -->
          <!-- </div> -->
        </template>
        <div v-else-if="bibleBook" class="row q-px-md">
          <!-- <q-spinner
            v-if="!selectedBibleBookChapters.length"
            color="primary"
            size="md"
          /> -->
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
            v-if="selectedMediaItemIds.length"
            v-close-popup
            color="primary"
            :label="$t('add') + ' (' + selectedMediaItemIds.length + ')'"
          />
          <!-- @click="addSelectedMediaItems()" -->
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
  // BibleBook,
  // BibleBookImage,
  // BibleBookMedia,
  // BibleBooksResult,
  // ImageTypeSizes,
  // MediaSection,
  MultimediaItem,
  // PublicationFetcher,
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

const allMediaItems = computed(() => {
  return bibleBookMedia.value.reduce(
    (acc: Record<number, MultimediaItem>, item) => {
      if (!acc[item.MultimediaId]) {
        acc[item.MultimediaId] = item;
      }
      return acc;
    },
    {},
  );
});

const selectedChapterMediaItems = computed(() => {
  return bibleBook.value && bibleBookChapter.value
    ? bibleBookMedia.value.filter(
        (item) =>
          item.BookNumber === bibleBook.value &&
          item.ChapterNumber === bibleBookChapter.value,
      )
    : [];
});

// Define the type for the grouped verses
type GroupedVerses = Record<
  string,
  { label?: string; labels?: string[]; MultimediaId: number }[]
>;

// Group verses by VerseLabel and then by MultimediaId and format the verse labels
const groupedByLabel = computed(() => {
  const grouped: GroupedVerses = selectedChapterMediaItems.value.reduce(
    (acc, verse) => {
      const verseLabel = verse.VerseLabel || '';
      const verseNumber = verseLabel
        .replace('<span class="vl">', '')
        .replace('</span>', ''); // Extract verse number
      const MultimediaId = verse.MultimediaId;

      // If the VerseLabel is not already in the accumulator, initialize it
      if (!acc[verseLabel]) {
        acc[verseLabel] = [];
      }

      // Check if the MultimediaId is already included in the list for the same label
      const existingGroup = acc[verseLabel].find(
        (group) => group.MultimediaId === MultimediaId,
      );

      if (existingGroup) {
        // If MultimediaId already exists for this label, add the verse number
        existingGroup.labels ??= [];
        existingGroup.labels.push(verseNumber);
      } else {
        // Otherwise, create a new entry for this MultimediaId and VerseLabel
        acc[verseLabel].push({
          labels: [verseNumber], // Start the label with the current verse number
          MultimediaId,
        });
      }

      return acc;
    },
    {} as GroupedVerses,
  );

  // Format the verse numbers as ranges
  return Object.keys(grouped).reduce((result, verseLabel) => {
    result[verseLabel] = grouped[verseLabel].map((group) => {
      group.labels?.sort(); // Sort the verses in ascending order
      const label = formatVerseLabel(group.labels || []);
      return { label, MultimediaId: group.MultimediaId };
    });
    return result;
  }, {} as GroupedVerses);
});

// Helper function to format verse labels
function formatVerseLabel(verses: string[]) {
  const ranges: string[] = [];
  let rangeStart = verses[0];
  let rangeEnd = verses[0];

  for (let i = 1; i < verses.length; i++) {
    if (parseInt(verses[i]) === parseInt(verses[i - 1], 10) + 1) {
      rangeEnd = verses[i];
    } else {
      if (rangeStart === rangeEnd) {
        ranges.push(rangeStart);
      } else {
        ranges.push(`${rangeStart}-${rangeEnd}`);
      }
      rangeStart = verses[i];
      rangeEnd = verses[i];
    }
  }

  // Push the last range
  if (rangeStart === rangeEnd) {
    ranges.push(rangeStart);
  } else {
    ranges.push(`${rangeStart}-${rangeEnd}`);
  }

  return `${ranges.join(', ')}`;
}

const loadingProgress = ref<number>(0);
const hoveredBibleBook = ref('');
const hoveredMediaItem = ref(0);

const selectedMediaItemIds = ref<number[]>([]);

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

const resetBibleBook = (close = false) => {
  bibleBook.value = 0;
  bibleBookChapter.value = 0;
  selectedMediaItemIds.value = [];
  if (close) open.value = false;
};
</script>
