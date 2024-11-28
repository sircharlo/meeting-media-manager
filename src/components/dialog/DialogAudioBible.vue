<template>
  <q-dialog v-model="open">
    <div
      class="bg-secondary-contrast column fit-snugly large-overlay q-px-none"
    >
      <div class="text-h6 col-shrink full-width q-px-md q-pt-lg">
        {{ $t('add-media-audio-bible') }}
      </div>
      <div class="col-shrink full-width q-px-md q-py-md">
        {{ $t('add-media-audio-bible-explain') }}
      </div>
      <div
        v-if="loading"
        class="col-shrink full-width q-px-md q-pb-md row justify-center"
      >
        <q-spinner color="primary" size="md" />
      </div>
      <q-tabs
        v-if="selectedBibleBook && bibleBookNames.length"
        v-model="selectedBibleBook"
        active-color="primary"
        align="justify"
        class="text-grey full-width"
        dense
        indicator-color="primary"
        narrow-indicator
      >
        <q-tab
          v-for="(name, index) in bibleBookNames"
          :key="name"
          :label="name"
          :name="index + 1"
        />
      </q-tabs>
      <div class="q-pr-scroll overflow-auto col items-start q-px-md">
        <template v-if="selectedBibleBook">
          <!-- <div class="col-shrink full-width q-px-md q-pb-md">
            <div class="text-subtitle1">
              {{ selectedBibleBook }}
            </div>
          </div> -->
          <div class="row">
            <div class="col">
              <div class="text-caption text-uppercase">
                {{ $t('chapter') }}
              </div>
              <div class="q-px-md overflow-auto col full-width flex">
                <q-btn
                  v-for="chapter in selectedBookChapters"
                  :key="chapter"
                  class="rounded-borders-sm col-shrink grid-margin"
                  :color="
                    selectedChapter === chapter ? 'primary' : 'accent-400'
                  "
                  :disable="loading"
                  :label="chapter"
                  style="width: 3em; height: 3em"
                  unelevated
                  @click="selectedChapter = chapter"
                />
              </div>
            </div>
            <q-separator class="q-mx-sm" vertical />
            <div class="col q-px-md q-pb-md">
              <div class="text-caption text-uppercase">
                {{ $t('verse-or-verses') }}
              </div>
              <div class="q-px-md overflow-auto col full-width flex">
                {{ selectedChapterVerses }}
                <q-btn
                  v-for="verse in selectedChapterVerses"
                  :key="verse"
                  class="rounded-borders-sm col-shrink grid-margin"
                  :color="
                    chosenVerses.includes(verse) ? 'primary' : 'accent-400'
                  "
                  :disable="loading"
                  :label="verse"
                  style="width: 3em; height: 3em"
                  unelevated
                  @click="toggleVerse(verse)"
                />
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="col-shrink full-width q-px-md q-pb-md">
            <div class="text-caption text-uppercase">
              {{ $t('hebrew-aramaic-scriptures') }}
            </div>
          </div>
          <div class="row full-width q-col-gutter-xs">
            <div
              v-for="(book, index) in bibleAudioMediaHebrew"
              :key="index"
              class="col col-xs-4 col-sm-3 col-md-2 col-lg-1"
            >
              <q-btn
                class="full-width"
                color="accent-200"
                no-caps
                text-color="black"
                unelevated
                @click="selectedBibleBook = book.booknum"
              >
                <div class="ellipsis">
                  {{ book.pubName }}
                </div>
              </q-btn>
            </div>
          </div>
          <div class="col-shrink full-width q-px-md q-py-md">
            <div class="text-caption text-uppercase">
              {{ $t('greek-scriptures') }}
            </div>
          </div>
          <div class="row full-width q-col-gutter-xs">
            <div
              v-for="(book, index) in bibleAudioMediaGreek"
              :key="index"
              class="col col-xs-4 col-sm-3 col-md-2 col-lg-1"
            >
              <q-btn
                class="full-width"
                color="accent-200"
                no-caps
                text-color="black"
                unelevated
                @click="selectedBibleBook = book.booknum"
              >
                <div class="ellipsis">
                  {{ book.pubName }}
                </div>
              </q-btn>
            </div>
          </div>
        </template>
      </div>
      <div class="row q-px-md q-py-md col-shrink full-width">
        <div class="col"></div>
        <div class="col text-right q-gutter-x-sm">
          <q-btn
            v-if="selectedBibleBook"
            color="primary"
            flat
            :label="$t('back')"
            @click="resetBibleBook(!selectedChapter)"
          />
          <q-btn
            v-if="chosenVerses.length"
            v-close-popup
            color="primary"
            :label="$t('add') + ' (' + chosenVerses.length + ')'"
          />
          <!-- @click="addSelectedMediaItems()" -->
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
import type { MediaLink, Publication, PublicationFiles } from 'src/types';

