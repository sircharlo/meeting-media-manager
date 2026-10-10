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
    @mouseenter="scheduleHoverOpen"
    @mouseleave="scheduleHoverClose"
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
      v-if="!timerPopup && !hoverControlsEnabled"
      anchor="bottom left"
      :delay="1000"
      :offset="[14, 22]"
      self="top left"
    >
      {{ t('timer') }}
    </q-tooltip>
    <!-- Quick controls on hover: the part being timed and its buttons,
         without opening the full popup. Closes once the mouse leaves both
         the button and the controls. -->
    <q-menu
      v-if="hoverControlsEnabled"
      v-model="hoverOpen"
      anchor="top middle"
      class="timer-button__hover-menu"
      no-focus
      no-parent-event
      no-refocus
      :offset="[0, 8]"
      self="bottom middle"
      transition-hide="jump-down"
      transition-show="jump-up"
    >
      <div
        class="q-pa-md"
        @mouseenter="cancelHoverClose"
        @mouseleave="scheduleHoverClose"
      >
        <TimerQuickControls />
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import type { TimerData } from 'src/types';

import { useBroadcastChannel } from '@vueuse/core';
import TimerQuickControls from 'components/media/TimerQuickControls.vue';
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings, timerWindowVisible } = storeToRefs(currentState);

const timerPopup = defineModel<boolean>({ required: true });

const timerDisplay = ref<string>('');

const hoverControlsEnabled = computed(
  () => !!currentSettings.value?.timerIslandHoverControls,
);

const hoverOpen = ref(false);
let hoverOpenTimeout: ReturnType<typeof setTimeout> | undefined;
let hoverCloseTimeout: ReturnType<typeof setTimeout> | undefined;

const HOVER_OPEN_DELAY_MS = 350;
const HOVER_CLOSE_DELAY_MS = 250;

const cancelHoverOpen = () => {
  if (hoverOpenTimeout) clearTimeout(hoverOpenTimeout);
  hoverOpenTimeout = undefined;
};

const cancelHoverClose = () => {
  if (hoverCloseTimeout) clearTimeout(hoverCloseTimeout);
  hoverCloseTimeout = undefined;
};

const scheduleHoverOpen = () => {
  if (!hoverControlsEnabled.value || timerPopup.value) return;
  cancelHoverClose();
  cancelHoverOpen();
  hoverOpenTimeout = setTimeout(() => {
    if (!timerPopup.value) hoverOpen.value = true;
  }, HOVER_OPEN_DELAY_MS);
};

const scheduleHoverClose = () => {
  cancelHoverOpen();
  cancelHoverClose();
  hoverCloseTimeout = setTimeout(() => {
    hoverOpen.value = false;
  }, HOVER_CLOSE_DELAY_MS);
};

// Listen to timer data
const { data } = useBroadcastChannel<TimerData, TimerData>({
  name: 'timer-display-data',
});

watch(data, (newData) => {
  if (newData) {
    timerDisplay.value = newData.time || '';
  }
});

// The full popup takes over from the hover controls.
watch(timerPopup, (isOpen) => {
  if (isOpen) {
    cancelHoverOpen();
    hoverOpen.value = false;
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
