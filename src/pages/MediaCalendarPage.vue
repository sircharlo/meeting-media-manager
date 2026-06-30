<template>
  <q-dialog
    v-model="mediaFilterVisible"
    class="media-filter-dialog"
    position="top"
    seamless
    style="z-index: 1500 !important"
    @show="focusMediaFilter"
  >
    <q-card class="media-filter-overlay">
      <q-card-section class="q-pa-sm row items-center no-wrap q-gutter-sm">
        <q-input
          ref="mediaFilterInput"
          v-model="mediaFilter"
          autofocus
          bg-color="accent-100"
          color="primary"
          dense
          :label="t('search')"
          outlined
          spellcheck="false"
          @keydown.enter.prevent="goToNextMediaFilterMatch"
          @keydown.escape="closeMediaFilter"
        >
          <template #prepend>
            <q-icon name="mmm-search" />
          </template>
        </q-input>
        <div
          v-if="hasMediaFilterTerms"
          class="media-filter-overlay__count text-caption text-accent-400"
        >
          {{ mediaFilterMatchLabel }}
        </div>
        <q-btn
          color="primary"
          dense
          :disable="!mediaFilterMatchCount"
          flat
          icon="keyboard_arrow_up"
          round
          @click="goToPreviousMediaFilterMatch"
        >
          <q-tooltip v-if="mediaFilterMatchCount">{{
            t('previous-search-match')
          }}</q-tooltip>
        </q-btn>
        <q-btn
          color="primary"
          dense
          :disable="!mediaFilterMatchCount"
          flat
          icon="keyboard_arrow_down"
          round
          @click="goToNextMediaFilterMatch"
        >
          <q-tooltip v-if="mediaFilterMatchCount">{{
            t('next-search-match')
          }}</q-tooltip>
        </q-btn>
        <q-btn
          color="primary"
          dense
          flat
          icon="close"
          round
          @click="closeMediaFilter"
        >
          <q-tooltip>{{ t('close') }}</q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card>
  </q-dialog>
  <q-page
    padding
    @dragenter="dropActive"
    @dragover="dropActive"
    @dragstart="dropActive"
  >
    <div v-if="bannerColumnVisible" class="col">
      <q-slide-transition v-for="b in pageBanners" :key="b.key">
        <div class="row">
          <q-banner :class="b.className" rounded>
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
          :media-filter-terms="mediaFilterTerms"
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
      :color="$q.dark.isActive ? 'grey-9' : 'accent-100'"
      icon="mmm-plus"
      :label="t('new-section')"
      :text-color="$q.dark.isActive ? 'grey-4' : 'primary'"
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
      @cancel="onMediaPickerDismiss"
      @ok="onMediaPickerDismiss"
      @update:model-value="showMediaPicker = $event"
    />
  </q-page>
</template>

<script setup lang="ts">
import type {
  DateInfo,
  DocumentItem,
  MediaItem,
  MediaSectionIdentifier,
  MediaSectionWithConfig,
  PublicationFetcher,
} from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  watchImmediate,
} from '@vueuse/core';
import { Buffer } from 'buffer/';
import DialogFileImport from 'components/dialog/DialogFileImport.vue';
import DialogJwpubMediaPicker from 'components/dialog/DialogJwpubMediaPicker.vue';
import DialogSectionPicker from 'components/dialog/DialogSectionPicker.vue';
import MediaEmptyState from 'components/media/MediaEmptyState.vue';
import MediaList from 'components/media/MediaList.vue';
import DOMPurify from 'dompurify';
import Mousetrap from 'mousetrap';
import { storeToRefs } from 'pinia';
import { type QInput, useMeta, useQuasar } from 'quasar';
import { useLocale } from 'src/composables/useLocale';
import { useMediaSectionRepeat } from 'src/composables/useMediaSectionRepeat';
import { SORTER } from 'src/constants/general';
import {
  getMeetingSections,
  MEDIA_STOP_FADE_DURATION_SECONDS,
} from 'src/constants/media';
import {
  isCoWeek,
  isMeetingDay,
  isMemorialDay,
  isWeMeetingDay,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addDayToExportQueue } from 'src/helpers/export-media';
import {
  copyToDatedAdditionalMedia,
  createMediaItemFromPath,
  downloadAdditionalRemoteVideo,
  downloadFileIfNeeded,
  dynamicMediaMapper,
  fetchMedia,
  getJwMediaInfo,
  getMemorialMedia,
  getPubMediaLinks,
  identifyJwpub,
  stageUserJwpubForRead,
  unzipJwpub,
} from 'src/helpers/jw-media';
import { sendKeyboardShortcut } from 'src/helpers/keyboard-shortcuts';
import { executeLocalShortcut } from 'src/helpers/keyboardShortcuts';
import {
  addSection,
  defaultAdditionalSection,
  findMediaSection,
  getOrCreateMediaSection,
} from 'src/helpers/media-sections';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { triggerMediaWindowAutoHide } from 'src/helpers/mediaWindowAutoHide';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { updateLastUsedDate } from 'src/helpers/usage';
import { triggerZoomScreenShare } from 'src/helpers/zoom';
import { log, uuid } from 'src/shared/vanilla';
import { convertImageIfNeeded, convertPdfToImages } from 'src/utils/converters';
import {
  dateFromString,
  formatDate,
  getDateDiff,
  getLocalDate,
  isInPast,
} from 'src/utils/date';
import {
  getParentDirectory,
  getPublicationDirectory,
  getTempPath,
  isFileUrl,
} from 'src/utils/fs';
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
import { findDb, tableExists } from 'src/utils/sqlite';
import { useAppSettingsStore } from 'stores/app-settings';
import {
  type MediaPlayingState,
  useCurrentStateStore,
} from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';
import {
  computed,
  nextTick,
  onMounted,
  ref,
  type Ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

const { sanitize } = DOMPurify;

const $q = useQuasar();

const jwpubImportDb = ref('');
const jwpubImportDocuments = ref<DocumentItem[]>([]);

const { dateLocale, t } = useLocale();
useMeta({ title: t('titles.meetingMedia') });

const mediaFilter = ref<null | string | undefined>('');
const mediaFilterInput = useTemplateRef<QInput>('mediaFilterInput');
const mediaFilterMatchCount = ref(0);
const mediaFilterMatchIndex = ref(-1);
const mediaFilterVisible = ref(false);

const getMediaFilterValue = (): string => mediaFilter.value?.trim() ?? '';

const mediaFilterTerms = computed(() =>
  getMediaFilterValue().toLocaleLowerCase().split(/\s+/).filter(Boolean),
);

const hasMediaFilterTerms = computed(() => mediaFilterTerms.value.length > 0);

const mediaFilterMatchLabel = computed(() => {
  if (!hasMediaFilterTerms.value) return '';
  if (!mediaFilterMatchCount.value) return t('no-search-results');
  return `${mediaFilterMatchIndex.value + 1} / ${mediaFilterMatchCount.value}`;
});

const getMediaFilterMatches = (): HTMLElement[] =>
  Array.from(
    document.querySelectorAll<HTMLElement>('.media-filter-match-target'),
  ).filter((element) => element.offsetParent !== null);

const scrollToMediaFilterMatch = (index: number) => {
  try {
    const matches = getMediaFilterMatches();
    const match = matches[index];
    if (!match) return;

    matches.forEach((element) =>
      element.classList.remove('media-filter-current-match'),
    );
    match.scrollIntoView({ behavior: 'smooth', block: 'center' });
    match.classList.remove('media-filter-current-match');
    match.classList.add('media-filter-current-match');
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            index,
          },
          name: 'scrollToMediaFilterMatch',
        },
      },
    });
  }
};

const updateMediaFilterMatches = async (scrollToMatch = false) => {
  try {
    await nextTick();
    const matches = getMediaFilterMatches();
    mediaFilterMatchCount.value = matches.length;

    if (!matches.length) {
      mediaFilterMatchIndex.value = -1;
      return;
    }

    if (mediaFilterMatchIndex.value < 0) {
      mediaFilterMatchIndex.value = 0;
    }
    if (mediaFilterMatchIndex.value >= matches.length) {
      mediaFilterMatchIndex.value = matches.length - 1;
    }

    if (scrollToMatch) {
      scrollToMediaFilterMatch(mediaFilterMatchIndex.value);
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            scrollToMatch,
          },
          name: 'updateMediaFilterMatches',
        },
      },
    });
  }
};

