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
import type { ElectronIpcListenKey } from 'src/types';

import { watchDebounced, watchImmediate, whenever } from '@vueuse/core';
import { queues } from 'boot/globals';
import HeaderBase from 'components/header/HeaderBase.vue';
import ActionIsland from 'components/ui/ActionIsland.vue';
import AnnouncementBanner from 'components/ui/AnnouncementBanner.vue';
import NavDrawer from 'components/ui/NavDrawer.vue';
import { storeToRefs } from 'pinia';
import { useMeta, useQuasar } from 'quasar';
import { SORTER } from 'src/constants/general';
import {
  cleanCache,
  cleanPersistedStores,
  deleteCacheFiles,
} from 'src/helpers/cleanup';
import {
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
import { showMediaWindow } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { localeOptions } from 'src/i18n';
import { formatDate, getSpecificWeekday, isInPast } from 'src/utils/date';
import { kebabToCamelCase } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

// Local state
const miniState = ref(true);

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

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  downloadProgress,
  mediaPlaying,
  online,
  selectedDate,
  selectedDateObject,
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
  onLog,
  onShortcut,
  onWatchFolderUpdate,
  pathToFileURL,
  removeListeners,
  setAutoStartAtLogin,
  setElectronUrlVariables,
} = window.electronApi;

updateMemorials(online.value);
updateJwLanguages(online.value);

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

      if (currentSettings.value?.enableCacheAutoClear) {
        console.group('🗑️ Cache Auto-Clear');
        console.log(
          '🗑️ Clearing cache files automatically based on user settings...',
        );
        deleteCacheFiles('smart')
          .then(() => {
            console.log('✅ Cache files cleared successfully');
            console.groupEnd();
          })
          .catch((error) => {
            console.log('❌ Error clearing cache:', error);
            errorCatcher(error);
            console.groupEnd();
          });
      }

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
        currentState.currentLangObject,
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
    currentSettings.value?.meteredConnection,
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
        updateLookupPeriod(true);
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
        updateLookupPeriod(true, {
          onlyForWeekIncluding: changedWeek,
          targeted: true,
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
    if (event === 'addDir' || event === 'unlinkDir') {
      for (let i = dayObj.dynamicMedia.length - 1; i >= 0; i--) {
        if (dayObj.dynamicMedia[i]?.source === 'watched') {
          dayObj.dynamicMedia.splice(i, 1);
        }
      }
    } else if (event === 'add') {
      if (!changedPath) return;
      const watchedItems = (await watchedItemMapper(day, changedPath)) || [];

      for (const watchedItem of watchedItems) {
        if (
          dayObj.dynamicMedia.find((i) => i.uniqueId === watchedItem.uniqueId)
        ) {
          continue;
        }
        watchedItem.sortOrderOriginal = 'watched-' + watchedItem.title;

        // Find the correct index to insert the item in the sorted order
        const insertIndex = dayObj.dynamicMedia.findIndex(
          (existingItem) =>
            SORTER.compare(existingItem.title, watchedItem.title) > 0,
        );

        if (insertIndex === -1) {
          // If no larger item is found, push to the end
          dayObj.dynamicMedia.push(watchedItem);
        } else {
          // Otherwise, insert at the correct index
          dayObj.dynamicMedia.splice(insertIndex, 0, watchedItem);
        }
      }
    } else if (event === 'unlink') {
      if (!changedPath) return;
      const targetUrl = pathToFileURL(changedPath);
      for (let i = dayObj.dynamicMedia.length - 1; i >= 0; i--) {
        if (
          dayObj.dynamicMedia[i]?.source === 'watched' &&
          dayObj.dynamicMedia[i]?.fileUrl === targetUrl
        ) {
          dayObj.dynamicMedia.splice(i, 1);
        }
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

cleanCache();
cleanPersistedStores();

const closeAttempts = ref(0);

const bcClose = new BroadcastChannel('closeAttempts');
bcClose.onmessage = (event) => {
  if (event?.data?.attemptedClose) {
    const meetingDay =
      !!selectedDateObject.value?.today && !!selectedDateObject.value?.meeting;
    if (
      (mediaPlaying.value ||
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
    updateWatchFolderRef({ changedPath, day, event });
  });

  onDownloadStarted((args) => {
    downloadProgress.value[args.id] = {
      filename: args.filename,
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

watchImmediate(
  (): [string | undefined, string | undefined, boolean] => [
    jwStore.urlVariables?.base,
    jwStore.urlVariables?.mediator,
    currentState.online,
  ],
  ([base, mediator, online]: [
    string | undefined,
    string | undefined,
    boolean,
  ]) => {
    const prev = previousState.value;

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
</script>
