<template>
  <q-page
    :class="
      !(
        sortableAdditionalMediaItems?.filter((m) => !m.hidden).length ||
        sortableWtMediaItems?.filter((m) => !m.hidden).length ||
        sortableTgwMediaItems?.filter((m) => !m.hidden).length ||
        sortableAyfmMediaItems?.filter((m) => !m.hidden).length ||
        sortableLacMediaItems?.filter((m) => !m.hidden).length ||
        sortableCircuitOverseerMediaItems?.filter((m) => !m.hidden).length
      )
        ? 'flex'
        : ''
    "
    padding
    @dragenter="dropActive"
    @dragover="dropActive"
    @dragstart="dropActive"
    @drop="dropEnd"
  >
    <div class="col">
      <div
        v-if="
          [...sortableAdditionalMediaItems, ...sortableMediaItems].some(
            (m) => m.hidden,
          )
        "
        class="row"
      >
        <q-banner
          class="bg-warning text-white full-width"
          inline-actions
          rounded
        >
          {{ t('some-media-items-are-hidden') }}
          <template #avatar>
            <q-avatar class="bg-white text-warning" size="lg">
              <q-icon name="mmm-file-hidden" size="sm" />
            </q-avatar>
          </template>
        </q-banner>
      </div>
      <div
        v-if="
          (currentSettings?.disableMediaFetching &&
            sortableAdditionalMediaItems?.filter((m) => !m.hidden).length <
              1) ||
          (!currentSettings?.disableMediaFetching &&
            ((selectedDateObject?.meeting && !selectedDateObject?.complete) ||
              !(
                sortableAdditionalMediaItems?.filter((m) => !m.hidden).length ||
                sortableWtMediaItems?.filter((m) => !m.hidden).length ||
                sortableTgwMediaItems?.filter((m) => !m.hidden).length ||
                sortableAyfmMediaItems?.filter((m) => !m.hidden).length ||
                sortableLacMediaItems?.filter((m) => !m.hidden).length ||
                sortableCircuitOverseerMediaItems?.filter((m) => !m.hidden)
                  .length
              )))
        "
        class="row"
      >
        <div class="col content-center q-py-xl">
          <div
            v-if="
              !currentSettings?.disableMediaFetching ||
              !sortableAdditionalMediaItems?.filter((m) => !m.hidden).length
            "
            class="row justify-center"
          >
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-my-lg">
                <q-spinner
                  v-if="
                    !currentSettings?.disableMediaFetching &&
                    selectedDateObject?.meeting &&
                    !selectedDateObject?.complete &&
                    !selectedDateObject?.error
                  "
                  color="primary"
                  size="lg"
                />
                <q-img
                  v-else
                  fit="contain"
                  src="~assets/img/no-media.svg"
                  style="max-height: 30vh"
                />
              </div>
              <div
                class="row items-center justify-center text-subtitle1 text-semibold"
              >
                {{
                  !selectedDate
                    ? t('noDateSelected')
                    : !currentSettings?.disableMediaFetching &&
                        selectedDateObject?.meeting &&
                        !selectedDateObject?.error
                      ? t('please-wait')
                      : t('there-are-no-media-items-for-the-selected-date')
                }}
              </div>
              <div class="row items-center justify-center text-center">
                {{
                  !selectedDate
                    ? t('select-a-date-to-begin')
                    : !currentSettings?.disableMediaFetching &&
                        selectedDateObject?.meeting &&
                        !selectedDateObject?.error
                      ? t('currently-loading')
                      : t(
                          'use-the-import-button-to-add-media-for-this-date-or-select-another-date-to-view-the-corresponding-meeting-media',
                        )
                }}
              </div>
              <div
                v-if="
                  currentSettings?.disableMediaFetching ||
                  !selectedDateObject?.meeting ||
                  selectedDateObject?.error
                "
                class="row items-center justify-center q-mt-lg q-gutter-md"
              >
                <q-btn color="primary" outline @click="goToNextDayWithMedia()">
                  <q-icon class="q-mr-sm" name="mmm-go-to-date" size="xs" />
                  {{ t('next-day-with-media') }}
                </q-btn>
                <q-btn
                  v-if="selectedDate"
                  color="primary"
                  @click="openImportMenu(undefined)"
                >
                  <q-icon class="q-mr-sm" name="mmm-add-media" size="xs" />
                  {{ t('add-extra-media') }}
                </q-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template
      v-for="mediaList in [
        {
          type: 'additional',
          label: t(
            selectedDateObject?.date && isWeMeetingDay(selectedDateObject.date)
              ? 'public-talk'
              : 'imported-media',
          ),
          mmmIcon:
            selectedDateObject?.date &&
            !isWeMeetingDay(selectedDateObject?.date)
              ? 'mmm-additional-media'
              : undefined,
          jwIcon:
            selectedDateObject?.date && isWeMeetingDay(selectedDateObject?.date)
              ? ''
              : undefined,
          items: sortableAdditionalMediaItems,
        },
        selectedDateObject?.date &&
          isWeMeetingDay(selectedDateObject?.date) && {
            type: 'wt',
            label: t('wt'),
            jwIcon: '',
            items: sortableWtMediaItems,
          },
        selectedDateObject?.date &&
          isMwMeetingDay(selectedDateObject?.date) && {
            type: 'tgw',
            label: t('tgw'),
            jwIcon: '',
            items: sortableTgwMediaItems,
          },
        selectedDateObject?.date &&
          isMwMeetingDay(selectedDateObject?.date) && {
            type: 'ayfm',
            label: t('ayfm'),
            jwIcon: '',
            items: sortableAyfmMediaItems,
          },
        selectedDateObject?.date &&
          isMwMeetingDay(selectedDateObject?.date) && {
            type: 'lac',
            label: t('lac'),
            jwIcon: '',
            items: sortableLacMediaItems,
          },
        selectedDateObject?.date &&
          isCoWeek(selectedDateObject?.date) && {
            type: 'circuit-overseer',
            label: t('circuit-overseer'),
            jwIcon: '',
            items: sortableCircuitOverseerMediaItems,
          },
      ].filter((m) => !!m)"
      :key="mediaList.items.map((m) => m.uniqueId).join(',')"
    >
      <q-list
        v-show="
          mediaList.items?.filter((m) => !m.hidden).length ||
          (selectedDateObject &&
            selectedDateObject.complete &&
            isWeMeetingDay(selectedDateObject?.date))
        "
        :class="'media-section ' + mediaList.type"
      >
        <q-item
          v-if="selectedDateObject"
          :class="'text-' + mediaList.type + ' items-center'"
        >
          <q-avatar
            :class="
              'text-white bg-' +
              mediaList.type +
              (mediaList.jwIcon ? ' jw-icon' : '')
            "
          >
            <!-- :size="isWeMeetingDay(selectedDateObject.date) ? 'lg' : 'md'" -->
            <template v-if="mediaList.jwIcon">
              {{ mediaList.jwIcon }}
            </template>
            <template v-else>
              <q-icon :name="mediaList.mmmIcon" size="md" />
            </template>
          </q-avatar>
          <q-item-section
            class="text-bold text-uppercase text-spaced row justify-between"
          >
            {{ mediaList.label }}
          </q-item-section>
          <q-item-section
            v-if="
              isWeMeetingDay(selectedDateObject.date) &&
              mediaList.type === 'additional' &&
              !mediaList.items?.filter(
                (m) => !m.hidden && m.source !== 'watched',
              ).length
            "
            side
          >
            <q-btn
              color="additional"
              icon="mmm-music-note"
              @click="addSong('additional')"
            >
              {{ t('add-an-opening-song') }}
            </q-btn>
          </q-item-section>
        </q-item>
        <div v-if="!mediaList.items.filter((m) => !m.hidden).length">
          <q-item>
            <q-item-section
              class="align-center text-secondary text-grey text-subtitle2"
            >
              <div class="row items-center">
                <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
                <span>{{
                  selectedDateObject && isWeMeetingDay(selectedDateObject?.date)
                    ? t('dont-forget-add-missing-media')
                    : t('no-media-files-for-section')
                }}</span>
              </div>
            </q-item-section>
          </q-item>
        </div>
        <Sortable
          item-key="uniqueId"
          :list="mediaList.items"
          :options="{ group: 'mediaLists' }"
        >
          <template #item="{ element }: { element: DynamicMediaObject }">
            <q-expansion-item
              v-if="element.children"
              :key="element.uniqueId"
              class="draggable"
              header-class="bg-secondary text-white"
              :label="element.extractCaption"
            >
              <Sortable
                v-if="element.children"
                item-key="uniqueId"
                :list="element.children"
              >
                <template #item="{ element }: { element: DynamicMediaObject }">
                  <div :key="element.uniqueId" class="draggable bg-info">
                    <MediaItem
                      :key="element.uniqueId"
                      v-model:repeat="element.repeat"
                      :media="element"
                      :play-state="playState(element.uniqueId)"
                      @update:custom-duration="
                        element.customDuration = JSON.parse($event) || undefined
                      "
                      @update:hidden="element.hidden = !!$event"
                      @update:tag="element.tag = $event"
                      @update:title="element.title = $event"
                    />
                  </div>
                </template>
              </Sortable>
            </q-expansion-item>
            <div v-else :key="element.fileUrl" class="draggable">
              <MediaItem
                :key="element.uniqueId"
                v-model:repeat="element.repeat"
                :media="element"
                :play-state="playState(element.uniqueId)"
                @update:custom-duration="
                  element.customDuration = JSON.parse($event) || undefined
                "
                @update:hidden="element.hidden = !!$event"
                @update:tag="element.tag = $event"
                @update:title="element.title = $event"
              />
            </div>
          </template>
        </Sortable>
      </q-list>
    </template>
    <!-- <q-list
      v-show="selectedDateObject?.complete && coWeek"
      class="media-section additional"
    >
      <q-item class="text-additional items-center">
        <q-avatar class="text-white bg-additional jw-icon" size="lg">
          
        </q-avatar>
        <q-item-section class="text-bold text-uppercase text-spaced col-grow">
          {{ t('circuit-overseer') }}
        </q-item-section>
        <q-item-section side>
          <q-btn
            class="add-media-shortcut"
            color="additional"
            :flat="
              !!sortableCircuitOverseerMediaItems.filter((m) => !m.hidden)
                .length
            "
            :icon="
              sortableCircuitOverseerMediaItems.filter((m) => !m.hidden).length
                ? 'mmm-add-media'
                : 'mmm-music-note'
            "
            :label="
              $q.screen.gt.xs
                ? t(
                    sortableCircuitOverseerMediaItems.filter((m) => !m.hidden)
                      .length
                      ? 'add-extra-media'
                      : 'add-a-closing-song',
                  )
                : undefined
            "
            @click="
              sortableCircuitOverseerMediaItems.filter((m) => !m.hidden).length
                ? openImportMenu('circuitOverseer')
                : addSong('circuitOverseer')
            "
          >
            <q-tooltip v-if="!$q.screen.gt.xs" :delay="1000">
              {{
                t(
                  sortableCircuitOverseerMediaItems.filter((m) => !m.hidden)
                    .length
                    ? 'add-extra-media'
                    : 'add-a-closing-song',
                )
              }}
            </q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
      <q-list ref="circuitOverseerList" class="list-droppable">
        <MediaItem
          v-for="media in sortableCircuitOverseerMediaItems"
          :key="media.uniqueId"
          v-model:repeat="media.repeat"
          :media="media"
          :play-state="playState(media.uniqueId)"
          @update:custom-duration="
            media.customDuration = JSON.parse($event) || undefined
          "
          @update:hidden="media.hidden = !!$event"
          @update:tag="media.tag = $event"
          @update:title="media.title = $event"
        />
        <div
          v-if="
            sortableCircuitOverseerMediaItems.filter((m) => !m.hidden)
              .length === 0
          "
        >
          <q-item>
            <q-item-section
              class="align-center text-secondary text-grey text-subtitle2"
            >
              <div class="row items-center">
                <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
                <span>{{ t('dont-forget-add-missing-media') }}</span>
              </div>
            </q-item-section>
          </q-item>
        </div>
      </q-list>
    </q-list> -->
  </q-page>
  <DragAndDropper
    v-model="dragging"
    v-model:jwpub-db="jwpubImportDb"
    v-model:jwpub-documents="jwpubImportDocuments"
    :current-file="currentFile"
    :section="sectionToAddTo"
    :total-files="totalFiles"
    @drop="dropEnd"
  />
