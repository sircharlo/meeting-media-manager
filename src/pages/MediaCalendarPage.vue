<template>
  <q-page
    :class="
      !(
        sortableAdditionalMediaItems?.length ||
        sortableWtMediaItems?.length ||
        sortableTgwMediaItems?.length ||
        sortableAyfmMediaItems?.length ||
        sortableLacMediaItems?.length ||
        sortableCircuitOverseerMediaItems?.length
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
          {{ $t('some-media-items-are-hidden') }}
          <template #avatar>
            <q-avatar class="bg-white text-warning" size="lg">
              <q-icon name="mmm-file-hidden" size="sm" />
            </q-avatar>
          </template>
        </q-banner>
      </div>
      <div
        v-if="
          selectedDateObject?.meeting === 'we' &&
          selectedDateObject?.complete &&
          !sortableAdditionalMediaItems?.length
        "
        class="row"
      >
        <q-banner
          class="bg-additional text-white full-width"
          inline-actions
          rounded
        >
          {{ $t('dont-forget-add-opening-song') }}
          <template #avatar>
            <q-avatar class="bg-white text-additional" size="lg">
              <q-icon name="mmm-music-note" size="sm" />
            </q-avatar>
          </template>
          <template #action>
            <q-btn flat @click="addOpeningSong()">
              {{ $t('add-an-opening-song') }}
            </q-btn>
          </template>
        </q-banner>
      </div>
      <div
        v-if="
          selectedDateObject?.meeting &&
          !sortableCircuitOverseerMediaItems?.length &&
          coWeek
        "
        class="row"
      >
        <q-banner
          class="bg-additional text-white full-width"
          inline-actions
          rounded
        >
          {{ $t('dont-forget-add-circuit-overseer-media') }}
          <template #avatar>
            <q-avatar class="bg-white text-additional jw-icon" size="lg">
              
            </q-avatar>
          </template>
          <template #action>
            <q-btn flat @click="openImportMenu()">
              {{ $t('add-missing-media') }}
            </q-btn>
          </template>
        </q-banner>
      </div>
      <div
        v-if="
          (currentSettings?.disableMediaFetching &&
            sortableAdditionalMediaItems?.length < 1) ||
          (!currentSettings?.disableMediaFetching &&
            ((selectedDateObject?.meeting && !selectedDateObject?.complete) ||
              !(
                sortableAdditionalMediaItems?.length ||
                sortableWtMediaItems?.length ||
                sortableTgwMediaItems?.length ||
                sortableAyfmMediaItems?.length ||
                sortableLacMediaItems?.length ||
                sortableCircuitOverseerMediaItems?.length
              )))
        "
        class="row"
      >
        <div class="col content-center q-py-xl">
          <div
            v-if="
              !currentSettings?.disableMediaFetching ||
              sortableAdditionalMediaItems?.length < 1
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
                  src="images/no-media.svg"
                  style="max-height: 30vh"
                />
              </div>
              <div
                class="row items-center justify-center text-subtitle1 text-semibold"
              >
                {{
                  !selectedDate
                    ? $t('noDateSelected')
                    : !currentSettings?.disableMediaFetching &&
                        selectedDateObject?.meeting &&
                        !selectedDateObject?.error
                      ? $t('please-wait')
                      : $t('there-are-no-media-items-for-the-selected-date')
                }}
              </div>
              <div class="row items-center justify-center text-center">
                {{
                  !selectedDate
                    ? $t('select-a-date-to-begin')
                    : !currentSettings?.disableMediaFetching &&
                        selectedDateObject?.meeting &&
                        !selectedDateObject?.error
                      ? $t('currently-loading')
                      : $t(
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
                  {{ $t('next-day-with-media') }}
                </q-btn>
                <q-btn
                  v-if="selectedDate"
                  color="primary"
                  @click="openImportMenu()"
                >
                  <q-icon class="q-mr-sm" name="mmm-import-media" size="xs" />
                  {{ $t('add-extra-media') }}
                </q-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <q-list
      v-show="sortableAdditionalMediaItems?.length"
      class="media-section additional"
    >
      <q-item class="text-additional items-center">
        <!-- :class="
              isWeMeetingDay(selectedDateObject?.date)
                ? 'bg-white text-additional jw-icon'
                : 'text-white bg-additional rounded-borders-sm'
            " -->
        <q-avatar
          v-if="selectedDateObject"
          :size="isWeMeetingDay(selectedDateObject?.date) ? 'lg' : 'md'"
          class="text-white bg-additional jw-icon"
        >
          <template v-if="isWeMeetingDay(selectedDateObject?.date)">
            
          </template>
          <template v-else>
            <q-icon name="mmm-additional-media" size="md" />
          </template>
        </q-avatar>
        <div
          v-if="selectedDateObject"
          class="text-bold text-uppercase text-spaced"
        >
          {{
            $t(
              isWeMeetingDay(selectedDateObject?.date)
                ? 'public-talk'
                : 'imported-media',
            )
          }}
        </div>
      </q-item>
      <q-list ref="additionalList" class="list-droppable">
        <MediaItem
          v-for="media in sortableAdditionalMediaItems"
          :key="media.uniqueId"
          :list="sortableAdditionalMediaItems"
          :media="media"
          :play-state="playState(media.uniqueId)"
          @update:hidden="media.hidden = !!$event"
        />
      </q-list>
    </q-list>
    <q-list
      v-show="
        selectedDateObject?.complete &&
        (sortableTgwMediaItems.length ||
          sortableAyfmMediaItems.length ||
          sortableLacMediaItems.length)
      "
      class="media-section tgw"
    >
      <q-item class="text-tgw items-center">
        <q-avatar class="text-white bg-tgw jw-icon" size="md"></q-avatar>
        <div class="text-bold text-uppercase text-spaced">
          {{ $t('tgw') }}
        </div>
      </q-item>
      <q-list ref="tgwList" class="list-droppable">
        <MediaItem
          v-for="media in sortableTgwMediaItems"
          :key="media.uniqueId"
          :list="sortableTgwMediaItems"
          :media="media"
          :play-state="playState(media.uniqueId)"
          @update:hidden="media.hidden = !!$event"
        />
        <div v-if="sortableTgwMediaItems.length === 0">
          <q-item>
            <q-item-section
              class="align-center text-secondary text-grey text-subtitle2"
            >
              <div>
                <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
                {{ $t('no-media-files-for-section') }}
              </div>
            </q-item-section>
          </q-item>
        </div>
      </q-list>
    </q-list>
    <q-list
      v-show="
        selectedDateObject?.complete &&
        (sortableTgwMediaItems.length ||
          sortableAyfmMediaItems.length ||
          sortableLacMediaItems.length)
      "
      class="media-section ayfm"
    >
      <q-item class="text-ayfm items-center">
        <q-avatar class="text-white bg-ayfm jw-icon" size="lg"></q-avatar>
        <div class="text-bold text-uppercase text-spaced">
          {{ $t('ayfm') }}
        </div>
      </q-item>
      <q-list ref="ayfmList" class="list-droppable">
        <MediaItem
          v-for="media in sortableAyfmMediaItems"
          :key="media.uniqueId"
          :list="sortableAyfmMediaItems"
          :media="media"
          :play-state="playState(media.uniqueId)"
          @update:hidden="media.hidden = !!$event"
        />
        <div v-if="sortableAyfmMediaItems.length === 0">
          <q-item>
            <q-item-section
              class="align-center text-secondary text-grey text-subtitle2"
            >
              <div>
                <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
                {{ $t('no-media-files-for-section') }}
              </div>
            </q-item-section>
          </q-item>
        </div>
      </q-list>
    </q-list>
    <q-list
      v-show="
        selectedDateObject?.complete &&
        (sortableTgwMediaItems.length ||
          sortableAyfmMediaItems.length ||
          sortableLacMediaItems.length)
      "
      class="media-section lac"
    >
      <q-item class="text-lac items-center">
        <q-avatar class="text-white bg-lac jw-icon" size="lg"></q-avatar>
        <div class="text-bold text-uppercase text-spaced">
          {{ $t('lac') }}
        </div>
      </q-item>
      <q-list ref="lacList" class="list-droppable">
        <MediaItem
          v-for="media in sortableLacMediaItems"
          :key="media.uniqueId"
          :list="sortableLacMediaItems"
          :media="media"
          :play-state="playState(media.uniqueId)"
          @update:hidden="media.hidden = !!$event"
        />
        <div v-if="sortableLacMediaItems.length === 0">
          <q-item>
            <q-item-section
              class="align-center text-secondary text-grey text-subtitle2"
            >
              <div>
                <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
                {{ $t('no-media-files-for-section') }}
              </div>
            </q-item-section>
          </q-item>
        </div>
      </q-list>
    </q-list>
    <q-list
      v-show="selectedDateObject?.complete && sortableWtMediaItems.length"
      class="media-section wt"
    >
      <q-item class="text-wt items-center">
        <q-avatar class="text-white bg-wt jw-icon" size="lg"></q-avatar>
        <div class="text-bold text-uppercase text-spaced">
          {{ $t('wt') }}
        </div>
      </q-item>
      <q-list ref="wtList" class="list-droppable">
        <MediaItem
          v-for="media in sortableWtMediaItems"
          :key="media.uniqueId"
          :list="sortableWtMediaItems"
          :media="media"
          :play-state="playState(media.uniqueId)"
          @update:hidden="media.hidden = !!$event"
        />
        <div v-if="sortableWtMediaItems.length === 0">
          <q-item>
            <q-item-section
              class="align-center text-secondary text-grey text-subtitle2"
            >
              <div>
                <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
                {{ $t('no-media-files-for-section') }}
              </div>
            </q-item-section>
          </q-item>
        </div>
      </q-list>
    </q-list>
    <q-list
      v-show="selectedDateObject?.complete && coWeek"
      class="media-section additional"
    >
      <q-item class="text-additional items-center">
        <q-avatar class="text-white bg-additional jw-icon" size="lg"
          ></q-avatar
        >
        <div class="text-bold text-uppercase text-spaced">
          {{ $t('co') }}
        </div>
      </q-item>
      <q-list ref="circuitOverseerList" class="list-droppable">
        <MediaItem
          v-for="media in sortableCircuitOverseerMediaItems"
          :key="media.uniqueId"
          :list="sortableCircuitOverseerMediaItems"
          :media="media"
          :play-state="playState(media.uniqueId)"
          @update:hidden="media.hidden = !!$event"
        />
        <div v-if="sortableCircuitOverseerMediaItems.length === 0">
          <q-item>
            <q-item-section
              class="align-center text-secondary text-grey text-subtitle2"
            >
              <div>
                <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
                {{ $t('no-media-files-for-section') }}
              </div>
            </q-item-section>
          </q-item>
        </div>
      </q-list>
    </q-list>
  </q-page>
  <DragAndDropper
    v-model="dragging"
    :files-loading="filesLoading"
    :jwpub-db="jwpubImportDb"
    :jwpub-documents="jwpubImportDocuments"
    @drop="dropEnd"
  />
</template>

<script setup lang="ts">
import type { DNDPlugin } from '@formkit/drag-and-drop';
import type { DocumentItem, DynamicMediaObject, TableItem } from 'src/types';

// eslint-disable-next-line no-duplicate-imports
import {
  animations,
  multiDrag,
  parents,
  selections,
} from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { useBroadcastChannel, useEventListener } from '@vueuse/core';
import { Buffer } from 'buffer';
import DOMPurify from 'dompurify';
import { storeToRefs } from 'pinia';
import { date, uid } from 'quasar';
import DragAndDropper from 'src/components/media/DragAndDropper.vue';
import MediaItem from 'src/components/media/MediaItem.vue';
import { useLocale } from 'src/composables/useLocale';
import {
  dateFromString,
  getLocalDate,
  isCoWeek,
  isInPast,
  isWeMeetingDay,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  getDurationFromMediaPath,
  getFileUrl,
  getPublicationDirectory,
  getTempDirectory,
  getThumbnailUrl,
} from 'src/helpers/fs';
import {
  addJwpubDocumentMediaToFiles,
  downloadFileIfNeeded,
  fetchMedia,
  getPublicationInfoFromDb,
  sanitizeId,
} from 'src/helpers/jw-media';
import {
  convertImageIfNeeded,
  decompressJwpub,
  findDb,
  getMediaFromJwPlaylist,
  inferExtension,
  isArchive,
  isAudio,
  isImage,
  isImageString,
  isJwPlaylist,
  isJwpub,
  isPdf,
  isRemoteUrl,
  isVideo,
} from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { sendObsSceneEvent } from 'src/helpers/obs';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { formatDate, getDateDiff } = date;

const dragging = ref(false);
const jwpubImportDb = ref('');
const jwpubImportDocuments = ref<DocumentItem[]>([]);

const { dateLocale } = useLocale();

watch(
  () => [jwpubImportDb.value, jwpubImportDocuments.value],
  ([newJwpubImportDb, newJwpubImportDocuments]) => {
    if (!!newJwpubImportDb || newJwpubImportDocuments?.length) {
      dragging.value = true;
    }
  },
);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const jwStore = useJwStore();
const { addToAdditionMediaMap, removeFromAdditionMediaMap } = jwStore;
const { additionalMediaMaps, customDurations, lookupPeriod, mediaSort } =
  storeToRefs(jwStore);
const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  getDatedAdditionalMediaDirectory,
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
} = storeToRefs(currentState);
const {
  convertPdfToImages,
  decompress,
  executeQuery,
  fs,
  getLocalPathFromFileObject,
  path,
} = window.electronApi;

const filesLoading = ref(-1);

watch(
  () => mediaPlayingUniqueId.value,
  (newMediaUniqueId) => {
    const { post } = useBroadcastChannel({ name: 'unique-id' });
    post(newMediaUniqueId);
    if (newMediaUniqueId) lastPlayedMediaUniqueId.value = newMediaUniqueId;
  },
);

watch(
  () => mediaPlayingAction.value,
  (newAction, oldAction) => {
    const { post } = useBroadcastChannel({ name: 'media-action' });
    if (newAction !== oldAction) post(newAction);
  },
);

watch(
  () => mediaPlayingSubtitlesUrl.value,
  (newSubtitlesUrl, oldSubtitlesUrl) => {
    const { post } = useBroadcastChannel({ name: 'subtitles-url' });
    if (newSubtitlesUrl !== oldSubtitlesUrl) post(newSubtitlesUrl);
  },
);

watch(
  () => mediaPlayingPanzoom.value,
  (newPanzoom, oldPanzoom) => {
    try {
      const { post } = useBroadcastChannel({ name: 'panzoom' });
      if (JSON.stringify(newPanzoom) !== JSON.stringify(oldPanzoom)) {
        newPanzoom = JSON.parse(JSON.stringify(newPanzoom));
        post(newPanzoom);
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
    const { post } = useBroadcastChannel({ name: 'media-url' });
    if (newUrl !== oldUrl) post(newUrl);
  },
);

const datedAdditionalMediaMap = computed(() => {
  return (
    additionalMediaMaps.value[currentCongregation.value]?.[
      selectedDate.value
    ] ?? []
  );
});

const { data: mediaStateData } = useBroadcastChannel({ name: 'media-state' });

watch(
  () => mediaStateData.value,
  (newMediaStateData) => {
    if (newMediaStateData === 'ended') {
      mediaPlayingCurrentPosition.value = 0;
      mediaPlayingUrl.value = '';
      mediaPlayingUniqueId.value = '';
      mediaPlayingAction.value =
        mediaPlayingAction.value === 'backgroundMusicPlay'
          ? 'backgroundMusicCurrentEnded'
          : '';
    }
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

const mapOrder =
  (sortOrder: string | string[] | undefined) =>
  (a: DynamicMediaObject, b: DynamicMediaObject) => {
    try {
      const key = 'uniqueId';
      if (!sortOrder || sortOrder.length === 0) return 0;
      return sortOrder.indexOf(a[key]) > sortOrder.indexOf(b[key]) ? 1 : -1;
    } catch (e) {
      errorCatcher(e);
      return 0;
    }
  };

const updateMediaSortPlugin: DNDPlugin = (parent) => {
  const parentData = parents.get(parent);
  if (!parentData) return;

  const updateMediaSection = (id: string, section: string) => {
    (selectedDateObject.value?.dynamicMedia ?? []).forEach((item) => {
      if (item.uniqueId === id && item.section !== section) {
        item.section = section;
      }
    });
    (
      additionalMediaMaps.value[currentCongregation.value]?.[
        selectedDate.value
      ] ?? []
    ).forEach((item) => {
      if (item.uniqueId === id && item.section !== section) {
        item.section = section;
      }
    });
  };
  function dragover() {
    for (const media of sortableAdditionalMediaItems.value) {
      updateMediaSection(media.uniqueId, 'additional');
    }
    for (const media of sortableTgwMediaItems.value) {
      updateMediaSection(media.uniqueId, 'tgw');
    }
    for (const media of sortableAyfmMediaItems.value) {
      updateMediaSection(media.uniqueId, 'ayfm');
    }
    for (const media of sortableLacMediaItems.value) {
      updateMediaSection(media.uniqueId, 'lac');
    }
    for (const media of sortableWtMediaItems.value) {
      updateMediaSection(media.uniqueId, 'wt');
    }
    for (const media of sortableCircuitOverseerMediaItems.value) {
      updateMediaSection(media.uniqueId, 'circuitOverseer');
    }
  }

  function dragend() {
    if (!mediaSort.value[currentCongregation.value])
      mediaSort.value[currentCongregation.value] = {};
    mediaSort.value[currentCongregation.value][selectedDate.value] = [
      ...sortableAdditionalMediaItems.value,
      ...sortableTgwMediaItems.value,
      ...sortableAyfmMediaItems.value,
      ...sortableLacMediaItems.value,
      ...sortableWtMediaItems.value,
      ...sortableCircuitOverseerMediaItems.value,
    ].map((item: DynamicMediaObject) => item.uniqueId);
  }

  return {
    setupNode(data) {
      useEventListener(data.node, 'dragover', dragover);
      useEventListener(data.node, 'dragend', dragend);
    },
    tearDownNode(data) {
      data.node.removeEventListener('dragover', dragover);
      data.node.removeEventListener('dragend', dragend);
    },
  };
};

const sortableMediaItems = ref<DynamicMediaObject[]>([]);

const generateMediaList = () => {
  const combinedMediaItems = datedAdditionalMediaMap.value.concat(
    selectedDateObject.value?.dynamicMedia ?? [],
  );
  if (combinedMediaItems && currentCongregation.value) {
    if (!mediaSort.value[currentCongregation.value]) {
      mediaSort.value[currentCongregation.value] = {};
    }
    const seenFileUrls = new Set();
    sortableMediaItems.value = combinedMediaItems
      .sort(
        mapOrder(
          selectedDate.value
            ? mediaSort.value[currentCongregation.value][selectedDate.value]
            : [],
        ),
      )
      .filter((m) => {
        if (!m.fileUrl || seenFileUrls.has(m.fileUrl)) {
          return false;
        }
        seenFileUrls.add(m.fileUrl);
        return true;
      });
  }
};

watch(
  () => [
    selectedDateObject.value?.date,
    datedAdditionalMediaMap.value?.length,
    selectedDateObject.value?.dynamicMedia?.length,
  ],
  (
    [newSelectedDate, newAdditionalMediaListLength, newDynamicMediaListLength],
    [oldSelectedDate, oldAdditionalMediaListLength, oldDynamicMediaListLength],
  ) => {
    try {
      if (
        newSelectedDate !== oldSelectedDate ||
        newAdditionalMediaListLength !== oldAdditionalMediaListLength ||
        newDynamicMediaListLength !== oldDynamicMediaListLength
      ) {
        generateMediaList();
      }
    } catch (e) {
      errorCatcher(e);
    }
  },
);

watch(
  () => mediaSort.value?.[currentCongregation.value]?.[selectedDate.value],
  (newMediaSort) => {
    try {
      if (newMediaSort && newMediaSort.length === 0) {
        generateMediaList();
      }
    } catch (e) {
      errorCatcher(e);
    }
  },
  { deep: true, immediate: true },
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

const goToNextDayWithMedia = () => {
  try {
    if (
      currentCongregation.value &&
      (lookupPeriod.value?.[currentCongregation.value] ||
        additionalMediaMaps.value?.[currentCongregation.value])
    ) {
      selectedDate.value = [
        ...(lookupPeriod.value?.[currentCongregation.value]
          ?.filter((day) => day.meeting)
          .map((day) => day.date) ?? []),
        ...Object.keys(
          additionalMediaMaps.value?.[currentCongregation.value] || {},
        ).filter(
          (day) =>
            additionalMediaMaps.value?.[currentCongregation.value][day].length >
            0,
        ),
      ]
        .filter(Boolean)
        .filter((mediaDate) => !isInPast(dateFromString(mediaDate)))
        .map((mediaDate) => formatDate(mediaDate, 'YYYY/MM/DD'))
        .sort()[0];
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

useEventListener(window, 'draggingSomething', () => {
  resetDragging();
  dragging.value = true;
});
useEventListener(window, 'localFiles-browsed', (event: CustomEventInit) => {
  addToFiles(event.detail).catch((error) => {
    errorCatcher(error);
  });
});
useEventListener(window, 'remote-video-loading', (event: CustomEventInit) => {
  addToAdditionMediaMapFromPath(event.detail.path, undefined, {
    duration: event.detail.duration,
    song: event.detail.song,
    thumbnailUrl: event.detail.thumbnailUrl,
    title: event.detail.title,
    url: event.detail.url,
  });
});

onMounted(async () => {
  watch(
    selectedDate,
    (newVal) => {
      try {
        if (!currentCongregation.value || !newVal) {
          return;
        }
        const durations = (customDurations.value[currentCongregation.value] ||=
          {});
        durations[newVal] ||= {};
        coWeek.value = isCoWeek(dateFromString(newVal));
      } catch (e) {
        errorCatcher(e);
      }
    },
    { immediate: true },
  );
  generateMediaList();
  goToNextDayWithMedia();

  // If no date with media is found, go to todays date
  if (!selectedDate.value) {
    selectedDate.value = formatDate(new Date(), 'YYYY/MM/DD');
  }

  sendObsSceneEvent('camera');
  fetchMedia();
  checkCoDate();
});

const [tgwList, sortableTgwMediaItems] = useDragAndDrop<DynamicMediaObject>(
  [],
  {
    group: 'sortableMedia',
    plugins: [
      updateMediaSortPlugin,
      animations(),
      multiDrag({
        plugins: [
          selections({
            selectedClass: 'selected-to-drag',
          }),
        ],
      }),
    ],
  },
);

const [ayfmList, sortableAyfmMediaItems] = useDragAndDrop<DynamicMediaObject>(
  [],
  {
    group: 'sortableMedia',
    plugins: [
      updateMediaSortPlugin,
      animations(),
      multiDrag({
        plugins: [
          selections({
            selectedClass: 'selected-to-drag',
          }),
        ],
      }),
    ],
  },
);

const [lacList, sortableLacMediaItems] = useDragAndDrop<DynamicMediaObject>(
  [],
  {
    group: 'sortableMedia',
    plugins: [
      updateMediaSortPlugin,
      animations(),
      multiDrag({
        plugins: [
          selections({
            selectedClass: 'selected-to-drag',
          }),
        ],
      }),
    ],
  },
);

const [wtList, sortableWtMediaItems] = useDragAndDrop<DynamicMediaObject>([], {
  group: 'sortableMedia',
  plugins: [
    updateMediaSortPlugin,
    animations(),
    multiDrag({
      plugins: [
        selections({
          selectedClass: 'selected-to-drag',
        }),
      ],
    }),
  ],
});

const [additionalList, sortableAdditionalMediaItems] =
  useDragAndDrop<DynamicMediaObject>([], {
    group: 'sortableMedia',
    plugins: [
      updateMediaSortPlugin,
      animations(),
      multiDrag({
        plugins: [
          selections({
            selectedClass: 'selected-to-drag',
          }),
        ],
      }),
    ],
  });

const [circuitOverseerList, sortableCircuitOverseerMediaItems] =
  useDragAndDrop<DynamicMediaObject>([], {
    group: 'sortableMedia',
    plugins: [
      updateMediaSortPlugin,
      animations(),
      multiDrag({
        plugins: [
          selections({
            selectedClass: 'selected-to-drag',
          }),
        ],
      }),
    ],
  });

watch(
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
  { deep: true, immediate: true },
);

const sortedMediaIds = computed(() => {
  return [
    ...sortableAdditionalMediaItems.value.filter((m) => !m.hidden),
    ...sortableMediaItems.value.filter((m) => !m.hidden),
  ].map((m) => m.uniqueId);
});

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

const copyToDatedAdditionalMedia = async (files: string[]) => {
  const datedAdditionalMediaDir = getDatedAdditionalMediaDirectory.value;
  fs.ensureDirSync(datedAdditionalMediaDir);

  const trimFilepathAsNeeded = (filepath: string) => {
    let filepathSize = new Blob([filepath]).size;
    while (filepathSize > 230) {
      const overBy = filepathSize - 230;
      const baseName = path
        .basename(filepath)
        .slice(0, -path.extname(filepath).length);
      const newBaseName = baseName.slice(0, -overBy);
      filepath = path.join(
        datedAdditionalMediaDir,
        newBaseName + path.extname(filepath),
      );
      filepathSize = new Blob([filepath]).size;
    }
    return filepath;
  };
  for (const filepathToCopy of files) {
    try {
      if (!filepathToCopy || !fs.existsSync(filepathToCopy)) continue;
      let datedAdditionalMediaPath = path.join(
        datedAdditionalMediaDir,
        path.basename(filepathToCopy),
      );
      datedAdditionalMediaPath = trimFilepathAsNeeded(datedAdditionalMediaPath);
      const uniqueId = sanitizeId(
        formatDate(selectedDate.value, 'YYYYMMDD') +
          '-' +
          getFileUrl(datedAdditionalMediaPath),
      );
      if (fs.existsSync(datedAdditionalMediaPath)) {
        if (filepathToCopy !== datedAdditionalMediaPath) {
          fs.removeSync(datedAdditionalMediaPath);
          removeFromAdditionMediaMap(uniqueId);
        }
      }
      if (filepathToCopy !== datedAdditionalMediaPath)
        fs.copySync(filepathToCopy, datedAdditionalMediaPath);
      await addToAdditionMediaMapFromPath(datedAdditionalMediaPath, uniqueId);
    } catch (error) {
      errorCatcher(filepathToCopy);
      errorCatcher(error);
    }
  }
};

const addToAdditionMediaMapFromPath = async (
  additionalFilePath: string,
  uniqueId?: string,
  stream?: {
    duration: number;
    song?: string;
    thumbnailUrl: string;
    title?: string;
    url: string;
  },
) => {
  try {
    if (!additionalFilePath) return;
    const isVideoFile = isVideo(additionalFilePath);
    const isAudioFile = isAudio(additionalFilePath);
    let duration = 0;
    if (isVideoFile || isAudioFile) {
      duration =
        stream?.duration ??
        (await getDurationFromMediaPath(additionalFilePath));
    }
    if (!uniqueId) {
      uniqueId = sanitizeId(
        formatDate(selectedDate.value, 'YYYYMMDD') +
          '-' +
          getFileUrl(additionalFilePath),
      );
    }
    addToAdditionMediaMap([
      {
        duration,
        fileUrl: getFileUrl(additionalFilePath),
        isAdditional: true,
        isAudio: isAudioFile,
        isImage: isImage(additionalFilePath),
        isVideo: isVideoFile,
        section: 'additional',
        sectionOriginal: 'additional',
        song: stream?.song,
        streamUrl: stream?.url,
        thumbnailUrl:
          stream?.thumbnailUrl ??
          (await getThumbnailUrl(additionalFilePath, true)),
        title: stream?.title ?? path.basename(additionalFilePath),
        uniqueId,
      },
    ]);
  } catch (error) {
    errorCatcher(additionalFilePath);
    errorCatcher(error);
  }
};

const addToFiles = async (
  files: { filetype?: string; path: string }[] | FileList,
) => {
  if (!files) return;
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < files.length; i++) {
    filesLoading.value = i / files.length;
    let filepath = files[i]?.path;
    try {
      if (!filepath) continue;
      // Check if file is remote URL; if so, download it
      if (isRemoteUrl(filepath)) {
        const baseFileName = path.basename(new URL(filepath).pathname);
        filepath = (
          await downloadFileIfNeeded({
            dir: getTempDirectory(),
            filename: inferExtension(
              baseFileName,
              (files[i] as { filetype?: string }).filetype,
            ),
            url: filepath,
          })
        ).path;
      } else if (isImageString(filepath)) {
        const [preamble, data] = filepath.split(';base64,');
        const ext = preamble.split('/')[1];
        const tempFilename = uid() + '.' + ext;
        const tempFilepath = path.join(getTempDirectory(), tempFilename);
        fs.writeFileSync(tempFilepath, Buffer.from(data, 'base64'));
        filepath = tempFilepath;
      }
      filepath = await convertImageIfNeeded(filepath);
      if (isImage(filepath) || isVideo(filepath) || isAudio(filepath)) {
        await copyToDatedAdditionalMedia([filepath]);
      } else if (isPdf(filepath)) {
        const convertedImages = (
          await convertPdfToImages(filepath, getTempDirectory())
        ).map((path) => {
          return { path };
        });
        await addToFiles(convertedImages);
      } else if (isJwpub(filepath)) {
        // TODO: only decompress the db in memory using adm-zip, to get the publication info
        const tempUnzipDir = await decompressJwpub(filepath);
        console.log(tempUnzipDir);
        const tempDb = findDb(tempUnzipDir);
        console.log(tempDb);
        if (!tempDb) return;
        const publication = getPublicationInfoFromDb(tempDb);
        console.log(publication);
        const publicationDirectory = getPublicationDirectory(publication);
        console.log(publicationDirectory);
        if (!publicationDirectory) return;
        const unzipDir = await decompressJwpub(filepath, publicationDirectory);
        console.log(unzipDir);
        const db = findDb(unzipDir);
        console.log(db);
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
          if (jwpubImportDocuments.value.length === 1) {
            const errors = await addJwpubDocumentMediaToFiles(
              jwpubImportDb.value,
              jwpubImportDocuments.value[0],
            );
            jwpubImportDb.value = '';
            jwpubImportDocuments.value = [];
            if (errors?.length)
              errors.forEach((e) =>
                createTemporaryNotification({
                  caption: t('file-not-available'),
                  icon: 'mmm-error',
                  message: [
                    e.pub,
                    e.issue,
                    e.track,
                    e.langwritten,
                    e.fileformat,
                  ]
                    .filter(Boolean)
                    .join('_'),
                  timeout: 15000,
                  type: 'negative',
                }),
              );
          }
        }
        // jwpubImportLoading.value = false;
      } else if (isJwPlaylist(filepath) && selectedDateObject.value) {
        getMediaFromJwPlaylist(
          filepath,
          selectedDateObject.value?.date,
          getDatedAdditionalMediaDirectory.value,
        )
          .then((additionalMedia) => {
            addToAdditionMediaMap(additionalMedia);
            additionalMedia
              .filter(
                (m) =>
                  m.customDuration &&
                  (m.customDuration.max || m.customDuration.min),
              )
              .forEach((m) => {
                const { max, min } = m.customDuration as {
                  max: number;
                  min: number;
                };
                const congregation = (customDurations.value[
                  currentCongregation.value
                ] ??= {});
                const dateDurations = (congregation[selectedDate.value] ??= {});
                dateDurations[m.uniqueId] = { max, min };
              });
          })
          .catch((error) => {
            errorCatcher(error);
          });
      } else if (isArchive(filepath)) {
        const unzipDirectory = path.join(
          getTempDirectory(),
          path.basename(filepath),
        );
        if (fs.existsSync(unzipDirectory)) fs.removeSync(unzipDirectory);
        decompress(filepath, unzipDirectory)
          .then(() => {
            addToFiles(
              fs.readdirSync(unzipDirectory).map((file) => {
                return {
                  path: path.join(unzipDirectory, file),
                };
              }),
            )
              .then(() => fs.removeSync(unzipDirectory))
              .catch((error) => {
                errorCatcher(error);
              });
          })
          .catch((error) => {
            errorCatcher(error);
          });
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
    filesLoading.value = (i + 1) / files.length;
  }
  dragging.value = false;
  filesLoading.value = -1;
};

const addOpeningSong = () => {
  window.dispatchEvent(new CustomEvent('openSongPicker'));
};

const openImportMenu = () => {
  window.dispatchEvent(new CustomEvent('openImportMenu'));
};

const dropActive = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (!event?.relatedTarget && event?.dataTransfer?.effectAllowed === 'all') {
    dragging.value = true;
  }
};
const dropEnd = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  try {
    if (event.dataTransfer?.files.length) {
      const droppedStuff = Array.from(event.dataTransfer.files)
        .map((file) => {
          return {
            path: getLocalPathFromFileObject(file),
            type: file.type,
          };
        })
        .sort((a, b) =>
          a?.path?.localeCompare(b?.path, undefined, {
            numeric: true,
            sensitivity: 'base',
          }),
        );
      let noLocalDroppedFiles =
        droppedStuff.filter((file) => file.path).length === 0;
      if (noLocalDroppedFiles && droppedStuff.length > 0) {
        let html = event.dataTransfer.getData('text/html');
        let sanitizedHtml = DOMPurify.sanitize(html);
        let src = new DOMParser()
          .parseFromString(sanitizedHtml, 'text/html')
          .querySelector('img')?.src;
        const type =
          Array.from(event.dataTransfer.items).find(
            (item) => item.kind === 'file',
          )?.type ?? '';
        if (src) droppedStuff[0] = { path: src, type };
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
};
</script>
