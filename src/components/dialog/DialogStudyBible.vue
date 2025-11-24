<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId">
    <div
      class="bg-secondary-contrast flex large-overlay q-px-none"
      style="flex-flow: column"
    >
      <!-- Header -->
      <div class="text-h6 row q-px-md q-pt-lg items-center">
        <q-btn
          v-if="bibleBook"
          class="q-mr-sm"
          dense
          flat
          icon="mmm-left"
          round
          @click="goBack"
        />
        <template v-if="!bibleBook">
          {{ t('add-media-study-bible') }}
        </template>
        <template v-else>
          {{ bibleBooks[bibleBook]?.Title }}
          <template v-if="bibleBookChapter > -1">
            -
            {{
              bibleBookChapter === 0
                ? t('introduction')
                : t('chapter') + ' ' + bibleBookChapter
            }}
          </template>
        </template>
      </div>
      <div class="row q-px-md q-py-md">
        {{ t('add-media-study-bible-explain') }}
      </div>

      <!-- Content -->
      <div class="q-px-md q-py-md col overflow-auto">
        <!-- Loading -->
        <div
          v-if="loadingBooks || loadingMedia"
          class="row justify-center q-py-md"
        >
          <q-spinner color="primary" size="md" />
        </div>

        <!-- View 1: Books -->
        <div v-else-if="!bibleBook">
          <div
            v-for="(sectionInfo, sectionIndex) in [
              {
                title: 'hebrew-aramaic-scriptures',
                books: bibleBooksHebrew,
              },
              { title: 'greek-scriptures', books: bibleBooksGreek },
            ]"
            :key="sectionIndex"
            class="q-pb-md"
          >
            <div class="text-secondary text-uppercase q-my-sm">
              {{ t(sectionInfo.title) }}
            </div>
            <div class="row q-col-gutter-xs">
              <div
                v-for="[bookNr, book] in Object.entries(sectionInfo.books)"
                :key="bookNr"
                class="col-xs-4 col-sm-3 col-md-2 col-lg-1"
              >
                <q-btn
                  class="full-width"
                  color="accent-200"
                  no-caps
                  text-color="black"
                  unelevated
                  @click="selectBook(parseInt(bookNr))"
                >
                  <div class="ellipsis">{{ book.Title }}</div>
                </q-btn>
              </div>
            </div>
          </div>
        </div>

        <!-- View 2: Chapters -->
        <div v-else-if="bibleBookChapter === -1" class="row q-col-gutter-xs">
          <!-- Introduction -->
          <div class="col-12 q-mb-sm">
            <q-btn
              class="full-width"
              color="accent-200"
              :disable="!chaptersWithMedia.has(0)"
              :label="t('introduction')"
              text-color="black"
              unelevated
              @click="selectChapter(0)"
            />
          </div>
          <!-- Chapters -->
          <div
            v-for="chapter in bibleBooks[bibleBook]?.ChapterCount || 0"
            :key="chapter"
            class="col-2 col-sm-1"
          >
            <q-btn
              class="full-width aspect-ratio-1"
              color="accent-200"
              :disable="!chaptersWithMedia.has(chapter)"
              :label="chapter"
              text-color="black"
              unelevated
              @click="selectChapter(chapter)"
            />
          </div>
        </div>

        <!-- View 3: Media -->
        <div v-else>
          <template
            v-for="([label, mediaItems], index) in groupedMediaItems"
            :key="label"
          >
            <div class="text-subtitle2 q-mt-md q-mb-sm text-grey-8">
              {{ label || t('general') }}
            </div>
            <div class="row q-col-gutter-sm">
              <div
                v-for="mediaItem in mediaItems"
                :key="mediaItem.MultimediaId"
                class="col-6 col-sm-4 col-md-3"
              >
                <div
                  v-ripple
                  :class="{
                    'cursor-pointer': true,
                    'rounded-borders-lg': true,
                    'bg-accent-100': hoveredMediaItem === mediaItem,
                    'relative-position': true,
                    'overflow-hidden': true,
                  }"
                  @click="toggleSelection(mediaItem)"
                  @mouseout="hoveredMediaItem = undefined"
                  @mouseover="hoveredMediaItem = mediaItem"
                >
                  <q-img
                    :class="{
                      'study-bible-item': true,
                      'study-bible-item-selected':
                        selectedMediaItems.includes(mediaItem),
                    }"
                    fit="contain"
                    :ratio="16 / 9"
                    :src="mediaItem.CoverPictureFilePath || mediaItem.FilePath"
                  >
                    <q-badge
                      v-if="mediaItem.CategoryType < 0"
                      class="q-mt-sm q-ml-sm bg-semi-black rounded-borders-sm"
                    >
                      <q-icon class="q-mr-xs" color="white" name="mmm-play" />
                      {{ t('video') }}
                    </q-badge>
                    <q-checkbox
                      v-if="isSelected(mediaItem)"
                      class="absolute-top-right q-ma-xs"
                      color="primary"
                      model-value
                    />
                    <div
                      class="absolute-bottom text-caption gradient-transparent-to-black ellipsis q-px-sm"
                    >
                      {{ mediaItem.Label }}
                    </div>
                  </q-img>
                </div>
              </div>
            </div>
            <q-separator
              v-if="index < groupedMediaItems.length - 1"
              class="q-my-md"
            />
          </template>
          <div v-if="!groupedMediaItems.length" class="text-center text-grey">
            {{ t('no-media-found') }}
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="row q-px-md q-py-md justify-end q-gutter-sm">
        <q-btn v-close-popup flat :label="t('cancel')" />
        <q-btn
          v-if="selectedMediaItems.length"
          v-close-popup
          color="primary"
          :label="`${t('add')} (${selectedMediaItems.length})`"
          @click="addSelectedMediaItems"
        />
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import type {
  JwLangCode,
  MediaSectionIdentifier,
  MultimediaItem,
  PublicationFetcher,
} from 'src/types';

