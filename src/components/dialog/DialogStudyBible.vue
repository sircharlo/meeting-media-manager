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
          {{ bibleBooks[bibleBook].Title }}
        </template>
      </div>
      <div class="col-shrink full-width q-px-md q-py-md">
        <template v-if="!bibleBook || !bibleBookChapter">
          {{ $t('add-media-study-bible-explain') }}
        </template>
        <template v-else>
          <div class="text-subtitle1">
            {{ bibleBooks[bibleBook].Title }} - {{ $t('chapter') }}
            {{ bibleBookChapter }}
          </div>
        </template>
      </div>
      <div
        v-if="loading"
        class="col-shrink full-width q-px-md q-pb-md row justify-center"
      >
        <q-spinner color="primary" size="md" />
      </div>
      <div class="col-shrink full-width q-px-md">
        <q-tabs
          v-model="tab"
          active-color="primary"
          align="justify"
          class="text-grey"
          dense
          indicator-color="primary"
          narrow-indicator
          outside-arrows
        >
          <q-tab
            v-for="category in bibleMediaCategories"
            :key="category"
            :disable="!bibleMediaByCategory[category]?.length"
            :label="category"
            :name="category"
          >
            <q-tooltip
              v-if="!bibleMediaByCategory[category]?.length"
              :delay="500"
            >
              {{ $t('no-media-for-this-category') }}
            </q-tooltip>
          </q-tab>
        </q-tabs>
      </div>
      <div class="q-pr-scroll overflow-auto col full-width items-start">
        <q-tab-panels v-model="tab" animated style="background: transparent">
          <q-tab-panel
            v-for="category in bibleMediaCategories"
            :key="category"
            :name="category"
          >
            <template
              v-if="category !== bibleMediaCategories[1] || bibleBookChapter"
            >
              <template
                v-for="[label, mediaItems] in groupedMediaItems"
                :key="label"
              >
                <div class="text-subtitle1 col q-px-md">
                  {{
                    (category === bibleMediaCategories[1]
                      ? bibleBookChapter + ':'
                      : '') + label
                  }}
                </div>
                <div class="row q-px-md">
                  <template
                    v-for="mediaItem in mediaItems"
                    :key="mediaItem.MultimediaId"
                  >
                    <div
                      class="col col-xs-6 col-sm-4 col-md-3 col-lg-2 col-xl-1"
                    >
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
                        @mouseout="hoveredMediaItem = undefined"
                        @mouseover="hoveredMediaItem = mediaItem"
                      >
                        <q-card-section
                          :class="{
                            'q-pa-none': true,
                          }"
                        >
                          <q-img
                            :class="{
                              'study-bible-item': true,
                              'study-bible-item-selected':
                                selectedMediaItems.includes(mediaItem),
                            }"
                            fit="contain"
                            :ratio="1"
                            :src="
                              mediaItem.CoverPictureFilePath ||
                              mediaItem.FilePath
                            "
                          >
                            <q-badge
                              v-if="mediaItem.CategoryType < 0"
                              class="q-mt-sm q-ml-sm bg-semi-black rounded-borders-sm"
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
                            <div
                              class="absolute-bottom text-caption gradient-transparent-to-black"
                            >
                              {{ mediaItem.Label }}
                            </div>
                          </q-img>
                        </q-card-section>
                      </div>
                    </div>
                  </template>
                </div>
                <q-separator
                  class="bg-accent-200 full-width q-mt-md q-mb-lg"
                  size="2px"
                />
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
                @click="bibleBookChapter = chapter"
              />
            </div>
            <div v-else class="row q-col-gutter-md full-width">
              <template
                v-for="[bookNr, book] in Object.entries(bibleBooks)"
                :key="bookNr"
              >
                <div class="col col-xs-6 col-sm-4 col-md-3 col-lg-2">
                  <div
                    v-ripple
                    :class="{
                      'cursor-pointer': true,
                      'rounded-borders-lg': true,
                      'full-height': true,
                      'bg-accent-100': hoveredBibleBook === bookNr,
                    }"
                    flat
                    @click="bibleBook = parseInt(bookNr)"
                    @mouseout="hoveredBibleBook = ''"
                    @mouseover="hoveredBibleBook = bookNr"
                  >
                    <q-img
                      class="rounded-borders"
                      :src="book.CoverPictureFilePath"
                    >
                      <div
                        class="absolute-bottom text-subtitle2 gradient-transparent-to-black"
                      >
                        {{ book.Title }}
                      </div>
                    </q-img>
                  </div>
                </div>
              </template>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
      <div class="row q-px-md q-py-md col-shrink full-width">
        <div class="col"></div>
        <div class="col text-right q-gutter-x-sm">
          <q-btn
            v-if="bibleBook"
            color="primary"
            flat
            :label="$t('back')"
            @click="resetBibleBook(!bibleBookChapter)"
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
            @click="resetBibleBook(true)"
          />
        </div>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import type {
  JwLangCode,
  MediaSection,
  MultimediaItem,
  PublicationFetcher,
} from 'src/types';

