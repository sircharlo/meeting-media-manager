<template>
  <q-page
    padding
    @dragenter="dropActive"
    @dragover="dropActive"
    @dragstart="dropActive"
  >
    {{ selectedDateObject?.mediaSections.map((s) => s.config.uniqueId) }}
    <div v-if="showBannerColumn" class="col">
      <q-slide-transition>
        <div v-if="showObsBanner" class="row">
          <q-banner
            class="bg-negative text-white full-width"
            inline-actions
            rounded
          >
            {{ t('obs-studio-disconnected-banner') }}
            <template #avatar>
              <q-icon name="mmm-obs-studio" size="lg" />
            </template>
          </q-banner>
        </div>
      </q-slide-transition>
      <q-slide-transition>
        <div v-if="showHiddenItemsBanner" class="row">
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
            <template #action>
              <q-btn
                flat
                :label="t('show-all-media')"
                @click="
                  showHiddenMediaForSelectedDate(
                    currentCongregation,
                    selectedDateObject,
                  )
                "
              />
            </template>
          </q-banner>
        </div>
      </q-slide-transition>
      <q-slide-transition>
        <div v-if="showDuplicateSongsBanner" class="row">
          <q-banner
            class="bg-warning text-white full-width"
            inline-actions
            rounded
          >
            {{ t('some-songs-are-duplicated') }}
            <template #avatar>
              <q-avatar class="bg-white text-warning" size="lg">
                <q-icon name="mmm-music-note" size="sm" />
              </q-avatar>
            </template>
          </q-banner>
        </div>
      </q-slide-transition>
      <MediaEmptyState
        v-if="showEmptyState"
        :go-to-next-day-with-media="goToNextDayWithMedia"
        :open-import-menu="openImportMenu"
      />
    </div>
    <template v-if="!showEmptyState">
      <template
        v-for="mediaList in mediaLists"
        :key="
          selectedDateObject?.date +
          '-' +
          mediaList.config?.uniqueId +
          '-' +
          mediaList.items?.length
        "
      >
        <MediaList
          :ref="(el) => (mediaListRefs[mediaList.sectionId] = el)"
          :media-list="mediaList"
          :open-import-menu="openImportMenu"
          @update-media-section-bg-color="updateMediaSectionBgColor"
          @update-media-section-label="updateMediaSectionLabel"
          @update:is-dragging="
            (isDragging) =>
              updateMediaListDragging(mediaList.sectionId, isDragging)
          "
          @update:sortable-items="
            (items) => updateMediaListItems(items, mediaList.sectionId)
          "
        />
      </template>
    </template>
    <q-btn
      v-if="
        selectedDateObject && !selectedDateObject.meeting && !showEmptyState
      "
      :class="{
        'full-width': true,
        'dashed-border': !mediaListDragging,
        'big-button': true,
      }"
      color="accent-100"
      :disable="mediaListDragging"
      icon="mmm-plus"
      :label="t('new-section')"
      text-color="primary"
      unelevated
      @click="addSection()"
    />

    <!-- Dialog Components -->
    <DialogFileImport
      v-model="showFileImport"
      v-model:jwpub-db="jwpubImportDb"
      v-model:jwpub-documents="jwpubImportDocuments"
      :current-file="currentFile"
      :dialog-id="'media-calendar-file-import'"
      :section="sectionToAddTo"
      :total-files="totalFiles"
      @drop="handleDrop"
    />
    <DialogSectionPicker
      v-model="showSectionPicker"
      :files="pendingFiles"
      @section-selected="handleSectionSelected"
    />
  </q-page>
</template>

<script setup lang="ts">
import type {
  DocumentItem,
  MediaItem,
  MediaSectionIdentifier,
  TableItem,
} from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  useMouse,
  usePointer,
  watchImmediate,
} from '@vueuse/core';
import { Buffer } from 'buffer';
import DialogFileImport from 'components/dialog/DialogFileImport.vue';
import DialogSectionPicker from 'components/dialog/DialogSectionPicker.vue';
import MediaEmptyState from 'components/media/MediaEmptyState.vue';
import MediaList from 'components/media/MediaList.vue';
import DOMPurify from 'dompurify';
import Mousetrap from 'mousetrap';
import { storeToRefs } from 'pinia';
import { useMeta } from 'quasar';
import { useLocale } from 'src/composables/useLocale';
import { defaultAdditionalSection } from 'src/composables/useMediaSection';
import { useMediaSectionRepeat } from 'src/composables/useMediaSectionRepeat';
import { SORTER } from 'src/constants/general';
import { getMeetingSections } from 'src/constants/media';
import { isCoWeek, isMwMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addDayToExportQueue } from 'src/helpers/export-media';
import {
  addJwpubDocumentMediaToFiles,
  copyToDatedAdditionalMedia,
  downloadFileIfNeeded,
  fetchMedia,
  getMemorialBackground,
} from 'src/helpers/jw-media';
import { executeLocalShortcut } from 'src/helpers/keyboardShortcuts';
import {
  addSection,
  findMediaSection,
  getOrCreateMediaSection,
} from 'src/helpers/media-sections';
import { decompressJwpub, showMediaWindow } from 'src/helpers/mediaPlayback';
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
import { useAppSettingsStore } from 'stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';
import { computed, nextTick, onMounted, ref, type Ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const jwpubImportDb = ref('');
const jwpubImportDocuments = ref<DocumentItem[]>([]);

const { dateLocale, t } = useLocale();
useMeta({ title: t('titles.meetingMedia') });

watch(
  () => [jwpubImportDb.value, jwpubImportDocuments.value],
  async ([newJwpubImportDb, newJwpubImportDocuments]) => {
    if (!!newJwpubImportDb || newJwpubImportDocuments?.length) {
      showFileImport.value = true;
    }
  },
);

const route = useRoute();
const router = useRouter();

const jwStore = useJwStore();
const { showHiddenMediaForSelectedDate } = jwStore;
const { lookupPeriod, urlVariables } = storeToRefs(jwStore);
const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  highlightedMediaId,
  mediaIsPlaying,
  mediaPaused,
  mediaPlaying,
  missingMedia,
  selectedDate,
  selectedDateObject,
  someItemsHiddenForSelectedDate,
} = storeToRefs(currentState);
const obsState = useObsStateStore();
const { obsConnectionState } = storeToRefs(obsState);

