<template>
  <q-btn
    class="super-rounded"
    :class="classes"
    :color="color"
    rounded
    :text-color="textColor"
    unelevated
    @click="downloadPopup = !downloadPopup"
  >
    <q-spinner v-if="busy" size="sm" />
    <q-icon
      v-else
      :name="someHaveError ? 'mmm-cloud-error' : 'mmm-cloud-done'"
    />
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
import { storeToRefs } from 'pinia';
import {
  type IslandButtonStatus,
  useIslandButton,
} from 'src/composables/useIslandButton';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getDateDiff } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onMounted } from 'vue';
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
  updateOnline();
}, 10000);

onMounted(() => {
  updateOnline();
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
</script>
