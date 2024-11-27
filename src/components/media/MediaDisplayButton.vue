<template>
  <q-btn
    v-if="currentSettings?.enableMediaDisplayButton"
    class="super-rounded"
    :color="
      displayPopup
        ? 'white'
        : mediaWindowVisible
          ? 'white-transparent'
          : 'negative'
    "
    :icon="
      mediaWindowVisible
        ? 'mmm-media-display-active'
        : 'mmm-media-display-inactive'
    "
    rounded
    :text-color="
      displayPopup ? (mediaWindowVisible ? 'primary' : 'negative') : ''
    "
    unelevated
    @click="(displayPopup = !displayPopup)"
  >
    <q-tooltip
      v-if="!displayPopup"
      anchor="bottom left"
      :delay="1000"
      :offset="[14, 22]"
      self="top left"
    >
      {{ $t('media-display') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'src/stores/current-state';

const currentState = useCurrentStateStore();
const { currentSettings, mediaWindowVisible } = storeToRefs(currentState);

const displayPopup = defineModel<boolean>({ required: true });
</script>
