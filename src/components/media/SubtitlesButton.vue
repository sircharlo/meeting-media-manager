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
      {{ $t('subtitles') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { useBroadcastChannel } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'src/stores/current-state';
import { ref, watch } from 'vue';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const subtitlesVisible = ref(true);

const { post } = useBroadcastChannel<boolean, boolean>({
  name: 'subtitles-visible',
});

watch(
  () => subtitlesVisible.value,
  (newSubtitlesVisible, oldSubtitlesVisible) => {
    if (newSubtitlesVisible !== oldSubtitlesVisible) post(newSubtitlesVisible);
  },
);
</script>