</template>

<script setup lang="ts">
import type {
  DocumentItem,
  DynamicMediaObject,
  MediaSection,
  TableItem,
} from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  watchImmediate,
} from '@vueuse/core';
import { Buffer } from 'buffer';
import DOMPurify from 'dompurify';
import { storeToRefs } from 'pinia';
import { useMeta, useQuasar } from 'quasar';
import { Sortable } from 'sortablejs-vue3';
import DragAndDropper from 'src/components/media/DragAndDropper.vue';
import MediaItem from 'src/components/media/MediaItem.vue';
import { useLocale } from 'src/composables/useLocale';
import { SORTER } from 'src/constants/general';
import { isCoWeek, isMwMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addDayToExportQueue } from 'src/helpers/export-media';
import {
  addJwpubDocumentMediaToFiles,
  copyToDatedAdditionalMedia,
  downloadFileIfNeeded,
  fetchMedia,
} from 'src/helpers/jw-media';
import {
  decompressJwpub,
  getMediaFromJwPlaylist,
} from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { convertImageIfNeeded } from 'src/utils/converters';
import {
  dateFromString,
  formatDate,
  getDateDiff,
  getLocalDate,
  isInPast,
} from 'src/utils/date';
import { getPublicationDirectory, getTempPath } from 'src/utils/fs';
import { uuid } from 'src/utils/general';
import {
  getMetadataFromMediaPath,
  inferExtension,
  isArchive,
  isAudio,
  isImage,
  isImageString,
  isJwPlaylist,
  isJwpub,
  isPdf,
  isRemoteFile,
  isVideo,
} from 'src/utils/media';
import { sendObsSceneEvent } from 'src/utils/obs';
import { findDb, getPublicationInfoFromDb } from 'src/utils/sqlite';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const dragging = ref(false);
const jwpubImportDb = ref('');
const jwpubImportDocuments = ref<DocumentItem[]>([]);