const totalFiles = ref(0);
const currentFile = ref(0);
const showFileImport = ref(false);
const showSectionPicker = ref(false);
const pendingFiles = ref<(File | string)[]>([]);

// Watch for file import dialog closing to reset progress tracking
watch(
  () => showFileImport.value,
  (isOpen) => {
    if (!isOpen) {
      // Reset progress tracking when dialog closes
      totalFiles.value = 0;
      currentFile.value = 0;
    }
  },
);

// Track dragging state for each media list
const mediaListDragging = ref(false);

// Function to update dragging state for a specific media list
const updateMediaListDragging = (sectionId: string, isDragging: boolean) => {
  mediaListDragging.value = isDragging;
};

const updateMediaListItems = (
  items: MediaItem[],
  sectionId: MediaSectionIdentifier,
) => {
  if (!selectedDateObject.value) return;

  // Update the section's media items with the new order
  if (!selectedDateObject.value.mediaSections) {
    selectedDateObject.value.mediaSections = [];
  }

  const section = getOrCreateMediaSection(
    selectedDateObject.value.mediaSections,
    sectionId,
  );

  // Get the current items in this section before the update
  const currentItems = section.items || [];

  // Find items that were moved from other sections (items that are in the new list but weren't in the current list)
  const movedItems = items.filter(
    (newItem) =>
      !currentItems.some(
        (currentItem) => currentItem.uniqueId === newItem.uniqueId,
      ),
  );

  // Remove moved items from their original sections
  if (movedItems.length > 0) {
    selectedDateObject.value.mediaSections.forEach((otherSection) => {
      if (otherSection.config.uniqueId !== sectionId) {
        if (otherSection?.items) {
          // Remove items that were moved to the new section
          otherSection.items = otherSection.items.filter(
            (item) =>
              !movedItems.some(
                (movedItem) => movedItem.uniqueId === item.uniqueId,
              ),
          );
        }
      }
    });

    console.log(
      '🔄 Moved items between sections:',
      movedItems.map((item) => item.title),
      'to section:',
      sectionId,
    );
  }

  // Update the target section with the new items
  section.items = items;

  console.log(
    '🔄 Updated items in section:',
    sectionId,
    'with',
    items.length,
    'items',
  );
};

const {
  convertPdfToImages,
  decompress,
  executeQuery,
  fs,
  getLocalPathFromFileObject,
  inferExtension,
  path,
  pathToFileURL,
  readdir,
} = window.electronApi;
const { ensureDir, exists, remove, writeFile } = fs;
const { basename, join } = path;

const { post: postMediaAction } = useBroadcastChannel<string, string>({
  name: 'main-window-media-action',
});

const { post: postCameraStream } = useBroadcastChannel<
  null | string,
  null | string
>({
  name: 'camera-stream',
});

const appSettingsStore = useAppSettingsStore();

watch(
  () => mediaPlaying.value.action,
  (newAction, oldAction) => {
    if (newAction !== oldAction) postMediaAction(newAction);
    if (currentState.currentLangObject?.isSignLanguage) {
      if (newAction !== 'play') {
        const cameraId = appSettingsStore.displayCameraId;
        if (cameraId) {
          postCameraStream(cameraId);
        } else {
          showMediaWindow(false);
        }
      } else {
        showMediaWindow(true);
      }
    }
  },
);

const { post: postSubtitlesUrl } = useBroadcastChannel<string, string>({
  name: 'subtitles-url',
});

watch(
  () => mediaPlaying.value.subtitlesUrl,
  (newSubtitlesUrl, oldSubtitlesUrl) => {
    if (newSubtitlesUrl !== oldSubtitlesUrl) postSubtitlesUrl(newSubtitlesUrl);
  },
);

const { post: postPanzoom } = useBroadcastChannel<
  Partial<Record<string, number>>,
  Partial<Record<string, number>>
>({ name: 'panzoom' });