import { whenever } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  addToAdditionMediaMapFromPath,
  downloadAdditionalRemoteVideo,
  getJwMediaInfo,
  getPubMediaLinks,
  getStudyBibleBooks,
  getStudyBibleMedia,
} from 'src/helpers/jw-media';
import { convertImageIfNeeded } from 'src/utils/converters';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Stores
const currentState = useCurrentStateStore();
const { currentSettings, selectedDate } = storeToRefs(currentState);

// Props
const props = defineProps<{
  dialogId: string;
  modelValue: boolean;
  section: MediaSectionIdentifier | undefined;
}>();

const emit = defineEmits<{
  cancel: [];
  ok: [];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// State
const bibleBook = ref(0);
const bibleBookChapter = ref(-1);
const loadingBooks = ref(false);
const loadingMedia = ref(false);
const bibleBooks = ref<Record<number, MultimediaItem>>({});
const allBibleMedia = ref<MultimediaItem[]>([]);
const selectedMediaItems = ref<MultimediaItem[]>([]);
const hoveredMediaItem = ref<MultimediaItem>();
const chaptersWithMedia = ref<Set<number>>(new Set());

// Computed
const bibleBooksHebrew = computed(() => {
  return Object.fromEntries(
    Object.entries(bibleBooks.value).filter(
      ([bookNr]) => parseInt(bookNr) < 40,
    ),
  );
});

const bibleBooksGreek = computed(() => {
  return Object.fromEntries(
    Object.entries(bibleBooks.value).filter(
      ([bookNr]) => parseInt(bookNr) >= 40,
    ),
  );
});

const groupedMediaItems = computed(() => {
  const groups: Record<string, MultimediaItem[]> = {};

  for (const item of allBibleMedia.value) {
    // Group by Verse Label if available, otherwise 'General' or Title
    const label = item.VerseNumber
      ? bibleBookChapter.value + ':' + item.VerseNumber
      : t('general');

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label]?.push(item);
  }

  // Sort groups
  return Object.entries(groups).sort((a, b) => {
    const [aLabel] = a;
    const [bLabel] = b;

    // Handle "Chapter:Verse" format
    if (aLabel.includes(':') && bLabel.includes(':')) {
      const aParts = aLabel.split(':').map((p) => parseInt(p));
      const bParts = bLabel.split(':').map((p) => parseInt(p));
      const aVerse = aParts[1];
      const bVerse = bParts[1];

      if (
        aVerse !== undefined &&
        bVerse !== undefined &&
        !isNaN(aVerse) &&
        !isNaN(bVerse)
      ) {
        return aVerse - bVerse;
      }
    }

    // Fallback to simple integer parse (e.g. for Chapter numbers if used elsewhere)
    const aNum = parseInt(aLabel);
    const bNum = parseInt(bLabel);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;

    // Put "General" or other text at the end (or beginning depending on preference, usually text < numbers in ASCII but we want Verse numbers sorted)
    // Actually, if we have "General" and "1:1", parseInt("General") is NaN.
    // Let's put defined numbers before NaNs? Or NaNs (General) first?
    // Usually "General" (Introduction) comes before verses.
    if (isNaN(aNum) && !isNaN(bNum)) return -1;
    if (!isNaN(aNum) && isNaN(bNum)) return 1;

    return aLabel.localeCompare(bLabel);
  });
});

