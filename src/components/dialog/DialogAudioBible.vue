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
        v-if="
          !loading &&
          selectedBibleBook &&
          bibleAudioMediaHebrew.concat(bibleAudioMediaGreek).length
        "
        class="col-shrink full-width q-px-md"
      >
        <q-tabs
          v-model="selectedBibleBook"
          active-color="primary"
          class="text-grey"
          dense
          indicator-color="primary"
          narrow-indicator
          outside-arrows
        >
          <q-tab
            v-for="book in bibleAudioMediaHebrew.concat(bibleAudioMediaGreek)"
            :key="book.booknum || 0"
            :disable="!book.files"
            :label="book.pubName"
            :name="book.booknum || 0"
          />
        </q-tabs>
      </div>
      <div
        class="q-pr-scroll overflow-auto col items-start q-pt-sm"
        :class="{ 'content-center': loading }"
      >
        <template v-if="loading">
          <div class="row q-px-md col flex-center">
            <q-spinner color="primary" size="md" />
          </div>
        </template>
        <template v-else>
          <template v-if="selectedBibleBook && selectedBookChapters.length">
            <div class="row q-px-md col">
              <div class="col q-pr-scroll overflow-auto">
                <div class="text-grey text-uppercase q-my-sm">
                  {{ $t('chapter') }}
                </div>
                <div class="overflow-auto row q-col-gutter-xs">
                  <div
                    v-for="chapter in selectedBookChapters"
                    :key="chapter"
                    class="col col-grid"
                  >
                    <q-btn
                      :key="chapter"
                      class="rounded-borders-sm full-width aspect-ratio-1"
                      :class="{
                        'bg-primary': selectedChapter === chapter,
                        'text-white': selectedChapter === chapter,
                        'bg-primary-light': selectedChapter !== chapter,
                      }"
                      :disable="loading"
                      :label="chapter"
                      unelevated
                      @click="selectedChapter = chapter"
                    />
                  </div>
                </div>
                <!-- style="width: 3em; height: 3em" -->
              </div>
              <q-separator class="q-mx-sm" vertical />
              <div class="col q-px-md q-pb-md">
                <div class="text-grey text-uppercase q-my-sm">
                  {{ $t('verse-or-verses') }}
                </div>
                <div
                  class="overflow-auto row q-col-gutter-xs"
                  @mouseleave="hoveredVerse = null"
                >
                  <div
                    v-for="verse in selectedChapterVerses"
                    :key="verse"
                    class="col col-grid"
                  >
                    <q-btn
                      class="rounded-borders-sm full-width aspect-ratio-1"
                      :class="getVerseClass(verse)"
                      :disable="loading"
                      :label="verse"
                      unelevated
                      @click="toggleVerse(verse)"
                      @mouseover="hoveredVerse = verse"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="bibleAudioMedia?.length">
            <div
              v-for="(sectionInfo, sectionIndex) in [
                {
                  title: 'hebrew-aramaic-scriptures',
                  books: bibleAudioMediaHebrew,
                },
                { title: 'greek-scriptures', books: bibleAudioMediaGreek },
              ]"
              :key="sectionIndex"
              class="col-shrink full-width q-px-md"
            >
              <div class="text-grey text-uppercase q-my-sm">
                {{ $t(sectionInfo.title) }}
              </div>
              <div class="row full-width q-col-gutter-xs q-mb-lg">
                <div
                  v-for="(book, index) in sectionInfo.books"
                  :key="index"
                  class="col col-xs-4 col-sm-3 col-md-2 col-lg-1"
                >
                  <q-btn
                    :class="{
                      'full-width': true,
                      'dotted-borders': !book.files,
                    }"
                    :color="!book.files ? '' : 'accent-200'"
                    :disable="!book.files"
                    no-caps
                    :text-color="!book.files ? 'accent-300' : 'black'"
                    unelevated
                    @click="selectedBibleBook = book.booknum || 0"
                  >
                    <div class="ellipsis">
                      {{ book.pubName }}
                    </div>
                  </q-btn>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
      <div class="row q-px-md q-py-md col-shrink full-width">
        <div class="col">
          <q-btn
            color="primary"
            :disable="loading"
            flat
            round
            @click="
              loading = true;
              fetchMedia(true);
            "
          >
            <q-spinner
              v-if="loading || bibleAudioMedia?.length === 0"
              color="primary"
              size="sm"
            />
            <q-icon v-else name="mmm-refresh" />
          </q-btn>
        </div>
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
import type {
  MediaLink,
  MediaSection,
  Publication,
  PublicationFiles,
} from 'src/types';

