<template>
  <q-btn
    v-if="currentSettings?.enableSubtitles"
    class="super-rounded"
    :color="!subtitlesVisible ? 'negative' : 'white-transparent'"
    :icon="subtitlesVisible ? 'mmm-subtitles' : 'mmm-subtitles-off'"
    rounded
    unelevated
    @click="subtitlesVisible = !subtitlesVisible"
  >
    <q-tooltip :delay="1000" :offset="[14, 22]">
      {{ t('subtitles') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { useBroadcastChannel, watchImmediate } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const subtitlesVisible = ref(true);

const { post } = useBroadcastChannel<boolean, boolean>({
  name: 'subtitles-visible',
});

// Listen for requests to get current media window variables
const { data: getCurrentMediaWindowVariables } = useBroadcastChannel<
  string,
  string
>({
  name: 'get-current-media-window-variables',
});

watch(
  () => subtitlesVisible.value,
  (newSubtitlesVisible, oldSubtitlesVisible) => {
    if (newSubtitlesVisible !== oldSubtitlesVisible) post(newSubtitlesVisible);
  },
);

watchImmediate(
  () => getCurrentMediaWindowVariables.value,
  () => {
    // Push current subtitles visibility when requested
    post(subtitlesVisible.value);
  },
);
</script>
