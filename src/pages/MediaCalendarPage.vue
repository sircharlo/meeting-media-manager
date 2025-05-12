<template>
  <q-page
    :class="
      !selectedDateObject?.dynamicMedia?.filter((m) => !m.hidden).length
        ? 'flex'
        : ''
    "
    padding
    @dragenter="dropActive"
    @dragover="dropActive"
    @dragstart="dropActive"
  >
    <div class="col">
      <div
        v-if="
          currentSettings?.obsEnable &&
          ['disconnected', 'notConnected'].includes(obsConnectionState) &&
          selectedDateObject?.today
        "
        class="row"
      >
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
      <div v-if="someItemsHiddenForSelectedDate" class="row">
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
      <div v-if="duplicateSongsForWeMeeting" class="row">
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
      <MediaEmptyState
        v-if="
          (currentSettings?.disableMediaFetching &&
            getVisibleMediaForSection.additional.length < 1) ||
          (!currentSettings?.disableMediaFetching &&
            ((selectedDateObject?.meeting && !selectedDateObject?.complete) ||
              !selectedDateObject?.dynamicMedia?.filter((m) => !m.hidden)
                .length))
        "
        :go-to-next-day-with-media="goToNextDayWithMedia"
        :open-import-menu="openImportMenu"
      />
    </div>
    <template
      v-for="mediaList in mediaLists"
      :key="
        mediaList.type +
        (mediaList.items?.map((m) => m.uniqueId) || []).sort().join(',')
      "
    >
      <MediaList :media-list="mediaList" :open-import-menu="openImportMenu" />
    </template>
    <DialogFileImport
      v-model="showFileImportDialog"
      v-model:jwpub-db="jwpubImportDb"
      v-model:jwpub-documents="jwpubImportDocuments"
      :current-file="currentFile"
      :section="sectionToAddTo"
      :total-files="totalFiles"
      @drop="dropEnd"
    />
  </q-page>
</template>

<script setup lang="ts">
import type { DocumentItem, MediaSection, TableItem } from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  useMouse,
  usePointer,
} from '@vueuse/core';
import { Buffer } from 'buffer';
import DialogFileImport from 'components/dialog/DialogFileImport.vue';
import MediaEmptyState from 'components/media/MediaEmptyState.vue';
import MediaList, {
  type MediaListObject,
} from 'components/media/MediaList.vue';
import DOMPurify from 'dompurify';
import { storeToRefs } from 'pinia';
import { useMeta } from 'quasar';
import { useLocale } from 'src/composables/useLocale';
import { SORTER } from 'src/constants/general';
import { isCoWeek, isMwMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  addJwpubDocumentMediaToFiles,
  copyToDatedAdditionalMedia,
  downloadFileIfNeeded,
  fetchMedia,
  getMemorialBackground,
} from 'src/helpers/jw-media';
import {
  decompressJwpub,
  getMediaFromJwPlaylist,
  showMediaWindow,
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
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const showFileImportDialog = ref(false);
const jwpubImportDb = ref('');
const jwpubImportDocuments = ref<DocumentItem[]>([]);

const { dateLocale, t } = useLocale();
useMeta({ title: t('titles.meetingMedia') });

watch(
  () => [jwpubImportDb.value, jwpubImportDocuments.value],
  ([newJwpubImportDb, newJwpubImportDocuments]) => {
    if (!!newJwpubImportDb || newJwpubImportDocuments?.length) {
      showFileImportDialog.value = true;
    }
  },
);

const route = useRoute();
const router = useRouter();

const jwStore = useJwStore();
const { addToAdditionMediaMap, showHiddenMediaForSelectedDate } = jwStore;
const { lookupPeriod, urlVariables } = storeToRefs(jwStore);
const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  getVisibleMediaForSection,
  mediaPaused,
  mediaPlaying,
  mediaPlayingAction,
  mediaPlayingCurrentPosition,
  mediaPlayingPanzoom,
  mediaPlayingSubtitlesUrl,
  mediaPlayingUniqueId,
  mediaPlayingUrl,
  missingMedia,
  selectedDate,
  selectedDateObject,
  someItemsHiddenForSelectedDate,
} = storeToRefs(currentState);
const obsState = useObsStateStore();
const { obsConnectionState } = storeToRefs(obsState);

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