// Methods
whenever(
  () => props.modelValue,
  async () => {
    resetState();
    await fetchBooks();
  },
);

const resetState = () => {
  bibleBook.value = 0;
  bibleBookChapter.value = -1;
  selectedMediaItems.value = [];
  allBibleMedia.value = [];
  chaptersWithMedia.value = new Set();
};

const fetchBooks = async () => {
  if (Object.keys(bibleBooks.value).length) return;
  try {
    loadingBooks.value = true;
    bibleBooks.value = await getStudyBibleBooks();
  } catch (error) {
    errorCatcher(error);
  } finally {
    loadingBooks.value = false;
  }
};

const fetchChapterMediaAvailability = async (bookNr: number) => {
  try {
    const chaptersSet = new Set<number>();
    const result = await getStudyBibleMedia(bookNr);

    result.mediaItems.forEach((item) => {
      // Check for explicit ChapterNumber (if available on item)
      // The query returns it, but we need to make sure it's on the object.
      // If not, we can try to parse it from VerseLabel or other fields.
      // Based on logs, item has ChapterNumber.
      if (item.ChapterNumber !== undefined && item.ChapterNumber !== null) {
        chaptersSet.add(item.ChapterNumber);
      } else if (item.VerseLabel) {
        // Try to parse from VerseLabel "Chapter:Verse"
        const match = item.VerseLabel.match(/>(\d+):/);
        if (match && match[1]) {
          chaptersSet.add(parseInt(match[1]));
        }
      }
      // Also check for Introduction (Chapter 0)
      // Usually intro items have ChapterNumber 0 or are in related items
      if (item.ChapterNumber === 0) {
        chaptersSet.add(0);
      }
    });

    chaptersWithMedia.value = new Set([...chaptersSet].sort((a, b) => a - b));
  } catch (error) {
    errorCatcher(error);
    chaptersWithMedia.value = new Set();
  }
};

const selectBook = async (bookNr: number) => {
  bibleBook.value = bookNr;
  bibleBookChapter.value = -1;
  await fetchChapterMediaAvailability(bookNr);
};

const selectChapter = async (chapter: number) => {
  bibleBookChapter.value = chapter;
  await fetchMedia();
};

const fetchMedia = async () => {
  try {
    loadingMedia.value = true;
    const result = await getStudyBibleMedia(
      bibleBook.value,
      bibleBookChapter.value,
    );
    allBibleMedia.value = result.mediaItems;
  } catch (error) {
    errorCatcher(error);
  } finally {
    loadingMedia.value = false;
  }
};

const goBack = () => {
  if (bibleBookChapter.value > -1) {
    bibleBookChapter.value = -1;
  } else {
    bibleBook.value = 0;
  }
};

const toggleSelection = (item: MultimediaItem) => {
  const index = selectedMediaItems.value.indexOf(item);
  if (index > -1) {
    selectedMediaItems.value.splice(index, 1);
  } else {
    selectedMediaItems.value.push(item);
  }
};

const isSelected = (item: MultimediaItem) => {
  return selectedMediaItems.value.includes(item);
};

const addSelectedMediaItems = async () => {
  for (const mediaItem of selectedMediaItems.value) {
    await addStudyBibleMedia(mediaItem);
  }
  resetState();
  emit('ok');
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
      ...new Set([
        currentSettings.value?.lang,
        currentSettings.value?.langFallback,
        'E',
      ]),
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
        selectedDate.value,
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
</script>

<style scoped>
.study-bible-item :deep(img) {
  background-color: white;
}
</style>