const focusMediaFilter = () => {
  mediaFilterInput.value?.focus();
  mediaFilterInput.value?.select();
};

const openMediaFilter = () => {
  mediaFilterVisible.value = true;
  void nextTick(() => {
    focusMediaFilter();
    void updateMediaFilterMatches();
  });
};

const closeMediaFilter = () => {
  mediaFilter.value = undefined;
  mediaFilterVisible.value = false;
  mediaFilterMatchCount.value = 0;
  mediaFilterMatchIndex.value = -1;
};

const goToNextMediaFilterMatch = () => {
  if (!mediaFilterMatchCount.value) return;
  mediaFilterMatchIndex.value =
    (mediaFilterMatchIndex.value + 1) % mediaFilterMatchCount.value;
  scrollToMediaFilterMatch(mediaFilterMatchIndex.value);
};

const goToPreviousMediaFilterMatch = () => {
  if (!mediaFilterMatchCount.value) return;
  mediaFilterMatchIndex.value =
    (mediaFilterMatchIndex.value - 1 + mediaFilterMatchCount.value) %
    mediaFilterMatchCount.value;
  scrollToMediaFilterMatch(mediaFilterMatchIndex.value);
};

useEventListener(globalThis, 'keydown', (event: KeyboardEvent) => {
  if (
    event.repeat ||
    event.key.toLowerCase() !== 'f' ||
    (!event.ctrlKey && !event.metaKey)
  ) {
    return;
  }

  event.preventDefault();
  openMediaFilter();
});

interface BackgroundMusicAction {
  action: 'stop';
  fadeSeconds?: number;
  requestedAt: number;
}

interface BackgroundMusicState {
  playing: boolean;
  state:
    '' | 'music.error' | 'music.playing' | 'music.starting' | 'music.stopping';
}

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
  currentSongbook,
  downloadProgress,
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

const {
  basename,
  executeQuery,
  fileUrlToPath,
  fs,
  getLocalPathFromFileObject,
  inferExtension,
  join,
  parse,
  pathToFileURL,
  readdir,
  unzip,
} = globalThis.electronApi;
const { copy, pathExists, remove, writeFile } = fs;

const { post: postMediaAction } = useBroadcastChannel<string, string>({
  name: 'main-window-media-action',
});
const { post: postBackgroundMusicAction } = useBroadcastChannel<
  BackgroundMusicAction,
  BackgroundMusicAction
>({
  name: 'background-music-action',
});
const { data: backgroundMusicState } = useBroadcastChannel<
  BackgroundMusicState,
  BackgroundMusicState
>({
  name: 'background-music-state',
});

const { post: postCameraStream } = useBroadcastChannel<
  null | string,
  null | string
>({
  name: 'camera-stream',
});

const appSettingsStore = useAppSettingsStore();

const { post: postSubtitlesUrl } = useBroadcastChannel<string, string>({
  name: 'subtitles-url',
});

const { post: postMediaUrl } = useBroadcastChannel<string, string>({
  name: 'media-url',
});