import { whenever } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { SORTER } from 'src/constants/general';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  addToAdditionMediaMapFromPath,
  downloadAdditionalRemoteVideo,
  getJwMediaInfo,
  getPubMediaLinks,
  getStudyBibleBooks,
  getStudyBibleCategories,
  getStudyBibleMedia,
} from 'src/helpers/jw-media';
import { useCurrentStateStore } from 'src/stores/current-state';
import { convertImageIfNeeded } from 'src/utils/converters';
import { computed, ref } from 'vue';

// Stores
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

// Props
const props = defineProps<{
  section?: MediaSection;
}>();

const open = defineModel<boolean>({ default: false });

const tab = ref('');

whenever(tab, () => {
  if (tab.value !== bibleMediaCategories.value[1]) resetBibleBook(true);
});

const bibleBook = ref(0);
const bibleBookChapter = ref(0);
const allBibleMedia = ref<MultimediaItem[]>([]);
const bibleBooksStartAtId = ref(0);
const bibleBooksEndAtId = ref(0);

const bibleMediaCategories = ref<string[]>([]);

const bibleMediaByCategory = computed(() => {
  const returnObj: Record<string, MultimediaItem[]> = {};
  returnObj[bibleMediaCategories.value[0]] = allBibleMedia.value.filter(
    (item) => item.DocumentId < bibleBooksStartAtId.value,
  );
  returnObj[bibleMediaCategories.value[1]] = allBibleMedia.value.filter(
    (item) => item.BookNumber,
  );
  for (let i = 2; i < bibleMediaCategories.value.length; i++) {
    returnObj[bibleMediaCategories.value[i]] = allBibleMedia.value.filter(
      (item) =>
        item.DocumentId > bibleBooksEndAtId.value &&
        (item.ParentTitle || '').toLowerCase() ===
          bibleMediaCategories.value[i].toLowerCase(),
    );
  }
  return returnObj;
});
const bibleBookMedia = computed(() => {
  return bibleMediaByCategory.value[bibleMediaCategories.value[1]];
});
const bibleBooks = ref<Record<number, MultimediaItem>>({});

const selectedBookChapters = computed(() => {
  if (!bibleBook.value) return [];

  const chapters = new Set<number>();
  for (const item of bibleBookMedia.value) {
    if (item.BookNumber === bibleBook.value) {
      chapters.add(item.ChapterNumber || 0);
    }
  }
  return Array.from(chapters);
});

const selectedChapterMediaItems = computed(() => {
  if (tab.value !== bibleMediaCategories.value[1])
    return bibleMediaByCategory.value[tab.value];
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
      const label =
        (tab.value !== bibleMediaCategories.value[1]
          ? item.Title
          : item.FormattedVerseLabel) || '';
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(item);
      return groups;
    },
    {},
  );
  if (tab.value !== bibleMediaCategories.value[1]) {
    Object.entries(groups).sort((a, b) => SORTER.compare(a[0], b[0]));
  }
  return Object.entries(groups).sort((a, b) => {
    const parseRange = (str: string) => str.split('-').map(Number);
    const [aStart] = parseRange(a[0]);
    const [bStart] = parseRange(b[0]);

    return aStart - bStart;
  });
});

