<template>
  <q-btn
    v-if="currentSettings?.enableSubtitles"
    :color="!subtitlesVisible ? 'negative' : 'white-transparent'"
    :icon="subtitlesVisible ? 'mmm-subtitles' : 'mmm-subtitles-off'"
    class="super-rounded"
    rounded
    unelevated
    @click="subtitlesVisible = !subtitlesVisible"
  >
    <q-tooltip :delay="1000" :offset="[14, 22]">{{
      $t('subtitles')
    }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'src/stores/current-state';
import { ref, watch } from 'vue';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const subtitlesVisible = ref(true);

const bc = new BroadcastChannel('mediaPlayback');

watch(
  () => subtitlesVisible.value,
  (newSubtitlesVisible, oldSubtitlesVisible) => {
    if (newSubtitlesVisible !== oldSubtitlesVisible)
      bc.postMessage({ subtitlesVisible: newSubtitlesVisible });
  },
);
</script>
