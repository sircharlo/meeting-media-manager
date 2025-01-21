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
              @click="showHiddenMediaForSelectedDate()"
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
            (getVisibleMediaForSection.additional?.length || 0) < 1) ||
          (!currentSettings?.disableMediaFetching &&
            ((selectedDateObject?.meeting && !selectedDateObject?.complete) ||
              (!selectedDateObject?.customSections?.length &&
                !selectedDateObject?.dynamicMedia?.filter((m) => !m.hidden)
                  .length)))
        "
        :go-to-next-day-with-media="goToNextDayWithMedia"
        :open-import-menu="openImportMenu"
      />
      <template
        v-for="mediaList in mediaLists"
        :key="
          (mediaList.items?.length
            ? mediaList.items.map((m) => m.uniqueId)
            : [mediaList.uniqueId]
          )
            .sort()
            .join(',')
        "
      >
        <MediaList :media-list="mediaList" :open-import-menu="openImportMenu" />
      </template>
      <q-btn
        v-if="selectedDateObject && !selectedDateObject.meeting"
        class="full-width dashed-border big-button"
        color="accent-100"
        icon="mmm-plus"
        :label="t('new-section')"
        text-color="primary"
        unelevated
        @click="addSection()"
      />
      <pre>
      {{
          selectedDateObject?.dynamicMedia
            ?.filter((m) => !m.hidden)
            .map((m) => [m.section, m.uniqueId])
        }}
    </pre
      >
    </div>
    <DialogFileImport
      v-model="showFileImportDialog"
      v-model:jwpub-db="jwpubImportDb"
      v-model:jwpub-documents="jwpubImportDocuments"
      :current-file="currentFile"
      :section="sectionToAddTo"
      :total-files="totalFiles"
      @drop="dropEnd"
    />
    <DialogCustomSectionEdit v-model="showCustomSectionDialog" />
    <q-menu context-menu style="overflow-x: hidden" touch-position>
      <q-list>
        <q-item v-close-popup clickable @click="showCustomSectionDialog = true">
          <q-item-section avatar>
            <q-icon name="mmm-file-" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('edit-sections') }}</q-item-label>
            <q-item-label caption>
              {{ t('edit-sections-explain') }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-page>
</template>

<script setup lang="ts">
import type {
  DocumentItem,
  DynamicMediaSection,
  MediaSection,
  TableItem,
} from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  useMouse,
  usePointer,
  whenever,
} from '@vueuse/core';
import { Buffer } from 'buffer';
import DOMPurify from 'dompurify';
import { storeToRefs } from 'pinia';
import { useMeta } from 'quasar';
import DialogCustomSectionEdit from 'src/components/dialog/DialogCustomSectionEdit.vue';
import DialogFileImport from 'src/components/dialog/DialogFileImport.vue';
import MediaEmptyState from 'src/components/media/MediaEmptyState.vue';
import MediaList from 'src/components/media/MediaList.vue';
import { useLocale } from 'src/composables/useLocale';
import { SORTER } from 'src/constants/general';
import { isCoWeek, isMwMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  addJwpubDocumentMediaToFiles,
  copyToDatedAdditionalMedia,
  downloadFileIfNeeded,
  fetchMedia,
} from 'src/helpers/jw-media';
import { addSection } from 'src/helpers/media-sections';
import {
  decompressJwpub,
  getMediaFromJwPlaylist,
  showMediaWindow,
} from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useObsStateStore } from 'src/stores/obs-state';
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

const showCustomSectionDialog = ref(false);

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

