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
          <q-list class="full-width" dense>
            <q-expansion-item
              v-for="(group, dateKey) in groupedByDate"
              :key="dateKey"
              :caption="getStatusCaption(dateKey)"
              dense-toggle
              expand-separator
              :icon="getStatusIcon(dateKey)"
              :icon-color="getStatusColor(dateKey)"
              :label="
                getLocalDate(dateKey, dateLocale) ||
                dateKey ||
                t('unknown-date')
              "
              :model-value="expandedDates.has(dateKey)"
              @update:model-value="
                (expanded) => handleExpansionToggle(dateKey, expanded)
              "
            >
              <template #header>
                <div class="row items-center full-width">
                  <div class="col">
                    <q-item-section>
                      <q-item-label>{{
                        getLocalDate(dateKey, dateLocale) ||
                        dateKey ||
                        t('unknown-date')
                      }}</q-item-label>
                      <q-item-label caption>{{
                        getStatusCaption(dateKey)
                      }}</q-item-label>
                    </q-item-section>
                  </div>
                  <div class="col-shrink">
                    <q-btn
                      class="q-mr-sm"
                      color="primary"
                      flat
                      icon="mmm-arrow-outward"
                      round
                      size="xs"
                      @click.stop="navigateToDate(dateKey)"
                    />
                  </div>
                </div>
              </template>

              <q-list class="full-width q-px-lg" dense>
                <q-item v-for="(item, id) in group" :key="id" dense>
                  <q-item-section>
                    <q-item-label class="text-weight-medium text-dark-grey">
                      {{ getBasename(item.filename) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon
                      v-if="item.error"
                      color="negative"
                      name="mmm-error"
                      size="sm"
                    >
                      <q-tooltip>
                        {{ errorTooltipText(item) }}
                      </q-tooltip>
                    </q-icon>
                    <q-icon
                      v-else-if="item.complete"
                      color="positive"
                      name="mmm-cloud-done"
                      size="sm"
                    />
                    <q-circular-progress
                      v-else-if="showProgress(item)"
                      color="primary"
                      size="sm"
                      :thickness="0.3"
                      :value="progressValue(item)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </q-list>
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
import { dateFromString, getDateDiff, getLocalDate } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, ref, useTemplateRef, watch } from 'vue';
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

const filteredDownloads = () =>
  Object.entries(downloadProgress.value || {})
    .sort((a, b) => SORTER.compare(a[1].filename, b[1].filename))
    .map(([, item]) => item);

const { dateLocale } = useLocale();

const groupedByDate = computed(() => {
  const items = filteredDownloads();
  return items.reduce(
    (acc, item) => {
      const key = item.meetingDate || '';
      if (!acc[key]) acc[key] = [] as typeof items;
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, typeof items>,
  );
});

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

// Track expansion state for each date group
const expandedDates = ref<Set<string>>(new Set());

// Initialize expansion state based on current download status
const initializeExpansionState = () => {
  const newExpandedDates = new Set<string>();
  Object.keys(groupedByDate.value).forEach((dateKey) => {
    if (shouldAutoOpen(dateKey)) {
      newExpandedDates.add(dateKey);
    }
  });
  expandedDates.value = newExpandedDates;
};

// Watch for changes in download progress and update expansion states
watch(
  () => Object.keys(downloadProgress.value || {}).length,
  () => {
    const newExpandedDates = new Set<string>();
    Object.keys(groupedByDate.value).forEach((dateKey) => {
      const status = getDateStatus(dateKey);
      const wasExpanded = expandedDates.value.has(dateKey);

      // Auto-open if loading or error, auto-close if all complete
      const shouldExpand =
        status === 'loading' ||
        (status === 'error' &&
          getDateDiff(dateFromString(dateKey), new Date(), 'days') <= 7) ||
        (status === 'complete' && wasExpanded);

      if (shouldExpand) {
        newExpandedDates.add(dateKey);
      }
    });
    expandedDates.value = newExpandedDates;
  },
  { deep: true },
);

// Handle expansion toggle with position update
const handleExpansionToggle = (dateKey: string, expanded: boolean) => {
  if (expanded) {
    expandedDates.value.add(dateKey);
  } else {
    expandedDates.value.delete(dateKey);
  }

  // Update popup position after animation completes
  setTimeout(() => {
    if (downloadPopup.value) {
      downloadPopup.value.updatePosition();
    }
  }, 300); // Allow time for expansion animation
};

// Initialize expansion state on component mount
watchImmediate(
  () => groupedByDate.value,
  () => {
    initializeExpansionState();
  },
);

watchImmediate(
  () => filteredDownloads().length,
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

// New functions for expansion item logic
const getDateStatus = (dateKey: string) => {
  const group = groupedByDate.value[dateKey];
  if (!group || group.length === 0) return 'none';

  const hasError = group.some((item) => item.error);
  const hasLoading = group.some((item) => !item.complete && !item.error);
  const allComplete = group.every((item) => item.complete);

  if (hasError) return 'error';
  if (hasLoading) return 'loading';
  if (allComplete) return 'complete';
  return 'none';
};

const shouldAutoOpen = (dateKey: string) => {
  const status = getDateStatus(dateKey);
  if (status === 'error') {
    return getDateDiff(dateFromString(dateKey), new Date(), 'days') < 7;
  }
  return status === 'loading';
};

const getStatusIcon = (dateKey: string) => {
  const status = getDateStatus(dateKey);
  switch (status) {
    case 'complete':
      return 'mmm-cloud-done';
    case 'error':
      return 'mmm-error';
    case 'loading':
      return 'mmm-download';
    default:
      return 'mmm-calendar';
  }
};

const getStatusColor = (dateKey: string) => {
  const status = getDateStatus(dateKey);
  switch (status) {
    case 'complete':
      return 'positive';
    case 'error':
      return 'negative';
    case 'loading':
      return 'primary';
    default:
      return 'grey';
  }
};

const getStatusCaption = (dateKey: string) => {
  const group = groupedByDate.value[dateKey];
  if (!group) return '';

  const total = group.length;
  const complete = group.filter((item) => item.complete).length;
  const error = group.filter((item) => item.error).length;
  const loading = total - complete - error;

  if (loading > 0) return `${t('loading')}`;
  if (error > 0) return `${t('failed')} (${error})`;
  if (complete === total) return `${t('completed')}`;
  return `${total} ${t('items')}`;
};

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