const { dateLocale, t } = useLocale();
useMeta({ title: t('titles.meetingMedia') });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const $q = useQuasar();

watch(
  () => [jwpubImportDb.value, jwpubImportDocuments.value],
  ([newJwpubImportDb, newJwpubImportDocuments]) => {
    if (!!newJwpubImportDb || newJwpubImportDocuments?.length) {
      dragging.value = true;
    }
  },
);

const route = useRoute();
const router = useRouter();

const jwStore = useJwStore();
const { addToAdditionMediaMap } = jwStore;
const {
  lookupPeriod,
  missingMedia,
  urlVariables,
  // watchedMediaSections,
} = storeToRefs(jwStore);
const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  mediaPaused,
  mediaPlaying,
  mediaPlayingAction,
  mediaPlayingCurrentPosition,
  mediaPlayingPanzoom,
  mediaPlayingSubtitlesUrl,
  mediaPlayingUniqueId,
  mediaPlayingUrl,
  selectedDate,
  selectedDateObject,
  watchFolderMedia,
} = storeToRefs(currentState);
const { getDatedAdditionalMediaDirectory } = currentState;
const {
  convertPdfToImages,
  decompress,
  executeQuery,
  fs,
  getLocalPathFromFileObject,
  path,
  readdir,
} = window.electronApi;

const totalFiles = ref(0);
const currentFile = ref(0);

watch(
  () => mediaPlayingUniqueId.value,
  (newMediaUniqueId) => {
    if (newMediaUniqueId) lastPlayedMediaUniqueId.value = newMediaUniqueId;
  },
);

const { post: postMediaAction } = useBroadcastChannel<string, string>({
  name: 'media-action',
});

watch(
  () => mediaPlayingAction.value,
  (newAction, oldAction) => {
    if (newAction !== oldAction) postMediaAction(newAction);
  },
);

const { post: postSubtitlesUrl } = useBroadcastChannel<string, string>({
  name: 'subtitles-url',
});

watch(
  () => mediaPlayingSubtitlesUrl.value,
  (newSubtitlesUrl, oldSubtitlesUrl) => {
    if (newSubtitlesUrl !== oldSubtitlesUrl) postSubtitlesUrl(newSubtitlesUrl);
  },
);

