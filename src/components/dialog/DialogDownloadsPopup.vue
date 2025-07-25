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
      <div class="card-title row q-px-md q-mb-none">
        {{ t('media-sync') }}
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
import { storeToRefs } from 'pinia';
import { SORTER } from 'src/constants/general';
import { useCurrentStateStore } from 'stores/current-state';
import { useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { path } = window.electronApi;
const { basename } = path;

const open = defineModel<boolean>({ default: false });

const currentState = useCurrentStateStore();
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
</script>