import { whenever } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  downloadAdditionalRemoteVideo,
  getAudioBibleMedia,
} from 'src/helpers/jw-media';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { computed, ref, watch } from 'vue';

// Stores
const currentStateStore = useCurrentStateStore();
const { currentCongregation, selectedDate } = storeToRefs(currentStateStore);
const jwStore = useJwStore();
const { customDurations } = storeToRefs(jwStore);

// Props
const props = defineProps<{
  section: MediaSection | undefined;
}>();

const open = defineModel<boolean>({ default: false });

const selectedBibleBook = ref<number>(0);
const selectedChapter = ref(0);
const bibleAudioMedia = ref<Partial<Publication>[] | undefined>([]);

const bibleAudioMediaHebrew = computed(() => {
  return (
    bibleAudioMedia.value?.filter(
      (item) => item?.booknum && item?.booknum < 40,
    ) || []
  );
});

const bibleAudioMediaGreek = computed(() => {
  return (
    bibleAudioMedia.value?.filter(
      (item) => item?.booknum && item?.booknum >= 40,
    ) || []
  );
});

const selectedBookMedia = computed(() => {
  if (!selectedBibleBook.value) return [];
  const allFiles: PublicationFiles[] = Object.values(
    bibleAudioMedia.value?.find(
      (item) => item?.booknum === selectedBibleBook.value,
    )?.files || {},
  );
  const langFiles: PublicationFiles = allFiles[0]!;
  const mediaFiles: MediaLink[] = Object.values(langFiles || {})[0];
  return mediaFiles || [];
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
          ? Math.abs(chosenVerses.value[0]! - chosenVerses.value[1]!) + 1
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

const fetchMedia = async (force = false) => {
  try {
    loading.value = true;
    bibleAudioMedia.value = await getAudioBibleMedia(force);
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
  loading.value = true;
  if (!chosenVerses.value.length) return;
  const startVerseNumber = chosenVerses.value[0];
  const endVerseNumber = chosenVerses.value[1] || startVerseNumber;

  const timeToSeconds = (time: string) => {
    const [h, m, s] = time.split(':').map(parseFloat);
    return h! * 3600 + m! * 60 + s!;
  };

  const min = timeToSeconds(
    selectedChapterMedia.value.map((item) =>
      item.markers.markers.find(
        (marker) => marker.verseNumber === startVerseNumber,
      ),
    )?.[0]?.startTime || '0',
  );

  const endVerse = selectedChapterMedia.value.map((item) =>
    item.markers.markers.find(
      (marker) => marker.verseNumber === endVerseNumber,
    ),
  )?.[0];
  const max = endVerse
    ? timeToSeconds(endVerse.startTime) + timeToSeconds(endVerse.duration)
    : 0;

  const uniqueId = await downloadAdditionalRemoteVideo(
    selectedChapterMedia.value,
    undefined,
    false,
    bibleAudioMedia.value?.[selectedBibleBook.value - 1]?.pubName +
      ' ' +
      selectedChapter.value +
      ':' +
      chosenVerses.value
        .filter((verse, index, self) => self.indexOf(verse) === index)
        .join('-'),
    props.section,
  );

  if (
    uniqueId &&
    min &&
    max &&
    selectedDate.value &&
    currentCongregation.value
  ) {
    const congregation = (customDurations.value[currentCongregation.value] ??=
      {});
    const dateDurations = (congregation[selectedDate.value] ??= {});
    dateDurations[uniqueId] = { max, min };
  }

  resetBibleBook(true, true);

  loading.value = false;
};

const resetBibleBook = (closeBook = false, closeDialog = false) => {
  if (closeDialog) open.value = false;
  if (closeBook) selectedBibleBook.value = 0;
  selectedChapter.value = 0;
  chosenVerses.value = [];
  hoveredVerse.value = null;
};

const getVerseClass = (verse: number) => {
  if (chosenVerses.value.includes(verse)) {
    return 'bg-primary text-white';
  } else if (
    chosenVerses.value.length === 2 &&
    verse > Math.min(...chosenVerses.value) &&
    verse < Math.max(...chosenVerses.value)
  ) {
    return 'bg-primary-semi-transparent text-white';
  } else if (
    chosenVerses.value.length === 1 &&
    chosenVerses.value !== null &&
    verse > Math.min(chosenVerses.value[0]!, hoveredVerse.value || 0) &&
    verse < Math.max(chosenVerses.value[0]!, hoveredVerse.value || 0)
  ) {
    return 'bg-primary-semi-transparent text-white';
  } else {
    return 'bg-primary-light';
  }
};
</script>