const { post: postPanzoom } = useBroadcastChannel<
  Partial<Record<string, number>>,
  Partial<Record<string, number>>
>({ name: 'panzoom' });

watch(
  () => mediaPlayingPanzoom.value,
  (newPanzoom, oldPanzoom) => {
    try {
      if (JSON.stringify(newPanzoom) !== JSON.stringify(oldPanzoom)) {
        newPanzoom = JSON.parse(JSON.stringify(newPanzoom));
        postPanzoom(newPanzoom);
      }
    } catch (error) {
      errorCatcher(error);
    }
  },
  { deep: true },
);

watch(
  () => mediaPlayingUrl.value,
  (newUrl, oldUrl) => {
    if (newUrl !== oldUrl) {
      const { post: postMediaUrl } = useBroadcastChannel<string, string>({
        name: 'media-url',
      });
      postMediaUrl(newUrl);

      const customDuration =
        (
          lookupPeriod.value[currentCongregation.value]?.flatMap(
            (item) => item.dynamicMedia,
          ) ?? []
        )
          .concat(watchFolderMedia.value?.[selectedDate.value] ?? [])
          .find((item) => item.uniqueId === mediaPlayingUniqueId.value)
          ?.customDuration || undefined;
      if (customDuration) {
        const { post } = useBroadcastChannel<string, string>({
          name: 'custom-duration',
        });
        post(JSON.stringify(customDuration));
      }
    }
  },
);

const { data: mediaStateData } = useBroadcastChannel<
  'ended' | null,
  'ended' | null
>({
  name: 'media-state',
});

watch(
  () => mediaStateData.value,
  (newMediaStateData) => {
    if (newMediaStateData === 'ended') {
      mediaPlayingCurrentPosition.value = 0;
      mediaPlayingUrl.value = '';
      mediaPlayingUniqueId.value = '';
      mediaPlayingAction.value = '';
    }
    mediaStateData.value = null;
  },
);

const { data: currentTimeData } = useBroadcastChannel<number, number>({
  name: 'current-time',
});

watch(
  () => currentTimeData.value,
  (newCurrentTime) => {
    mediaPlayingCurrentPosition.value = newCurrentTime;
  },
);

// const stopScrolling = ref(true);
// const scroll = (step: number) => {
//   const el = document.querySelector('.q-page-container');
//   if (!el) return;
//   el.scrollBy(0, step);
//   if (!stopScrolling.value) {
//     setTimeout(() => scroll(step), 20);
//   }
// };

// const updateMediaSortPlugin: DNDPlugin = (parent) => {
//   const parentData = parents.get(parent);
//   if (!parentData) return;

//   const updateMediaSection = (id: string, section: MediaSection) => {
//     (selectedDateObject.value?.dynamicMedia ?? []).forEach((item) => {
//       if (item.uniqueId === id && item.section !== section) {
//         item.section = section;
//       }
//     });

//     const currentCong = currentCongregation.value;
//     const currentDate = selectedDate.value;
//     (additionalMediaMaps.value[currentCong]?.[currentDate] ?? []).forEach(
//       (item) => {
//         if (item.uniqueId === id && item.section !== section) {
//           item.section = section;
//         }
//       },
//     );
//     (watchFolderMedia.value?.[currentDate] ?? []).forEach((item) => {
//       if (item.uniqueId === id) {
//         watchedMediaSections.value[currentCong] ??= {};
//         watchedMediaSections.value[currentCong][currentDate] ??= {};
//         watchedMediaSections.value[currentCong][currentDate][id] = section;
//         if (item.section !== section) item.section = section;
//       }
//     });
//   };
//   function dragover(e: DragEvent) {
//     stopScrolling.value = true;
//     if (e.clientY < 200) {
//       stopScrolling.value = false;
//       scroll(-1);
//     } else if (window.innerHeight - e.clientY < 200) {
//       stopScrolling.value = false;
//       scroll(1);
//     }

//     for (const media of sortableAdditionalMediaItems.value) {
//       updateMediaSection(media.uniqueId, 'additional');
//     }
//     for (const media of sortableTgwMediaItems.value) {
//       updateMediaSection(media.uniqueId, 'tgw');
//     }
//     for (const media of sortableAyfmMediaItems.value) {
//       updateMediaSection(media.uniqueId, 'ayfm');
//     }
//     for (const media of sortableLacMediaItems.value) {
//       updateMediaSection(media.uniqueId, 'lac');
//     }
//     for (const media of sortableWtMediaItems.value) {
//       updateMediaSection(media.uniqueId, 'wt');
//     }
//     for (const media of sortableCircuitOverseerMediaItems.value) {
//       updateMediaSection(media.uniqueId, 'circuitOverseer');
//     }
//   }

//   function dragend() {
//     stopScrolling.value = true;
//     const currentCong = currentCongregation.value;
//     generateMediaList();
//     addDayToExportQueue(selectedDateObject.value?.date);
//   }

//   return {
//     setupNode(data) {
//       data.node.addEventListener('dragover', dragover, { passive: true });
//       data.node.addEventListener('dragend', dragend, { passive: true });
//     },
//     tearDownNode(data) {
//       data.node.removeEventListener('dragover', dragover);
//       data.node.removeEventListener('dragend', dragend);
//     },
//   };
// };

const sortableMediaItems = ref<DynamicMediaObject[]>([]);

const generateMediaList = () => {
  sortableMediaItems.value = [
    ...(selectedDateObject.value?.dynamicMedia ?? []),
    ...(watchFolderMedia.value?.[selectedDate.value] ?? []),
  ].filter(
    (item, index, self) =>
      !item.fileUrl ||
      index === self.findIndex((i) => i.fileUrl === item.fileUrl),
  );
};

