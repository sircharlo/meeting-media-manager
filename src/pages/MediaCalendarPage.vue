<template>
  <q-page
    padding
    @dragenter="dropActive"
    @dragover="dropActive"
    @dragstart="dropActive"
  >
    <div v-if="bannerColumnVisible" class="col">
      <q-slide-transition v-for="b in pageBanners" :key="b.key">
        <div class="row">
          <q-banner :class="b.className" inline-actions rounded>
            {{ t(b.textKey) }}
            <template #avatar>
              <q-avatar v-if="b.avatarClass" :class="b.avatarClass" size="lg">
                <q-icon :name="b.icon" size="sm" />
              </q-avatar>
              <q-icon v-else :name="b.icon" size="lg" />
            </template>
            <template #action>
              <q-btn
                v-for="a in b.actions || []"
                :key="a.labelKey"
                flat
                :label="t(a.labelKey)"
                @click="a.onClick()"
              />
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
          :selected-media-items="selectedMediaItems"
          @item-clicked="handleMediaItemClick"
          @update-media-section-bg-color="updateMediaSectionBgColor"
          @update-media-section-label="updateMediaSectionLabel"
        />
      </template>
    </template>
    <q-btn
      v-if="selectedDateObject && !selectedDayMeetingType && !showEmptyState"
      :class="{
        'full-width': true,
        'dashed-border': true,
        'big-button': true,
      }"
      color="accent-100"
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
    <DialogJwpubMediaPicker
      :db-path="jwpubImportDb"
      :dialog-id="'media-calendar-jwpub-media-picker'"
      :document="selectedDocument"
      :model-value="showMediaPicker"
      :section="sectionToAddTo"
      @cancel="onMediaPickerCancel"
      @ok="onMediaPickerOk"
      @update:model-value="showMediaPicker = $event"
    />
  </q-page>
</template>