const { post: postSlideshowAudioUrl } = useBroadcastChannel<string, string>({
  name: 'slideshow-audio-url',
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

const { post: postZoomPan } = useBroadcastChannel<
  Partial<Record<string, number>>,
  Partial<Record<string, number>>
>({ name: 'zoom-pan' });

const { data: lastEndTimestamp } = useBroadcastChannel<
  null | number,
  null | number
>({
  name: 'last-end-timestamp',
});

const { data: currentTimeData } = useBroadcastChannel<number, number>({
  name: 'current-time',
});

const changeDelay = 600; // 600ms delay: "--animate-duration" = 300ms, "slow" = "--animate-duration" * 2
let mediaSceneTimeout: NodeJS.Timeout | null = null;
const seenErrors = new Set<string>();

const { post: postCustomBackground } = useBroadcastChannel<string, string>({
  name: 'custom-background',
});

let checkMemorialDateRunning = false;
const checkMemorialDate = async () => {
  if (checkMemorialDateRunning) return;
  checkMemorialDateRunning = true;
  try {
    if (!isSelectedMemorialDate()) {
      postCustomBackground(mediaWindowCustomBackground.value ?? '');
      return;
    }

    const sections = getMemorialSections();
    if (!sections) return;

    const forceRefetch = prepareMemorialSections(sections);
    await downloadMemorialStreamSources(sections);
    await applyFetchedMemorialMedia(sections, forceRefetch);
    await addMemorialSongsIfNeeded(sections.memorialSection);
  } finally {
    checkMemorialDateRunning = false;
  }
};

const addMemorialBackgroundBackup = (
  introSection: MediaSectionWithConfig,
  backgroundPath: string,
) => {
  introSection.items ??= [];

  const memorialBgFileUrl = isFileUrl(backgroundPath)
    ? backgroundPath
    : pathToFileURL(backgroundPath);

  const hasMemorialBgInWelcomeSection = introSection.items.some(
    (item) =>
      item.source === 'dynamic' &&
      item.isImage &&
      item.fileUrl === memorialBgFileUrl,
  );
  if (hasMemorialBgInWelcomeSection) return;

  introSection.items.push({
    fileUrl: memorialBgFileUrl,
    isImage: true,
    source: 'dynamic',
    title: t('memorial-background'),
    type: 'media',
    uniqueId: uuid(),
  });
};

const addMemorialIntroVideos = async (
  introSection: MediaSectionWithConfig,
  introVideos: NonNullable<
    Awaited<ReturnType<typeof getMemorialMedia>>
  >['introVideos'],
) => {
  if (introSection.items?.length || !introVideos?.length || !selectedDate.value)
    return;

  const mappedVideos = await dynamicMediaMapper(
    introVideos,
    dateFromString(selectedDate.value),
    'dynamic',
  );

  introSection.items ??= [];
  mappedVideos.forEach((video) => {
    video.repeat = true;
  });
  introSection.items.push(...mappedVideos);

  createTemporaryNotification({
    group: 'memorial-fetch-video',
    message: t('memorialFetchVideoSuccess'),
    type: 'positive',
  });
};

const addMemorialSongsIfNeeded = async (
  memorialSection: MediaSectionWithConfig,
) => {
  if (memorialSection.items?.length) return;

  createTemporaryNotification({
    group: 'memorial-fetch',
    icon: 'mmm-info',
    message: t('memorialFetchSongs'),
    type: 'ongoing',
  });

  const songsToAdd = [18, 25];
  let successfulSongs = 0;
  for (const songTrack of songsToAdd) {
    if (await downloadMemorialSong(songTrack)) {
      successfulSongs++;
    }
  }
  const allSongsDownloaded = successfulSongs === songsToAdd.length;

  createTemporaryNotification({
    group: 'memorial-fetch',
    message: t(
      allSongsDownloaded
        ? 'memorialFetchSongsSuccess'
        : 'memorialFetchSongsError',
    ),
    type: allSongsDownloaded ? 'positive' : 'negative',
  });
};

const applyFetchedMemorialMedia = async (
  sections: {
    introSection: MediaSectionWithConfig;
    memorialSection: MediaSectionWithConfig;
  },
  forceRefetch: boolean,
) => {
  createTemporaryNotification({
    group: 'memorial-fetch',
    icon: 'mmm-info',
    message: t('attemptingToFetchMemorialBannerAndIntroVideo'),
    type: 'ongoing',
  });

  const memorialMedia = await getMemorialMedia(forceRefetch);
  if (!memorialMedia) {
    createTemporaryNotification({
      group: 'memorial-fetch',
      message: t('memorialFetchError'),
      type: 'negative',
    });
    return;
  }

  createTemporaryNotification({
    group: 'memorial-fetch',
    message: t('memorialFetchSuccess'),
    type: 'positive',
  });
  notifyMemorialBackgroundResult(memorialMedia.bg);
  await addMemorialIntroVideos(
    sections.introSection,
    memorialMedia.introVideos,
  );
  if (memorialMedia.bg) {
    addMemorialBackgroundBackup(sections.introSection, memorialMedia.bg);
  }
};

const downloadMemorialSong = async (songTrack: number) => {
  const songTrackItem: PublicationFetcher = {
    fileformat: 'MP4',
    langwritten: currentSettings.value?.lang || 'E',
    pub: currentSongbook.value?.pub,
    track: songTrack,
  };

  try {
    const [songTrackFiles, { thumbnail, title }] = await Promise.all([
      getPubMediaLinks(songTrackItem),
      getJwMediaInfo(songTrackItem),
    ]);

    const files =
      songTrackFiles?.files?.[currentSettings.value?.lang || 'E']?.MP4 || [];
    if (!files.length) return true;

    const downloadId = (await downloadAdditionalRemoteVideo({
      mediaItemLinks: files,
      meetingDate: selectedDate.value,
      section: 'memorial-talk',
      song: songTrack,
      thumbnailUrl: thumbnail,
      title: title.replace(/^\d+\.\s*/, ''),
    })) as string | undefined;
    await waitForDownloadComplete(downloadId);
    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const downloadMemorialStreamSource = async (
  mediaItem: MediaItem,
  datedAdditionalMediaDir: string,
) => {
  if (!mediaItem.streamUrl || !selectedDate.value) return;

  const existingPath =
    mediaItem.fileUrl && isFileUrl(mediaItem.fileUrl)
      ? fileUrlToPath(mediaItem.fileUrl)
      : '';
  if (existingPath && (await pathExists(existingPath))) return;

  const fallbackFilename = basename(mediaItem.streamUrl);
  const targetFilename = basename(existingPath || fallbackFilename);

  await downloadFileIfNeeded({
    dir: datedAdditionalMediaDir,
    filename: targetFilename,
    lowPriority: false,
    meetingDate: selectedDate.value,
    size: mediaItem.filesize,
    url: mediaItem.streamUrl,
  });

  const downloadedPath = join(datedAdditionalMediaDir, targetFilename);
  if (await pathExists(downloadedPath)) {
    mediaItem.fileUrl = pathToFileURL(downloadedPath);
  }
};

const downloadMemorialStreamSources = async (sections: {
  introSection: MediaSectionWithConfig;
  memorialSection: MediaSectionWithConfig;
}) => {
  const memorialMediaWithStreamSource = getMemorialSectionItems(
    sections,
  ).filter((item) => !!item.streamUrl);
  if (!memorialMediaWithStreamSource.length || !selectedDate.value) return;

  const datedAdditionalMediaDir =
    await currentState.getDatedAdditionalMediaDirectory(selectedDate.value);
  if (!datedAdditionalMediaDir) return;

  for (const mediaItem of memorialMediaWithStreamSource) {
    await downloadMemorialStreamSource(mediaItem, datedAdditionalMediaDir);
  }
};

const getMemorialSectionItems = (sections: {
  introSection: MediaSectionWithConfig;
  memorialSection: MediaSectionWithConfig;
}) => [
  ...(sections.introSection.items || []),
  ...(sections.memorialSection.items || []),
];

const getMemorialSections = () => {
  if (!selectedDateObject.value) return null;

  selectedDateObject.value.mediaSections ??= [];

  return {
    introSection: getOrCreateMediaSection(
      selectedDateObject.value.mediaSections,
      'welcome-video',
      { jwIconKeyword: 'welcome-video', label: t('welcome-video') },
    ),
    memorialSection: getOrCreateMediaSection(
      selectedDateObject.value.mediaSections,
      'memorial-talk',
      { jwIconKeyword: 'memorial', label: t('memorial-talk') },
    ),
  };
};

const hasDynamicMedia = (section: MediaSectionWithConfig) =>
  !!section.items?.some((item) => item.source === 'dynamic');

const isSelectedMemorialDate = () =>
  !!selectedDate.value &&
  !!selectedDateObject.value &&
  !isInPast(selectedDate.value) &&
  selectedDate.value === currentSettings.value?.memorialDate;

const notifyMemorialBackgroundResult = (backgroundPath?: string) => {
  if (!backgroundPath) {
    createTemporaryNotification({
      group: 'memorial-fetch-bg',
      message: t('memorialFetchErrorNoBg'),
      type: 'negative',
    });
    return;
  }

  postCustomBackground(backgroundPath);
  createTemporaryNotification({
    group: 'memorial-fetch-bg',
    message: t('memorialFetchBgSuccess'),
    type: 'positive',
  });
};

const prepareMemorialSection = (section: MediaSectionWithConfig) => {
  const hasMissingDynamicMedia = section.items?.some(
    (item) => item.source === 'dynamic' && !isFileUrl(item.fileUrl),
  );
  section.items = section.items?.filter(
    (item) => item.source !== 'dynamic' || isFileUrl(item.fileUrl),
  );
  return !!hasMissingDynamicMedia;
};

const prepareMemorialSections = (sections: {
  introSection: MediaSectionWithConfig;
  memorialSection: MediaSectionWithConfig;
}) => {
  const removedMissingMedia =
    prepareMemorialSection(sections.introSection) ||
    prepareMemorialSection(sections.memorialSection);

  return (
    removedMissingMedia ||
    !hasDynamicMedia(sections.introSection) ||
    !hasDynamicMedia(sections.memorialSection)
  );
};

const waitForDownloadComplete = async (downloadId?: string) => {
  if (!downloadId) return;

  let downloadCompleted: boolean | null = null;
  while (downloadCompleted !== true) {
    downloadCompleted =
      await globalThis.electronApi?.isDownloadComplete(downloadId);
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
  }
};

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
            return (
              getMeetingType(day.date) || isMemorialDay(day.date) || hasMedia
            );
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
      icon: 'mmm-error',
      message: t('no-circuit-overseer-date-set'),
      timeout: 30000,
      type: 'primary',
    });
  }
};

const sectionToAddTo = ref<MediaSectionIdentifier | undefined>();