watch(
  () => [
    selectedDateObject.value?.date,
    selectedDateObject.value?.dynamicMedia?.length,
    watchFolderMedia.value?.[selectedDate.value]?.length,
  ],
  (
    [
      newSelectedDate,
      newAdditionalMediaListLength,
      newDynamicMediaListLength,
      newWatchFolderMediaLength,
    ],
    [
      oldSelectedDate,
      oldAdditionalMediaListLength,
      oldDynamicMediaListLength,
      oldWatchFolderMediaLength,
    ],
  ) => {
    try {
      if (
        newSelectedDate !== oldSelectedDate ||
        newAdditionalMediaListLength !== oldAdditionalMediaListLength ||
        newDynamicMediaListLength !== oldDynamicMediaListLength ||
        newWatchFolderMediaLength !== oldWatchFolderMediaLength
      ) {
        generateMediaList();
      }
    } catch (e) {
      errorCatcher(e);
    }
  },
);

watch(
  () => [mediaPlaying.value, mediaPaused.value, mediaPlayingUrl.value],
  ([newMediaPlaying, newMediaPaused]) => {
    sendObsSceneEvent(
      newMediaPaused ? 'camera' : newMediaPlaying ? 'media' : 'camera',
    );
  },
);

const seenErrors = new Set();
watch(
  () =>
    lookupPeriod.value[currentCongregation.value]
      ?.filter((d) => d.error)
      .map((d) => formatDate(d.date, 'YYYY/MM/DD')),
  (errorVals) => {
    errorVals?.forEach((errorVal) => {
      const daysUntilError = getDateDiff(errorVal, new Date(), 'days');
      if (seenErrors.has(currentCongregation + errorVal) || daysUntilError > 7)
        return;
      createTemporaryNotification({
        caption: getLocalDate(errorVal, dateLocale.value),
        group: 'meetingMediaDownloadError',
        icon: 'mmm-error',
        message: t('errorDownloadingMeetingMedia'),
        timeout: 15000,
        type: 'negative',
      });
      seenErrors.add(currentCongregation + errorVal);
    });
  },
);

watch(
  () =>
    missingMedia.value
      .map((m) => m.fileUrl)
      .filter((f) => typeof f === 'string'),
  (missingFileUrls) => {
    missingFileUrls?.forEach((missingFileUrl) => {
      if (seenErrors.has(currentCongregation + missingFileUrl)) return;
      createTemporaryNotification({
        caption: t('some-media-items-are-missing-explain'),
        color: 'warning',
        group: 'missingMeetingMedia',
        icon: 'mmm-file-missing',
        message: t('some-media-items-are-missing'),
        timeout: 15000,
      });
      seenErrors.add(currentCongregation + missingFileUrl);
    });
  },
);

const goToNextDayWithMedia = () => {
  try {
    if (
      currentCongregation.value &&
      lookupPeriod.value?.[currentCongregation.value]
    ) {
      selectedDate.value =
        lookupPeriod.value?.[currentCongregation.value]
          ?.filter((day) => day.meeting || day.dynamicMedia.length > 0)
          .map((day) => day.date)
          .filter(Boolean)
          .filter((mediaDate) => !isInPast(dateFromString(mediaDate)))
          .map((mediaDate) => formatDate(mediaDate, 'YYYY/MM/DD'))
          .sort()[0] || '';
    }
  } catch (e) {
    errorCatcher(e);
  }
};

const coWeek = ref(false);

const checkCoDate = () => {
  if (
    !currentSettings.value ||
    currentSettings.value?.disableMediaFetching ||
    route.params?.typeOfLoad !== 'initial'
  )
    return;
  if (
    !currentSettings.value?.coWeek ||
    getDateDiff(new Date(), currentSettings.value?.coWeek, 'months') > 2
  ) {
    createTemporaryNotification({
      actions: [
        {
          color: 'white',
          label: t('remind-me-later'),
        },
        {
          color: 'white',
          handler: () => {
            router.push('/settings/coWeek');
          },
          label: t('go-to-settings'),
        },
      ],
      caption: t('dont-forget-to-add-circuit-overseer-date', {
        congregationMeetings: t('congregationMeetings'),
        settings: t('titles.settings'),
      }),
      color: 'primary',
      icon: 'mmm-error',
      message: t('no-circuit-overseer-date-set'),
      textColor: 'white',
      timeout: 30000,
    });
  }
};

const sectionToAddTo = ref<MediaSection | undefined>();

useEventListener<CustomEvent<{ section: MediaSection | undefined }>>(
  window,
  'openDragAndDropper',
  (e) => {
    resetDragging();
    sectionToAddTo.value = e.detail.section;
    dragging.value = true;
  },
  { passive: true },
);
useEventListener<
  CustomEvent<{
    files: { filename?: string; filetype?: string; path: string }[];
    section: MediaSection | undefined;
  }>
>(
  window,
  'localFiles-browsed',
  (event) => {
    sectionToAddTo.value = event.detail?.section;
    addToFiles(event.detail?.files ?? []).catch((error) => {
      errorCatcher(error);
    });
  },
  { passive: true },
);

watchImmediate(selectedDate, (newVal) => {
  try {
    if (!currentCongregation.value || !newVal) {
      return;
    }
    coWeek.value = isCoWeek(dateFromString(newVal));
  } catch (e) {
    errorCatcher(e);
  }
});

