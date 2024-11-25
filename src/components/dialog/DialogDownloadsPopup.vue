<template>
  <q-menu
    ref="downloadPopup"
    v-model="open"
    anchor="bottom middle"
    class="custom-scroll"
    no-parent-event
    :offset="[0, 8]"
    self="top middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <q-card flat>
      <q-card-section class="q-px-none">
        <div class="card-title q-px-md">
          {{ $t('media-sync') }}
        </div>
        <div>
          <template v-if="Object.values(downloadProgress).length === 0">
            <div class="row items-center q-px-md">
              <div class="col text-weight-medium text-dark-grey">
                {{ $t('noDownloadsInProgress') }}
              </div>
              <div class="col-shrink">
                <q-icon color="positive" name="mmm-cloud-done" size="sm" />
              </div>
            </div>
          </template>
          <div v-else class="custom-scroll" style="max-height: 40vh">
            <template
              v-for="statusObject in statusConfig"
              :key="statusObject.status"
            >
              <p
                v-if="hasStatus(downloadProgress, statusObject.status)"
                class="card-section-title text-dark-grey q-mt-md q-px-md"
              >
                {{ $t(statusObject.label) }}
              </p>
              <template
                v-for="(item, id) in filteredDownloads(statusObject.status)"
                :key="id"
              >
                <div class="row items-center q-py-sm q-px-md">
                  <div class="col text-weight-medium text-dark-grey">
                    {{ item.filename && path.basename(item.filename) }}
                  </div>
                  <div class="col-shrink">
                    <q-icon
                      v-if="statusObject.icon"
                      :color="statusColor(statusObject.status)"
                      :name="statusObject.icon"
                      size="sm"
                    >
                      <q-tooltip v-if="statusObject.status === 'error'">
                        {{ $t('errorDownloadingMeetingMedia') }}.
                        {{ $t('tryConfiguringFallbackLanguage') }}.
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
                <q-separator
                  v-if="
                    Object.keys(filteredDownloads(statusObject.status) || {})
                      ?.length > 1
                  "
                  class="bg-accent-200"
                />
              </template>
            </template>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-menu>
</template>

<script setup lang="ts">
import type { QMenu } from 'quasar';
import type { DownloadProgressItems } from 'src/types';

import { watchImmediate } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { sorter } from 'src/helpers/general';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useTemplateRef } from 'vue';

const { path } = window.electronApi;

const open = defineModel<boolean>({ default: false });

const currentState = useCurrentStateStore();
const { downloadProgress } = storeToRefs(currentState);

const filteredDownloads = (status: 'complete' | 'error' | 'loaded') =>
  Object.entries(downloadProgress.value || {})
    .filter(([, item]) => item[status])
    .sort((a, b) => sorter.compare(a[1].filename, b[1].filename))
    .map(([, item]) => item);

const downloadPopup = useTemplateRef<QMenu>('downloadPopup');

watchImmediate(
  () => filteredDownloads,
  () => {
    if (downloadPopup.value) {
      const intervalId = setInterval(() => {
        if (downloadPopup.value) downloadPopup.value.updatePosition();
      }, 10);
      setTimeout(() => {
        clearInterval(intervalId);
      }, 2000);
    }
  },
  { deep: true },
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
</script>
