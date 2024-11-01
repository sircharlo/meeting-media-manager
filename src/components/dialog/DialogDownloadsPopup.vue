<template>
  <q-menu
    ref="downloadPopup"
    v-model="open"
    :offset="[0, 8]"
    anchor="bottom middle"
    no-parent-event
    self="top middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <q-card flat>
      <q-card-section>
        <div class="card-title">
          {{ $t('media-sync') }}
        </div>
        <div>
          <template v-if="Object.values(downloadProgress).length === 0">
            <div class="row items-center">
              <div class="col text-weight-medium text-dark-grey">
                {{ $t('noDownloadsInProgress') }}
              </div>
              <div class="col-shrink">
                <q-icon color="positive" name="mmm-cloud-done" size="sm" />
              </div>
            </div>
          </template>
          <template v-else>
            <q-scroll-area
              :bar-style="barStyle"
              :thumb-style="thumbStyle"
              style="height: 40vh; width: -webkit-fill-available"
            >
              <template
                v-for="statusObject in statusConfig"
                :key="statusObject.status"
              >
                <p
                  v-if="hasStatus(downloadProgress, statusObject.status)"
                  class="card-section-title text-dark-grey q-mt-md"
                >
                  {{ $t(statusObject.label) }}
                </p>
                <template
                  v-for="(item, url) in filteredDownloads(
                    downloadProgress,
                    statusObject.status,
                  )"
                  :key="url"
                >
                  <div class="row items-center q-py-sm">
                    <div class="col text-weight-medium text-dark-grey">
                      {{ url && path.basename(url as string) }}
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
                        :thickness="0.3"
                        :value="progressValue(item)"
                        color="primary"
                        size="sm"
                      />
                    </div>
                  </div>
                  <q-separator
                    v-if="
                      Object.keys(
                        filteredDownloads(
                          downloadProgress,
                          statusObject.status,
                        ) || {},
                      )?.length > 1
                    "
                    class="bg-accent-200"
                  />
                </template>
              </template>
            </q-scroll-area>
          </template>
        </div>
      </q-card-section>
    </q-card>
  </q-menu>
</template>

<script setup lang="ts">
import type { DownloadProgressItems } from 'src/types/media';

import { storeToRefs } from 'pinia';
import { QMenu } from 'quasar';
import { useScrollbar } from 'src/composables/useScrollbar';
import { useCurrentStateStore } from 'src/stores/current-state';
import { ref, watch } from 'vue';

const { path } = window.electronApi;

const open = defineModel<boolean>({ default: false });

const { barStyle, thumbStyle } = useScrollbar();
const currentState = useCurrentStateStore();
const { downloadProgress } = storeToRefs(currentState);

const filteredDownloads = (
  obj: DownloadProgressItems,
  status: 'complete' | 'error' | 'loaded',
): DownloadProgressItems =>
  Object.fromEntries(
    Object.entries(obj)
      .filter(([, item]) => item[status])
      .sort(([keyA], [keyB]) =>
        path.basename(keyA).localeCompare(path.basename(keyB)),
      ),
  );

const downloadPopup = ref<QMenu>();

watch(
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
  { deep: true, immediate: true },
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

const statusConfig = [
  { icon: '', label: 'inProgress', status: 'loaded' },
  { icon: 'mmm-error', label: 'errors', status: 'error' },
  { icon: 'mmm-cloud-done', label: 'complete', status: 'complete' },
] as { icon: string; label: string; status: 'complete' | 'error' | 'loaded' }[];
</script>