onMounted(() => {
  generateMediaList();
  goToNextDayWithMedia();

  // If no date with media is found, go to todays date
  if (!selectedDate.value) {
    selectedDate.value = formatDate(new Date(), 'YYYY/MM/DD');
  }

  sendObsSceneEvent('camera');
  if (urlVariables.value.base && urlVariables.value.mediator) {
    fetchMedia();
  } else {
    router.push('/settings');
  }
  checkCoDate();
});

watch(
  () => urlVariables.value.mediator,
  () => {
    fetchMedia();
  },
);

const sortableTgwMediaItems = ref<DynamicMediaObject[]>([]);

// const [tgwList, sortableTgwMediaItems] = useDragAndDrop<DynamicMediaObject>(
//   [],
//   {
//     group: 'sortableMedia',
//     plugins: [
//       updateMediaSortPlugin,
//       animations(),
//       multiDrag({
//         plugins: [selections({ selectedClass: 'selected-to-drag' })],
//       }),
//     ],
//   },
// );

const sortableAyfmMediaItems = ref<DynamicMediaObject[]>([]);

// const [ayfmList, sortableAyfmMediaItems] = useDragAndDrop<DynamicMediaObject>(
//   [],
//   {
//     group: 'sortableMedia',
//     plugins: [
//       updateMediaSortPlugin,
//       animations(),
//       multiDrag({
//         plugins: [selections({ selectedClass: 'selected-to-drag' })],
//       }),
//     ],
//   },
// );

const sortableLacMediaItems = ref<DynamicMediaObject[]>([]);

// const [lacList, sortableLacMediaItems] = useDragAndDrop<DynamicMediaObject>(
//   [],
//   {
//     group: 'sortableMedia',
//     plugins: [
//       updateMediaSortPlugin,
//       animations(),
//       multiDrag({
//         plugins: [selections({ selectedClass: 'selected-to-drag' })],
//       }),
//     ],
//   },
// );

const sortableWtMediaItems = ref<DynamicMediaObject[]>([]);

// const [wtList, sortableWtMediaItems] = useDragAndDrop<DynamicMediaObject>([], {
//   group: 'sortableMedia',
//   plugins: [
//     updateMediaSortPlugin,
//     animations(),
//     multiDrag({
//       plugins: [selections({ selectedClass: 'selected-to-drag' })],
//     }),
//   ],
// });

const sortableAdditionalMediaItems = ref<DynamicMediaObject[]>([]);

// const [additionalList, sortableAdditionalMediaItems] =
//   useDragAndDrop<DynamicMediaObject>([], {
//     group: 'sortableMedia',
//     plugins: [
//       updateMediaSortPlugin,
//       animations(),
//       multiDrag({
//         plugins: [selections({ selectedClass: 'selected-to-drag' })],
//       }),
//     ],
//   });

const sortableCircuitOverseerMediaItems = ref<DynamicMediaObject[]>([]);

// const [circuitOverseerList, sortableCircuitOverseerMediaItems] =
//   useDragAndDrop<DynamicMediaObject>([], {
//     group: 'sortableMedia',
//     plugins: [
//       updateMediaSortPlugin,
//       animations(),
//       multiDrag({
//         plugins: [selections({ selectedClass: 'selected-to-drag' })],
//       }),
//     ],
//   });

watchImmediate(
  () => sortableMediaItems.value,
  (newVal) => {
    sortableTgwMediaItems.value = newVal.filter((m) => m.section === 'tgw');
    sortableAyfmMediaItems.value = newVal.filter((m) => m.section === 'ayfm');
    sortableLacMediaItems.value = newVal.filter((m) => m.section === 'lac');
    sortableWtMediaItems.value = newVal.filter((m) => m.section === 'wt');
    sortableAdditionalMediaItems.value = newVal.filter(
      (m) => m.section === 'additional',
    );
    sortableCircuitOverseerMediaItems.value = newVal.filter(
      (m) => m.section === 'circuitOverseer',
    );
  },
  { deep: true },
);

const sortedMediaIds = computed(() => {
  return [
    ...sortableAdditionalMediaItems.value,
    ...sortableTgwMediaItems.value,
    ...sortableAyfmMediaItems.value,
    ...sortableLacMediaItems.value,
    ...sortableWtMediaItems.value,
    ...sortableCircuitOverseerMediaItems.value,
  ]
    .filter((m) => !m.hidden)
    .map((m) => m.uniqueId)
    .filter((uniqueId, index, self) => self.indexOf(uniqueId) === index);
});

const arraysAreIdentical = (a: string[], b: string[]) =>
  a.length === b.length && a.every((element, index) => element === b[index]);

const sortedMediaFileUrls = computed(() =>
  [...sortableAdditionalMediaItems.value, ...sortableMediaItems.value]
    .filter((m) => !m.hidden && !!m.fileUrl)
    .map((m) => m.fileUrl)
    .filter((m) => typeof m === 'string')
    .filter((fileUrl, index, self) => self.indexOf(fileUrl) === index),
);

watch(
  () => sortedMediaFileUrls.value,
  (newSortedMediaFileUrls, oldSortedMediaFileUrls) => {
    if (
      selectedDateObject.value?.date &&
      !arraysAreIdentical(newSortedMediaFileUrls, oldSortedMediaFileUrls)
    ) {
      try {
        addDayToExportQueue(selectedDateObject.value.date);
      } catch (e) {
        errorCatcher(e);
      }
    }
  },
);

const lastPlayedMediaUniqueId = ref<string>('');

const nextMediaUniqueId = computed(() => {
  if (!selectedDate.value) return '';
  if (!lastPlayedMediaUniqueId.value) return sortedMediaIds.value[0];
  const index = sortedMediaIds.value.indexOf(lastPlayedMediaUniqueId.value);
  if (index === -1) return sortedMediaIds.value[0];
  return sortedMediaIds.value[
    Math.min(index + 1, sortedMediaIds.value.length - 1)
  ];
});

