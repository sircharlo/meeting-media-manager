<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId">
    <div
      class="bg-secondary-contrast flex medium-overlay q-px-none"
      style="flex-flow: column"
    >
      <div class="text-h6 row q-px-md q-pt-lg">
        <div class="col">
          {{ t('choose-a-song') }}
        </div>
        <div class="col-shrink">
          <q-btn
            color="primary"
            flat
            icon="mmm-cloud-done"
            :loading="loading || !filteredSongs?.length"
            round
            size="sm"
            @click="
              loading = true;
              updateJwSongs(
                online,
                currentSettings,
                currentSongbook,
                true,
              ).then(() => (loading = false));
            "
          />
        </div>
      </div>
      <div class="row q-px-md q-pt-md">
        {{ t('add-a-song') }}
      </div>
      <div class="row q-px-md q-py-md">
        <q-input
          v-model="filter"
          autofocus
          class="col"
          clearable
          debounce="100"
          dense
          :disable="loading"
          :label="t('search-by-title-or-number')"
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
          class="row q-pb-md flex-center flex"
          style="min-height: 100px"
        >
          <q-spinner color="primary" size="lg" />
        </div>
      </q-slide-transition>
      <div class="q-px-md overflow-auto row q-col-gutter-xs content-start">
        <div
          v-for="song in filteredSongs"
          :key="song.track"
          class="col col-grid"
        >
          <q-btn
            class="rounded-borders-sm aspect-ratio-1 full-width"
            :color="hoveredSong === song.track ? 'primary' : 'accent-200'"
            :disable="loading"
            :label="song.track"
            :text-color="hoveredSong === song.track ? 'white' : 'black'"
            unelevated
            @click="addSong(song.track)"
            @mouseout="if (!loading) hoveredSong = null;"
            @mouseover="if (!loading) hoveredSong = song.track;"
          >
            <q-tooltip v-if="!loading" class="bg-black text-white">
              {{ song.title }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>
      <div class="row q-px-md q-py-md row">
        <div class="col text-right">
          <q-btn
            color="negative"
            flat
            :label="t('cancel')"
            @click="dismissPopup"
          />
        </div>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import type {
  MediaLink,
  MediaSectionIdentifier,
  PublicationFetcher,
} from 'src/types';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  downloadAdditionalRemoteVideo,
  getJwMediaInfo,
  getPubMediaLinks,
} from 'src/helpers/jw-media';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

// Setup logic
const currentState = useCurrentStateStore();
const { currentSettings, currentSongbook, currentSongs, online } =
  storeToRefs(currentState);

const jwStore = useJwStore();
const { updateJwSongs } = jwStore;

const loading = ref(false);
const hoveredSong = ref<null | number>(null);

const filter = ref('');

const resetDialogState = () => {
  // Reset all dialog state
  filter.value = '';
  hoveredSong.value = null;
  loading.value = false;
};

// Watch for dialog closing to reset state
watch(
  () => dialogValue.value,
  (isOpen) => {
    if (!isOpen) {
      // Reset state when dialog closes
      resetDialogState();
    }
  },
);
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
  // Reset state when dialog is cancelled
  resetDialogState();
  dialogValue.value = false;
  emit('cancel');
};

const addSong = async (songTrack: number) => {
  try {
    loading.value = true;
    hoveredSong.value = songTrack;
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
    // Reset state and close dialog after song is added
    resetDialogState();
    dialogValue.value = false;
    emit('ok');
  }
};

// Initialize when component mounts
if (online)
  updateJwSongs(online.value, currentSettings.value, currentSongbook.value);
</script>
