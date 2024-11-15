<template>
  <q-dialog v-model="open">
    <div
      class="items-center q-pb-lg q-px-sm q-gutter-y-lg bg-secondary-contrast medium-overlay"
    >
      <div class="text-h6 row q-px-md">{{ $t('choose-a-song') }}</div>
      <div class="row q-px-md">{{ $t('add-a-song') }}</div>
      <div class="row q-px-md">
        <q-input
          v-model="filter"
          :disable="loading"
          :label="$t('search-by-title-or-number')"
          class="col"
          clearable
          debounce="100"
          dense
          outlined
          spellcheck="false"
        >
          <template #prepend>
            <q-icon name="mmm-search" />
          </template>
        </q-input>
      </div>
      <q-slide-transition>
        <div v-if="loading" class="row items-center justify-center">
          <q-spinner color="primary" size="lg" />
        </div>
      </q-slide-transition>
      <q-scroll-area
        :bar-style="barStyle"
        :thumb-style="thumbStyle"
        style="height: 40vh; width: -webkit-fill-available"
      >
        <div class="q-px-md">
          <q-btn
            v-for="song in filteredSongs"
            :key="song.track"
            :disable="loading"
            :label="song.track"
            class="rounded-borders-sm q-mr-xs q-mb-xs"
            color="primary"
            style="width: 3em; height: 3em"
            unelevated
            @click="addSong(song.track)"
          >
            <q-tooltip v-if="!loading" class="bg-black text-white">
              {{ song.title }}
            </q-tooltip>
          </q-btn>
        </div>
      </q-scroll-area>
      <div class="row">
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
            :label="$t('cancel')"
            color="negative"
            flat
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
import { useScrollbar } from 'src/composables/useScrollbar';
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
const { barStyle, thumbStyle } = useScrollbar();
const currentState = useCurrentStateStore();
const { currentSettings, currentSongbook, currentSongs } =
  storeToRefs(currentState);

const jwStore = useJwStore();
const { updateJwSongs } = jwStore;

const loading = ref(false);

const filter = ref('');
const filteredSongs = computed((): MediaLink[] => {
  return filter.value
    ? currentSongs.value?.filter((s) =>
        s.title.toLowerCase().includes(filter.value.toLowerCase()),
      )
    : currentSongs.value;
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
  updateJwSongs();
});
</script>