const previousMediaUniqueId = computed(() => {
  if (!selectedDate.value) return '';
  if (!lastPlayedMediaUniqueId.value) return sortedMediaIds.value[0];
  const index = sortedMediaIds.value.indexOf(lastPlayedMediaUniqueId.value);
  if (index === -1) return sortedMediaIds.value[0];
  return sortedMediaIds.value[Math.max(index - 1, 0)];
});

const playState = (id: string) => {
  if (id === lastPlayedMediaUniqueId.value) return 'current';
  if (id === nextMediaUniqueId.value) return 'next';
  if (id === previousMediaUniqueId.value) return 'previous';
  return 'unknown';
};

const addToFiles = async (
  files: FileList | { filename?: string; filetype?: string; path: string }[],
) => {
  if (!files) return;
  totalFiles.value = files.length;
  if (!Array.isArray(files)) files = Array.from(files);
  if (files.length > 1) {
    const jwPubFile = files.find((f) => isJwpub(f.path));
    if (jwPubFile) {
      files = [jwPubFile];
      createTemporaryNotification({
        caption: t('jwpub-file-found'),
        message: t('processing') + ' ' + path.basename(files[0]?.path || ''),
      });
    }
    const archiveFile = files.find((f) => isArchive(f.path));
    if (archiveFile) {
      files = [archiveFile];
      createTemporaryNotification({
        caption: t('archive-file-found'),
        message: t('processing') + ' ' + path.basename(files[0]?.path || ''),
      });
    }
  }
  for (const file of files) {
    let filepath = file?.path;
    try {
      if (!filepath) continue;
      // Check if file is remote URL; if so, download it
      if (isRemoteFile(file)) {
        const baseFileName = path.basename(new URL(filepath).pathname);
        filepath = (
          await downloadFileIfNeeded({
            dir: await getTempPath(),
            filename: await inferExtension(
              file.filename || baseFileName,
              file.filetype,
            ),
            url: filepath,
          })
        ).path;
      } else if (isImageString(filepath)) {
        const [preamble, data] = filepath.split(';base64,');
        const ext = preamble?.split('/')[1];
        const tempFilename = uuid() + '.' + ext;
        const tempFilepath = path.join(await getTempPath(), tempFilename);
        await fs.writeFile(tempFilepath, Buffer.from(data ?? '', 'base64'));
        filepath = tempFilepath;
      }
      filepath = await convertImageIfNeeded(filepath);
      if (isImage(filepath)) {
        await copyToDatedAdditionalMedia(filepath, sectionToAddTo.value, true);
      } else if (isVideo(filepath) || isAudio(filepath)) {
        const detectedPubMediaInfo = path
          .parse(filepath)
          .name.split('_')
          .filter((item) => !/^r\d+P$/.test(item));
        const normalizeArray = (arr: (number | string)[]) =>
          arr.map((item) => {
            if (Number.isFinite(item)) return item;
            if (typeof item === 'string') return parseInt(item, 10).toString();
            return item;
          });
        const matchingMissingItem = missingMedia.value.find((media) => {
          return (
            JSON.stringify(normalizeArray(media.fileUrl?.split('_') || [])) ===
            JSON.stringify(normalizeArray(detectedPubMediaInfo))
          );
        });
        const destPath = await copyToDatedAdditionalMedia(
          filepath,
          sectionToAddTo.value,
          !matchingMissingItem,
        );
        if (matchingMissingItem) {
          const metadata = await getMetadataFromMediaPath(destPath);
          matchingMissingItem.fileUrl =
            window.electronApi.pathToFileURL(destPath);
          matchingMissingItem.duration = metadata.format.duration || 0;
          matchingMissingItem.title =
            metadata.common.title || window.electronApi.path.basename(destPath);
          matchingMissingItem.isVideo = isVideo(filepath);
          matchingMissingItem.isAudio = isAudio(filepath);
        }
      } else if (isPdf(filepath)) {
        const convertedImages = (
          await convertPdfToImages(filepath, await getTempPath())
        ).map((path) => {
          return { path };
        });
        // await addToFiles(convertedImages);
        files.push(...convertedImages);
      } else if (isJwpub(filepath)) {
        // First, only decompress the db in memory to get the publication info and derive the destination path
        const tempJwpubContents = await decompress(filepath);
        const tempContentFile = tempJwpubContents.find((tempJwpubContent) =>
          tempJwpubContent.path.endsWith('contents'),
        );
        if (!tempContentFile) return;
        const tempDir = await getTempPath();
        if (!tempDir) return;
        await fs.ensureDir(tempDir);
        const tempFilePath = path.join(
          tempDir,
          path.basename(filepath) + '-contents',
        );
        await fs.writeFile(tempFilePath, tempContentFile.data);
        const tempJwpubFileContents = await decompress(tempFilePath);
        const tempDbFile = tempJwpubFileContents.find((tempJwpubFileContent) =>
          tempJwpubFileContent.path.endsWith('.db'),
        );
        if (!tempDbFile) return;
        const tempDbFilePath = path.join(
          await getTempPath(),
          path.basename(filepath) + '.db',
        );
        await fs.writeFile(tempDbFilePath, tempDbFile.data);
        fs.remove(tempFilePath);
        if (!(await fs.exists(tempDbFilePath))) return;
        const publication = getPublicationInfoFromDb(tempDbFilePath);
        const publicationDirectory = await getPublicationDirectory(
          publication,
          currentState.currentSettings?.cacheFolder,
        );
        if (!publicationDirectory) return;
        const unzipDir = await decompressJwpub(filepath, publicationDirectory);
        const db = await findDb(unzipDir);
        if (!db) return;
        jwpubImportDb.value = db;
        if (executeQuery(db, 'SELECT * FROM Multimedia;').length === 0) {
          createTemporaryNotification({
            caption: path.basename(filepath),
            icon: 'mmm-jwpub',
            message: t('jwpubNoMultimedia'),
            type: 'warning',
          });
          jwpubImportDb.value = '';
        } else {
          const documentMultimediaTableExists =
            executeQuery<TableItem>(
              db,
              'PRAGMA table_info(DocumentMultimedia);',
            ).length > 0;
          const mmTable = documentMultimediaTableExists
            ? 'DocumentMultimedia'
            : 'Multimedia';
          jwpubImportDocuments.value = executeQuery<DocumentItem>(
            db,
            `SELECT DISTINCT Document.DocumentId, Title FROM Document JOIN ${mmTable} ON Document.DocumentId = ${mmTable}.DocumentId;`,
          );
          if (
            jwpubImportDocuments.value.length === 1 &&
            jwpubImportDocuments.value[0]
          ) {
            await addJwpubDocumentMediaToFiles(
              jwpubImportDb.value,
              jwpubImportDocuments.value[0],
              sectionToAddTo.value,
            );
            jwpubImportDb.value = '';
            jwpubImportDocuments.value = [];
            resetDragging();
          }
        }
      } else if (isJwPlaylist(filepath) && selectedDateObject.value) {
        const additionalMedia = await getMediaFromJwPlaylist(
          filepath,
          selectedDateObject.value?.date,
          await getDatedAdditionalMediaDirectory(),
        ).catch((error) => {
          throw error;
        });
        addToAdditionMediaMap(additionalMedia, sectionToAddTo.value);
        additionalMedia.filter(
          (m) =>
            m.customDuration && (m.customDuration.max || m.customDuration.min),
        );
      } else if (isArchive(filepath)) {
        const unzipDirectory = path.join(
          await getTempPath(),
          path.basename(filepath),
        );
        await fs.remove(unzipDirectory);
        await decompress(filepath, unzipDirectory).catch((error) => {
          throw error;
        });
        const files = await readdir(unzipDirectory);
        const filePaths = files.map((file) => ({
          path: path.join(unzipDirectory, file.name),
        }));
        await addToFiles(filePaths);
        await fs.remove(unzipDirectory);
      } else {
        createTemporaryNotification({
          caption: filepath ? path.basename(filepath) : filepath,
          icon: 'mmm-local-media',
          message: t('filetypeNotSupported'),
          type: 'negative',
        });
      }
    } catch (error) {
      createTemporaryNotification({
        caption: filepath ? path.basename(filepath) : filepath,
        icon: 'mmm-error',
        message: t('fileProcessError'),
        type: 'negative',
      });
      errorCatcher(error);
    }
    currentFile.value++;
  }
  if (!isJwpub(files[0]?.path)) resetDragging();
};

