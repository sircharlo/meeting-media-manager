<template>
  <q-layout class="non-selectable column no-wrap" view="hHh LpR lFr">
    <!-- Top bar -->
    <HeaderBase />

    <!-- Side navigation -->
    <NavDrawer v-model="miniState" />

    <!-- Main content -->
    <q-page-container
      class="main-bg fit-snugly overflow-auto"
      style="overflow-x: hidden !important"
    >
      <AnnouncementBanner />
      <router-view />
    </q-page-container>

    <!-- Footer -->
    <q-footer
      v-if="
        currentSettings?.enableMediaDisplayButton ||
        currentSettings?.enableMusicButton
      "
      class="q-pb-sm"
      :style="
        'left: calc(50% + ' + (miniState ? '28' : '150') + 'px) !important'
      "
    >
      <ActionIsland />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { initializeElectronApi } from 'src/helpers/electron-api-manager';
initializeElectronApi('MainLayout');

import type { LanguageValue } from 'src/constants/locales';
import type {
  ElectronIpcListenKey,
  MediaItem,
  MediaSectionWithConfig,
} from 'src/types';

import {
  useBroadcastChannel,
  watchDebounced,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import { queues } from 'boot/globals';
import HeaderBase from 'components/header/HeaderBase.vue';
import ActionIsland from 'components/ui/ActionIsland.vue';
import AnnouncementBanner from 'components/ui/AnnouncementBanner.vue';
import NavDrawer from 'components/ui/NavDrawer.vue';
import { storeToRefs } from 'pinia';
import { debounce, useMeta, useQuasar } from 'quasar';
import { SORTER } from 'src/constants/general';
import {
  cleanCache,
  cleanPersistedStores,
  deleteCacheFiles,
} from 'src/helpers/cleanup';
import {
  isMwMeetingDay,
  isWeMeetingDay,
  remainingTimeBeforeMeetingStart,
  updateLookupPeriod,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { exportAllDays } from 'src/helpers/export-media';
import { setElementFont } from 'src/helpers/fonts';
import { watchExternalFolder } from 'src/helpers/fs';
import {
  downloadBackgroundMusic,
  downloadSongbookVideos,
  getJwMepsInfo,
  setUrlVariables,
  watchedItemMapper,
} from 'src/helpers/jw-media';
import {
  executeShortcut,
  registerAllCustomShortcuts,
  unregisterAllCustomShortcuts,
} from 'src/helpers/keyboardShortcuts';
import { getOrCreateMediaSection } from 'src/helpers/media-sections';
import { showMediaWindow } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { localeOptions } from 'src/i18n';
import { useAppSettingsStore } from 'src/stores/app-settings';
import { fetchYeartext } from 'src/utils/api';
import { formatDate, getSpecificWeekday, isInPast } from 'src/utils/date';
import { kebabToCamelCase } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import {
  type MediaPlayingStateAction,
  useCurrentStateStore,
} from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

// Local state
const miniState = ref(true);

// Pause flag for yeartext watcher during preview
const yeartextWatcherPaused = ref(false);

const productName = process.env.PRODUCT_NAME;

useMeta({
  titleTemplate: (title) => (title ? `${title} - M³` : `${productName}`),
});

// Icon mapping
const $q = useQuasar();

$q.iconMapFn = (iconName) => {
  if (iconName.startsWith('chevron_')) {
    iconName = iconName.replace('chevron_', 'mmm-');
  } else if (iconName.startsWith('keyboard_arrow_')) {
    iconName = iconName.replace('keyboard_arrow_', 'mmm-');
  } else if (iconName.startsWith('arrow_drop_')) {
    iconName = 'mmm-dropdown-arrow';
  } else if (iconName === 'cancel' || iconName === 'close') {
    iconName = 'clear';
  }
  if (!iconName.startsWith('mmm-')) {
    iconName = 'mmm-' + iconName;
  }
  return {
    cls: iconName,
  };
};

// Routes and translations
const route = useRoute();
const router = useRouter();
const { locale, t } = useI18n({ useScope: 'global' });

// Store initializations
const congregationSettings = useCongregationSettingsStore();
// congregationSettings.$subscribe((_, state) => {
//   saveSettingsStoreToFile('congregations', state);
// });

const appSettings = useAppSettingsStore();
const { displayCameraId } = storeToRefs(appSettings);

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentLangObject,
  currentSettings,
  downloadProgress,
  isSelectedDayToday,
  mediaIsPlaying,
  mediaPlaying,
  online,
  selectedDate,
  selectedDayMeetingType,
  yeartext,
} = storeToRefs(currentState);

const jwStore = useJwStore();
// jwStore.$subscribe((_, state) => {
//   saveSettingsStoreToFile('jw', state);
// });

const { updateJwLanguages, updateMemorials } = jwStore;
const { lookupPeriod } = storeToRefs(jwStore);

const {
  onDownloadCancelled,
  onDownloadCompleted,
  onDownloadError,
  onDownloadProgress,
  onDownloadStarted,
  onGpuCrashDetected,
  onLog,
  onShortcut,
  onWatchFolderUpdate,
  path,
  pathToFileURL,
  removeListeners,
  setAutoStartAtLogin,
  setElectronUrlVariables,
} = window.electronApi;
const { basename, dirname } = path;
updateMemorials(online.value);
updateJwLanguages(online.value);

const hasActiveDownloads = () => {
  return Object.values(downloadProgress.value).some(
    (item) =>
      !item.complete &&
      !item.error &&
      (!item.loaded || !item.total || item.loaded < item.total),
  );
};

let cacheClearTriggered = false;

const delayedCacheClear = () => {
  if (!currentSettings.value?.enableCacheAutoClear || cacheClearTriggered)
    return;

  cacheClearTriggered = true;
  console.group('🗑️ Cache Auto-Clear');
  console.log(
    '🗑️ Waiting 30 seconds and for downloads to complete before clearing cache...',
  );

  // Wait at least 30 seconds and until no active downloads
  const checkAndClear = () => {
    if (hasActiveDownloads()) {
      console.log('⏳ Downloads still in progress, waiting...');
      setTimeout(checkAndClear, 10000); // Check again in 10 seconds
      return;
    }

    console.log('✅ No active downloads, proceeding with cache clear...');
    deleteCacheFiles('smart')
      .then(({ itemsDeleted }) => {
        if (!itemsDeleted) {
          console.log('ℹ️ No cache items needed clearing');
        } else {
          console.log(`✅ Cleared ${itemsDeleted} cache item(s)`);
        }
        console.groupEnd();
      })
      .catch((error) => {
        console.log('❌ Error clearing cache:', error);
        errorCatcher(error);
        console.groupEnd();
      });
  };

  // Start checking after 30 seconds
  setTimeout(checkAndClear, 30000);
};

watch(currentCongregation, (newCongregation, oldCongregation) => {
  try {
    if (oldCongregation && queues.meetings[oldCongregation]) {
      queues.meetings[oldCongregation].pause();
    }
    if (!newCongregation) {
      showMediaWindow(false);
      navigateToCongregationSelector();
    } else {
      setElectronUrlVariables(JSON.stringify(jwStore.urlVariables));
      let year = new Date().getFullYear();
      if (
        jwStore.memorials[year] &&
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        isInPast(getSpecificWeekday(jwStore.memorials[year]!, 6))
      ) {
        year++;
      }
      if (
        currentSettings.value &&
        jwStore.memorials[year] &&
        currentSettings.value.memorialDate !== jwStore.memorials[year]
      ) {
        currentSettings.value.memorialDate = jwStore.memorials[year] ?? null;
      }
      downloadProgress.value = {};
      updateLookupPeriod();
      downloadBackgroundMusic();

      // Trigger delayed cache clear instead of immediate execution
      delayedCacheClear();

      if (queues.meetings[newCongregation]) {
        queues.meetings[newCongregation].start();
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
});

watch(online, (isNowOnline) => {
  try {
    const congregation = currentCongregation.value;
    if (!congregation) return;

    const { /*downloads,*/ meetings } = queues;
    // const downloadQueue = downloads[congregation];
    const meetingQueue = meetings[congregation];

    if (isNowOnline) {
      // downloadQueue?.start();
      meetingQueue?.start();
      jwStore.updateYeartext(
        online.value,
        currentSettings.value,
        currentLangObject.value,
      );
      jwStore.updateJwLanguages(online.value);
    } else {
      // downloadQueue?.pause();
      meetingQueue?.pause();
    }
  } catch (error) {
    errorCatcher(error);
  }
});

const navigateToCongregationSelector = () => {
  try {
    if (!route.fullPath.includes('/congregation-selector')) {
      router.push({ path: '/congregation-selector' });
      selectedDate.value = '';
    }
  } catch (error) {
    errorCatcher(error);
  }
};

watch(currentSettings, (newSettings) => {
  if (!newSettings) navigateToCongregationSelector();
});

watchImmediate(
  () => currentSettings.value?.darkMode,
  (newDarkMode) => {
    $q.dark.set(newDarkMode ?? 'auto');
  },
);

watch(
  () => [
    currentCongregation.value,
    currentSettings.value?.enableMediaAutoExport,
    currentSettings.value?.mediaAutoExportFolder,
    currentSettings.value?.convertFilesToMp4,
  ],
  ([newMediaAutoExport, newMediaAutoExportFolder]) => {
    if (!!newMediaAutoExport && !!newMediaAutoExportFolder) exportAllDays();
  },
);

whenever(
  () => currentSettings.value?.localAppLang,
  (newAppLang) => {
    // Migrate old language format to new format
    if (newAppLang.includes('-')) {
      newAppLang = kebabToCamelCase(newAppLang) as LanguageValue;
    }

    if (
      currentSettings.value &&
      !localeOptions?.map((option) => option.value).includes(newAppLang)
    ) {
      currentSettings.value.localAppLang = 'en';
    } else {
      locale.value = newAppLang;
    }
  },
);

watchDebounced(
  () => [currentSettings.value?.baseUrl, currentCongregation.value],
  async ([newBaseUrl, newCongregation], [oldBaseUrl]) => {
    if (!!newCongregation && newBaseUrl !== oldBaseUrl) {
      await setUrlVariables(newBaseUrl);
    }
  },
  { debounce: 500 },
);

const { post: postCameraStream } = useBroadcastChannel<
  null | string,
  null | string
>({
  name: 'camera-stream',
});

watch(displayCameraId, (newCameraId) => {
  if (mediaIsPlaying.value) return;
  postCameraStream(newCameraId);
  if (!newCameraId) {
    mediaPlaying.value.url = '';
  }
});

watch(
  () => currentLangObject.value?.isSignLanguage,
  (newIsSignLanguage) => {
    if (!newIsSignLanguage) {
      displayCameraId.value = null;
    }
  },
);

watch(
  () => [
    currentCongregation.value,
    currentSettings.value?.lang,
    currentSettings.value?.langFallback,
    currentSettings.value?.langSubtitles,
    currentSettings.value?.enableSubtitles,
    currentSettings.value?.mwDay,
    currentSettings.value?.weDay,
    currentSettings.value?.memorialDate,
    currentSettings.value?.meetingScheduleChangeDate,
    currentSettings.value?.meetingScheduleChangeOnce,
    currentSettings.value?.meetingScheduleChangeMwDay,
    currentSettings.value?.meetingScheduleChangeWeDay,
    currentSettings.value?.disableMediaFetching,
    currentSettings.value?.excludeFootnotes,
    currentSettings.value?.excludeWtParagraphVideos,
  ],
  (newValues, oldValues) => {
    // Skip if this is the initial run (oldValues is undefined)
    if (!oldValues) return;

    const [newCongregation, ...newSettings] = newValues;
    const [oldCongregation, ...oldSettings] = oldValues;

    // Only trigger if congregation hasn't changed but other settings have
    if (newCongregation === oldCongregation) {
      const settingsChanged = newSettings.some(
        (newSetting, index) => newSetting !== oldSettings[index],
      );

      if (settingsChanged) {
        console.log(
          '⚙️ Settings changed (congregation unchanged), updating lookup period',
        );
        updateLookupPeriod({ reset: true });
      }
    }
  },
);

watch(
  () => [currentCongregation.value, currentSettings.value?.coWeek],
  (
    [newCurrentCongregation, newCoWeek],
    [oldCurrentCongregation, oldCoWeek],
  ) => {
    // Skip if this is the initial run (oldValues is undefined)
    if (!oldCurrentCongregation) {
      return;
    }

    console.group('👁️ CO Week Watcher');
    console.log('👁️ CO Week watcher triggered:', {
      congregation: {
        new: newCurrentCongregation,
        old: oldCurrentCongregation,
      },
      coWeek: { new: newCoWeek, old: oldCoWeek },
    });

    if (newCurrentCongregation === oldCurrentCongregation) {
      console.log('🏢 Congregation unchanged, checking CO week changes...');

      const weeksToUpdate = [newCoWeek, oldCoWeek].filter((week) => !!week);

      if (weeksToUpdate.length === 0) {
        console.log('📅 No valid CO weeks to update');
        return;
      }

      console.log(
        `📅 Updating ${weeksToUpdate.length} CO week(s):`,
        weeksToUpdate,
      );

      for (const changedWeek of weeksToUpdate) {
        if (!changedWeek) continue;
        console.log(`🎯 Updating lookup period for CO week: ${changedWeek}`);
        updateLookupPeriod({
          onlyForWeekIncluding: changedWeek,
          reset: true,
        });
      }

      console.log('✅ CO week updates completed');
      console.groupEnd();
    } else {
      console.log('🏢 Congregation changed, skipping CO week update');
      console.groupEnd();
    }
  },
);

watch(
  () => currentSettings.value?.autoStartAtLogin,
  (newAutoStartAtLogin) => {
    setAutoStartAtLogin(!!newAutoStartAtLogin);
  },
);

watch(
  () => currentSettings.value?.enableExtraCache,
  (newEnableExtraCache, oldEnableExtraCache) => {
    try {
      if (
        newEnableExtraCache &&
        oldEnableExtraCache !== undefined &&
        oldEnableExtraCache !== newEnableExtraCache
      ) {
        downloadSongbookVideos();
      }
    } catch (error) {
      errorCatcher(error);
    }
  },
);

watchImmediate(
  () => currentSettings.value?.disableHardwareAcceleration,
  (newDisableHardwareAcceleration) => {
    if (newDisableHardwareAcceleration !== undefined) {
      window.electronApi.setHardwareAcceleration(
        newDisableHardwareAcceleration,
      );
      // Check if hardware acceleration is disabled via settings on startup
      if (
        newDisableHardwareAcceleration &&
        !currentSettings.value?.suppressHardwareAccelerationReminder
      ) {
        createTemporaryNotification({
          actions: [
            {
              color: 'white',
              handler: () => {
                router.push('/settings/disableHardwareAcceleration');
              },
              label: t('go-to-settings'),
            },
          ],
          caption: t('hardwareAccelerationDisabledExplain'),
          icon: 'mmm-info',
          message: t('hardwareAccelerationDisabled'),
          timeout: 10000,
          type: 'info',
        });
      }
    }
  },
);

watchImmediate(
  () => [
    currentCongregation.value,
    currentSettings.value?.enableKeyboardShortcuts,
  ],
  ([newCongregation, newEnableKeyboardShortcuts], oldValues = []) => {
    const [oldCongregation, oldEnableKeyboardShortcuts] = oldValues as [
      string | undefined,
      boolean | undefined,
    ];
    const congregationChanged =
      !(!newCongregation && !oldCongregation) &&
      newCongregation !== oldCongregation;
    const shortcutsToggled =
      newEnableKeyboardShortcuts !== oldEnableKeyboardShortcuts;

    const shouldUnregister =
      congregationChanged || (shortcutsToggled && !newEnableKeyboardShortcuts);

    const shouldRegister =
      newEnableKeyboardShortcuts && (congregationChanged || shortcutsToggled);

    if (shouldRegister) {
      // This will internally call unregisterAllCustomShortcuts
      registerAllCustomShortcuts();
    } else if (shouldUnregister) {
      // Only call unregisterAllCustomShortcuts directly if we’re NOT going to register
      unregisterAllCustomShortcuts();
    }
  },
);

watchImmediate(
  () => [
    currentSettings.value?.folderToWatch,
    currentSettings.value?.enableFolderWatcher,
  ],
  ([newFolderToWatch, newEnableFolderWatcher]) => {
    watchExternalFolder(
      newEnableFolderWatcher ? (newFolderToWatch as string) : undefined,
    );
  },
);

async function handleUnlinkCleanup(changedPath: string) {
  try {
    const filename = basename(changedPath);
    const watchedDayFolder = dirname(changedPath);
    if (watchedDayFolder) {
      const { removeWatchedMediaSectionInfo } = await import(
        'src/helpers/media-sections'
      );
      await removeWatchedMediaSectionInfo(watchedDayFolder, filename);
    }
  } catch (error) {
    console.warn(`⚠️ Could not remove section order info: ${error}`);
  }
}

function removeWatchedItems(
  sections: MediaSectionWithConfig[],
  predicate: (item: MediaItem) => boolean,
) {
  for (const section of sections) {
    if (!section.items) continue;
    // reassign instead of splicing to reduce reactive churn
    section.items = section.items.filter((item) => !predicate(item));
  }
}

const updateWatchFolderRef = async ({
  changedPath,
  day,
  event,
}: Record<string, string>) => {
  try {
    day = day?.replace(/-/g, '/');
    if (!day) return;

    const dayObj = lookupPeriod.value[currentCongregation.value]?.find(
      (d) => formatDate(d.date, 'YYYY/MM/DD') === day,
    );
    if (!dayObj) return;

    switch (event) {
      case 'add':
        if (!changedPath) return;
        {
          const watchedItems =
            (await watchedItemMapper(day, changedPath)) || [];
          console.log('🔍 [MainLayout] watchedItems:', watchedItems);

          for (const watchedItem of watchedItems) {
            // Skip if already exists
            const exists = dayObj.mediaSections.some((s) =>
              s.items?.some((i) => i.uniqueId === watchedItem.uniqueId),
            );
            if (exists) continue;

            const weMeeting = isWeMeetingDay(dayObj.date);
            const mwMeeting = isMwMeetingDay(dayObj.date);
            const targetSectionId =
              watchedItem.originalSection ||
              (weMeeting ? 'pt' : mwMeeting ? 'lac' : 'imported-media');

            dayObj.mediaSections ??= [];
            const targetSection = getOrCreateMediaSection(
              dayObj.mediaSections,
              targetSectionId,
            );
            targetSection.items ??= [];

            // Add, then we’ll sort once after all inserts
            targetSection.items.push(watchedItem);

            console.log(
              '🔍 [MainLayout] targetSection.items:',
              targetSection.items,
            );
          }

          // Sort sections once after adding
          for (const section of dayObj.mediaSections) {
            if (!section.items) continue;
            section.items.sort((a, b) => {
              const aOrder =
                typeof a.sortOrderOriginal === 'number'
                  ? a.sortOrderOriginal
                  : 0;
              const bOrder =
                typeof b.sortOrderOriginal === 'number'
                  ? b.sortOrderOriginal
                  : 0;
              return aOrder - bOrder || SORTER.compare(a.title, b.title);
            });
          }
        }
        break;

      case 'addDir':
      /* falls through */

      case 'unlinkDir':
        removeWatchedItems(
          dayObj.mediaSections,
          (item) => item?.source === 'watched',
        );
        break;

      case 'unlink':
        if (!changedPath) return;
        {
          const targetUrl = pathToFileURL(changedPath).toString();
          removeWatchedItems(
            dayObj.mediaSections,
            (item) => item?.source === 'watched' && item?.fileUrl === targetUrl,
          );
          await handleUnlinkCleanup(changedPath);
        }
        break;
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const processWatchFolderEvents = debounce(async (pendingEvents) => {
  for (const evt of pendingEvents) {
    await updateWatchFolderRef(evt);
  }
  pendingEvents.length = 0;
}, 100);

const pendingEvents: Record<string, string>[] = [];

const queueWatchFolderEvent = (event: Record<string, string>) => {
  pendingEvents.push(event);
  processWatchFolderEvents(pendingEvents);
};

cleanCache();
cleanPersistedStores();

const closeAttempts = ref(0);

const bcClose = new BroadcastChannel('closeAttempts');
bcClose.onmessage = (event) => {
  if (event?.data?.attemptedClose) {
    const meetingDay =
      isSelectedDayToday.value && !!selectedDayMeetingType.value;
    if (
      (mediaIsPlaying.value ||
        (currentCongregation.value && // a congregation is selected
          !currentSettings.value?.disableMediaFetching && // media fetching is enabled
          meetingDay && // today is a meeting day
          remainingTimeBeforeMeetingStart() < 90)) && // meeting is starting in less than 90 seconds
      closeAttempts.value === 0
    ) {
      createTemporaryNotification({
        caption: t('clicking-the-close-button-again-will-close-app'),
        icon: 'mmm-error',
        message: t('make-sure-that-m-is-in-not-use-before-quitting'),
        noClose: true,
        progress: true,
        timeout: 10000,
        type: 'negative',
      });
      closeAttempts.value += 1;
      setTimeout(() => {
        closeAttempts.value = 0;
      }, 10000);
    } else {
      bcClose.postMessage({ authorizedClose: true });
    }
  }
};

const initListeners = () => {
  onLog(({ ctx, level, msg }) => {
    console[level](`[main] ${msg}`, ctx);
  });

  onShortcut(({ shortcut }) => {
    if (!currentSettings.value?.enableKeyboardShortcuts) return;
    executeShortcut(shortcut);
  });

  onWatchFolderUpdate(({ changedPath, day, event }) => {
    queueWatchFolderEvent({ changedPath, day, event });
  });

  onDownloadStarted((args) => {
    const existing = downloadProgress.value[args.id];
    downloadProgress.value[args.id] = {
      ...(existing || {}),
      complete: existing?.complete,
      error: existing?.error,
      filename: args.filename,
      loaded: existing?.loaded,
      meetingDate: existing?.meetingDate || '',
      total: args.totalBytes,
    };
  });

  onDownloadCancelled((args) => {
    if (downloadProgress.value[args.id])
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      downloadProgress.value[args.id]!.error = true;
  });

  onDownloadCompleted((args) => {
    if (downloadProgress.value[args.id]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      downloadProgress.value[args.id]!.complete = true;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      delete downloadProgress.value[args.id]!.loaded;
    }
  });

  onDownloadError((args) => {
    if (downloadProgress.value[args.id])
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      downloadProgress.value[args.id]!.error = true;
  });

  onDownloadProgress((args) => {
    if (downloadProgress.value[args.id]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      downloadProgress.value[args.id]!.loaded = args.bytesReceived;
    }
  });

  onGpuCrashDetected(() => {
    createTemporaryNotification({
      caption: t('gpu-crash-detected-restarting'),
      icon: 'mmm-error',
      message: t('gpu-crash-detected'),
      timeout: 10000,
      type: 'negative',
    });
  });

  window.electronApi.onHardwareAccelerationTemporaryDisabled(() => {
    createTemporaryNotification({
      caption: t('gpu-crash-detected-explain'),
      icon: 'mmm-warning',
      message: t('gpu-crash-detected'),
      timeout: 10000,
      type: 'warning',
    });
  });
};

const removeListenersLocal = () => {
  const listeners: ElectronIpcListenKey[] = [
    'log',
    'shortcut',
    'watchFolderUpdate',
    'downloadStarted',
    'downloadCancelled',
    'downloadCompleted',
    'downloadError',
    'downloadProgress',
    'gpu-crash-detected',
  ];

  listeners.forEach((listener) => {
    try {
      removeListeners(listener);
    } catch (error) {
      errorCatcher(error);
    }
  });
};

onMounted(() => {
  congregationSettings.updateCongregationsWithMissingSettings();
  if (!currentSettings.value) navigateToCongregationSelector();
  initListeners();
});

onBeforeUnmount(() => {
  removeListenersLocal();
});

const previousState = ref<{
  base: string | undefined;
  mediator: string | undefined;
  wasOnline: boolean;
}>({
  base: undefined,
  mediator: undefined,
  wasOnline: false,
});

// Broadcast the three values to the media player page using useBroadcastChannel
const { post: postUrlVariables } = useBroadcastChannel<
  { base: string | undefined; mediator: string | undefined },
  { base: string | undefined; mediator: string | undefined }
>({
  name: 'url-variables',
});
const { post: postOnline } = useBroadcastChannel<boolean, boolean>({
  name: 'online',
});

watchImmediate(
  (): [string | undefined, string | undefined, boolean] => [
    jwStore.urlVariables?.base,
    jwStore.urlVariables?.mediator,
    online.value,
  ],
  ([base, mediator, online]: [
    string | undefined,
    string | undefined,
    boolean,
  ]) => {
    const prev = previousState.value;

    postUrlVariables({ base, mediator });
    postOnline(online);

    // Only get fonts and MEPS info if:
    // 1. Coming online for the first time (!prev.wasOnline && online)
    // 2. URL variables changed while online
    const shouldRun =
      (!prev.wasOnline && online) ||
      (online && (prev.base !== base || prev.mediator !== mediator));

    if (shouldRun) {
      getJwMepsInfo();
      setElementFont('JW-Icons');
    }

    // Update previous state
    previousState.value = { base, mediator, wasOnline: online };
  },
);

// Send hideMediaLogo to the media player page using useBroadcastChannel
const { post: postHideMediaLogo } = useBroadcastChannel<
  boolean | undefined,
  boolean | undefined
>({
  name: 'hide-media-logo',
});

watchImmediate(
  () => currentSettings.value?.hideMediaLogo,
  (newHideMediaLogo) => {
    postHideMediaLogo(newHideMediaLogo);
  },
);

// Send yeartext to the media player page using useBroadcastChannel
const { post: postYeartext } = useBroadcastChannel<
  string | undefined,
  string | undefined
>({
  name: 'yeartext',
});

// Function to check if we should show the yeartext preview notification
const checkYeartextPreview = async () => {
  try {
    console.log(
      '🔍 [checkYeartextPreview] Checking if we should show the yeartext preview notification',
    );
    // Only run if congregation is selected
    if (!currentCongregation.value) return;

    if (!currentSettings.value) return;

    // Only run if media display is enabled
    if (!currentSettings.value?.enableMediaDisplayButton) return;

    const now = new Date();
    const month = now.getMonth() + 1; // getMonth is 0-based

    // Only run if we're in December
    if (month !== 12) return;

    // Get current and next year
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;

    // Check if yeartext is available (current year)
    const { yeartexts } = jwStore;
    if (!yeartexts[currentYear]) return;

    const appSettingsStore = appSettings;

    // Check if already dismissed for next year
    if (appSettingsStore.yeartextPreviewDismissed[nextYear]) return;

    // Check if online
    if (!online.value) return;

    // Check if base URL available
    if (!jwStore.urlVariables?.base) return;

    // Get the current language
    const lang = currentSettings.value.lang;

    // Check if language is configured
    if (!lang) return;

    // Show notification
    createTemporaryNotification({
      actions: [
        {
          color: 'primary',
          handler: () => {
            // Session dismissal handled by not showing again until app restart
          },
          label: t('later'),
        },
        {
          color: 'negative',
          handler: () => {
            appSettingsStore.yeartextPreviewDismissed[nextYear] = true;
          },
          label: t('no'),
        },
        {
          color: 'positive',
          handler: async () => {
            try {
              // Fetch next year's yeartext
              const result = await fetchYeartext(
                lang,
                jwStore.urlVariables.base,
                nextYear,
              );
              if (result.yeartext) {
                // Pause the yeartext watcher to prevent immediate override
                yeartextWatcherPaused.value = true;

                // Post the next year yeartext temporarily
                postYeartext(result.yeartext);

                // Show success notification
                createTemporaryNotification({
                  icon: 'mmm-check',
                  message: t('yeartext-preview-success', { year: nextYear }),
                  timeout: 5000,
                  type: 'positive',
                });

                // Auto-dismiss after 10 seconds
                setTimeout(() => {
                  // Restore the current yeartext
                  const currentYeartext = currentState.yeartext || '';
                  postYeartext(currentYeartext);
                  createTemporaryNotification({
                    icon: 'mmm-check',
                    message: t('yeartext-cleared', {
                      currentYear: currentYear,
                    }),
                    timeout: 5000,
                    type: 'positive',
                  });
                  // Save to prevent asking every time
                  appSettingsStore.yeartextPreviewDismissed[nextYear] = true;
                  // Resume the watcher after a brief delay to allow the current yeartext to be posted
                  setTimeout(() => {
                    yeartextWatcherPaused.value = false;
                  }, 100);
                }, 10000);
              } else {
                createTemporaryNotification({
                  message: t('yeartext-preview-failed'),
                  type: 'negative',
                });
              }
            } catch (error) {
              errorCatcher(error);
              createTemporaryNotification({
                message: t('yeartext-preview-failed'),
                type: 'negative',
              });
            } finally {
              // Resume the watcher
              yeartextWatcherPaused.value = false;
            }
          },
          label: t('yes'),
        },
      ],
      message: t('yeartext-preview-next-year', { year: nextYear }),
      timeout: 0, // Don't auto-dismiss
    });
  } catch (error) {
    errorCatcher(error);
  } finally {
    // Resume the watcher
    yeartextWatcherPaused.value = false;
  }
};

// Watch for congregation selection and trigger yeartext preview check
watch(
  [currentCongregation, yeartext, online],
  ([newCongregation, newYeartext, newOnline]) => {
    if (newCongregation && newYeartext && newOnline) {
      // Small delay to ensure all data is ready
      setTimeout(() => {
        checkYeartextPreview();
      }, 1000);
    }
  },
);

watchImmediate(
  () => yeartext.value,
  (newYeartext) => {
    if (!yeartextWatcherPaused.value) {
      postYeartext(newYeartext);
    }
  },
);

// Receive media playing action from the media player page using useBroadcastChannel
const { data: mediaPlayingAction } = useBroadcastChannel<
  MediaPlayingStateAction,
  MediaPlayingStateAction
>({
  name: 'media-window-media-action',
});

watchImmediate(
  () => mediaPlayingAction.value,
  (newMediaPlayingAction) => {
    console.log(
      '🔄 [onMounted] mediaPlayingAction changed:',
      newMediaPlayingAction,
    );
    mediaPlaying.value.action = newMediaPlayingAction;
  },
);

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
    postUrlVariables({
      base: jwStore.urlVariables?.base,
      mediator: jwStore.urlVariables?.mediator,
    });
    postOnline(online.value);
    postHideMediaLogo(currentSettings.value?.hideMediaLogo);
    if (!yeartextWatcherPaused.value) {
      postYeartext(yeartext.value);
    }
  },
);
</script>
