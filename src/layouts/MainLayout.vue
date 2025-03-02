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
import { cleanCache, cleanPersistedStores } from 'src/helpers/cleanup';
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
import { formatDate } from 'src/utils/date';
import { kebabToCamelCase } from 'src/utils/general';
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
// const congregationSettings = useCongregationSettingsStore();
// congregationSettings.$subscribe((_, state) => {
//   saveSettingsStoreToFile('congregations', state);
// });

const jwStore = useJwStore();
// jwStore.$subscribe((_, state) => {
//   saveSettingsStoreToFile('jw', state);
// });

const { updateJwLanguages } = jwStore;
const { lookupPeriod } = storeToRefs(jwStore);
updateJwLanguages();

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

watch(currentCongregation, (newCongregation, oldCongregation) => {
  try {
    if (oldCongregation && queues.meetings[oldCongregation]) {
      queues.meetings[oldCongregation].pause();
    }
    if (!newCongregation) {
      showMediaWindow(false);
      navigateToCongregationSelector();
    } else {
      window.electronApi.setUrlVariables(JSON.stringify(jwStore.urlVariables));
      downloadProgress.value = {};
      updateLookupPeriod();
      registerAllCustomShortcuts();
      downloadBackgroundMusic();
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
      jwStore.updateYeartext();
      jwStore.updateJwLanguages();
      getJwMepsInfo();
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
    currentSettings.value?.coWeek,
    currentSettings.value?.memorialDate,
    currentSettings.value?.meetingScheduleChangeDate,
    currentSettings.value?.meetingScheduleChangeOnce,
    currentSettings.value?.meetingScheduleChangeMwDay,
    currentSettings.value?.meetingScheduleChangeWeDay,
    currentSettings.value?.disableMediaFetching,
  ],
  ([newCurrentCongregation], [oldCurrentCongregation]) => {
    if (newCurrentCongregation === oldCurrentCongregation) {
      updateLookupPeriod(true);
    }
  },
);

watch(
  () => currentSettings.value?.autoStartAtLogin,
  (newAutoStartAtLogin) => {
    window.electronApi.setAutoStartAtLogin(!!newAutoStartAtLogin);
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

watch(
  () => [
    currentCongregation.value,
    currentSettings.value?.enableKeyboardShortcuts,
  ],
  ([newCongregation, newEnableKeyboardShortcuts], [oldCongregation]) => {
    if (newCongregation !== oldCongregation || !newEnableKeyboardShortcuts) {
      unregisterAllCustomShortcuts();
    }
    if (newEnableKeyboardShortcuts) {
      registerAllCustomShortcuts();
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
      const targetUrl = window.electronApi.pathToFileURL(changedPath);
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
        currentState.musicPlaying ||
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
      const bcClose = new BroadcastChannel('closeAttempts');
      bcClose.postMessage({ authorizedClose: true });
    }
  }
};

const initListeners = () => {
  window.electronApi.onLog(({ ctx, level, msg }) => {
    console[level](`[main] ${msg}`, ctx);
  });

  window.electronApi.onShortcut(({ shortcut }) => {
    if (!currentSettings.value?.enableKeyboardShortcuts) return;
    executeShortcut(shortcut);
  });

  window.electronApi.onWatchFolderUpdate(({ changedPath, day, event }) => {
    updateWatchFolderRef({ changedPath, day, event });
  });

  window.electronApi.onDownloadStarted((args) => {
    downloadProgress.value[args.id] = {
      filename: args.filename,
      total: args.totalBytes,
    };
  });

  window.electronApi.onDownloadCancelled((args) => {
    if (downloadProgress.value[args.id])
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      downloadProgress.value[args.id]!.error = true;
  });

  window.electronApi.onDownloadCompleted((args) => {
    if (downloadProgress.value[args.id]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      downloadProgress.value[args.id]!.complete = true;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      delete downloadProgress.value[args.id]!.loaded;
    }
  });

  window.electronApi.onDownloadError((args) => {
    if (downloadProgress.value[args.id])
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      downloadProgress.value[args.id]!.error = true;
  });

  window.electronApi.onDownloadProgress((args) => {
    if (downloadProgress.value[args.id]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      downloadProgress.value[args.id]!.loaded = args.bytesReceived;
    }
  });
};

const removeListeners = () => {
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
      window.electronApi.removeListeners(listener);
    } catch (error) {
      errorCatcher(error);
    }
  });
};

onMounted(() => {
  if (!currentSettings.value) navigateToCongregationSelector();
  initListeners();
});

onBeforeUnmount(() => {
  removeListeners();
});

watchImmediate(
  () => [
    jwStore.urlVariables?.base,
    jwStore.urlVariables?.mediator,
    currentState.online,
  ],
  () => {
    if (currentState.online) {
      setElementFont('JW-Icons');
      getJwMepsInfo();
    }
  },
);
</script>