watch(
  () => mediaPlaying.value.panzoom,
  (newPanzoom, oldPanzoom) => {
    try {
      // Only pass the serializable panzoom state (scale, x, y)
      const serializablePanzoom = newPanzoom
        ? {
            scale: newPanzoom.scale,
            x: newPanzoom.x,
            y: newPanzoom.y,
          }
        : undefined;

      const serializableOldPanzoom = oldPanzoom
        ? {
            scale: oldPanzoom.scale,
            x: oldPanzoom.x,
            y: oldPanzoom.y,
          }
        : undefined;

      if (
        JSON.stringify(serializablePanzoom) !==
        JSON.stringify(serializableOldPanzoom)
      ) {
        postPanzoom(serializablePanzoom ?? {});
      }
    } catch (error) {
      errorCatcher(error);
    }
  },
  { deep: true },
);

const { post: postMediaUrl } = useBroadcastChannel<string, string>({
  name: 'media-url',
});

const { post: postCustomDuration } = useBroadcastChannel<
  string | undefined,
  string | undefined
>({
  name: 'custom-duration',
});

// Section repeat functionality
const { handleMediaEnded } = useMediaSectionRepeat();

const customDuration = computed(() => {
  // Get all media from all sections across all dates
  const allMedia: MediaItem[] = [];
  lookupPeriod.value[currentCongregation.value]?.forEach((dateInfo) => {
    (dateInfo.mediaSections ?? []).forEach((sectionMedia) => {
      allMedia.push(...(sectionMedia.items || []));
    });
  });

  return (
    allMedia.find((item) => item.uniqueId === mediaPlaying.value.uniqueId)
      ?.customDuration || undefined
  );
});

watch(
  () => [mediaPlaying.value.url, customDuration.value],
  ([newUrl, newCustomDuration], [oldUrl, oldCustomDuration]) => {
    console.log('🔄 [watch] mediaPlaying.value.url', newUrl, oldUrl);
    if (
      newUrl === oldUrl ||
      (newCustomDuration &&
        oldCustomDuration &&
        JSON.stringify(newCustomDuration) === JSON.stringify(oldCustomDuration))
    )
      return;
    postMediaUrl(newUrl as string);
    postCustomDuration(JSON.stringify(newCustomDuration));
  },
);

const { data: lastEndTimestamp } = useBroadcastChannel<
  null | number,
  null | number
>({
  name: 'last-end-timestamp',
});

watch(
  () => lastEndTimestamp.value,
  (newLastEndTimestamp) => {
    console.log('🔄 [onMediaEnded] Media state data:', newLastEndTimestamp);
    if (newLastEndTimestamp) {
      // Handle section repeat logic first
      const repeatHandled = handleMediaEnded();
      console.log('🔄 [onMediaEnded] Repeat handled:', repeatHandled);
      if (repeatHandled) return;

      // Then handle normal media state cleanup
      // mediaPlaying.value.currentPosition = 0;
      // mediaPlaying.value.url = '';
      // mediaPlaying.value.uniqueId = '';
      // mediaPlaying.value.action = '';
      mediaPlaying.value = {
        action: '',
        currentPosition: 0,
        panzoom: {
          scale: 1,
          x: 0,
          y: 0,
        },
        seekTo: 0,
        subtitlesUrl: '',
        uniqueId: '',
        url: '',
      };

      // Clear custom duration when media ends
      postCustomDuration(undefined);

      nextTick(() => {
        window.dispatchEvent(
          new CustomEvent<{ scrollToSelectedMedia: boolean }>(
            'shortcutMediaNext',
            {
              detail: {
                scrollToSelectedMedia: false,
              },
            },
          ),
        );
      });
    }
  },
);

const { data: currentTimeData } = useBroadcastChannel<number, number>({
  name: 'current-time',
});

watch(
  () => currentTimeData.value,
  (newCurrentTime) => {
    nextTick(() => {
      mediaPlaying.value.currentPosition = newCurrentTime;
    });
  },
);

let mediaSceneTimeout: NodeJS.Timeout | null = null;
const changeDelay = 600; // 600ms delay: "--animate-duration" = 300ms, "slow" = "--animate-duration" * 2

watch(
  () => [mediaIsPlaying.value, mediaPaused.value, mediaPlaying.value.url],
  (
    [newMediaPlaying, newMediaPaused, newMediaPlayingUrl],
    [, , oldMediaPlayingUrl],
  ) => {
    // Clear any existing timeout
    if (mediaSceneTimeout) {
      clearTimeout(mediaSceneTimeout);
      mediaSceneTimeout = null;
    }

    if (
      currentSettings.value?.obsPostponeImages &&
      newMediaPlaying &&
      !newMediaPaused &&
      typeof newMediaPlayingUrl === 'string' &&
      isImage(newMediaPlayingUrl)
    ) {
      return;
    }

    const targetScene = newMediaPaused
      ? 'camera'
      : newMediaPlaying
        ? 'media'
        : 'camera';
    const wasPlayingBefore = !!oldMediaPlayingUrl;

    if (targetScene === 'media') {
      if (wasPlayingBefore) {
        // If something was playing before, we change the scene immediately
        sendObsSceneEvent('media');
      } else {
        // If nothing was already playing, we wait a bit before changing the scene to prevent seeing the fade effect in OBS
        mediaSceneTimeout = setTimeout(() => {
          sendObsSceneEvent('media');
          mediaSceneTimeout = null;
        }, changeDelay);
      }
    } else {
      sendObsSceneEvent('camera');
    }
  },
);