<script setup lang="ts">
import type {
  DocumentItem,
  MediaItem,
  MediaSectionIdentifier,
} from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  watchImmediate,
} from '@vueuse/core';
import { Buffer } from 'buffer';
import DialogFileImport from 'components/dialog/DialogFileImport.vue';
import DialogJwpubMediaPicker from 'components/dialog/DialogJwpubMediaPicker.vue';
import DialogSectionPicker from 'components/dialog/DialogSectionPicker.vue';
import MediaEmptyState from 'components/media/MediaEmptyState.vue';
import MediaList from 'components/media/MediaList.vue';
import DOMPurify from 'dompurify';
import Mousetrap from 'mousetrap';
import { storeToRefs } from 'pinia';
import { useMeta, useQuasar } from 'quasar';
import { useLocale } from 'src/composables/useLocale';
import { defaultAdditionalSection } from 'src/composables/useMediaSection';
import { useMediaSectionRepeat } from 'src/composables/useMediaSectionRepeat';
import { SORTER } from 'src/constants/general';
import { jwIcons } from 'src/constants/jw-icons';
import { getMeetingSections } from 'src/constants/media';
import { isCoWeek, isMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addDayToExportQueue } from 'src/helpers/export-media';
import {
  copyToDatedAdditionalMedia,
  downloadFileIfNeeded,
  fetchMedia,
  getMemorialBackground,
} from 'src/helpers/jw-media';
import { sendKeyboardShortcut } from 'src/helpers/keyboard-shortcuts';
import { executeLocalShortcut } from 'src/helpers/keyboardShortcuts';
import {
  addSection,
  findMediaSection,
  getOrCreateMediaSection,
} from 'src/helpers/media-sections';
import { decompressJwpub, showMediaWindow } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { triggerZoomScreenShare } from 'src/helpers/zoom';
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
import {
  findDb,
  getPublicationInfoFromDb,
  tableExists,
} from 'src/utils/sqlite';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';
import { computed, nextTick, onMounted, ref, type Ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const $q = useQuasar();

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
const { deleteMediaItems, hideMediaItems, showHiddenMediaForSelectedDate } =
  jwStore;
const { lookupPeriod, urlVariables } = storeToRefs(jwStore);
const currentState = useCurrentStateStore();
const { getMeetingType } = currentState;
const {
  countItemsForSelectedDate,
  countItemsHiddenForSelectedDate,
  currentCongregation,
  currentLangObject,
  currentSettings,
  isSelectedDayToday,
  mediaIsPlaying,
  mediaPaused,
  mediaPlaying,
  mediaWindowCustomBackground,
  missingMedia,
  selectedDate,
  selectedDateObject,
  selectedDayMeetingType,
  someItemsHiddenForSelectedDate,
} = storeToRefs(currentState);
const obsState = useObsStateStore();
const { obsConnectionState } = storeToRefs(obsState);

const totalFiles = ref(0);
const currentFile = ref(0);
const showFileImport = ref(false);
const showSectionPicker = ref(false);
const showMediaPicker = ref(false);
const selectedDocument = ref<DocumentItem | undefined>();
const pendingFiles = ref<(File | string)[]>([]);

// Banner visibility state for transitions
const bannerColumnVisible = ref(false);

// Reset progress tracking when file import dialog closes
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

    const isPlay = newAction === 'play';
    const isSignLang = currentLangObject.value?.isSignLanguage;

    // Always show media window when playing
    if (isPlay) showMediaWindow(true);

    // Handle sign language special cases
    if (isSignLang) {
      if (isPlay) return showMediaWindow(true);

      const cameraId = appSettingsStore.displayCameraId;
      return cameraId ? postCameraStream(cameraId) : showMediaWindow(false);
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

const { post: postZoomPan } = useBroadcastChannel<
  Partial<Record<string, number>>,
  Partial<Record<string, number>>
>({ name: 'zoom-pan' });

watch(
  () => [mediaPlaying.value.zoom, mediaPlaying.value.pan],
  (newValues, oldValues) => {
    try {
      const [newZoom, newPan] = newValues as [
        number,
        Partial<{ x: number; y: number }>,
      ];
      const [oldZoom, oldPan] = oldValues as [
        number,
        Partial<{ x: number; y: number }>,
      ];
      // Only pass the serializable zoomPan state (scale, x, y)
      const serializableZoomPan =
        newZoom && newPan
          ? {
              scale: newZoom,
              x: newPan.x,
              y: newPan.y,
            }
          : undefined;

      const serializableOldZoomPan =
        oldZoom && oldPan
          ? {
              scale: oldZoom,
              x: oldPan.x,
              y: oldPan.y,
            }
          : undefined;

      if (
        JSON.stringify(serializableZoomPan) !==
        JSON.stringify(serializableOldZoomPan)
      ) {
        postZoomPan(serializableZoomPan ?? {});
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

const pageBanners = computed(() => {
  const banners: {
    actions?: { labelKey: string; onClick: () => void }[];
    avatarClass?: string;
    className: string;
    icon: string;
    key: string;
    textKey: string;
  }[] = [];

  if (showObsBanner.value) {
    banners.push({
      className: 'bg-negative text-white full-width',
      icon: 'mmm-obs-studio',
      key: 'obs',
      textKey: 'obs-studio-disconnected-banner',
    });
  }

  if (someItemsHiddenForSelectedDate.value) {
    banners.push({
      actions: [
        {
          labelKey: 'show-all-media',
          onClick: () =>
            showHiddenMediaForSelectedDate(
              currentCongregation.value,
              selectedDateObject.value,
            ),
        },
      ],
      avatarClass: 'bg-white text-warning',
      className: 'bg-warning text-white full-width',
      icon: 'mmm-file-hidden',
      key: 'hidden-items',
      textKey: 'some-media-items-are-hidden',
    });
  }

  if (duplicateSongsForWeMeeting.value) {
    banners.push({
      avatarClass: 'bg-white text-warning',
      className: 'bg-warning text-white full-width',
      icon: 'mmm-music-note',
      key: 'duplicate-songs',
      textKey: 'some-songs-are-duplicated',
    });
  }

  return banners;
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

      triggerZoomScreenShare(false);

      mediaPlaying.value = {
        action: '',
        currentPosition: 0,
        pan: {
          x: 0,
          y: 0,
        },
        seekTo: 0,
        subtitlesUrl: '',
        uniqueId: '',
        url: '',
        zoom: 1,
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
    console.log('🔄 [MediaCalendarPage] Media state watcher triggered:', {
      enableCustomEvents: currentSettings.value?.enableCustomEvents,
      newMediaPaused,
      newMediaPlaying,
      newMediaPlayingUrl,
      oldMediaPlayingUrl,
    });

    // Custom integration events
    if (currentSettings.value?.enableCustomEvents) {
      console.log('🔄 [CustomEvents] Custom events enabled');

      if (newMediaPlaying && !oldMediaPlayingUrl) {
        // Media started playing (from nothing to something)
        if (currentSettings.value?.customEventMediaPlayShortcut) {
          console.log(
            '🔄 [CustomEvents] Sending media play event shortcut:',
            currentSettings.value?.customEventMediaPlayShortcut,
          );
          sendKeyboardShortcut(
            currentSettings.value?.customEventMediaPlayShortcut,
            'CustomEvents',
          );
        }
      } else if (newMediaPaused && newMediaPlayingUrl) {
        // Media paused
        if (currentSettings.value?.customEventMediaPauseShortcut) {
          console.log(
            '🔄 [CustomEvents] Sending media pause event shortcut:',
            currentSettings.value?.customEventMediaPauseShortcut,
          );
          sendKeyboardShortcut(
            currentSettings.value?.customEventMediaPauseShortcut,
            'CustomEvents',
          );
        }
      } else if (!newMediaPlaying && oldMediaPlayingUrl) {
        // Media stopped (from something to nothing)
        if (currentSettings.value?.customEventMediaStopShortcut) {
          console.log(
            '🔄 [CustomEvents] Sending media stop event shortcut:',
            currentSettings.value?.customEventMediaStopShortcut,
          );
          sendKeyboardShortcut(
            currentSettings.value?.customEventMediaStopShortcut,
            'CustomEvents',
          );
        }

        if (currentSettings.value?.customEventLastSongShortcut) {
          // Since the shortcut is set, check if this was the last song in the meeting
          if (
            selectedDateObject.value &&
            selectedDayMeetingType.value &&
            oldMediaPlayingUrl
          ) {
            // This is a meeting day and something was playing before
            console.log(
              '🔄 [CustomEvents Verbose] Checking if the last played media item was the last song in the meeting',
            );

            // Check if the stopped media was a song and if it's the last one
            const allSongs: MediaItem[] = [];
            if (selectedDateObject.value.mediaSections) {
              Object.values(selectedDateObject.value.mediaSections).forEach(
                (section) => {
                  if (section.items) {
                    section.items.forEach((item) => {
                      if (item.tag?.type === 'song' && !item.hidden) {
                        allSongs.push(item);
                      }
                    });
                  }
                },
              );
            }

            console.log(
              '🔄 [CustomEvents Verbose] Total songs found in meeting:',
              allSongs.length,
            );

            // Check if the stopped media was the last song
            const lastSongUrl =
              allSongs[allSongs.length - 1]?.fileUrl ||
              allSongs[allSongs.length - 1]?.streamUrl;
            const stoppedWasLastSong =
              allSongs.length > 0 && lastSongUrl === oldMediaPlayingUrl;

            console.log(
              '🔄 [CustomEvents Verbose] Last song detection variables:',
              {
                lastSongUrl,
                oldMediaPlayingUrl,
                stoppedWasLastSong,
              },
            );

            if (stoppedWasLastSong) {
              console.log(
                '🔄 [CustomEvents] Sending last song played event shortcut:',
              );
              sendKeyboardShortcut(
                currentSettings.value?.customEventLastSongShortcut,
                'CustomEvents',
              );
            }
          }
        }
      }
    }

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
      console.log(
        '🔄 [MediaCalendarPage] OBS image postponement active, skipping scene change',
      );
      return;
    }

    const targetScene = newMediaPaused
      ? 'camera'
      : newMediaPlaying
        ? 'media'
        : 'camera';
    const wasPlayingBefore = !!oldMediaPlayingUrl;

    console.log('🔄 [MediaCalendarPage] OBS scene decision:', {
      newMediaPaused,
      newMediaPlaying,
      oldMediaPlayingUrl,
      targetScene,
      wasPlayingBefore,
    });

    if (targetScene === 'media') {
      if (wasPlayingBefore) {
        // If something was playing before, we change the scene immediately
        console.log(
          '🔄 [MediaCalendarPage] Switching to media scene immediately',
        );
        sendObsSceneEvent('media');
      } else {
        // If nothing was already playing, we wait a bit before changing the scene to prevent seeing the fade effect in OBS
        console.log('🔄 [MediaCalendarPage] Waiting for scene change delay');
        mediaSceneTimeout = setTimeout(() => {
          console.log(
            '🔄 [MediaCalendarPage] Executing delayed media scene change',
          );
          sendObsSceneEvent('media');
          mediaSceneTimeout = null;
        }, changeDelay);
      }
    } else {
      console.log('🔄 [MediaCalendarPage] Switching to camera scene');
      sendObsSceneEvent('camera');
    }
  },
);

const seenErrors = new Set<string>();
watch(
  () =>
    lookupPeriod.value[currentCongregation.value]
      ?.filter((d) => d.status === 'error')
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
        caption: getLocalDate(
          errorVal,
          dateLocale.value,
          currentSettings.value?.localDateFormat,
        ),
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
            return getMeetingType(day.date) || hasMedia;
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
      caption: t('dont-forget-to-add-circuit-overseer-date'),
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
    // Show section picker if more than one section exists
    if (
      (selectedDateObject.value?.mediaSections?.length || 0) > 1 &&
      !event.detail?.section
    ) {
      pendingFiles.value = event.detail?.files ?? [];
      showSectionPicker.value = true;
    } else {
      sectionToAddTo.value = event.detail?.section;
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

useEventListener<
  CustomEvent<{
    dbPath: string;
    document: DocumentItem;
  }>
>(
  window,
  'openJwpubMediaPicker',
  (e) => {
    console.log('🎯 openJwpubMediaPicker event received:', e.detail);
    jwpubImportDb.value = e.detail?.dbPath;
    selectedDocument.value = e.detail?.document;
    showMediaPicker.value = true;
  },
  { passive: true },
);

const checkMemorialDate = async () => {
  let bg: string | undefined = mediaWindowCustomBackground.value;
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

    // Only pass the serializable zoom and pan state
    const serializableZoomPan =
      mediaPlaying.value.zoom && mediaPlaying.value.pan
        ? {
            scale: mediaPlaying.value.zoom,
            x: mediaPlaying.value.pan.x,
            y: mediaPlaying.value.pan.y,
          }
        : undefined;
    postZoomPan(serializableZoomPan ?? {});

    postMediaUrl(mediaPlaying.value.url);
    postCustomDuration(JSON.stringify(customDuration.value));
    postCustomBackground(mediaWindowCustomBackground.value);
  },
);

// Selected media items state
const selectedMediaItems = ref<string[]>([]); // Array of selected media item IDs
const lastExtendDirection = ref<'down' | 'up' | null>(null); // Track the last extension direction

watchImmediate(
  () => selectedDate.value,
  async (newVal) => {
    selectedMediaItems.value = [];
    lastExtendDirection.value = null;

    if (!newVal || !selectedDateObject.value?.mediaSections) return;
    checkMemorialDate();

    if (isWeMeetingDay(selectedDateObject.value.date)) {
      getOrCreateMediaSection(selectedDateObject.value.mediaSections, 'pt', {
        ...defaultAdditionalSection.config,
        jwIcon: jwIcons.pt,
        label: t('pt'),
      });
    }
  },
);

const addToFiles = async (files: (File | string)[] | FileList) => {
  if (!files) return;
  totalFiles.value = files.length;
  if (!Array.isArray(files)) files = Array.from(files);

  // Set a default section if...
  if (
    !sectionToAddTo.value && // ... a section is not already set AND
    selectedDateObject.value && // ... a date is selected AND
    isWeMeetingDay(selectedDateObject.value.date) && // ... this is a WE meeting AND
    !isCoWeek(selectedDateObject.value.date) // ... and this is not a CO week
  ) {
    sectionToAddTo.value = 'pt'; // ... set section to pt (public talk)
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
        console.log('🎯 [addToFiles] Processing JWPUB file:', filepath);
        // First, only decompress the db in memory to get the publication info and derive the destination path
        console.log('🎯 [addToFiles] Decompressing JWPUB for db extraction');
        const tempJwpubContents = await decompress(filepath);
        console.log(
          '🎯 [addToFiles] Decompressed JWPUB contents:',
          tempJwpubContents.length,
          'files',
        );
        const tempContentFile = tempJwpubContents.find((tempJwpubContent) =>
          tempJwpubContent.path.endsWith('contents'),
        );
        console.log(
          '🎯 [addToFiles] Found contents file:',
          tempContentFile ? 'yes' : 'no',
        );
        if (!tempContentFile) {
          console.log('🎯 [addToFiles] No contents file found, returning');
          return;
        }
        console.log('🎯 [addToFiles] Getting temp directory');
        const tempDir = await getTempPath();
        console.log('🎯 [addToFiles] Temp dir:', tempDir);
        if (!tempDir) {
          console.log('🎯 [addToFiles] No temp dir, returning');
          return;
        }
        await ensureDir(tempDir);
        console.log('🎯 [addToFiles] Ensured temp dir exists');

        let tempFilePath: string | undefined;
        let tempDbFilePath: string | undefined;

        try {
          tempFilePath = join(tempDir, basename(filepath) + '-contents');
          console.log(
            '🎯 [addToFiles] Writing contents to temp file:',
            tempFilePath,
          );
          await writeFile(tempFilePath, tempContentFile.data);
          console.log('🎯 [addToFiles] Decompressing temp contents file');
          const tempJwpubFileContents = await decompress(tempFilePath);
          console.log(
            '🎯 [addToFiles] Decompressed temp contents:',
            tempJwpubFileContents.length,
            'files',
          );
          const tempDbFile = tempJwpubFileContents.find(
            (tempJwpubFileContent) => tempJwpubFileContent.path.endsWith('.db'),
          );
          console.log(
            '🎯 [addToFiles] Found db file:',
            tempDbFile ? 'yes' : 'no',
          );
          if (!tempDbFile) {
            console.log('🎯 [addToFiles] No db file found, returning');
            return;
          }
          tempDbFilePath = join(tempDir, basename(filepath) + '.db');
          console.log(
            '🎯 [addToFiles] Writing db to temp path:',
            tempDbFilePath,
          );
          await writeFile(tempDbFilePath, tempDbFile.data);
          console.log('🎯 [addToFiles] Checking if db file exists');
          if (!(await exists(tempDbFilePath))) {
            console.log('🎯 [addToFiles] Db file does not exist, returning');
            return;
          }
          console.log('🎯 [addToFiles] Getting publication info from db');
          const publication = getPublicationInfoFromDb(tempDbFilePath);
          console.log('🎯 [addToFiles] Publication info:', publication);
          console.log('🎯 [addToFiles] Getting publication directory');
          const publicationDirectory = await getPublicationDirectory(
            publication,
            currentSettings.value?.cacheFolder,
          );
          console.log(
            '🎯 [addToFiles] Publication directory:',
            publicationDirectory,
          );
          if (!publicationDirectory) {
            console.log('🎯 [addToFiles] No publication directory, returning');
            return;
          }
          console.log(
            '🎯 [addToFiles] Decompressing JWPUB to publication directory',
          );
          const unzipDir = await decompressJwpub(
            filepath,
            publicationDirectory,
          );
          console.log('🎯 [addToFiles] Unzip dir:', unzipDir);
          console.log('🎯 [addToFiles] Finding db in unzip dir');
          const db = await findDb(unzipDir);
          console.log('🎯 [addToFiles] Db found:', db ? 'yes' : 'no');
          if (!db) {
            console.log('🎯 [addToFiles] No db found, returning');
            return;
          }
          jwpubImportDb.value = db;
          console.log('🎯 [addToFiles] Set jwpubImportDb');
          console.log('🎯 [addToFiles] Checking multimedia count');
          if (
            executeQuery<{ count: number }>(
              db,
              'SELECT COUNT(*) as count FROM Multimedia;',
            )?.[0]?.count === 0
          ) {
            console.log('🎯 [addToFiles] No multimedia, showing notification');
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
            console.log('🎯 [addToFiles] Has multimedia, checking tables');
            const documentMultimediaTableExists = tableExists(
              db,
              'DocumentMultimedia',
            );
            console.log(
              '🎯 [addToFiles] DocumentMultimedia table exists:',
              documentMultimediaTableExists,
            );
            const mmTable = documentMultimediaTableExists
              ? 'DocumentMultimedia'
              : 'Multimedia';
            console.log('🎯 [addToFiles] Using mmTable:', mmTable);
            console.log('🎯 [addToFiles] Executing query for documents');
            jwpubImportDocuments.value = executeQuery<DocumentItem>(
              db,
              `SELECT DISTINCT Document.DocumentId, Title FROM Document JOIN ${mmTable} ON Document.DocumentId = ${mmTable}.DocumentId;`,
            );
            console.log(
              '🎯 [addToFiles] Documents found:',
              jwpubImportDocuments.value.length,
            );
          }
        } finally {
          // Clean up temp files
          if (tempFilePath) {
            console.log('🎯 [addToFiles] Removing temp contents file');
            remove(tempFilePath).catch((err) =>
              console.error('Failed to remove temp contents file:', err),
            );
          }
          if (tempDbFilePath) {
            console.log('🎯 [addToFiles] Removing temp db file');
            remove(tempDbFilePath).catch((err) =>
              console.error('Failed to remove temp db file:', err),
            );
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
        console.log('🎯 Archive file detected:', filepath);
        const unzipDirectory = join(await getTempPath(), basename(filepath));
        console.log('🎯 Unzip directory:', unzipDirectory);
        await remove(unzipDirectory);
        console.log('🎯 Removed unzip directory');
        await decompress(filepath, unzipDirectory);
        console.log('🎯 Decompressed archive');
        const files = await readdir(unzipDirectory);
        console.log('🎯 Reading unzip directory', files);
        const filePaths = files.map((file) => join(unzipDirectory, file.name));
        console.log('🎯 Mapping files', filePaths);
        await addToFiles(filePaths);
        console.log('🎯 Added files');
        await remove(unzipDirectory);
        console.log('🎯 Removed unzip directory');
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

const onMediaPickerOk = () => {
  showMediaPicker.value = false;
  selectedDocument.value = undefined;
  jwpubImportDb.value = '';
  showFileImport.value = false;
};

const onMediaPickerCancel = () => {
  showMediaPicker.value = false;
  selectedDocument.value = undefined;
  jwpubImportDb.value = '';
  showFileImport.value = false;
};

const dropActive = (event: DragEvent) => {
  sectionToAddTo.value = undefined;
  if (['all', 'copyLink'].includes(event?.dataTransfer?.effectAllowed || '')) {
    event.preventDefault();

    // Only show file import dialog for non-WE meetings
    // if (!selectedDateObject.value || !isWeMeetingDay(selectedDateObject.value.date)) {
    showFileImport.value = true;
    // }
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

      // Show section picker if...
      if (
        (selectedDateObject.value?.mediaSections?.length || 0) > 1 && // ... more than one section exists AND
        (!isWeMeetingDay(selectedDateObject.value?.date) || // ... EITHER this is not a WE meeting
          isCoWeek(selectedDateObject.value?.date)) // ... OR this is a CO week
      ) {
        pendingFiles.value = droppedStuff;
        showSectionPicker.value = true;
      } else {
        // Otherwise, process files directly without showing the section picker
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
  if (!selectedDateObject.value || selectedDayMeetingType.value !== 'we')
    return false;

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

    const currentId = selectedMediaItems.value[0];

    // If no current selection, return first item
    if (!currentId) {
      selectedMediaItems.value = [sortedMediaIds[0]];
      return;
    }

    const currentIndex = sortedMediaIds.indexOf(currentId);

    // If current item not found, reset to first
    if (currentIndex === -1) {
      selectedMediaItems.value = [sortedMediaIds[0]];
      return;
    }

    // Find next selectable media item
    const nextSelectableId = findNextSelectableMedia(mediaList, currentIndex);
    if (!nextSelectableId) return;
    selectedMediaItems.value = [nextSelectableId];
    if (event.detail?.scrollToSelectedMedia)
      window.dispatchEvent(new CustomEvent('scrollToSelectedMedia'));
    anchorId.value = nextSelectableId;
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

    if (selectedMediaItems.value?.length > 1) {
      // If multiple items are selected, reduce to the first one
      const firstSelected = selectedMediaItems.value[0];
      if (!firstSelected) return;
      selectedMediaItems.value = [firstSelected];
      return;
    }

    const currentId = selectedMediaItems.value[0];

    const lastItem = sortedMediaIds[sortedMediaIds.length - 1];

    // If no current selection, return last item if possible, otherwise first
    if (!currentId) {
      selectedMediaItems.value = [lastItem || sortedMediaIds[0]];
      return;
    }

    const currentIndex = sortedMediaIds.indexOf(currentId);

    // If current item not found, reset to last item if possible, otherwise first
    if (currentIndex === -1) {
      selectedMediaItems.value = [lastItem || sortedMediaIds[0]];
      return;
    }

    // Find previous selectable media item
    const previousSelectableId = findPreviousSelectableMedia(
      mediaList,
      currentIndex,
    );
    if (!previousSelectableId) return;
    selectedMediaItems.value = [previousSelectableId];
    if (event.detail?.scrollToSelectedMedia)
      window.dispatchEvent(new CustomEvent('scrollToSelectedMedia'));
    anchorId.value = previousSelectableId;
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
Mousetrap.bind('del', () => {
  if (selectedMediaItems.value.length > 0) {
    // Filter to only include additional media items (similar to MediaItem.vue)
    const deletableSelectedMediaItems = keyboardShortcutMediaList.value
      .filter(
        (item) =>
          selectedMediaItems.value.includes(item.uniqueId) &&
          item.source === 'additional',
      )
      .map((item) => item.uniqueId);

    if (deletableSelectedMediaItems.length > 0) {
      $q.dialog({
        cancel: { label: t('cancel') },
        message: t('delete-selected-media-confirmation', {
          count: deletableSelectedMediaItems?.length || 0,
        }),
        ok: { color: 'negative', label: t('delete') },
        persistent: true,
        title: t('confirm'),
      }).onOk(() => {
        deleteMediaItems(
          deletableSelectedMediaItems,
          currentCongregation.value,
          selectedDateObject.value,
        );
        // Clear selection after deletion
        selectedMediaItems.value = [];
      });
    }
  }
});
Mousetrap.bind('shift+up', () => {
  extendSelection('up');
});
Mousetrap.bind('shift+down', () => {
  extendSelection('down');
});
Mousetrap.bind('mod+a', (e) => {
  e.preventDefault();
  if (keyboardShortcutMediaList.value.length > 0) {
    const allSelectableIds = keyboardShortcutMediaList.value
      .filter((item) => isMediaSelectable(item))
      .map((item) => item.uniqueId);

    if (allSelectableIds.length > 0) {
      selectedMediaItems.value = allSelectableIds;
    }
  }
});
Mousetrap.bind('h', () => {
  if (selectedMediaItems.value.length > 0) {
    $q.dialog({
      cancel: { label: t('cancel') },
      message: t('hide-selected-media-confirmation', {
        count: selectedMediaItems.value.length,
      }),
      ok: { label: t('hide-from-list') },
      persistent: true,
      title: t('confirm'),
    }).onOk(() => {
      hideMediaItems(
        selectedMediaItems.value,
        currentCongregation.value,
        selectedDateObject.value,
      );
      // Clear selection after hiding
      selectedMediaItems.value = [];
    });
  }
});

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
    if (newMediaUniqueId) selectedMediaItems.value = [newMediaUniqueId];
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
    isSelectedDayToday.value,
);

const showEmptyState = computed(() => {
  if (!selectedDateObject.value) return true;

  const noMediaSections = !selectedDateObject.value.mediaSections?.length;

  // Count total media items across all sections
  const totalMediaCount = (selectedDateObject.value.mediaSections ?? []).reduce(
    (total, section) => total + (section.items?.length || 0),
    0,
  );

  return (
    (currentSettings.value?.disableMediaFetching && noMediaSections) ||
    (!currentSettings.value?.disableMediaFetching &&
      ((selectedDayMeetingType.value &&
        (!selectedDateObject.value.status || totalMediaCount === 0)) ||
        (!selectedDayMeetingType.value && noMediaSections)))
  );
});

// Banner column management for transitions
const shouldShowBannerColumn = computed(
  () =>
    showObsBanner.value ||
    someItemsHiddenForSelectedDate.value ||
    duplicateSongsForWeMeeting.value ||
    showEmptyState.value,
);

// Watch for banner column changes and manage visibility for transitions
watch(
  shouldShowBannerColumn,
  (shouldShow) => {
    if (shouldShow) {
      bannerColumnVisible.value = true;
    } else {
      // Delay hiding to allow transition to complete
      setTimeout(() => {
        bannerColumnVisible.value = false;
      }, 300); // Match transition duration
    }
  },
  { immediate: true },
);

const mediaLists = computed(() => {
  if (!selectedDateObject.value?.mediaSections) return [];

  // Get the appropriate meeting sections based on meeting type (MW vs WE)
  const meetingSections = getMeetingSections(
    selectedDayMeetingType.value,
    isCoWeek(selectedDateObject.value?.date),
  );

  // Create a list of all sections that should be displayed
  const sectionsToShow: string[] = [...meetingSections];

  // Add any custom sections that have items (not already in meeting sections)
  selectedDateObject.value.mediaSections.forEach((sectionData) => {
    const sectionId = sectionData.config.uniqueId;
    const isMeetingToday = isMeetingDay(selectedDateObject.value?.date);
    if (
      !sectionsToShow.includes(sectionId) &&
      ((!isMeetingToday && !meetingSections.includes(sectionId)) ||
        (isMeetingToday && sectionData?.items?.length))
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
      sectionId: (sectionData.config?.uniqueId || '') as MediaSectionIdentifier,
    }));
});

const anchorId = ref<null | string>(null);

// Handle item click events from MediaList components
const handleMediaItemClick = (payload: {
  event: MouseEvent;
  mediaItemId: string;
  sectionId: string | undefined;
}) => {
  console.log('Media item clicked:', payload.mediaItemId);
  // Check if Ctrl/Cmd or Shift key is pressed for multiple selection
  const isCtrlPressed = payload.event.ctrlKey || payload.event.metaKey;
  const isShiftPressed = payload.event.shiftKey;

  // If no modifier keys, clear existing selection and select only this item
  if (isCtrlPressed) {
    const index = selectedMediaItems.value.indexOf(payload.mediaItemId);
    if (index === -1) {
      selectedMediaItems.value.push(payload.mediaItemId);
    } else {
      selectedMediaItems.value.splice(index, 1);
    }
  } else if (isShiftPressed) {
    // Find all media items across all sections to determine the range
    const allMediaItems = mediaLists.value
      .flatMap((section) => (section.items || []).map((item) => item.uniqueId))
      .filter((id) => id) as string[];

    const lastSelectedId =
      selectedMediaItems.value[selectedMediaItems.value.length - 1];
    if (!lastSelectedId) return;

    const startIndex = allMediaItems.indexOf(lastSelectedId);
    const endIndex = allMediaItems.indexOf(payload.mediaItemId);

    if (startIndex !== -1 && endIndex !== -1) {
      const [from, to] =
        startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      const rangeIds = allMediaItems.slice(from, to + 1);
      selectedMediaItems.value = Array.from(
        new Set([...rangeIds, ...selectedMediaItems.value]),
      );
    }
  } else {
    selectedMediaItems.value = [payload.mediaItemId];
  }
  anchorId.value = payload.mediaItemId; // new anchor
};

// Function to extend selection using Shift+Up/Shift+Down
function extendSelection(direction: 'down' | 'up') {
  console.trace('extendSelection triggered');

  console.log('🔄 [extendSelection] Starting function', {
    direction,
    selectedItemsCount: selectedMediaItems.value.length,
  });

  if (!selectedMediaItems.value.length) {
    console.log('🔄 [extendSelection] No selected items, returning');
    return;
  }

  // Get all media items in order
  const allMediaItems = keyboardShortcutMediaList.value
    .filter((item) => !item.hidden) // or keep hidden — but be consistent
    .map((item) => item.uniqueId);

  if (!allMediaItems.length) {
    console.log('🔄 [extendSelection] No media items available, returning');
    return;
  }

  // Find the index of the last selected item (the cursor position)
  const lastSelectedId =
    selectedMediaItems.value[
      direction === 'up' ? 0 : selectedMediaItems.value.length - 1
    ];
  if (!lastSelectedId) {
    console.log('🔄 [extendSelection] No last selected item, returning');
    return;
  }

  const currentIndex = allMediaItems.indexOf(lastSelectedId);
  if (currentIndex === -1) {
    console.log(
      '🔄 [extendSelection] Current index not found in allMediaItems, returning',
    );
    return;
  }

  console.log('🔄 [extendSelection] Initial state', {
    allMediaItemsCount: allMediaItems.length,
    currentIndex,
    direction,
    lastSelectedId,
    selectedItems: selectedMediaItems.value,
  });

  // Calculate the new index based on direction
  let newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  // Handle boundary conditions (wrap around if needed)
  if (newIndex < 0) {
    newIndex = allMediaItems.length - 1; // Wrap to last item
    console.log(
      '🔄 [extendSelection] Wrapping newIndex to last item:',
      newIndex,
    );
  } else if (newIndex >= allMediaItems.length) {
    newIndex = 0; // Wrap to first item
    console.log(
      '🔄 [extendSelection] Wrapping newIndex to first item:',
      newIndex,
    );
  }

  const newMediaItemId = allMediaItems[newIndex];
  if (!newMediaItemId) {
    console.log('🔄 [extendSelection] No new media item ID found, returning');
    return;
  }

  // Find the anchor point (the first selected item that doesn't move)
  if (!anchorId.value) {
    console.log(
      '🔄 [extendSelection] No anchorId set, cannot extend selection, returning',
    );
    return;
  }
  const anchorIndex = allMediaItems.indexOf(anchorId.value);
  if (anchorIndex === -1) {
    console.log(
      '🔄 [extendSelection] Anchor index not found in allMediaItems, returning',
    );
    return;
  }

  console.log('🔄 [extendSelection] Anchor and current info', {
    anchorId,
    anchorIndex,
    currentIndex,
    newIndex,
    newMediaItemId,
  });

  // Determine if we're moving in the same direction as the last extension or opposite
  // Only set the last extension direction when selection grows from 1 to 2 items
  if (selectedMediaItems.value.length === 1) {
    // This is the first extension (going from 1 item to 2 items), set the direction
    lastExtendDirection.value = direction;
    console.log(
      '🔄 [extendSelection] Setting lastExtendDirection to',
      direction,
    );
  }

  let shouldExpand = true;
  if (lastExtendDirection.value !== null) {
    // If we have a previous extension direction, determine if we're continuing or reversing
    shouldExpand = direction === lastExtendDirection.value;

    // If we're reversing direction, update the last extension direction
    // if (!shouldExpand) {
    //   // We're shrinking, so update the direction to the current one for next time
    //   // lastExtendDirection.value = direction;
    //   console.log(
    //     '🔄 [extendSelection] Reversing direction, updating lastExtendDirection to',
    //     direction,
    //   );
    // }
  }

  console.log('🔄 [extendSelection] Expansion decision', {
    currentDirection: direction,
    lastExtendDirection: lastExtendDirection.value,
    shouldExpand,
  });

  if (shouldExpand) {
    // Expanding the selection
    console.log('🔄 [extendSelection] EXPANDING selection');
    const newStartIndex = Math.min(anchorIndex, newIndex);
    const newEndIndex = Math.max(anchorIndex, newIndex);
    const newSelection = allMediaItems.slice(newStartIndex, newEndIndex + 1);
    console.log('🔄 [extendSelection] New selection (expansion)', {
      newSelection,
    });
    selectedMediaItems.value = newSelection;
  } else {
    // SHRINKING selection
    console.log('🔄 [extendSelection] SHRINKING selection');

    const sel = selectedMediaItems.value;

    // If we have more than 1 item selected, shrink by removing the end closer to direction reversal
    if (sel.length > 1) {
      if (direction === 'up') {
        // Moving up — remove the FIRST item (bottom of list visually)
        sel.pop();
      } else {
        // Moving down — remove the LAST item (top of list visually)
        sel.shift();
      }
      selectedMediaItems.value = [...sel];
    } else {
      // If only one item left, switch to expansion like normal
      const newStartIndex = Math.min(anchorIndex, newIndex);
      const newEndIndex = Math.max(anchorIndex, newIndex);
      selectedMediaItems.value = allMediaItems.slice(
        newStartIndex,
        newEndIndex + 1,
      );
    }
  }

  console.log('🔄 [extendSelection] Final state', {
    newHighlightedId: newMediaItemId,
    selectedItems: selectedMediaItems.value,
    selectedItemsCount: selectedMediaItems.value.length,
  });
}

watch(
  () => [countItemsHiddenForSelectedDate.value, countItemsForSelectedDate],
  () => {
    // Clear selected media items when date changes
    selectedMediaItems.value = [];
  },
);
</script>