const mediaLists = computed(() => {
  const mwMeetingDay = isMwMeetingDay(selectedDateObject.value?.date);
  const weMeetingDay = isWeMeetingDay(selectedDateObject.value?.date);
  const all: (false | MediaListObject | undefined)[] = [
    {
      alwaysShow:
        !!selectedDateObject.value?.dynamicMedia?.filter(
          (m) => m.section === 'additional',
        )?.length ||
        (!!selectedDateObject.value?.complete && weMeetingDay),
      extraMediaShortcut:
        weMeetingDay &&
        !getVisibleMediaForSection.value.additional.filter(
          (m) => !m.hidden && m.source !== 'watched',
        ).length,
      items: getVisibleMediaForSection.value.additional,
      jwIcon: weMeetingDay ? '' : undefined,
      label: weMeetingDay ? t('public-talk') : t('imported-media'),
      mmmIcon:
        selectedDateObject.value?.date && !weMeetingDay
          ? 'mmm-additional-media'
          : undefined,
      type: 'additional',
    },
    weMeetingDay &&
      selectedDateObject.value?.complete && {
        alwaysShow: true,
        items: getVisibleMediaForSection.value.wt,
        jwIcon: '',
        label: t('wt'),
        type: 'wt',
      },
    mwMeetingDay &&
      selectedDateObject.value?.complete && {
        alwaysShow: true,
        items: getVisibleMediaForSection.value.tgw,
        jwIcon: '',
        label: t('tgw'),
        type: 'tgw',
      },
    mwMeetingDay &&
      selectedDateObject.value?.complete && {
        alwaysShow: true,
        items: getVisibleMediaForSection.value.ayfm,
        jwIcon: '',
        label: t('ayfm'),
        type: 'ayfm',
      },
    mwMeetingDay &&
      selectedDateObject.value?.complete && {
        alwaysShow: true,
        extraMediaShortcut: true,
        items: getVisibleMediaForSection.value.lac,
        jwIcon: '',
        label: t('lac'),
        type: 'lac',
      },
    isCoWeek(selectedDateObject.value?.date) &&
      selectedDateObject.value?.complete && {
        alwaysShow: true,
        extraMediaShortcut: true,
        items: getVisibleMediaForSection.value.circuitOverseer,
        jwIcon: '',
        label: t('circuit-overseer'),
        type: 'circuitOverseer',
      },
  ];

  return all.filter((m) => !!m);
});

const { post: postMediaAction } = useBroadcastChannel<string, string>({
  name: 'media-action',
});

const { post: postCameraStream } = useBroadcastChannel<
  null | string,
  null | string
>({
  name: 'camera-stream',
});

const appSettingsStore = useAppSettingsStore();