const seenErrors = new Set<string>();
watch(
  () =>
    lookupPeriod.value[currentCongregation.value]
      ?.filter((d) => d.error)
      .map((d) => formatDate(d.date, 'YYYY/MM/DD')),
  (errorVals) => {
    errorVals?.forEach((errorVal) => {
      const daysUntilError = getDateDiff(errorVal, new Date(), 'days');
      if (
        seenErrors.has(currentCongregation.value + errorVal) ||
        daysUntilError > 7
      )
        return;
      createTemporaryNotification({
        caption: getLocalDate(errorVal, dateLocale.value),
        group: 'meetingMediaDownloadError',
        icon: 'mmm-error',
        message: t('errorDownloadingMeetingMedia'),
        timeout: 15000,
        type: 'negative',
      });
      seenErrors.add(currentCongregation.value + errorVal);
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
      if (seenErrors.has(currentCongregation.value + missingFileUrl)) return;
      createTemporaryNotification({
        caption: t('some-media-items-are-missing-explain'),
        color: 'warning',
        group: 'missingMeetingMedia',
        icon: 'mmm-file-missing',
        message: t('some-media-items-are-missing'),
        timeout: 15000,
      });
      seenErrors.add(currentCongregation.value + missingFileUrl);
    });
  },
);

const goToNextDayWithMedia = (ignoreTodaysDate = false) => {
  try {
    if (
      currentCongregation.value &&
      lookupPeriod.value?.[currentCongregation.value]
    ) {
      selectedDate.value =
        lookupPeriod.value?.[currentCongregation.value]
          ?.filter((day) => {
            // Check if it's a meeting day or has any media in any section
            const hasMedia = (day.mediaSections ?? []).some(
              (section) => !!section.items?.length,
            );
            return day.meeting || hasMedia;
          })
          .map((day) => day.date)
          .filter(Boolean)
          .filter(
            (mediaDate) =>
              !isInPast(dateFromString(mediaDate), ignoreTodaysDate),
          )
          .map((mediaDate) => formatDate(mediaDate, 'YYYY/MM/DD'))
          .sort()?.[0] || '';
    }
  } catch (e) {
    errorCatcher(e);
  }
};

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

const sectionToAddTo = ref<MediaSectionIdentifier | undefined>();

useEventListener<CustomEvent<{ section: MediaSectionIdentifier | undefined }>>(
  window,
  'openFileImportDialog',
  async (e) => {
    sectionToAddTo.value = e.detail.section;
    // Reset progress tracking when opening the dialog
    totalFiles.value = 0;
    currentFile.value = 0;
    showFileImport.value = true;
  },
  { passive: true },
);
useEventListener<
  CustomEvent<{
    files: (File | string)[];
    section: MediaSectionIdentifier | undefined;
  }>
>(
  window,
  'localFiles-browsed',
  (event) => {
    sectionToAddTo.value = event.detail?.section;

    // Check if it's a WE meeting and no specific section was chosen
    if (
      selectedDateObject.value &&
      isWeMeetingDay(selectedDateObject.value.date) &&
      !event.detail?.section
    ) {
      pendingFiles.value = event.detail?.files ?? [];
      showSectionPicker.value = true;
    } else {
      // For non-WE meetings or when section is already specified, process files directly
      addToFiles(event.detail?.files ?? []).catch((error) => {
        errorCatcher(error);
      });
    }
  },
  { passive: true },
);
useEventListener<
  CustomEvent<{
    jwPlaylistPath: string;
    section: MediaSectionIdentifier | undefined;
  }>
>(
  window,
  'openJwPlaylistDialog',
  (e) => {
    console.log('🎯 openJwPlaylistDialog event received:', e.detail);
    window.dispatchEvent(
      new CustomEvent<{
        jwPlaylistPath: string;
        section: MediaSectionIdentifier | undefined;
      }>('openJwPlaylistPicker', {
        detail: {
          jwPlaylistPath: e.detail?.jwPlaylistPath,
          section: e.detail?.section,
        },
      }),
    );
    console.log('🎯 openJwPlaylistPicker event dispatched');
  },
  { passive: true },
);

const checkMemorialDate = async () => {
  let bg: string | undefined = currentState.mediaWindowCustomBackground;
  if (
    selectedDate.value &&
    selectedDate.value === currentSettings.value?.memorialDate
  ) {
    bg = await getMemorialBackground();
  }
  postCustomBackground(bg ?? '');
};

onMounted(() => {
  // generateMediaList();
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

  watch(
    () => urlVariables.value.mediator,
    () => {
      console.log(
        '🔄 [onMounted] urlVariables.value.mediator changed:',
        urlVariables.value.mediator,
        'Fetching media',
      );
      fetchMedia();
    },
  );
});

const { post: postCustomBackground } = useBroadcastChannel<string, string>({
  name: 'custom-background',
});

// Listen for requests to get current media window variables
const { data: getCurrentMediaWindowVariables } = useBroadcastChannel<
  string,
  string
>({
  name: 'get-current-media-window-variables',
});

