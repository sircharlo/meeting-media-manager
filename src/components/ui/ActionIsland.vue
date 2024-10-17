<template>
  <div id="actionIsland" class="flex" style="justify-content: center">
    <q-chip
      :ripple="false"
      class="action-island"
      color="primary"
      rounded
      size="xl"
    >
      <div class="flex q-gutter-x-md">
        <DownloadStatus
          :download="downloadPopup"
          @update:download="downloadPopup = $event"
        />
        <q-separator class="bg-semi-white-24" vertical />
        <MusicButton />
        <SubtitlesButton />
        <ObsStatus />
        <MediaDisplayButton />
      </div>
    </q-chip>
    <q-dialog v-model="downloadPopup" position="bottom">
      <q-card flat>
        <q-card-section>
          <div class="card-title">
            {{ $t('media-sync') }}
          </div>
          <q-slide-transition>
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
              </template>
            </div>
          </q-slide-transition>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import type { DownloadProgressItems } from 'src/types';

import { storeToRefs } from 'pinia';
import DownloadStatus from 'src/components/media/DownloadStatus.vue';
import MediaDisplayButton from 'src/components/media/MediaDisplayButton.vue';
import MusicButton from 'src/components/media/MusicButton.vue';
import ObsStatus from 'src/components/media/ObsStatus.vue';
import SubtitlesButton from 'src/components/media/SubtitlesButton.vue';
import { electronApi } from 'src/helpers/electron-api';
import { useCurrentStateStore } from 'src/stores/current-state';
import { ref } from 'vue';

const { path } = electronApi;
const currentState = useCurrentStateStore();
const { downloadProgress } = storeToRefs(currentState);
const downloadPopup = ref(false);

const filteredDownloads = (
  obj: DownloadProgressItems,
  status: 'complete' | 'error' | 'loaded',
) =>
  Object.fromEntries(
    Object.entries(obj)
      .filter(([, item]) => item[status])
      .sort(([keyA], [keyB]) =>
        path.basename(keyA).localeCompare(path.basename(keyB)),
      ),
  ) as DownloadProgressItems;

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
