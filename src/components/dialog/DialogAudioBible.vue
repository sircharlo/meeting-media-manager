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
                  :class="
                    selectedChapter === chapter
                      ? 'bg-primary text-white'
                      : 'bg-primary-light'
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
              <div
                class="q-px-md overflow-auto col full-width flex"
                @mouseleave="hoveredVerse = null"
              >
                <q-btn
                  v-for="verse in selectedChapterVerses"
                  :key="verse"
                  class="rounded-borders-sm col-shrink grid-margin"
                  :class="
                    chosenVerses.includes(verse)
                      ? 'bg-primary text-white'
                      : chosenVerses.length === 2 &&
                          verse > Math.min(...chosenVerses) &&
                          verse < Math.max(...chosenVerses)
                        ? 'bg-primary-semi-transparent text-white'
                        : chosenVerses.length === 1 &&
                            hoveredVerse !== null &&
                            verse > Math.min(chosenVerses[0], hoveredVerse) &&
                            verse < Math.max(chosenVerses[0], hoveredVerse)
                          ? 'bg-primary-semi-transparent text-white'
                          : 'bg-primary-light'
                  "
                  :disable="loading"
                  :label="verse"
                  style="width: 3em; height: 3em"
                  unelevated
                  @click="toggleVerse(verse)"
                  @mouseover="hoveredVerse = verse"
                />
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div
            v-for="(section, sectionIndex) in [
              {
                title: 'hebrew-aramaic-scriptures',
                books: bibleAudioMediaHebrew,
              },
              { title: 'greek-scriptures', books: bibleAudioMediaGreek },
            ]"
            :key="sectionIndex"
            class="col-shrink full-width q-px-md q-py-md"
          >
            <div class="text-caption text-uppercase">
              {{ $t(section.title) }}
            </div>
            <div class="row full-width q-col-gutter-xs">
              <div
                v-for="(book, index) in section.books"
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
            :label="$t('add') + totalChosenVerses"
            @click="addSelectedVerses()"
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

const selectedChapterMedia = computed(() => {
  return selectedBookMedia.value.filter(
    (item) => item.track === selectedChapter.value,
  );
});

const selectedBookChapters = computed(() => {
  return selectedBookMedia.value.map((item) => item.track || 0);
});

const selectedChapterVerses = computed(() => {
  return selectedChapterMedia.value
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
const hoveredVerse = ref<null | number>(null);
const totalChosenVerses = computed(() => {
  return !chosenVerses.value.length
    ? ''
    : ' (' +
        (chosenVerses.value.length === 2
          ? Math.abs(chosenVerses.value[0] - chosenVerses.value[1]) + 1
          : chosenVerses.value.length === 1
            ? 1
            : '') +
        ')';
});

const toggleVerse = (verse: number) => {
  if (chosenVerses.value.length === 2) {
    chosenVerses.value = [verse];
  } else {
    chosenVerses.value.push(verse);
    chosenVerses.value.sort((a, b) => a - b);
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

const addSelectedVerses = async () => {
  const timeToMs = (time: string) => {
    const [h, m, s] = time.split(':').map(parseFloat);
    return (h * 3600 + m * 60 + s) * 1000;
  };

  const msToTime = (ms: number) => {
    const h = Math.floor(ms / 3600000)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((ms % 3600000) / 60000)
      .toString()
      .padStart(2, '0');
    const s = ((ms % 60000) / 1000).toFixed(3).padStart(6, '0');
    return `${h}:${m}:${s}`;
  };

  const startTime =
    selectedChapterMedia.value.map((item) =>
      item.markers.markers.find(
        (marker) => marker.verseNumber === chosenVerses.value[0],
      ),
    )?.[0]?.startTime || 0;
  const endVerse = selectedChapterMedia.value.map((item) =>
    item.markers.markers.find(
      (marker) => marker.verseNumber === chosenVerses.value[1],
    ),
  )?.[0];
  const endTime = msToTime(
    endVerse ? timeToMs(endVerse.startTime) + timeToMs(endVerse.duration) : 0,
  );
  console.log(chosenVerses.value[0], startTime, chosenVerses.value[1], endTime);
  // for (const verse of chosenVerses.value.sort()) {
  //   console.log(
  //     verse,
  //     selectedChapterMedia.value.map((item) =>
  //       item.markers.markers.find((marker) => marker.verseNumber === verse),
  //     ),
  //   );
  // }
  resetBibleBook(true, true);
};

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
  hoveredVerse.value = null;
};
</script>