watchImmediate(
  () => getCurrentMediaWindowVariables.value,
  () => {
    // Push current values when requested
    postMediaAction(mediaPlaying.value.action);
    postSubtitlesUrl(mediaPlaying.value.subtitlesUrl);

    // Only pass the serializable panzoom state
    const serializablePanzoom = mediaPlaying.value.panzoom
      ? {
          scale: mediaPlaying.value.panzoom.scale,
          x: mediaPlaying.value.panzoom.x,
          y: mediaPlaying.value.panzoom.y,
        }
      : undefined;
    postPanzoom(serializablePanzoom ?? {});

    postMediaUrl(mediaPlaying.value.url);
    postCustomDuration(JSON.stringify(customDuration.value));
    postCustomBackground(currentState.mediaWindowCustomBackground);
  },
);

watchImmediate(
  () => selectedDate.value,
  (newVal) => {
    mediaListDragging.value = false;
    if (!newVal || !selectedDateObject.value?.mediaSections) return;
    checkMemorialDate();

    if (isWeMeetingDay(selectedDateObject.value.date)) {
      getOrCreateMediaSection(selectedDateObject.value.mediaSections, 'pt', {
        ...defaultAdditionalSection.config,
        jwIcon: '',
        label: t('public-talk'),
      });
    }
  },
);

const addToFiles = async (files: (File | string)[] | FileList) => {
  if (!files) return;
  totalFiles.value = files.length;
  if (!Array.isArray(files)) files = Array.from(files);

  // Set default section for WE meetings if no section is specified
  if (
    selectedDateObject.value &&
    isWeMeetingDay(selectedDateObject.value.date) &&
    !sectionToAddTo.value
  ) {
    sectionToAddTo.value = 'pt'; // Default to public talk section for WE meetings
  }
  if (files.length > 1) {
    const jwPubFile = files.find((f) => isJwpub(getLocalPathFromFileObject(f)));
    if (jwPubFile) {
      files = [jwPubFile];
      createTemporaryNotification({
        caption: t('jwpub-file-found'),
        message:
          t('processing') +
          ' ' +
          basename(getLocalPathFromFileObject(files[0])),
      });
    }
    const archiveFile = files.find((f) =>
      isArchive(getLocalPathFromFileObject(f)),
    );
    if (archiveFile) {
      files = [archiveFile];
      createTemporaryNotification({
        caption: t('archive-file-found'),
        message:
          t('processing') +
          ' ' +
          basename(getLocalPathFromFileObject(files[0])),
      });
    }
  }
  for (const file of files) {
    let filepath = getLocalPathFromFileObject(file);
    try {
      if (!filepath) continue;
      // Check if file is remote URL; if so, download it
      if (isRemoteFile(file)) {
        const baseFileName = basename(new URL(filepath).pathname);
        filepath = (
          await downloadFileIfNeeded({
            dir: await getTempPath(),
            filename: await inferExtension(
              baseFileName,
              file instanceof File ? file.type : undefined,
            ),
            url: filepath,
          })
        ).path;
      } else if (isImageString(filepath)) {
        const [preamble, data] = filepath.split(';base64,');
        const ext = preamble?.split('/')[1];
        const tempFilename = uuid() + '.' + ext;
        const tempFilepath = join(await getTempPath(), tempFilename);
        await writeFile(tempFilepath, Buffer.from(data ?? '', 'base64'));
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
          matchingMissingItem.fileUrl = pathToFileURL(destPath);
          matchingMissingItem.duration = metadata.format.duration || 0;
          matchingMissingItem.title =
            metadata.common.title || basename(destPath);
          matchingMissingItem.isVideo = isVideo(filepath);
          matchingMissingItem.isAudio = isAudio(filepath);
        }
      } else if (isPdf(filepath)) {
        const convertedImages = await convertPdfToImages(
          filepath,
          await getTempPath(),
        );
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
        await ensureDir(tempDir);
        const tempFilePath = join(tempDir, basename(filepath) + '-contents');
        await writeFile(tempFilePath, tempContentFile.data);
        const tempJwpubFileContents = await decompress(tempFilePath);
        const tempDbFile = tempJwpubFileContents.find((tempJwpubFileContent) =>
          tempJwpubFileContent.path.endsWith('.db'),
        );
        if (!tempDbFile) return;
        const tempDbFilePath = join(
          await getTempPath(),
          basename(filepath) + '.db',
        );
        await writeFile(tempDbFilePath, tempDbFile.data);
        remove(tempFilePath);
        if (!(await exists(tempDbFilePath))) return;
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
            caption: basename(filepath),
            icon: 'mmm-jwpub',
            message: t('jwpubNoMultimedia'),
            type: 'warning',
          });
          jwpubImportDb.value = '';
          jwpubImportDocuments.value = [];
          showFileImport.value = false;
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
          }
        }
      } else if (isJwPlaylist(filepath) && selectedDateObject.value) {
        // Show playlist selection dialog
        console.log('🎯 JW Playlist file detected:', filepath);
        console.log('🎯 Section to add to:', sectionToAddTo.value);

        // Reset progress tracking since we're switching to JW playlist dialog
        totalFiles.value = 0;
        currentFile.value = 0;

        window.dispatchEvent(
          new CustomEvent<{
            jwPlaylistPath: string;
            section: MediaSectionIdentifier | undefined;
          }>('openJwPlaylistDialog', {
            detail: {
              jwPlaylistPath: filepath,
              section: sectionToAddTo.value,
            },
          }),
        );
        console.log('🎯 openJwPlaylistDialog event dispatched');
      } else if (isArchive(filepath)) {
        const unzipDirectory = join(await getTempPath(), basename(filepath));
        await remove(unzipDirectory);
        await window.electronApi
          .decompress(filepath, unzipDirectory)
          .catch((error) => {
            throw error;
          });
        const files = await readdir(unzipDirectory);
        const filePaths = files.map((file) => join(unzipDirectory, file.name));
        await addToFiles(filePaths);
        await remove(unzipDirectory);
      } else {
        createTemporaryNotification({
          caption: filepath ? basename(filepath) : filepath,
          icon: 'mmm-local-media',
          message: t('filetypeNotSupported'),
          type: 'negative',
        });
      }
    } catch (error) {
      createTemporaryNotification({
        caption: filepath ? basename(filepath) : filepath,
        icon: 'mmm-error',
        message: t('fileProcessError'),
        type: 'negative',
      });
      errorCatcher(error);
    }
    currentFile.value++;
  }
  if (showFileImport.value) {
    showFileImport.value = false;
  }
};