useEventListener<CustomEvent<{ section: MediaSectionIdentifier | undefined }>>(
  globalThis,
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
  globalThis,
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
  globalThis,
  'openJwPlaylistDialog',
  (e) => {
    log(
      '🎯 openJwPlaylistDialog event received:',
      'mediaCalendar',
      'log',
      e.detail,
    );
    globalThis.dispatchEvent(
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
    log('🎯 openJwPlaylistPicker event dispatched', 'mediaCalendar', 'log');
  },
  { passive: true },
);

useEventListener<
  CustomEvent<{
    dbPath: string;
    document: DocumentItem;
  }>
>(
  globalThis,
  'openJwpubMediaPicker',
  (e) => {
    log(
      '🎯 openJwpubMediaPicker event received:',
      'mediaCalendar',
      'log',
      e.detail,
    );
    jwpubImportDb.value = e.detail?.dbPath;
    selectedDocument.value = e.detail?.document;
    showMediaPicker.value = true;
  },
  { passive: true },
);

// Track pinyin setting across page navigations
let lastPinyinState: boolean | undefined;

interface SavedPinyinSong {
  section: string;
  songTrack: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  title?: string;
}

const collectAdditionalSongsForPinyin = (
  selectedDay: DateInfo | undefined,
): SavedPinyinSong[] => {
  const savedSongs: SavedPinyinSong[] = [];

  for (const section of selectedDay?.mediaSections ?? []) {
    for (const item of section.items ?? []) {
      if (item.source === 'additional' && item.tag?.type === 'song') {
        savedSongs.push({
          section: section.config.uniqueId,
          songTrack: String(item.tag.value),
          streamUrl: item.streamUrl,
          thumbnailUrl: item.thumbnailUrl,
          title: item.title,
        });
      }
    }
  }

  return savedSongs;
};

const resetDynamicMediaForPinyin = (
  days: DateInfo[],
  selectedDay: DateInfo | undefined,
) => {
  days.forEach((day) => {
    day.status = null;
    const isSelected =
      selectedDay && day.date?.getTime() === selectedDay.date?.getTime();
    day.mediaSections?.forEach((s) => {
      s.items = (s.items || []).filter(
        (i) =>
          i.source !== 'dynamic' &&
          !(isSelected && i.source === 'additional' && i.tag?.type === 'song'),
      );
    });
  });
};

const addSongToSectionMap = (
  songsBySection: Record<string, MediaItem[]>,
  section: string,
  item: MediaItem | undefined,
) => {
  if (!item) return;
  songsBySection[section] ??= [];
  songsBySection[section].push(item);
};

const createPinyinSongMediaItem = async (
  song: SavedPinyinSong,
  pinyinFolder: string,
) => {
  const trackNum = song.songTrack.padStart(3, '0');
  const pinyinPath = join(pinyinFolder, `sjjm_s-Pi_CHS_${trackNum}_r720P.mp4`);
  if (!(await pathExists(pinyinPath))) return undefined;

  return createMediaItemFromPath(pinyinPath, undefined, {
    song: song.songTrack,
    title: song.title,
    url: song.streamUrl,
  });
};

const createCachedSongMediaItem = async (song: SavedPinyinSong) => {
  if (!song.streamUrl) return undefined;

  const cacheDir = await currentState.getDatedAdditionalMediaDirectory();
  const normalPath = join(cacheDir, basename(song.streamUrl));
  if (!(await pathExists(normalPath))) {
    await downloadFileIfNeeded({
      dir: cacheDir,
      url: song.streamUrl,
    });
  }
  if (!(await pathExists(normalPath))) return undefined;

  return createMediaItemFromPath(normalPath, undefined, {
    song: song.songTrack,
    thumbnailUrl: song.thumbnailUrl,
    title: song.title,
    url: song.streamUrl,
  });
};

const restoreAdditionalSongsForPinyin = async (
  savedSongs: SavedPinyinSong[],
  newPinyinActive: boolean,
  pinyinFolder: string | undefined,
) => {
  const songsBySection: Record<string, MediaItem[]> = {};

  for (const song of savedSongs) {
    const section = song.section || 'imported-media';
    const item =
      newPinyinActive && pinyinFolder
        ? await createPinyinSongMediaItem(song, pinyinFolder)
        : await createCachedSongMediaItem(song);

    addSongToSectionMap(songsBySection, section, item);
  }

  for (const sec in songsBySection) {
    if (!songsBySection[sec]) continue;
    jwStore.addToAdditionMediaMap(
      songsBySection[sec],
      sec as MediaSectionIdentifier,
      currentCongregation.value,
      selectedDateObject.value,
      isCoWeek(selectedDateObject.value?.date),
    );
  }
};

// Handle pinyin state change: save additional songs, reset all media, re-fetch, re-add songs
const handlePinyinChange = async (newPinyinActive: boolean) => {
  const selectedDay = selectedDateObject.value ?? undefined;
  const savedSongs = collectAdditionalSongsForPinyin(selectedDay);
  resetDynamicMediaForPinyin(
    lookupPeriod.value?.[currentCongregation.value] ?? [],
    selectedDay,
  );
  await fetchMedia();
  await restoreAdditionalSongsForPinyin(
    savedSongs,
    newPinyinActive,
    currentSettings.value?.pinyinSongFolder ?? undefined,
  );
};

// Selected media items state
const selectedMediaItems = ref<string[]>([]); // Array of selected media item IDs
const lastExtendDirection = ref<'down' | 'up' | null>(null); // Track the last extension direction

const setDefaultSectionForImport = () => {
  if (
    !sectionToAddTo.value &&
    selectedDateObject.value &&
    isWeMeetingDay(selectedDateObject.value.date) &&
    !isCoWeek(selectedDateObject.value.date)
  ) {
    sectionToAddTo.value = 'pt';
  }
};

const notifySingleImportFile = (captionKey: string, filePath: string) => {
  createTemporaryNotification({
    caption: t(captionKey),
    message: t('processing') + ' ' + basename(filePath),
  });
};

const pickPreferredSingleImportFile = (files: (File | string)[]) => {
  if (files.length <= 1) return files;

  const jwPubFile = files.find((file) =>
    isJwpub(getLocalPathFromFileObject(file)),
  );
  if (jwPubFile) {
    const filePath = getLocalPathFromFileObject(jwPubFile);
    notifySingleImportFile('jwpub-file-found', filePath);
    return [jwPubFile];
  }

  const archiveFile = files.find((file) =>
    isArchive(getLocalPathFromFileObject(file)),
  );
  if (archiveFile) {
    const filePath = getLocalPathFromFileObject(archiveFile);
    notifySingleImportFile('archive-file-found', filePath);
    return [archiveFile];
  }

  return files;
};

const normalizeImportFilePath = async (
  file: File | string,
  filepath: string,
) => {
  if (isRemoteFile(file)) {
    const baseFileName = basename(new URL(filepath).pathname);
    return (
      await downloadFileIfNeeded({
        dir: await getTempPath(),
        filename: await inferExtension(
          baseFileName,
          file instanceof File ? file.type : undefined,
        ),
        lowPriority: false,
        url: filepath,
      })
    ).path;
  }

  if (!isImageString(filepath)) return filepath;

  const [preamble, data] = filepath.split(';base64,');
  const ext = preamble?.split('/')[1];
  const tempFilename = uuid() + '.' + ext;
  const tempFilepath = join(await getTempPath(), tempFilename);
  await writeFile(tempFilepath, Buffer.from(data ?? '', 'base64'));
  return tempFilepath;
};

const addImageFileToMediaItems = async (
  filepath: string,
  mediaItemsToAdd: MediaItem[],
) => {
  const destPath = await copyToDatedAdditionalMedia(
    filepath,
    sectionToAddTo.value,
    false,
  );
  if (!destPath) return;

  const item = await createMediaItemFromPath(destPath);
  if (item) mediaItemsToAdd.push(item);
};

const normalizeFileNameParts = (items: (number | string)[]) =>
  items.map((item) => {
    if (Number.isFinite(item)) return item;
    if (typeof item === 'string') return Number.parseInt(item, 10).toString();
    return item;
  });

const findMatchingMissingMedia = (filepath: string) => {
  const detectedPubMediaInfo = parse(filepath)
    .name.split('_')
    .filter((item) => !/^r\d+P$/.test(item));

  return missingMedia.value.find((media) => {
    return (
      JSON.stringify(
        normalizeFileNameParts(media.fileUrl?.split('_') || []),
      ) === JSON.stringify(normalizeFileNameParts(detectedPubMediaInfo))
    );
  });
};

const addMediaFileToMediaItems = async (
  filepath: string,
  mediaItemsToAdd: MediaItem[],
) => {
  const matchingMissingItem = findMatchingMissingMedia(filepath);
  const destPath = await copyToDatedAdditionalMedia(
    filepath,
    sectionToAddTo.value,
    false,
  );

  if (matchingMissingItem) {
    const metadata = await getMetadataFromMediaPath(destPath);
    matchingMissingItem.fileUrl = pathToFileURL(destPath);
    matchingMissingItem.duration = metadata.format.duration || 0;
    matchingMissingItem.title = metadata.common.title || basename(destPath);
    matchingMissingItem.isVideo = isVideo(filepath);
    matchingMissingItem.isAudio = isAudio(filepath);
    return;
  }

  if (!destPath) return;
  const item = await createMediaItemFromPath(destPath);
  if (item) mediaItemsToAdd.push(item);
};

const resetJwpubImportState = () => {
  jwpubImportDb.value = '';
  jwpubImportDocuments.value = [];
  showFileImport.value = false;
};

const loadJwpubImportDocuments = (db: string, filepath: string) => {
  const multimediaCount =
    executeQuery<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM Multimedia;',
    )?.[0]?.count ?? 0;

  if (multimediaCount === 0) {
    createTemporaryNotification({
      caption: basename(filepath),
      icon: 'mmm-jwpub',
      message: t('jwpubNoMultimedia'),
      type: 'warning',
    });
    resetJwpubImportState();
    return;
  }

  const mmTable = tableExists(db, 'DocumentMultimedia')
    ? 'DocumentMultimedia'
    : 'Multimedia';
  jwpubImportDocuments.value = executeQuery<DocumentItem>(
    db,
    `SELECT DISTINCT Document.DocumentId, Title FROM Document JOIN ${mmTable} ON Document.DocumentId = ${mmTable}.DocumentId;`,
  );
};

