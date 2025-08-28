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
            :disable="refreshing"
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
              v-for="(group, dateKey) in groupedByDate(statusObject.status)"
              :key="dateKey"
            >
              <div class="row items-center q-px-md q-pt-xs q-pb-xs">
                <div class="col-auto">
                  <span class="text-subtitle2">
                    {{
                      getLocalDate(dateKey, dateLocale) ||
                      dateKey ||
                      t('unknown-date')
                    }}
                  </span>
                  <q-btn
                    class="q-ml-xs"
                    color="primary"
                    flat
                    icon="mmm-arrow-outward"
                    round
                    size="xs"
                    @click="navigateToDate(dateKey)"
                  />
                </div>
              </div>

              <template v-for="(item, id) in group" :key="id">
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
                        {{ errorTooltipText(item) }}
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
                  <q-separator class="bg-accent-200" />
                </div>
              </template>
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
import { useLocale } from 'src/composables/useLocale';
import { SORTER } from 'src/constants/general';
import { fetchMedia } from 'src/helpers/jw-media';
import { getDateDiff, getLocalDate } from 'src/utils/date';
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

const { dateLocale } = useLocale();

const groupedByDate = (
  status: 'complete' | 'error' | 'loaded',
): Record<string, ReturnType<typeof filteredDownloads>> => {
  const items = filteredDownloads(status);
  return items.reduce(
    (acc, item) => {
      const key = item.meetingDate || '';
      if (!acc[key]) acc[key] = [] as typeof items;
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, typeof items>,
  );
};

const navigateToDate = (dateKey?: string) => {
  if (!dateKey) return;
  if (!dateKey.includes('/')) {
    dateKey = dateKey.replace(/(\d{4})(\d{2})(\d{2})/, '$1/$2/$3');
  }
  currentState.selectedDate = dateKey;
};

const errorTooltipText = (item: { meetingDate?: string }) => {
  try {
    const dateKey = item.meetingDate;
    if (!dateKey)
      return `${t('errorDownloadingMeetingMedia')}. ${t('tryConfiguringFallbackLanguage')}.`;
    const daysUntil = getDateDiff(dateKey, new Date(), 'days');
    if (daysUntil > 7) {
      return `${t('errorDownloadingMeetingMedia')}. This media may become available later.`;
    }
    return `${t('errorDownloadingMeetingMedia')}. ${t('tryConfiguringFallbackLanguage')}.`;
  } catch {
    return `${t('errorDownloadingMeetingMedia')}. ${t('tryConfiguringFallbackLanguage')}.`;
  }
};

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
    return size > 0;
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
