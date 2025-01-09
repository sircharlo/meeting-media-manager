<template>
  <q-btn
    class="super-rounded position-relative"
    :color="downloadPopup ? 'white' : online ? 'white-transparent' : 'negative'"
    rounded
    :text-color="downloadPopup ? (online ? 'primary' : 'negative') : ''"
    unelevated
    @click="downloadPopup = !downloadPopup"
  >
    <template v-if="someAreLoading && !someHaveError">
      <q-icon name="mmm-cloud" />
      <q-spinner
        class="absolute"
        :color="downloadPopup ? 'white' : 'primary'"
        size="8px"
        style="top: 14"
      />
    </template>
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
      {{ t('download-status') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import type { DownloadProgressItem } from 'src/types';

import isOnline from 'is-online';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

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

setInterval(() => {
  updateOnline();
}, 10000);

onMounted(() => {
  updateOnline();
});

const someHaveError = computed(() => {
  return Object.values(downloadProgress.value).some(
    (item: DownloadProgressItem) => item.error,
  );
});

const someAreLoading = computed(() => {
  return Object.values(downloadProgress.value).some(
    (item: DownloadProgressItem) =>
      !item.complete &&
      !item.error &&
      (!item.loaded || !item.total || item.loaded < item.total),
  );
});
</script>