const processJwpubFile = async (filepath: string) => {
  log('[addToFiles] Processing JWPUB file:', 'mediaCalendar', 'log', filepath);

  const stagedJwpubPath = await stageUserJwpubForRead(filepath);
  if (!stagedJwpubPath) return;

  const publication = await identifyJwpub(stagedJwpubPath);
  log(
    '[addToFiles] Publication identified:',
    'mediaCalendar',
    'log',
    publication,
  );
  if (!publication) {
    errorCatcher('Could not identify JWPUB file', {
      contexts: {
        fn: {
          args: {
            filepath,
          },
          name: 'addToFiles (JWPUB identifyJwpub)',
        },
      },
    });
    return;
  }

  const publicationDirectory = await getPublicationDirectory(publication);
  log(
    '[addToFiles] Publication directory:',
    'mediaCalendar',
    'log',
    publicationDirectory,
  );
  if (!publicationDirectory) {
    errorCatcher('[addToFiles] Could not find publication directory', {
      contexts: {
        fn: {
          args: {
            filepath,
            publication,
          },
          name: 'addToFiles (JWPUB getPublicationDirectory)',
        },
      },
    });
    return;
  }

  await updateLastUsedDate(
    publicationDirectory,
    selectedDateObject.value?.date || new Date(),
  );

  const unzipDir = await unzipJwpub(stagedJwpubPath, publicationDirectory);
  const db = await findDb(unzipDir);
  log('[addToFiles] Db found:', 'mediaCalendar', 'log', db ? 'yes' : 'no');
  if (!db) {
    errorCatcher('No db found after unzip', {
      contexts: {
        fn: {
          args: {
            filepath,
            unzipDir,
          },
          name: 'addToFiles (JWPUB findDb)',
        },
      },
    });
    return;
  }

  jwpubImportDb.value = db;
  loadJwpubImportDocuments(db, filepath);
};

const processJwPlaylistFile = async (filepath: string) => {
  if (!selectedDateObject.value) return false;

  log('JW Playlist file detected:', 'mediaCalendar', 'log', filepath);
  log('Section to add to:', 'mediaCalendar', 'log', sectionToAddTo.value);

  totalFiles.value = 0;
  currentFile.value = 0;
  const playlistStagingDir = join(
    await getTempPath(),
    `jwplaylist-import-${uuid()}`,
  );
  const stagedPlaylistPath = join(playlistStagingDir, basename(filepath));
  await copy(filepath, stagedPlaylistPath);

  globalThis.dispatchEvent(
    new CustomEvent<{
      jwPlaylistPath: string;
      section: MediaSectionIdentifier | undefined;
    }>('openJwPlaylistDialog', {
      detail: {
        jwPlaylistPath: stagedPlaylistPath,
        section: sectionToAddTo.value,
      },
    }),
  );
  log('openJwPlaylistDialog event dispatched', 'mediaCalendar', 'log');
  return true;
};

const processArchiveFile = async (filepath: string) => {
  log('Archive file detected:', 'mediaCalendar', 'log', filepath);
  const unzipDirectory = join(await getTempPath(), basename(filepath));
  await remove(unzipDirectory);
  await unzip(filepath, unzipDirectory);
  const filesList = await readdir(unzipDirectory);
  const filePaths = filesList.map((file) => join(unzipDirectory, file.name));
  await addToFiles(filePaths);
  await remove(unzipDirectory);
};

const notifyUnsupportedFile = (filepath: string) => {
  createTemporaryNotification({
    caption: filepath ? basename(filepath) : filepath,
    icon: 'mmm-local-media',
    message: t('filetypeNotSupported'),
    type: 'negative',
  });
};

const processImportFile = async (
  file: File | string,
  mediaItemsToAdd: MediaItem[],
) => {
  let filepath = getLocalPathFromFileObject(file);
  if (!filepath) return;

  filepath = await normalizeImportFilePath(file, filepath);
  filepath = await convertImageIfNeeded(filepath);

  if (isImage(filepath)) {
    await addImageFileToMediaItems(filepath, mediaItemsToAdd);
    return;
  }

  if (isVideo(filepath) || isAudio(filepath)) {
    await addMediaFileToMediaItems(filepath, mediaItemsToAdd);
    return;
  }

  if (isPdf(filepath)) {
    return convertPdfToImages(filepath, await getTempPath());
  }

  if (isJwpub(filepath)) {
    await processJwpubFile(filepath);
    return;
  }

  if (isJwPlaylist(filepath) && (await processJwPlaylistFile(filepath))) {
    return;
  }

  if (isArchive(filepath)) {
    await processArchiveFile(filepath);
    return;
  }

  notifyUnsupportedFile(filepath);
};

const finishImportedMediaItems = (mediaItemsToAdd: MediaItem[]) => {
  if (!mediaItemsToAdd.length) return;

  const targetSection = sectionToAddTo.value || 'imported-media';
  jwStore.addToAdditionMediaMap(
    mediaItemsToAdd,
    targetSection,
    currentCongregation.value,
    selectedDateObject.value,
    isCoWeek(selectedDateObject.value?.date),
  );
};

const addToFiles = async (files: (File | string)[] | FileList) => {
  if (!files) return;
  let selectedFiles = Array.isArray(files) ? files : Array.from(files);
  totalFiles.value = selectedFiles.length;
  setDefaultSectionForImport();
  selectedFiles = pickPreferredSingleImportFile(selectedFiles);
  const mediaItemsToAdd: MediaItem[] = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    if (!file) continue;
    try {
      const convertedImages = await processImportFile(file, mediaItemsToAdd);
      if (convertedImages?.length) {
        selectedFiles.splice(i + 1, 0, ...convertedImages);
        totalFiles.value = selectedFiles.length;
      }
    } catch (error) {
      const filepath = getLocalPathFromFileObject(file);
      createTemporaryNotification({
        caption: filepath ? basename(filepath) : filepath,
        message: t('fileProcessError'),
        type: 'negative',
      });
      errorCatcher(error, {
        contexts: {
          fn: {
            args: { filepath },
            name: 'addToFiles',
          },
        },
      });
    }
    currentFile.value++;
  }

  finishImportedMediaItems(mediaItemsToAdd);

  if (showFileImport.value && !jwpubImportDocuments.value.length) {
    showFileImport.value = false;
  }
};