const addSong = (section: MediaSection | undefined) => {
  window.dispatchEvent(
    new CustomEvent<{ section: MediaSection | undefined }>('openSongPicker', {
      detail: { section },
    }),
  );
};

const openImportMenu = (section: MediaSection | undefined) => {
  window.dispatchEvent(
    new CustomEvent<{ section: MediaSection | undefined }>('openImportMenu', {
      detail: { section },
    }),
  );
};

// TODO: re-enable after fixing drag and drop sort
const dropActive = (event: DragEvent) => {
  console.log('todo: re-enable after fixing drag and drop sort', event);
  //   event.preventDefault();
  //   event.stopPropagation();
  //   if (!event?.relatedTarget && event?.dataTransfer?.effectAllowed === 'all') {
  //     dragging.value = true;
  //   }
};
const dropEnd = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  try {
    if (event.dataTransfer?.files?.length) {
      const droppedStuff = Array.from(event.dataTransfer.files)
        .map((file) => {
          return {
            filetype: file.type,
            path: getLocalPathFromFileObject(file),
          };
        })
        .sort((a, b) => SORTER.compare(a?.path, b?.path));
      const noLocalDroppedFiles =
        droppedStuff.filter((file) => file.path).length === 0;
      if (noLocalDroppedFiles && droppedStuff.length > 0) {
        const html = event.dataTransfer.getData('text/html');
        const sanitizedHtml = DOMPurify.sanitize(html);
        const src = new DOMParser()
          .parseFromString(sanitizedHtml, 'text/html')
          .querySelector('img')?.src;
        const filetype =
          Array.from(event.dataTransfer.items).find(
            (item) => item.kind === 'file',
          )?.type ?? '';
        if (src) droppedStuff[0] = { filetype, path: src };
      }
      addToFiles(droppedStuff).catch((error) => {
        errorCatcher(error);
      });
      // .then(() => {
      //   resetDragging();
      // });
    }
  } catch (error) {
    errorCatcher(error);
  }
};
// const dropIgnore = (event: DragEvent) => {
//   event.preventDefault();
//   event.stopPropagation();
// };

const resetDragging = () => {
  dragging.value = false;
  jwpubImportDb.value = '';
  jwpubImportDocuments.value = [];
  currentFile.value = 0;
  totalFiles.value = 0;
  sectionToAddTo.value = undefined;
};
</script>
<style scoped lang="scss">
.add-media-shortcut {
  max-width: 100%;

  :deep(span.block) {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
}
</style>