watch(
  () => mediaPlayingAction.value,
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

const { post: postMediaUrl } = useBroadcastChannel<string, string>({
  name: 'media-url',
});

const { post: postCustomDuration } = useBroadcastChannel<
  string | undefined,
  string | undefined
>({
  name: 'custom-duration',
});

watch(
  () => mediaPlayingUrl.value,
  (newUrl, oldUrl) => {
    if (newUrl === oldUrl) return;
    postMediaUrl(newUrl);
    postCustomDuration(undefined);

    const customDuration =
      (
        lookupPeriod.value[currentCongregation.value]?.flatMap(
          (item) => item.dynamicMedia,
        ) ?? []
      ).find((item) => item.uniqueId === mediaPlayingUniqueId.value)
        ?.customDuration || undefined;

    if (customDuration) {
      postCustomDuration(JSON.stringify(customDuration));
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

watch(
  () => [mediaPlaying.value, mediaPaused.value, mediaPlayingUrl.value],
  ([newMediaPlaying, newMediaPaused, newMediaPlayingUrl]) => {
    if (
      currentSettings.value?.obsPostponeImages &&
      newMediaPlaying &&
      !newMediaPaused &&
      typeof newMediaPlayingUrl === 'string' &&
      isImage(newMediaPlayingUrl)
    ) {
      return;
    }
    sendObsSceneEvent(
      newMediaPaused ? 'camera' : newMediaPlaying ? 'media' : 'camera',
    );
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
          ?.filter((day) => day.meeting || day.dynamicMedia.length > 0)
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

const sectionToAddTo = ref<MediaSection | undefined>();

useEventListener<CustomEvent<{ section: MediaSection | undefined }>>(
  window,
  'openFileImportDialog',
  (e) => {
    sectionToAddTo.value = e.detail.section;
    showFileImportDialog.value = true;
  },
  { passive: true },
);
useEventListener<
  CustomEvent<{
    files: (File | string)[];
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
  checkMemorialDate();
});

const { post: postCustomBackground } = useBroadcastChannel<string, string>({
  name: 'custom-background',
});

watch(selectedDate, () => {
  checkMemorialDate();
});

watch(
  () => urlVariables.value.mediator,
  () => {
    fetchMedia();
  },
);

const addToFiles = async (files: (File | string)[] | FileList) => {
  if (!files) return;
  totalFiles.value = files.length;
  if (!Array.isArray(files)) files = Array.from(files);
  if (files.length > 1) {
    const jwPubFile = files.find((f) => isJwpub(getLocalPathFromFileObject(f)));
    if (jwPubFile) {
      files = [jwPubFile];
      createTemporaryNotification({
        caption: t('jwpub-file-found'),
        message:
          t('processing') +
          ' ' +
          path.basename(getLocalPathFromFileObject(files[0])),
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
          path.basename(getLocalPathFromFileObject(files[0])),
      });
    }
  }
  for (const file of files) {
    let filepath = getLocalPathFromFileObject(file);
    try {
      if (!filepath) continue;
      // Check if file is remote URL; if so, download it
      if (isRemoteFile(file)) {
        const baseFileName = path.basename(new URL(filepath).pathname);
        filepath = (
          await downloadFileIfNeeded({
            dir: await getTempPath(),
            filename: await window.electronApi.inferExtension(
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
            showFileImportDialog.value = false;
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
        addToAdditionMediaMap(
          additionalMedia,
          sectionToAddTo.value,
          currentState.currentCongregation,
          selectedDateObject.value,
          isCoWeek(selectedDateObject.value?.date),
        );
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
        const filePaths = files.map((file) =>
          path.join(unzipDirectory, file.name),
        );
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
  if (!isJwpub(getLocalPathFromFileObject(files[0])))
    showFileImportDialog.value = false;
};

const openImportMenu = (section: MediaSection | undefined) => {
  window.dispatchEvent(
    new CustomEvent<{ section: MediaSection | undefined }>('openImportMenu', {
      detail: { section },
    }),
  );
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
    showFileImportDialog.value = true;
    stopScrolling.value = true;
  }
};

const dropEnd = (event: DragEvent) => {
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
      addToFiles(droppedStuff).catch((error) => {
        errorCatcher(error);
      });
    }
  } catch (error) {
    errorCatcher(error);
  }
};

watch(
  () => showFileImportDialog.value,
  (newVal) => {
    if (newVal) {
      jwpubImportDb.value = '';
      jwpubImportDocuments.value = [];
      currentFile.value = 0;
      totalFiles.value = 0;
    } else {
      scroll(); // Scroll to top when dialog closes
    }
  },
);

const duplicateSongsForWeMeeting = computed(() => {
  // if (!(selectedDateObject.value?.meeting === 'we')) return false;
  const songNumbers: (number | string)[] =
    selectedDateObject.value?.dynamicMedia
      ?.filter((m) => !m.hidden && m.tag?.type === 'song' && m.tag?.value)
      .map((m) => m.tag?.value)
      .filter(
        (value): value is number | string =>
          typeof value === 'string' || typeof value === 'number',
      ) || [];
  if (songNumbers.length < 2) return false;
  const songSet = new Set(songNumbers);
  return songSet.size !== songNumbers.length;
});
</script>