import { whenever } from '@vueuse/core';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getAudioBibleMedia } from 'src/helpers/jw-media';
import { computed, ref, watch } from 'vue';
// // Props
// const props = defineProps<{
//   section?: MediaSection;
// }>();

const open = defineModel<boolean>({ default: false });

const selectedBibleBook = ref<null | number>(0);
const selectedChapter = ref(0);
const bibleAudioMedia = ref<Publication[]>([]);

const bibleBookNames = computed(() => {
  return bibleAudioMedia.value.map((item) => item.pubName);
});

const bibleAudioMediaHebrew = computed(() => {
  return bibleAudioMedia.value.filter(
    (item) => item.booknum && item.booknum < 40,
  );
});

const bibleAudioMediaGreek = computed(() => {
  return bibleAudioMedia.value.filter(
    (item) => item.booknum && item.booknum >= 40,
  );
});

const selectedBookMedia = computed(() => {
  if (!selectedBibleBook.value) return [];
  const allFiles: PublicationFiles[] = Object.values(
    bibleAudioMedia.value[selectedBibleBook.value - 1].files,
  );
  const langFiles: PublicationFiles = allFiles[0];
  const mediaFiles: MediaLink[] = Object.values(langFiles)[0];
  return mediaFiles;
});

const selectedBookChapters = computed(() => {
  return selectedBookMedia.value.map((item) => item.track || 0);
});

const selectedChapterVerses = computed(() => {
  return selectedBookMedia.value
    .filter((item) => item.track === selectedChapter.value)
    .map((item) => item.markers)
    .flatMap((item) => item.markers)
    .map((item) => item.verseNumber)
    .filter((verse): verse is number => verse !== undefined && verse > 0);
});

watch(
  () => selectedBibleBook.value,
  () => {
    resetBibleBook();
  },
);

watch(
  () => selectedChapter.value,
  () => {
    chosenVerses.value = [];
  },
);

const loading = ref<boolean>(false);

const chosenVerses = ref<number[]>([]);

const toggleVerse = (verse: number) => {
  if (chosenVerses.value.includes(verse)) {
    chosenVerses.value = chosenVerses.value.filter((v) => v !== verse);
  } else {
    chosenVerses.value.push(verse);
  }
};

const fetchMedia = async () => {
  try {
    loading.value = true;
    bibleAudioMedia.value = await getAudioBibleMedia();
  } catch (error) {
    errorCatcher(error);
  } finally {
    loading.value = false;
  }
};

whenever(open, () => {
  resetBibleBook(true);
  fetchMedia();
});

// const addSelectedMediaItems = async () => {
//   for (const mediaItem of selectedMediaItems.value) {
//     await addStudyBibleMedia(mediaItem);
//   }
//   resetBibleBook(true, true);
// };

// const addStudyBibleMedia = async (mediaItem: MultimediaItem) => {
//   if (mediaItem.MimeType.includes('image')) {
//     mediaItem.FilePath = await convertImageIfNeeded(mediaItem.FilePath);
//     await addToAdditionMediaMapFromPath(
//       mediaItem.FilePath,
//       props.section,
//       undefined,
//       {
//         title: mediaItem.Label,
//       },
//     );
//   } else {
//     const mediaLookup: PublicationFetcher = {
//       docid: mediaItem.MepsDocumentId,
//       fileformat: 'MP4',
//       issue: mediaItem.IssueTagNumber || undefined,
//       langwritten: '',
//       pub: mediaItem.KeySymbol,
//       track: mediaItem.Track || undefined,
//     };

//     const langsToTry = [
//       currentSettings.value?.lang,
//       currentSettings.value?.langFallback,
//       'E',
//     ].filter((l) => l !== undefined && l !== null);
//     let mediaInfo, mediaItemFiles;
//     for (const lang of langsToTry) {
//       if (!lang) continue;
//       mediaLookup.langwritten = lang as JwLangCode;
//       try {
//         [mediaItemFiles, mediaInfo] = await Promise.all([
//           getPubMediaLinks(mediaLookup),
//           getJwMediaInfo(mediaLookup),
//         ]);
//         if (mediaItemFiles && mediaInfo) break; // Exit loop if successful
//       } catch {
//         // Continue to the next language on failure
//       }
//     }

//     if (mediaItemFiles && mediaInfo && mediaLookup.langwritten) {
//       const { thumbnail, title } = mediaInfo;
//       downloadAdditionalRemoteVideo(
//         mediaItemFiles?.files?.[mediaLookup.langwritten]?.['MP4'] || [],
//         thumbnail,
//         false,
//         title.replace(/^\d+\.\s*/, ''),
//         props.section,
//       );
//     } else {
//       console.error('Failed to fetch media for all languages.');
//     }
//   }
// };

const resetBibleBook = (closeBook = false, closeDialog = false) => {
  if (closeDialog) open.value = false;
  if (closeBook) selectedBibleBook.value = 0;
  selectedChapter.value = 0;
  chosenVerses.value = [];
};
</script>