const openImportMenu = (section: MediaSectionIdentifier | undefined) => {
  globalThis.dispatchEvent(
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

const onMediaPickerDismiss = () => {
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
        const sanitizedHtml = sanitize(html);
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

useEventListener(
  globalThis,
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
      globalThis.dispatchEvent(new CustomEvent('scrollToSelectedMedia'));
    anchorId.value = nextSelectableId;
  },
  { passive: true },
);

useEventListener(
  globalThis,
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
      globalThis.dispatchEvent(new CustomEvent('scrollToSelectedMedia'));
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

const filesDownloaded = computed(() =>
  Object.values(downloadProgress.value)
    .filter((p) => p.complete)
    .map((p) => p.filename),
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

const atRest: MediaPlayingState = {
  action: '',
  currentPosition: 0,
  pan: {
    x: 0,
    y: 0,
  },
  playbackRate: 1,
  seekTo: 0,
  shouldLoop: false,
  slideshowAudioUrl: '',
  subtitlesUrl: '',
  uniqueId: '',
  url: '',
  zoom: 1,
};

function stopSlideshowPlayback() {
  if (!mediaPlaying.value.slideshowAudioUrl) return;

  mediaPlaying.value = atRest;
}

const anchorId = ref<null | string>(null);

// Handle item click events from MediaList components
const handleMediaItemClick = (payload: {
  event: MouseEvent;
  mediaItemId: string;
  sectionId: string | undefined;
}) => {
  log('Media item clicked:', 'mediaCalendar', 'log', payload.mediaItemId);
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
      .filter(Boolean) as string[];

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

const getVisibleKeyboardMediaIds = () =>
  keyboardShortcutMediaList.value
    .filter((item) => !item.hidden)
    .map((item) => item.uniqueId);

const getSelectionCursorId = (direction: 'down' | 'up') =>
  selectedMediaItems.value[
    direction === 'up' ? 0 : selectedMediaItems.value.length - 1
  ];

const getWrappedSelectionIndex = (
  currentIndex: number,
  direction: 'down' | 'up',
  allMediaItems: string[],
) => {
  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0) return allMediaItems.length - 1;
  if (nextIndex >= allMediaItems.length) return 0;
  return nextIndex;
};

const getSelectionRange = (
  allMediaItems: string[],
  anchorIndex: number,
  newIndex: number,
) => {
  const newStartIndex = Math.min(anchorIndex, newIndex);
  const newEndIndex = Math.max(anchorIndex, newIndex);
  return allMediaItems.slice(newStartIndex, newEndIndex + 1);
};

const shrinkSelection = (
  allMediaItems: string[],
  anchorIndex: number,
  newIndex: number,
  direction: 'down' | 'up',
) => {
  const selection = [...selectedMediaItems.value];
  if (selection.length <= 1) {
    selectedMediaItems.value = getSelectionRange(
      allMediaItems,
      anchorIndex,
      newIndex,
    );
    return;
  }

  if (direction === 'up') {
    selection.pop();
  } else {
    selection.shift();
  }
  selectedMediaItems.value = selection;
};

const applyExtendedSelection = (
  allMediaItems: string[],
  anchorIndex: number,
  newIndex: number,
  direction: 'down' | 'up',
  shouldExpand: boolean,
) => {
  if (shouldExpand) {
    selectedMediaItems.value = getSelectionRange(
      allMediaItems,
      anchorIndex,
      newIndex,
    );
    return;
  }

  shrinkSelection(allMediaItems, anchorIndex, newIndex, direction);
};

// Function to extend selection using Shift+Up/Shift+Down
function extendSelection(direction: 'down' | 'up') {
  log('extendSelection triggered', 'mediaCalendar', 'trace');

  log('🔄 [extendSelection] Starting function', 'mediaCalendar', 'log', {
    direction,
    selectedItemsCount: selectedMediaItems.value.length,
  });

  if (!selectedMediaItems.value.length) {
    log(
      '🔄 [extendSelection] No selected items, returning',
      'mediaCalendar',
      'log',
    );
    return;
  }

  // Get all media items in order
  const allMediaItems = getVisibleKeyboardMediaIds();

  if (!allMediaItems.length) {
    log(
      '🔄 [extendSelection] No media items available, returning',
      'mediaCalendar',
      'log',
    );
    return;
  }

  // Find the index of the last selected item (the cursor position)
  const lastSelectedId = getSelectionCursorId(direction);
  if (!lastSelectedId) {
    log(
      '🔄 [extendSelection] No last selected item, returning',
      'mediaCalendar',
      'log',
    );
    return;
  }

  const currentIndex = allMediaItems.indexOf(lastSelectedId);
  if (currentIndex === -1) {
    log(
      '🔄 [extendSelection] Current index not found in allMediaItems, returning',
      'mediaCalendar',
      'log',
    );
    return;
  }

  log('🔄 [extendSelection] Initial state', 'mediaCalendar', 'log', {
    allMediaItemsCount: allMediaItems.length,
    currentIndex,
    direction,
    lastSelectedId,
    selectedItems: selectedMediaItems.value,
  });

  // Calculate the new index based on direction
  const newIndex = getWrappedSelectionIndex(
    currentIndex,
    direction,
    allMediaItems,
  );

  // Handle boundary conditions (wrap around if needed)
  if (direction === 'up' && newIndex > currentIndex) {
    log(
      '🔄 [extendSelection] Wrapping newIndex to last item:',
      'mediaCalendar',
      'log',
      newIndex,
    );
  } else if (direction === 'down' && newIndex < currentIndex) {
    log(
      '🔄 [extendSelection] Wrapping newIndex to first item:',
      'mediaCalendar',
      'log',
      newIndex,
    );
  }

  const newMediaItemId = allMediaItems[newIndex];
  if (!newMediaItemId) {
    log(
      '🔄 [extendSelection] No new media item ID found, returning',
      'mediaCalendar',
      'log',
    );
    return;
  }

  // Find the anchor point (the first selected item that doesn't move)
  if (!anchorId.value) {
    log(
      '🔄 [extendSelection] No anchorId set, cannot extend selection, returning',
      'mediaCalendar',
      'log',
    );
    return;
  }
  const anchorIndex = allMediaItems.indexOf(anchorId.value);
  if (anchorIndex === -1) {
    log(
      '🔄 [extendSelection] Anchor index not found in allMediaItems, returning',
      'mediaCalendar',
      'log',
    );
    return;
  }

  log('🔄 [extendSelection] Anchor and current info', 'mediaCalendar', 'log', {
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
    log(
      '🔄 [extendSelection] Setting lastExtendDirection to',
      'mediaCalendar',
      'log',
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
    //   log(
    //     '🔄 [extendSelection] Reversing direction, updating lastExtendDirection to',
    //     direction,
    //   );
    // }
  }

  log('🔄 [extendSelection] Expansion decision', 'mediaCalendar', 'log', {
    currentDirection: direction,
    lastExtendDirection: lastExtendDirection.value,
    shouldExpand,
  });

  applyExtendedSelection(
    allMediaItems,
    anchorIndex,
    newIndex,
    direction,
    shouldExpand,
  );

  log('🔄 [extendSelection] Final state', 'mediaCalendar', 'log', {
    newHighlightedId: newMediaItemId,
    selectedItems: selectedMediaItems.value,
    selectedItemsCount: selectedMediaItems.value.length,
  });
}

// Listen for requests to get current media window variables
const { data: getCurrentMediaWindowVariables } = useBroadcastChannel<
  string,
  string
>({
  name: 'get-current-media-window-variables',
});

type MediaPlayingPausedState = boolean | string | undefined;

const shouldNotifyBackgroundMusicStillPlaying = (
  newMediaPlaying: MediaPlayingPausedState,
  newMediaPaused: MediaPlayingPausedState,
  newMediaPlayingUrl: MediaPlayingPausedState,
  oldMediaPlayingUrl: MediaPlayingPausedState,
) => {
  return (
    newMediaPlaying &&
    !newMediaPaused &&
    typeof newMediaPlayingUrl === 'string' &&
    newMediaPlayingUrl !== oldMediaPlayingUrl &&
    (isAudio(newMediaPlayingUrl) || isVideo(newMediaPlayingUrl)) &&
    backgroundMusicState.value?.playing &&
    backgroundMusicState.value.state !== 'music.stopping'
  );
};

const sendConfiguredCustomShortcut = (
  shortcut: null | string | undefined,
  logMessage: string,
) => {
  if (!shortcut) return;

  log(logMessage, 'mediaCalendar', 'log', shortcut);
  sendKeyboardShortcut(shortcut, 'CustomEvents');
};

const getVisibleMeetingSongs = () => {
  return (selectedDateObject.value?.mediaSections ?? []).flatMap((section) =>
    (section.items ?? []).filter(
      (item) => item.tag?.type === 'song' && !item.hidden,
    ),
  );
};

const maybeSendLastSongShortcut = (oldMediaPlayingUrl: unknown) => {
  const shortcut = currentSettings.value?.customEventLastSongShortcut;
  if (!shortcut || !selectedDateObject.value || !selectedDayMeetingType.value) {
    return;
  }

  log(
    '🔄 [CustomEvents Verbose] Checking if the last played media item was the last song in the meeting',
    'mediaCalendar',
    'log',
  );

  const allSongs = getVisibleMeetingSongs();
  const lastSong = allSongs[allSongs.length - 1];
  const lastSongUrl = lastSong?.fileUrl || lastSong?.streamUrl;
  const stoppedWasLastSong =
    allSongs.length > 0 && lastSongUrl === oldMediaPlayingUrl;

  log(
    '🔄 [CustomEvents Verbose] Last song detection variables:',
    'mediaCalendar',
    'log',
    {
      lastSongUrl,
      oldMediaPlayingUrl,
      stoppedWasLastSong,
    },
  );

  if (!stoppedWasLastSong) return;

  sendConfiguredCustomShortcut(
    shortcut,
    '🔄 [CustomEvents] Sending last song played event shortcut:',
  );
};

const handleCustomMediaEvents = (
  newMediaPlaying: MediaPlayingPausedState,
  newMediaPaused: MediaPlayingPausedState,
  newMediaPlayingUrl: MediaPlayingPausedState,
  oldMediaPlayingUrl: MediaPlayingPausedState,
) => {
  if (!currentSettings.value?.enableCustomEvents) return;

  log('🔄 [CustomEvents] Custom events enabled', 'mediaCalendar', 'log');

  if (newMediaPlaying && !oldMediaPlayingUrl) {
    sendConfiguredCustomShortcut(
      currentSettings.value?.customEventMediaPlayShortcut,
      '🔄 [CustomEvents] Sending media play event shortcut:',
    );
    return;
  }

  if (newMediaPaused && newMediaPlayingUrl) {
    sendConfiguredCustomShortcut(
      currentSettings.value?.customEventMediaPauseShortcut,
      '🔄 [CustomEvents] Sending media pause event shortcut:',
    );
    return;
  }

  if (!newMediaPlaying && oldMediaPlayingUrl) {
    sendConfiguredCustomShortcut(
      currentSettings.value?.customEventMediaStopShortcut,
      '🔄 [CustomEvents] Sending media stop event shortcut:',
    );
    maybeSendLastSongShortcut(oldMediaPlayingUrl);
  }
};

const getTargetObsScene = (
  newMediaPlaying: MediaPlayingPausedState,
  newMediaPaused: MediaPlayingPausedState,
) => {
  if (newMediaPaused) return 'camera';
  if (newMediaPlaying) return 'media';
  return 'camera';
};

const shouldPostponeObsImageScene = (
  newMediaPlaying: MediaPlayingPausedState,
  newMediaPaused: MediaPlayingPausedState,
  newMediaPlayingUrl: MediaPlayingPausedState,
) => {
  return (
    currentSettings.value?.obsPostponeImages &&
    newMediaPlaying &&
    !newMediaPaused &&
    typeof newMediaPlayingUrl === 'string' &&
    isImage(newMediaPlayingUrl)
  );
};

const scheduleDelayedMediaScene = () => {
  log(
    '🔄 [MediaCalendarPage] Waiting for scene change delay',
    'mediaCalendar',
    'log',
  );
  mediaSceneTimeout = setTimeout(() => {
    log(
      '🔄 [MediaCalendarPage] Executing delayed media scene change',
      'mediaCalendar',
      'log',
    );
    sendObsSceneEvent('media');
    mediaSceneTimeout = null;
  }, changeDelay);
};

const switchToObsMediaScene = (wasPlayingBefore: boolean) => {
  if (wasPlayingBefore) {
    log(
      '🔄 [MediaCalendarPage] Switching to media scene immediately',
      'mediaCalendar',
      'log',
    );
    sendObsSceneEvent('media');
    return;
  }

  scheduleDelayedMediaScene();
};

const handleObsMediaSceneChange = (
  newMediaPlaying: MediaPlayingPausedState,
  newMediaPaused: MediaPlayingPausedState,
  newMediaPlayingUrl: MediaPlayingPausedState,
  oldMediaPlayingUrl: MediaPlayingPausedState,
) => {
  if (!currentSettings.value?.obsEnable) return;

  if (
    shouldPostponeObsImageScene(
      newMediaPlaying,
      newMediaPaused,
      newMediaPlayingUrl,
    )
  ) {
    log(
      '🔄 [MediaCalendarPage] OBS image postponement active, skipping scene change',
      'mediaCalendar',
      'log',
    );
    return;
  }

  const targetScene = getTargetObsScene(newMediaPlaying, newMediaPaused);
  const wasPlayingBefore = !!oldMediaPlayingUrl;

  log('🔄 [MediaCalendarPage] OBS scene decision:', 'mediaCalendar', 'log', {
    newMediaPaused,
    newMediaPlaying,
    oldMediaPlayingUrl,
    targetScene,
    wasPlayingBefore,
  });

  if (targetScene === 'media') {
    switchToObsMediaScene(wasPlayingBefore);
    return;
  }

  log(
    '🔄 [MediaCalendarPage] Switching to camera scene',
    'mediaCalendar',
    'log',
  );
  sendObsSceneEvent('camera');
};

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

watch(
  () => [countItemsHiddenForSelectedDate.value, countItemsForSelectedDate],
  () => {
    // Clear selected media items when date changes
    selectedMediaItems.value = [];
  },
);

watch(
  () => mediaPlaying.value.uniqueId,
  (newMediaUniqueId) => {
    if (newMediaUniqueId) selectedMediaItems.value = [newMediaUniqueId];
  },
);

watchImmediate(
  () => selectedDate.value,
  async (newVal) => {
    stopSlideshowPlayback();
    selectedMediaItems.value = [];
    lastExtendDirection.value = null;

    if (!newVal || !selectedDateObject.value?.mediaSections) return;

    if (isWeMeetingDay(selectedDateObject.value.date)) {
      getOrCreateMediaSection(selectedDateObject.value.mediaSections, 'pt', {
        ...defaultAdditionalSection.config,
        jwIconKeyword: 'pt',
        label: t('pt'),
      });
    }
  },
);

watch(
  () => currentCongregation.value,
  () => {
    stopSlideshowPlayback();
  },
);

watch(
  () => [jwpubImportDb.value, jwpubImportDocuments.value],
  async ([, newJwpubImportDocuments]) => {
    if (newJwpubImportDocuments?.length) {
      showFileImport.value = true;
    }
  },
);

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

watch(
  () => mediaPlaying.value.action,
  (newAction, oldAction) => {
    log(
      'mediaPlaying.value.action:',
      'mediaCalendar',
      'log',
      oldAction,
      '->',
      newAction,
    );

    if (newAction !== oldAction) postMediaAction(newAction);

    const isPlay = newAction === 'play';
    const isPause = newAction === 'pause';
    const isSignLang = currentLangObject.value?.isSignLanguage;

    // Always show media window when playing
    if (isPlay) toggleMediaWindowVisibility(true);

    // Handle sign language special cases
    if (isSignLang) {
      if (isPlay || isPause) return toggleMediaWindowVisibility(true);

      const cameraId = appSettingsStore.displayCameraId;
      return cameraId
        ? postCameraStream(cameraId)
        : toggleMediaWindowVisibility(false);
    }
  },
);

watch(
  () => mediaPlaying.value.subtitlesUrl,
  (newSubtitlesUrl, oldSubtitlesUrl) => {
    if (newSubtitlesUrl !== oldSubtitlesUrl) postSubtitlesUrl(newSubtitlesUrl);
  },
);

watch(
  () => [
    mediaPlaying.value.url,
    mediaPlaying.value.slideshowAudioUrl,
    customDuration.value,
  ],
  (
    [newUrl, newSlideshowAudioUrl, newCustomDuration],
    [oldUrl, oldSlideshowAudioUrl, oldCustomDuration],
  ) => {
    log(
      '🔄 [watch] mediaPlaying.value.url',
      'mediaCalendar',
      'log',
      newUrl,
      oldUrl,
    );

    if (newUrl !== oldUrl) {
      postMediaUrl(newUrl as string);
    }

    if (newSlideshowAudioUrl !== oldSlideshowAudioUrl) {
      postSlideshowAudioUrl(newSlideshowAudioUrl as string);
    }

    if (
      JSON.stringify(newCustomDuration) !== JSON.stringify(oldCustomDuration)
    ) {
      postCustomDuration(JSON.stringify(newCustomDuration));
    }
  },
);

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

watch(
  () => lastEndTimestamp.value,
  (newLastEndTimestamp) => {
    log(
      '🔄 [onMediaEnded] Media state data:',
      'mediaCalendar',
      'log',
      newLastEndTimestamp,
    );
    if (newLastEndTimestamp) {
      // Handle section repeat logic first
      const repeatHandled = handleMediaEnded();
      log(
        '🔄 [onMediaEnded] Repeat handled:',
        'mediaCalendar',
        'log',
        repeatHandled,
      );
      if (repeatHandled) return;

      triggerMediaWindowAutoHide(false);
      triggerZoomScreenShare(false);

      mediaPlaying.value = atRest;

      // Clear custom duration when media ends
      postCustomDuration(undefined);

      nextTick(() => {
        globalThis.dispatchEvent(
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

watch(
  () => currentTimeData.value,
  (newCurrentTime) => {
    nextTick(() => {
      mediaPlaying.value.currentPosition = newCurrentTime;
    });
  },
);

function notifyBackgroundMusicStillPlaying() {
  createTemporaryNotification({
    actions: [
      {
        color: 'dark',
        handler: () => {
          postBackgroundMusicAction({
            action: 'stop',
            fadeSeconds: MEDIA_STOP_FADE_DURATION_SECONDS,
            requestedAt: Date.now(),
          });
        },
        label: t('stop-music'),
      },
      {
        color: 'dark',
        icon: 'close',
        round: true,
      },
    ],
    caption: t('background-music-still-playing-explain'),
    group: 'background-music-still-playing',
    message: t('background-music-still-playing'),
    timeout: 15000,
    type: 'warning',
  });
}

watch(
  () => [mediaIsPlaying.value, mediaPaused.value, mediaPlaying.value.url],
  (
    [newMediaPlaying, newMediaPaused, newMediaPlayingUrl],
    [, , oldMediaPlayingUrl],
  ) => {
    log(
      '🔄 [MediaCalendarPage] Media state watcher triggered:',
      'mediaCalendar',
      'log',
      {
        enableCustomEvents: currentSettings.value?.enableCustomEvents,
        newMediaPaused,
        newMediaPlaying,
        newMediaPlayingUrl,
        oldMediaPlayingUrl,
      },
    );

    if (
      shouldNotifyBackgroundMusicStillPlaying(
        newMediaPlaying,
        newMediaPaused,
        newMediaPlayingUrl,
        oldMediaPlayingUrl,
      )
    ) {
      notifyBackgroundMusicStillPlaying();
    }

    handleCustomMediaEvents(
      newMediaPlaying,
      newMediaPaused,
      newMediaPlayingUrl,
      oldMediaPlayingUrl,
    );

    if (mediaSceneTimeout) {
      clearTimeout(mediaSceneTimeout);
      mediaSceneTimeout = null;
    }

    handleObsMediaSceneChange(
      newMediaPlaying,
      newMediaPaused,
      newMediaPlayingUrl,
      oldMediaPlayingUrl,
    );
  },
);

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
        group: 'missingMeetingMedia',
        icon: 'mmm-file-missing',
        message: t('some-media-items-are-missing'),
        timeout: 15000,
        type: 'warning',
      });
      seenErrors.add(currentCongregation.value + missingFileUrl);
    });
  },
);

watch(
  () => selectedDateObject.value,
  async (newDateObject) => {
    checkMemorialDate();

    if (!newDateObject?.date || !newDateObject?.mediaSections) return;
    const meetingDate = formatDate(newDateObject.date, 'YYYY-MM-DD');
    const foldersToTouch = new Set<string>();

    const collectFolders = (items: MediaItem[] | undefined) => {
      items?.forEach((item) => {
        if (item.fileUrl && isFileUrl(item.fileUrl)) {
          const filePath = fileUrlToPath(item.fileUrl);
          const folder = getParentDirectory(filePath);
          if (folder) foldersToTouch.add(folder);
        }
        if (item.children) {
          collectFolders(item.children);
        }
      });
    };

    Object.values(newDateObject.mediaSections).forEach((section) => {
      collectFolders(section.items);
    });

    for (const folder of foldersToTouch) {
      await updateLastUsedDate(folder, meetingDate);
    }
  },
  { immediate: true },
);

onMounted(() => {
  goToNextDayWithMedia();
  checkMemorialDate();

  // If no date with media is found, go to today's date
  if (!selectedDate.value) {
    selectedDate.value = formatDate(new Date(), 'YYYY/MM/DD');
  }

  // Restore pinyin state from persisted media (handles migration from non-persisted state)
  if (
    currentSettings.value?.enablePinyinSongs &&
    currentSettings.value?.pinyinSongFolder &&
    !currentState.pinyinActive
  ) {
    const days = lookupPeriod.value?.[currentCongregation.value] ?? [];
    const hasPinyinMedia = days.some((day) =>
      day.mediaSections?.some((section) =>
        section.items?.some(
          (item) =>
            item.source === 'dynamic' &&
            item.fileUrl?.includes('sjjm_s-Pi_CHS'),
        ),
      ),
    );
    if (hasPinyinMedia) {
      currentState.pinyinActive = true;
    }
  }

  // Detect pinyin state change (settings disabled or toggled while page was unmounted)
  let pinyinChanged = false;
  if (!currentSettings.value?.enablePinyinSongs && currentState.pinyinActive) {
    currentState.pinyinActive = false;
    pinyinChanged = true;
  } else if (
    lastPinyinState !== undefined &&
    lastPinyinState !== currentState.pinyinActive
  ) {
    pinyinChanged = true;
  }
  lastPinyinState = currentState.pinyinActive;

  sendObsSceneEvent('camera');
  if (urlVariables.value.base && urlVariables.value.mediator) {
    if (pinyinChanged) {
      // Full pinyin change handling (includes fetchMedia + additional song re-add)
      handlePinyinChange(currentState.pinyinActive);
    } else {
      fetchMedia();
    }
  } else {
    router.push('/settings');
  }
  checkCoDate();

  watch(
    () => urlVariables.value.mediator,
    () => {
      fetchMedia();
    },
  );

  // Force pinyinActive off when master setting is disabled
  watch(
    () => currentSettings.value?.enablePinyinSongs,
    (newVal) => {
      if (!newVal) {
        currentState.pinyinActive = false;
      }
    },
  );

  // Re-fetch media when pinyin active state changes (header toggle or setting change)
  watch(
    () => currentState.pinyinActive,
    async (newVal, oldVal) => {
      if (oldVal === undefined) return;
      if (newVal === oldVal) return;
      lastPinyinState = newVal;
      await handlePinyinChange(newVal);
    },
  );
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
    postSlideshowAudioUrl(mediaPlaying.value.slideshowAudioUrl);
    postCustomDuration(JSON.stringify(customDuration.value));
    postCustomBackground(mediaWindowCustomBackground.value);
  },
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

watch(
  () => filesDownloaded.value,
  () => {
    if (selectedDateObject.value?.date) {
      try {
        addDayToExportQueue(selectedDateObject.value.date);
      } catch (e) {
        errorCatcher(e);
      }
    }
  },
);

watch(
  mediaFilterTerms,
  () => {
    mediaFilterMatchIndex.value = 0;
    void updateMediaFilterMatches(true);
  },
  { flush: 'post' },
);
</script>

<style scoped>
.media-filter-overlay {
  border-radius: 0 0 8px 8px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  margin-top: 57px;
  max-width: calc(100vw - 32px);
  width: fit-content;
}

body.body--dark .media-filter-overlay {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-top: 0;
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.62),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.media-filter-overlay :deep(.q-field) {
  width: clamp(120px, calc(100vw - 208px), 320px);
}

.media-filter-overlay__count {
  min-width: 56px;
  text-align: center;
  white-space: nowrap;
}

body.body--dark
  .media-filter-overlay
  :deep(.q-field--outlined .q-field__control::before) {
  border-color: rgba(255, 255, 255, 0.34);
}

body.body--dark
  .media-filter-overlay
  :deep(.q-field--outlined .q-field__control:hover::before) {
  border-color: rgba(255, 255, 255, 0.52);
}
</style>
