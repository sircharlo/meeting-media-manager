<template>
  <q-menu
    ref="downloadPopup"
    v-model="open"
    anchor="bottom middle"
    no-parent-event
    :offset="[0, 8]"
    self="top middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div class="action-popup flex q-py-md" style="flex-flow: column">
      <div class="card-title row q-px-md q-mb-none items-center">
        <div class="col">
          {{ t('media-sync') }}
        </div>
        <div class="col-shrink">
          <q-btn
            color="negative"
            :disable="refreshDisabled || refreshing"
            icon="mmm-reset"
            :label="t('refresh-all-meeting-media')"
            :loading="refreshing"
            outline
            size="sm"
            @click="onRefreshMeetingMedia"
          >
            <q-tooltip>{{ t('refresh-all-meeting-media') }}</q-tooltip>
          </q-btn>
        </div>
      </div>
      <div class="col overflow-auto q-col-gutter-y-sm">
        <template v-if="Object.values(downloadProgress).length === 0">
          <div class="row flex-center q-px-md row">
            <div class="col ellipsis text-weight-medium text-dark-grey">
              {{ t('noDownloadsInProgress') }}
            </div>
            <div class="col-shrink">
              <q-icon color="positive" name="mmm-cloud-done" size="sm" />
            </div>
          </div>
        </template>
        <template v-else>
          <template
            v-for="statusObject in statusConfig"
            :key="statusObject.status"
          >
            <p
              v-if="hasStatus(downloadProgress, statusObject.status)"
              class="card-section-title text-dark-grey row q-px-md"
            >
              {{ t(statusObject.label) }}
            </p>
            <template
              v-for="(item, id) in filteredDownloads(statusObject.status)"
              :key="id"
            >
              <div class="row flex-center q-px-md row">
                <div class="col ellipsis text-weight-medium text-dark-grey">
                  {{ getBasename(item.filename) }}
                </div>
                <div class="col-shrink">
                  <q-icon
                    v-if="statusObject.icon"
                    :color="statusColor(statusObject.status)"
                    :name="statusObject.icon"
                    size="sm"
                  >
                    <q-tooltip v-if="statusObject.status === 'error'">
                      {{ t('errorDownloadingMeetingMedia') }}.
                      {{ t('tryConfiguringFallbackLanguage') }}.
                    </q-tooltip>
                  </q-icon>
                  <q-circular-progress
                    v-else-if="showProgress(item)"
                    color="primary"
                    size="sm"
                    :thickness="0.3"
                    :value="progressValue(item)"
                  />
                </div>
              </div>
              <div class="row q-px-md">
                <q-separator
                  v-if="
                    Object.keys(filteredDownloads(statusObject.status) || {})
                      ?.length > 1 &&
                    id <
                      Object.keys(filteredDownloads(statusObject.status) || {})
                        ?.length -
                        1
                  "
                  class="bg-accent-200"
                />
              </div>
            </template>
          </template>
        </template>
      </div>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import type { QMenu } from 'quasar';
import type { DownloadProgressItems } from 'src/types';

import { watchImmediate } from '@vueuse/core';
import { queues } from 'boot/globals';
import { storeToRefs } from 'pinia';
import { SORTER } from 'src/constants/general';
import { fetchMedia } from 'src/helpers/jw-media';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { path } = window.electronApi;
const { basename } = path;

const open = defineModel<boolean>({ default: false });

const currentState = useCurrentStateStore();
const jwStore = useJwStore();
const { downloadProgress } = storeToRefs(currentState);

const getBasename = (filename: string) => {
  if (!filename) return '';
  return basename(filename);
};

const filteredDownloads = (status: 'complete' | 'error' | 'loaded') =>
  Object.entries(downloadProgress.value || {})
    .filter(([, item]) => item[status])
    .sort((a, b) => SORTER.compare(a[1].filename, b[1].filename))
    .map(([, item]) => item);

const downloadPopup = useTemplateRef<QMenu>('downloadPopup');

watchImmediate(
  () => [
    filteredDownloads('complete').length,
    filteredDownloads('error').length,
    filteredDownloads('loaded').length,
  ],
  () => {
    if (downloadPopup.value) {
      setTimeout(() => {
        if (downloadPopup.value) downloadPopup.value.updatePosition();
      }, 10);
    }
  },
);

const hasStatus = (
  obj: DownloadProgressItems,
  status: 'complete' | 'error' | 'loaded',
) => Object.values(obj).some((item) => item[status]);

const progressValue = (item: { loaded?: number; total?: number }) =>
  item.loaded && item.total ? (item.loaded / item.total) * 100 : 0;

const showProgress = (item: { loaded?: number; total?: number }) =>
  item.loaded && item.total;

const statusColor = (status: string) =>
  status === 'complete' ? 'positive' : 'negative';

const statusConfig: {
  icon: string;
  label: string;
  status: 'complete' | 'error' | 'loaded';
}[] = [
  { icon: '', label: 'inProgress', status: 'loaded' },
  { icon: 'mmm-error', label: 'errors', status: 'error' },
  { icon: 'mmm-cloud-done', label: 'complete', status: 'complete' },
];

// Refresh button state and handler
const refreshing = ref(false);

const fetchIsRunning = computed(() => {
  try {
    const q = queues.meetings[currentState.currentCongregation];
    const size = q?.size || 0;
    const pending = q?.pending || 0;
    return size > 0 || pending > 0;
  } catch {
    return false;
  }
});

const hasActiveDownloads = computed(() =>
  hasStatus(downloadProgress.value, 'loaded'),
);

const refreshDisabled = computed(() => {
  return (
    hasActiveDownloads.value ||
    currentState.mediaIsPlaying ||
    fetchIsRunning.value
  );
});

const onRefreshMeetingMedia = async () => {
  if (refreshDisabled.value) return;
  try {
    refreshing.value = true;

    // 1) Clear all dynamic media from meeting days in lookupPeriod for current congregation
    const congregation = currentState.currentCongregation;
    const period = jwStore.lookupPeriod[congregation] || [];
    for (const day of period) {
      if (!day?.mediaSections || !day.meeting) continue;
      day.complete = false;
      day.error = false;
      for (const section of day.mediaSections) {
        if (!section?.items) continue;
        section.items = section.items.filter(
          (item) => item.source !== 'dynamic',
        );
      }
    }

    // 2) Fetch media
    await fetchMedia();
  } finally {
    refreshing.value = false;
  }
};
</script>
