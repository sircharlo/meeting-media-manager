<template>
  <q-btn
    class="download-status super-rounded"
    :class="[
      classes,
      {
        'download-status--finished': batchFinished,
        'liquid-host': showsLiquid,
      },
    ]"
    :color="color"
    rounded
    :text-color="textColor"
    unelevated
    @click="downloadPopup = !downloadPopup"
  >
    <!-- Downloads with a known size fill the button like a glass; before
         there are any (checking the meeting dates), its liquid sloshes. -->
    <LiquidFill
      v-if="showsLiquid"
      :key="batchNumber"
      axis="y"
      :clip-id="inkClipId"
      :done="batchFinished"
      :percent="batchPercent"
      :scale="0.35"
      :sloshing="!batchIsActive"
    />
    <LiquidSpinner v-if="busy && !showsLiquid" size="sm" />
    <q-icon v-else :class="{ 'mmm-pop-in': batchFinished }" :name="iconName" />
    <!-- The same icon again, in another color, where the liquid covers it. -->
    <span
      v-if="showsLiquid"
      aria-hidden="true"
      class="download-status__ink"
      :style="{ clipPath: `url(#${inkClipId})` }"
    >
      <q-icon :class="{ 'mmm-pop-in': batchFinished }" :name="iconName" />
    </span>
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

import { useIntervalFn } from '@vueuse/core';
import LiquidFill from 'components/ui/LiquidFill.vue';
import LiquidSpinner from 'components/ui/LiquidSpinner.vue';
import { storeToRefs } from 'pinia';
import { useDownloadBatch } from 'src/composables/useDownloadBatch';
import {
  type IslandButtonStatus,
  useIslandButton,
} from 'src/composables/useIslandButton';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getDateDiff } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onMounted, useId } from 'vue';
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

const { busy, classes, color, textColor } = useIslandButton(
  status,
  downloadPopup,
);

const {
  batchNumber,
  isActive: batchIsActive,
  isFinished: batchFinished,
  percent: batchPercent,
} = useDownloadBatch();
const inkClipId = `download-status-ink-${useId()}`;

// Not while its popup is open: the button turns white then, and the popup
// shows the progress itself.
const showsLiquid = computed(
  () =>
    !downloadPopup.value &&
    (status.value === 'busy' || (batchIsActive.value && batchFinished.value)),
);

const iconName = computed(() => {
  if (someHaveError.value) return 'mmm-cloud-error';
  return showsLiquid.value && !batchFinished.value
    ? 'mmm-cloud'
    : 'mmm-cloud-done';
});
</script>

<style lang="scss" scoped>
// White liquid on the island's blue, with the icon turning blue under it.
.download-status {
  --liquid-back: rgba(255, 255, 255, 0.5);
  --liquid-back-done: rgba(33, 186, 69, 0.6);
  --liquid-bubble: rgba(48, 117, 242, 0.55);
  --liquid-front: rgba(255, 255, 255, 0.95);
  --liquid-front-done: #{$positive};
}

.download-status__ink {
  align-items: center;
  color: $primary;
  display: flex;
  inset: 0;
  justify-content: center;
  pointer-events: none;
  position: absolute;
  transition: color 0.3s ease;
}

.download-status--finished .download-status__ink {
  color: white;
}
</style>
