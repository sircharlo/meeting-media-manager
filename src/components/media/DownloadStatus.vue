<template>
  <q-btn
    class="download-status liquid-host super-rounded"
    :class="classes"
    :color="color"
    rounded
    :text-color="textColor"
    unelevated
    @click="downloadPopup = !downloadPopup"
  >
    <!-- While the meeting dates are checked, the button's liquid sloshes;
         downloads with a known size then fill it like a glass. When it's
         all done, it fills up and turns green for a moment, then fades. -->
    <IslandButtonLiquid
      :done="isFinished"
      :open="downloadPopup"
      :percent="batchPercent"
      :restart-key="batchNumber"
      :showing="showsLiquid"
      :sloshing="!batchIsActive"
    >
      <q-icon :class="{ 'mmm-pop-in': isFinished }" :name="iconName" />
    </IslandButtonLiquid>
    <q-icon :class="{ 'mmm-pop-in': isFinished }" :name="iconName" />
    <q-tooltip
      v-if="!downloadPopup"
      anchor="bottom left"
      :delay="1000"
      :offset="[14, 22]"
      self="top left"
    >
      <div class="text-weight-medium">{{ t('download-status') }}</div>
      <div v-if="statusLine">{{ statusLine }}</div>
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import type { DownloadProgressItem } from 'src/types';

import { useIntervalFn, useTimeoutFn } from '@vueuse/core';
import IslandButtonLiquid from 'components/ui/IslandButtonLiquid.vue';
import { storeToRefs } from 'pinia';
import { useDownloadBatch } from 'src/composables/useDownloadBatch';
import {
  type IslandButtonStatus,
  useIslandButton,
} from 'src/composables/useIslandButton';
import { useMotionMode } from 'src/composables/useMotionMode';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getDateDiff } from 'src/utils/date';
import { LIQUID_DONE_HOLD_MS } from 'src/utils/liquid-motion';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { isOnline } = globalThis.electronApi;

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { downloadProgress, online } = storeToRefs(currentState);

const downloadPopup = defineModel<boolean>({ required: true });

const updateOnline = async () => {
  try {
    online.value = await isOnline();
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'updateOnline' } } });
  }
};

// useIntervalFn auto-clears on unmount - this component remounts whenever
// the footer that hosts it does (e.g. toggling media-display/music-button
// settings, or switching to a congregation with different values for them),
// so a bare setInterval here would accumulate a new timer on every remount.
useIntervalFn(() => {
  void updateOnline();
}, 10_000);

onMounted(() => {
  void updateOnline();
});

function isErrorInCurrentWindow(item: DownloadProgressItem) {
  if (!item.meetingDate) return true;
  const daysUntilMeeting = getDateDiff(item.meetingDate, new Date(), 'days');
  return daysUntilMeeting >= 0 && daysUntilMeeting <= 7;
}

const someHaveError = computed(() => {
  return Object.values(downloadProgress.value).some(
    (item: DownloadProgressItem) => item.error && isErrorInCurrentWindow(item),
  );
});

const someAreLoading = computed(() => currentState.hasActiveMediaWork);

const failedCount = computed(
  () =>
    Object.values(downloadProgress.value).filter(
      (item: DownloadProgressItem) =>
        item.error && isErrorInCurrentWindow(item),
    ).length,
);

const status = computed<IslandButtonStatus>(() => {
  if (someHaveError.value) return 'error';
  if (!online.value) return 'attention';
  if (someAreLoading.value) return 'busy';
  return 'normal';
});

const statusLine = computed(() => {
  if (status.value === 'error') {
    return t('n-items-failed', failedCount.value);
  }
  if (status.value === 'attention') return t('download-status-offline');
  return '';
});

const { classes, color, textColor } = useIslandButton(status, downloadPopup);

const {
  batchNumber,
  isActive: batchIsActive,
  isFinished: batchFinished,
  percent: batchPercent,
} = useDownloadBatch();

// Checking the meeting dates finishes too when there was nothing new to
// download: the button fills up and turns green for a moment, as it does
// after a batch of downloads, instead of its sloshing just vanishing.
const motion = useMotionMode();
const checkFinished = ref(false);
const { start: holdCheckFinished, stop: stopHoldingCheck } = useTimeoutFn(
  () => {
    checkFinished.value = false;
  },
  LIQUID_DONE_HOLD_MS,
  { immediate: false },
);

const isFinished = computed(() => batchFinished.value || checkFinished.value);
const showsLiquid = computed(() => status.value === 'busy' || isFinished.value);

const iconName = computed(() => {
  if (someHaveError.value) return 'mmm-cloud-error';
  return showsLiquid.value && !isFinished.value
    ? 'mmm-cloud'
    : 'mmm-cloud-done';
});

watch(status, (now, before) => {
  if (now === 'busy') {
    stopHoldingCheck();
    checkFinished.value = false;
    return;
  }
  // Failing (or going offline) isn't finishing, and a batch shows its own.
  if (before !== 'busy' || now !== 'normal' || batchIsActive.value) return;
  if (motion.value === 'still') return;
  checkFinished.value = true;
  holdCheckFinished();
});
</script>
