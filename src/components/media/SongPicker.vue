<template>
  <q-dialog v-model="open">
    <div
      class="bg-secondary-contrast column fit-snugly large-overlay q-px-none"
    >
      <div class="text-h6 col-shrink full-width q-px-md q-pt-lg">
        {{ $t('choose-a-song') }}
      </div>
      <div class="col-shrink full-width q-px-md q-pt-md">
        {{ $t('add-a-song') }}
      </div>
      <div class="col-shrink full-width q-px-md q-py-md">
        <q-input
          v-model="filter"
          class="col"
          clearable
          debounce="100"
          dense
          :disable="loading"
          :label="$t('search-by-title-or-number')"
          outlined
          spellcheck="false"
        >
          <template #prepend>
            <q-icon name="mmm-search" />
          </template>
        </q-input>
      </div>
      <q-slide-transition>
        <div
          v-if="loading && filteredSongs?.length === 0"
          class="col-shrink q-pb-md full-width"
        >
          <div class="row justify-center">
            <q-spinner color="primary" size="lg" />
          </div>
        </div>
      </q-slide-transition>
      <div class="q-px-md overflow-auto col row q-col-gutter-xs">
        <div v-for="song in filteredSongs" :key="song.track" class="col col-1">
          <q-btn
            class="rounded-borders-sm full-width aspect-ratio-1"
            color="primary"
            :disable="loading"
            :label="song.track"
            unelevated
            @click="addSong(song.track)"
          >
            <q-tooltip v-if="!loading" class="bg-black text-white">
              {{ song.title }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>
      <div class="row q-px-md q-py-md col-shrink full-width">
        <div class="col">
          <q-spinner
            v-if="loading || filteredSongs?.length === 0"
            color="primary"
            size="1.5em"
          />
          <q-btn
            v-else
            color="primary"
            flat
            icon="mmm-refresh"
            round
            @click="
              loading = true;
              updateJwSongs(true).then(() => (loading = false));
            "
          />
        </div>
        <div class="col text-right">
          <q-btn
            color="negative"
            flat
            :label="$t('cancel')"
            @click="dismissPopup"
          />
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import type { MediaLink, MediaSection, PublicationFetcher } from 'src/types';

import { whenever } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  downloadAdditionalRemoteVideo,
  getJwMediaInfo,
  getPubMediaLinks,
} from 'src/helpers/jw-media';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { computed, ref } from 'vue';

const props = defineProps<{
  section?: MediaSection;
}>();

// Define model
const open = defineModel<boolean>({ required: true });

// Setup logic
const currentState = useCurrentStateStore();
const { currentSettings, currentSongbook, currentSongs, online } =
  storeToRefs(currentState);

const jwStore = useJwStore();
const { updateJwSongs } = jwStore;

const loading = ref(false);

const filter = ref('');
const filteredSongs = computed((): MediaLink[] => {
  if (filter.value) {
    const searchTerms = filter.value
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term);
    return currentSongs.value?.filter((s) =>
      searchTerms.every((term) => s.title.toLowerCase().includes(term)),
    );
  }
  return currentSongs.value;
});

const dismissPopup = () => {
  open.value = false;
  loading.value = false;
};

const addSong = async (songTrack: number) => {
  try {
    loading.value = true;
    if (songTrack) {
      const songTrackItem: PublicationFetcher = {
        fileformat: 'MP4',
        langwritten: currentSettings.value?.lang || 'E',
        pub: currentSongbook.value?.pub,
        track: songTrack,
      };
      const [songTrackFiles, { thumbnail, title }] = await Promise.all([
        getPubMediaLinks(songTrackItem),
        getJwMediaInfo(songTrackItem),
      ]);
      downloadAdditionalRemoteVideo(
        songTrackFiles?.files?.[currentSettings.value?.lang || 'E']?.['MP4'] ||
          [],
        thumbnail,
        songTrack,
        title.replace(/^\d+\.\s*/, ''),
        props.section,
      );
    }
  } catch (error) {
    errorCatcher(error);
  } finally {
    dismissPopup();
  }
};

whenever(open, () => {
  if (online) updateJwSongs();
});
</script>