const openImportMenu = (section: MediaSectionIdentifier | undefined) => {
  window.dispatchEvent(
    new CustomEvent<{ section: MediaSectionIdentifier | undefined }>(
      'openImportMenu',
      {
        detail: { section },
      },
    ),
  );
};

const handleSectionSelected = (section: MediaSectionIdentifier) => {
  sectionToAddTo.value = section;
  addToFiles(pendingFiles.value).catch((error) => {
    errorCatcher(error);
  });
  pendingFiles.value = [];
};

const stopScrolling = ref(true);
const { pressure } = usePointer();
const { y } = useMouse();
const marginToEdge = Math.max(window.innerHeight / 4, 150);

watch(pressure, () => {
  if (!pressure.value) stopScrolling.value = true;
});

const scroll = (step?: number) => {
  const el = document.querySelector('.q-page-container');
  if (!el) return;
  if (!step) {
    el.scrollTop = 0;
    stopScrolling.value = true;
    return;
  }
  if (stopScrolling.value) return;
  el.scrollBy(0, step);
  setTimeout(() => scroll(step), 20);
};
const dropActive = (event: DragEvent) => {
  const step =
    y.value < marginToEdge
      ? -1
      : window.innerHeight - y.value < marginToEdge
        ? 1
        : 0;
  stopScrolling.value = step === 0;
  if (step) scroll(step);
  if (['all', 'copyLink'].includes(event?.dataTransfer?.effectAllowed || '')) {
    event.preventDefault();

    // Only show file import dialog for non-WE meetings
    // if (!selectedDateObject.value || !isWeMeetingDay(selectedDateObject.value.date)) {
    showFileImport.value = true;
    // }

    stopScrolling.value = true;
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  try {
    if (event.dataTransfer?.files?.length) {
      const droppedStuff: (File | string)[] = Array.from(
        event.dataTransfer.files,
      ).sort((a, b) =>
        SORTER.compare(
          getLocalPathFromFileObject(a),
          getLocalPathFromFileObject(b),
        ),
      );
      const noLocalDroppedFiles =
        droppedStuff.filter((file) => getLocalPathFromFileObject(file))
          .length === 0;
      if (noLocalDroppedFiles && droppedStuff.length > 0) {
        const html = event.dataTransfer.getData('text/html');
        const sanitizedHtml = DOMPurify.sanitize(html);
        const src = new DOMParser()
          .parseFromString(sanitizedHtml, 'text/html')
          .querySelector('img')?.src;
        if (src) droppedStuff[0] = src;
      }

      // Check if it's a WE meeting and show section picker
      if (
        selectedDateObject.value &&
        isWeMeetingDay(selectedDateObject.value.date)
      ) {
        pendingFiles.value = droppedStuff;
        showSectionPicker.value = true;
      } else {
        // For non-WE meetings, process files directly
        addToFiles(droppedStuff).catch((error) => {
          errorCatcher(error);
        });
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const duplicateSongsForWeMeeting = computed(() => {
  if (selectedDateObject.value?.meeting !== 'we') return false;

  // Get all media from all sections
  const allMedia = (selectedDateObject.value.mediaSections ?? []).flatMap(
    (section) => section.items || [],
  );

  const songNumbers: (number | string)[] = allMedia
    .filter((m) => !m.hidden && m.tag?.type === 'song' && m.tag?.value)
    .map((m) => m.tag?.value)
    .filter(
      (value): value is number | string =>
        typeof value === 'string' || typeof value === 'number',
    );

  if (songNumbers.length < 2) return false;
  const songSet = new Set(songNumbers);
  return songSet.size !== songNumbers.length;
});

const arraysAreIdentical = (a: string[], b: string[]) =>
  a.length === b.length && a.every((element, index) => element === b[index]);

const mediaListRefs = ref({}) as Ref<Record<string, unknown>>;

const keyboardShortcutMediaList = computed(() => {
  const allMedia = (selectedDateObject.value?.mediaSections ?? []).flatMap(
    (section) => {
      const mediaList = section.items;
      if (!mediaList) return [];
      return mediaList.map((item) => ({
        ...item,
        section: section.config?.uniqueId || 'imported-media',
        uniqueId: item.uniqueId || uuid(),
      }));
    },
  );

  return allMedia.flatMap((m) => {
    // Get media groups from the computed expanded groups
    const expanded = (
      mediaListRefs.value[m.section] as InstanceType<typeof MediaList>
    )?.expandedGroups;

    // Check if the media is collapsed based on the expanded state
    const isCollapsed =
      m.children && expanded && m.uniqueId
        ? !(expanded[m.uniqueId] ?? true)
        : false;

    // If the media is collapsed, return an empty array, since it won't be selectable
    if (isCollapsed) return [];

    // If the media is not collapsed, return the media itself or its children
    return m.children
      ? m.children.map((c) => ({
          ...c,
          parentUniqueId: m.uniqueId,
          section: m.section,
        }))
      : [m];
  });
});

const sortedMediaFileUrls = computed(() =>
  keyboardShortcutMediaList.value
    .filter((m) => !m.hidden && !!m.fileUrl)
    .map((m) => m.fileUrl)
    .filter((m): m is string => typeof m === 'string')
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

useEventListener(
  window,
  'shortcutMediaNext',
  (event: CustomEvent<{ scrollToSelectedMedia: boolean }>) => {
    // Early return if no date selected
    if (!selectedDate.value) return;

    const mediaList = keyboardShortcutMediaList.value;
    if (!mediaList.length) return;

    const sortedMediaIds = mediaList
      .filter((item) => item.type !== 'divider')
      .map((item) => item.uniqueId);
    if (!sortedMediaIds?.[0]) return;

    const currentId = highlightedMediaId.value;

    // If no current selection, return first item
    if (!currentId) {
      highlightedMediaId.value = sortedMediaIds[0];
      return;
    }

    const currentIndex = sortedMediaIds.indexOf(currentId);

    // If current item not found, reset to first
    if (currentIndex === -1) {
      highlightedMediaId.value = sortedMediaIds[0];
      return;
    }

    // Find next selectable media item
    const nextSelectableId = findNextSelectableMedia(mediaList, currentIndex);
    if (!nextSelectableId) return;
    highlightedMediaId.value = nextSelectableId;
    if (event.detail?.scrollToSelectedMedia)
      window.dispatchEvent(new CustomEvent('scrollToSelectedMedia'));
  },
  { passive: true },
);

useEventListener(
  window,
  'shortcutMediaPrevious',
  (event: CustomEvent<{ scrollToSelectedMedia: boolean }>) => {
    // Early return if no date selected
    if (!selectedDate.value) return;

    const mediaList = keyboardShortcutMediaList.value;
    if (!mediaList.length) return;

    const sortedMediaIds = mediaList
      .filter((item) => item.type !== 'divider')
      .map((item) => item.uniqueId);
    if (!sortedMediaIds?.[0]) return;

    const currentId = highlightedMediaId.value;

    const lastItem = sortedMediaIds[sortedMediaIds.length - 1];

    // If no current selection, return last item if possible, otherwise first
    if (!currentId) {
      highlightedMediaId.value = lastItem || sortedMediaIds[0];
      return;
    }

    const currentIndex = sortedMediaIds.indexOf(currentId);

    // If current item not found, reset to last item if possible, otherwise first
    if (currentIndex === -1) {
      highlightedMediaId.value = lastItem || sortedMediaIds[0];
      return;
    }

    // Find previous selectable media item
    const previousSelectableId = findPreviousSelectableMedia(
      mediaList,
      currentIndex,
    );
    if (!previousSelectableId) return;
    highlightedMediaId.value = previousSelectableId;
    if (event.detail?.scrollToSelectedMedia)
      window.dispatchEvent(new CustomEvent('scrollToSelectedMedia'));
  },
  { passive: true },
);

Mousetrap.bind('up', () => {
  executeLocalShortcut('shortcutMediaPrevious');
});
Mousetrap.bind('shift+tab', () => {
  executeLocalShortcut('shortcutMediaPrevious');
});
Mousetrap.bind('down', () => {
  executeLocalShortcut('shortcutMediaNext');
});
Mousetrap.bind('tab', () => {
  executeLocalShortcut('shortcutMediaNext');
});
Mousetrap.bind('space', () => {
  executeLocalShortcut('shortcutMediaPauseResume');
});
Mousetrap.bind('esc', () => {
  executeLocalShortcut('shortcutMediaStop');
});

// Listen for force calendar update event
// useEventListener(
//   window,
//   'force-calendar-update',
//   () => {
//     // Force a reactive update by triggering a change in the selectedDateObject
//     if (selectedDateObject.value) {
//       // Create a new reference to force Vue to re-render
//       const currentDate = selectedDate.value;
//       selectedDate.value = '';
//       nextTick(() => {
//         selectedDate.value = currentDate;
//       });
//     }
//   },
//   { passive: true },
// );

function findNextSelectableMedia(mediaList: MediaItem[], startIndex: number) {
  // Search from next item onwards
  for (let i = startIndex + 1; i < mediaList.length; i++) {
    const mediaItem = mediaList[i];
    if (mediaItem && isMediaSelectable(mediaItem)) {
      return mediaItem.uniqueId;
    }
  }

  // If no selectable item found, wrap to beginning
  return mediaList[0]?.uniqueId || null;
}

function findPreviousSelectableMedia(
  mediaList: MediaItem[],
  startIndex: number,
) {
  // Search from previous item backwards
  for (let i = startIndex - 1; i >= 0; i--) {
    const mediaItem = mediaList[i];
    if (mediaItem && isMediaSelectable(mediaItem)) {
      return mediaItem.uniqueId;
    }
  }

  // If no selectable item found, wrap to end
  return mediaList[mediaList.length - 1]?.uniqueId || null;
}

function isMediaSelectable(mediaItem: MediaItem) {
  if (!mediaItem) return false;

  // Media is selectable if:
  // 1. It doesn't have an extract caption, OR
  // 2. It has a parent unique ID (indicating it's part of a group)
  return !mediaItem.extractCaption || mediaItem.parentUniqueId;
}

watch(
  () => mediaPlaying.value.uniqueId,
  (newMediaUniqueId) => {
    if (newMediaUniqueId) highlightedMediaId.value = newMediaUniqueId;
  },
);

const updateMediaSectionBgColor = ({
  bgColor,
  uniqueId,
}: {
  bgColor: string;
  uniqueId: string;
}) => {
  if (!selectedDateObject.value?.mediaSections) return;
  const section = findMediaSection(
    selectedDateObject.value.mediaSections,
    uniqueId,
  );
  if (section?.config) {
    section.config.bgColor = bgColor;
  }
};

const updateMediaSectionLabel = ({
  label,
  uniqueId,
}: {
  label: string;
  uniqueId: string;
}) => {
  if (!selectedDateObject.value?.mediaSections) return;
  const section = findMediaSection(
    selectedDateObject.value.mediaSections,
    uniqueId,
  );
  if (section?.config) {
    section.config.label = label;
  }
};

// Computed conditions
const showObsBanner = computed(
  () =>
    currentSettings.value?.obsEnable &&
    ['disconnected', 'notConnected'].includes(obsConnectionState.value) &&
    selectedDateObject.value?.today,
);

const showHiddenItemsBanner = computed(
  () => someItemsHiddenForSelectedDate.value,
);

const showDuplicateSongsBanner = computed(
  () => duplicateSongsForWeMeeting.value,
);

const showEmptyState = computed(() => {
  if (!selectedDateObject.value) return true;

  // Count total media items across all sections
  const totalMediaCount = (selectedDateObject.value.mediaSections ?? []).reduce(
    (total, section) => total + (section.items?.length || 0),
    0,
  );

  // Count visible media items across all sections
  const visibleMediaCount = (
    selectedDateObject.value.mediaSections ?? []
  ).reduce(
    (total, section) =>
      total + (section.items?.filter((item) => !item.hidden).length || 0),
    0,
  );

  return (
    (currentSettings.value?.disableMediaFetching && totalMediaCount < 1) ||
    (!currentSettings.value?.disableMediaFetching &&
      ((selectedDateObject.value.meeting &&
        !selectedDateObject.value.complete) ||
        visibleMediaCount === 0))
  );
});

const showBannerColumn = computed(
  () =>
    showObsBanner.value ||
    showHiddenItemsBanner.value ||
    showDuplicateSongsBanner.value ||
    showEmptyState.value,
);

const mediaLists = computed(() => {
  if (!selectedDateObject.value?.mediaSections) return [];

  // Get the appropriate meeting sections based on meeting type (MW vs WE)
  const meetingSections = getMeetingSections(
    selectedDateObject.value?.meeting,
    isCoWeek(selectedDateObject.value?.date),
  );

  // Create a list of all sections that should be displayed
  const sectionsToShow: string[] = [...meetingSections];

  // Add any custom sections that have items (not already in meeting sections)
  selectedDateObject.value.mediaSections.forEach((sectionData) => {
    const sectionId = sectionData.config.uniqueId;
    const isMeetingToday =
      isWeMeetingDay(selectedDateObject.value?.date) ||
      isMwMeetingDay(selectedDateObject.value?.date);
    if (
      !sectionsToShow.includes(sectionId) &&
      ((!isMeetingToday && !meetingSections.includes(sectionId)) ||
        (isMeetingToday && sectionData?.items?.length))
      // sectionData?.items?.filter((item) => !item.hidden).length &&
      // !meetingSections.includes(sectionId) &&
      // !sectionsToShow.includes(sectionId)
    ) {
      sectionsToShow.push(sectionId);
    }
  });

  return selectedDateObject.value.mediaSections
    .filter((m) => !!m.config)
    .filter((m) => {
      const sectionId = m.config?.uniqueId || '';
      // Include if it's a meeting section OR if it has items
      return sectionsToShow.includes(sectionId);
    })
    .sort((a, b) => {
      const aId = a.config?.uniqueId || '';
      const bId = b.config?.uniqueId || '';

      // Get indices from our sectionsToShow array
      const aIndex = sectionsToShow.indexOf(aId);
      const bIndex = sectionsToShow.indexOf(bId);

      // If both are in the list, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one is in the list, prioritize the one in the list
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // If neither is in the list, sort alphabetically
      return aId.localeCompare(bId);
    })
    .map((sectionData) => ({
      config: sectionData?.config,
      items: sectionData?.items || [],
      sectionId: sectionData.config.uniqueId as MediaSectionIdentifier,
    }));
});
</script>