const loading = ref<boolean>(false);
const hoveredBibleBook = ref('');
const hoveredMediaItem = ref<MultimediaItem>();

const selectedMediaItems = ref<MultimediaItem[]>([]);

whenever(open, () => {
  resetBibleBook(true);
  getBibleMediaCategories();
  getBibleBooks();
  getBibleMedia();
});

const getBibleMediaCategories = async () => {
  try {
    if (Object.keys(bibleMediaCategories.value).length) return;
    loading.value = true;
    bibleMediaCategories.value = (await getStudyBibleCategories()).map(
      (item) => item.Title || '',
    );
  } catch (error) {
    errorCatcher(error);
  } finally {
    if (bibleMediaCategories.value.length > 1)
      tab.value = bibleMediaCategories.value[1];
    loading.value = false;
  }
};

const getBibleBooks = async () => {
  if (Object.keys(bibleBooks.value).length) return;
  try {
    loading.value = true;
    bibleBooks.value = await getStudyBibleBooks();
  } catch (error) {
    errorCatcher(error);
  } finally {
    loading.value = false;
  }
};

const getBibleMedia = async () => {
  if (Object.keys(allBibleMedia.value).length) return;
  try {
    const studyMediaInfo = await getStudyBibleMedia();
    bibleBooksStartAtId.value = studyMediaInfo.bibleBookDocumentsStartAtId || 0;
    bibleBooksEndAtId.value = studyMediaInfo.bibleBookDocumentsEndAtId || 0;
    allBibleMedia.value = studyMediaInfo.mediaItems;
  } catch (error) {
    errorCatcher(error);
  }
};

const addSelectedMediaItems = async () => {
  for (const mediaItem of selectedMediaItems.value) {
    await addStudyBibleMedia(mediaItem);
  }
  resetBibleBook(true, true);
};

const addStudyBibleMedia = async (mediaItem: MultimediaItem) => {
  if (mediaItem.MimeType.includes('image')) {
    mediaItem.FilePath = await convertImageIfNeeded(mediaItem.FilePath);
    await addToAdditionMediaMapFromPath(
      mediaItem.FilePath,
      props.section,
      undefined,
      {
        title: mediaItem.Label,
      },
    );
  } else {
    const mediaLookup: PublicationFetcher = {
      docid: mediaItem.MepsDocumentId,
      fileformat: 'MP4',
      issue: mediaItem.IssueTagNumber || undefined,
      langwritten: '',
      pub: mediaItem.KeySymbol,
      track: mediaItem.Track || undefined,
    };

    const langsToTry = [
      currentSettings.value?.lang,
      currentSettings.value?.langFallback,
      'E',
    ].filter((l) => l !== undefined && l !== null);
    let mediaInfo, mediaItemFiles;
    for (const lang of langsToTry) {
      if (!lang) continue;
      mediaLookup.langwritten = lang as JwLangCode;
      try {
        [mediaItemFiles, mediaInfo] = await Promise.all([
          getPubMediaLinks(mediaLookup),
          getJwMediaInfo(mediaLookup),
        ]);
        if (mediaItemFiles && mediaInfo) break; // Exit loop if successful
      } catch {
        // Continue to the next language on failure
      }
    }

    if (mediaItemFiles && mediaInfo && mediaLookup.langwritten) {
      const { thumbnail, title } = mediaInfo;
      downloadAdditionalRemoteVideo(
        mediaItemFiles?.files?.[mediaLookup.langwritten]?.['MP4'] || [],
        thumbnail,
        false,
        title.replace(/^\d+\.\s*/, ''),
        props.section,
      );
    } else {
      console.error('Failed to fetch media for all languages.');
    }
  }
};

const resetBibleBook = (closeBook = false, closeDialog = false) => {
  if (closeDialog) open.value = false;
  if (closeBook) bibleBook.value = 0;
  bibleBookChapter.value = 0;
  selectedMediaItems.value = [];
};
</script>
