<template>
  <q-btn
    v-if="currentSettings?.enableTimerDisplay"
    class="super-rounded"
    :color="
      timerPopup
        ? 'white'
        : timerWindowVisible
          ? 'white-transparent'
          : 'negative'
    "
    rounded
    :text-color="
      timerPopup ? (timerWindowVisible ? 'primary' : 'negative') : ''
    "
    unelevated
    @click="timerPopup = !timerPopup"
  >
    <template v-if="currentSettings?.timerShowOnActionIsland && timerDisplay">
      <span class="timer-button__display">
        {{ timerDisplay }}
      </span>
    </template>
    <template v-else>
      <q-icon :name="timerWindowVisible ? 'mmm-alarm' : 'mmm-alarm-off'" />
    </template>
    <q-tooltip
      v-if="!timerPopup"
      anchor="bottom left"
      :delay="1000"
      :offset="[14, 22]"
      self="top left"
    >
      {{ t('timer') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import type { TimerData } from 'src/types';

import { useBroadcastChannel } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings, timerWindowVisible } = storeToRefs(currentState);

const timerPopup = defineModel<boolean>({ required: true });

const timerDisplay = ref<string>('');

// Listen to timer data
const { data } = useBroadcastChannel<TimerData, TimerData>({
  name: 'timer-display-data',
});

watch(data, (newData) => {
  if (newData) {
    timerDisplay.value = newData.time || '';
  }
});
</script>

<style scoped>
.timer-button__display {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  min-width: 6ch;
  text-align: center;
  white-space: nowrap;
}
</style>
