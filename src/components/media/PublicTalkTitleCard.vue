<template>
  <q-item class="items-center">
    <q-item-section>
      <q-input
        v-model="talkTitle"
        autogrow
        dense
        :label="t('public-talk-title')"
        outlined
        style="max-width: calc(100% - 16px)"
        type="textarea"
      />
    </q-item-section>
    <q-item-section side style="align-content: center">
      <q-btn
        v-if="!isPlaying"
        :color="talkTitle?.trim() ? 'primary' : 'grey'"
        :disable="!talkTitle?.trim() || videoOrAudioPlaying"
        icon="mmm-play"
        rounded
        @click="togglePlay"
      />
      <q-btn
        v-else
        color="negative"
        icon="mmm-stop"
        rounded
        @click="togglePlay"
      />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { MediaSectionWithConfig } from 'src/types';

import { storeToRefs } from 'pinia';
import { locales } from 'src/constants/locales';
import { isAudio, isVideo } from 'src/utils/media';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  mediaList: MediaSectionWithConfig;
}>();

const emit = defineEmits<{
  'update-talk-title': [title: string];
}>();

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

// Disable only when video/audio is playing (same as other media items)
const videoOrAudioPlaying = computed(
  () =>
    currentState.mediaPlaying.url !== '' &&
    (isVideo(currentState.mediaPlaying.url) ||
      isAudio(currentState.mediaPlaying.url)),
);

const talkTitle = ref(props.mediaList.config?.publicTalkTitle || '');
const isPlaying = ref(false);

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const stopTitleDisplay = () => {
  if (!isPlaying.value) return;
  isPlaying.value = false;
  globalThis.dispatchEvent(
    new CustomEvent('public-talk-title', {
      detail: { html: null },
    }),
  );
};

const buildHtml = () => {
  const lang = currentSettings.value?.lang;
  const locale = locales.find((l) => l.langcode === lang)?.value;
  const subtitle = locale ? t('public-talk', {}, { locale }) : t('public-talk');
  const title = escapeHtml(talkTitle.value.trim()).replace(/\n/g, '<br>');
  return `<p class="pt-subtitle">${subtitle}</p><p class="pt-title">${title}</p>`;
};

const togglePlay = () => {
  if (!talkTitle.value?.trim()) return;

  // Stop image playback before showing title
  if (!isPlaying.value && currentState.mediaPlaying.url !== '') {
    currentState.mediaPlaying = {
      action: '',
      currentPosition: 0,
      pan: { x: 0, y: 0 },
      seekTo: 0,
      subtitlesUrl: '',
      uniqueId: '',
      url: '',
      zoom: 1,
    };
  }

  isPlaying.value = !isPlaying.value;

  globalThis.dispatchEvent(
    new CustomEvent('public-talk-title', {
      detail: { html: isPlaying.value ? buildHtml() : null },
    }),
  );
};

// Persist talk title to section config via emit
watch(talkTitle, (val) => {
  stopTitleDisplay();
  emit('update-talk-title', val);
});

// Stop title display when video/audio starts playing
watch(videoOrAudioPlaying, (newVal) => {
  if (newVal) stopTitleDisplay();
});

// Restore title when switching dates (mediaList prop changes)
watch(
  () => props.mediaList.config?.publicTalkTitle,
  (newVal) => {
    talkTitle.value = newVal || '';
  },
);
</script>