const mediaLists = computed<DynamicMediaSection[]>(() => {
  const mwMeetingDay = isMwMeetingDay(selectedDateObject.value?.date);
  const weMeetingDay = isWeMeetingDay(selectedDateObject.value?.date);
  const isComplete = selectedDateObject.value?.complete;
  const date = selectedDateObject.value?.date;

  const mediaSections: {
    condition: boolean | undefined;
    config: DynamicMediaSection;
  }[] = [
    {
      condition:
        !!selectedDateObject.value?.dynamicMedia?.some(
          (m) => m.section === 'additional',
        ) ||
        (isComplete && weMeetingDay),
      config: {
        alwaysShow: true,
        extraMediaShortcut:
          weMeetingDay &&
          !getVisibleMediaForSection.value.additional?.some(
            (m) => !m.hidden && m.source !== 'watched',
          ),
        items: getVisibleMediaForSection.value.additional || [],
        jwIcon: weMeetingDay ? '' : undefined,
        label: weMeetingDay ? t('public-talk') : t('imported-media'),
        mmmIcon: date && !weMeetingDay ? 'mmm-additional-media' : undefined,
        uniqueId: 'additional',
      },
    },
    {
      condition: weMeetingDay && isComplete,
      config: {
        alwaysShow: true,
        items: getVisibleMediaForSection.value.wt || [],
        jwIcon: '',
        label: t('wt'),
        uniqueId: 'wt',
      },
    },
    {
      condition: mwMeetingDay && isComplete,
      config: {
        alwaysShow: true,
        items: getVisibleMediaForSection.value.tgw || [],
        jwIcon: '',
        label: t('tgw'),
        uniqueId: 'tgw',
      },
    },
    {
      condition: mwMeetingDay && isComplete,
      config: {
        alwaysShow: true,
        items: getVisibleMediaForSection.value.ayfm || [],
        jwIcon: '',
        label: t('ayfm'),
        uniqueId: 'ayfm',
      },
    },
    {
      condition: mwMeetingDay && isComplete,
      config: {
        alwaysShow: true,
        extraMediaShortcut: true,
        items: getVisibleMediaForSection.value.lac || [],
        jwIcon: '',
        label: t('lac'),
        uniqueId: 'lac',
      },
    },
    {
      condition: isCoWeek(date) && isComplete,
      config: {
        alwaysShow: true,
        extraMediaShortcut: true,
        items: getVisibleMediaForSection.value.circuitOverseer || [],
        jwIcon: '',
        label: t('circuit-overseer'),
        uniqueId: 'circuitOverseer',
      },
    },
  ];

  const customSections = selectedDateObject.value?.customSections ?? [];
  customSections.forEach((section) => {
    section.items = getVisibleMediaForSection.value[section.uniqueId] || [];
  });

  const defaultMediaSections =
    mediaSections
      .filter(({ condition }) => condition)
      .map(({ config }) => config) ?? [];

  return [...defaultMediaSections, ...customSections];
});

const { post: postMediaAction } = useBroadcastChannel<string, string>({
  name: 'media-action',
});

watch(
  () => mediaPlayingAction.value,
  (newAction, oldAction) => {
    if (newAction !== oldAction) postMediaAction(newAction);
    if (currentState.currentLangObject?.isSignLanguage) {
      showMediaWindow(newAction === 'play');
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
        ).find((item) => item.uniqueId === mediaPlayingUniqueId.value)
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

watch(
  () => [mediaPlaying.value, mediaPaused.value, mediaPlayingUrl.value],
  ([newMediaPlaying, newMediaPaused]) => {
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
});

watch(
  () => urlVariables.value.mediator,
  () => {
    fetchMedia();
  },
);

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
  if (!isJwpub(files[0]?.path)) showFileImportDialog.value = false;
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

const scroll = (step: number) => {
  const el = document.querySelector('.q-page-container');
  if (!el || stopScrolling.value) return;
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
  if (event?.dataTransfer?.effectAllowed === 'all') {
    event.preventDefault();
    showFileImportDialog.value = true;
  }
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
    }
  } catch (error) {
    errorCatcher(error);
  }
};

whenever(
  () => showFileImportDialog.value,
  () => {
    jwpubImportDb.value = '';
    jwpubImportDocuments.value = [];
    currentFile.value = 0;
    totalFiles.value = 0;
    sectionToAddTo.value = undefined;
  },
);

const duplicateSongsForWeMeeting = computed(() => {
  if (!(selectedDateObject.value?.meeting === 'we')) return false;
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
