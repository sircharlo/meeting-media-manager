<template>
  <DialogCacheClear
    v-model="cacheClearConfirmPopup"
    v-model:cache-clear-type="cacheClearType"
    :cache-files="cacheFiles"
    :untouchable-directories="untouchableDirectories"
    :unused-parent-directories="unusedParentDirectories"
  />
  <q-btn v-if="selectedDate" color="white-transparent" unelevated>
    <q-icon class="q-mr-sm" name="mmm-tools" size="xs" />
    {{ $t('tools') }}
    <q-tooltip v-if="!moreOptionsMenuActive" :delay="1000">
      {{ $t('tools') }}
    </q-tooltip>
    <q-menu
      :offset="[0, 11]"
      @before-hide="moreOptionsMenuActive = false"
      @show="
        moreOptionsMenuActive = true;
        calculateCacheSize();
      "
    >
      <q-list style="min-width: 100px">
        <template v-if="invalidSettings()">
          <q-item-label header>{{ $t('invalid-settings') }}</q-item-label>
          <q-item
            clickable
            @click="onlyShowInvalidSettings = !onlyShowInvalidSettings"
          >
            <q-item-section avatar>
              <q-icon
                :color="onlyShowInvalidSettings ? 'primary' : 'negative'"
                :name="onlyShowInvalidSettings ? 'mmm-menu' : 'mmm-error'"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label
                >{{
                  onlyShowInvalidSettings
                    ? $t('show-all-settings')
                    : $t('only-show-settings-that-are-not-valid')
                }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <q-item-label header>{{ $t('cache') }}</q-item-label>
        <q-item
          v-close-popup
          :disable="calculatingCacheSize"
          clickable
          @click="confirmDeleteCacheFiles('smart')"
        >
          <q-item-section avatar>
            <q-icon color="primary" name="mmm-delete-smart" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('remove-unused-cache') }} </q-item-label>
            <q-item-label caption>{{ unusedCacheFoldersSize }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          :disable="calculatingCacheSize"
          clickable
          @click="confirmDeleteCacheFiles('all')"
        >
          <q-item-section avatar>
            <q-icon color="primary" name="mmm-delete-all" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('remove-all-cache') }} </q-item-label>
            <q-item-label caption>{{ allCacheFilesSize }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
// Packages
import { storeToRefs } from 'pinia';
import prettyBytes from 'pretty-bytes';
import { QMenu } from 'quasar';
import { computed, ref } from 'vue';

// Components
import DialogCacheClear from 'src/components/dialog/DialogCacheClear.vue';

// Helpers
import { electronApi } from 'src/helpers/electron-api';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  getAdditionalMediaPath,
  getParentDirectory,
  getPublicationDirectory,
  getPublicationsPath,
  getTempDirectory,
} from 'src/helpers/fs';

// Stores
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';

// Types
import type { CacheFile } from 'src/types';

const { fs, klawSync, pathToFileURL } = electronApi;

const jwStore = useJwStore();
const { additionalMediaMaps, lookupPeriod } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { invalidSettings } = currentState;
const {
  currentSettings,
  currentSongbook,
  onlyShowInvalidSettings,
  selectedDate,
} = storeToRefs(currentState);

const moreOptionsMenuActive = ref(false);
const calculatingCacheSize = ref(false);
const cacheClearConfirmPopup = ref(false);
const cacheClearType = ref<'' | 'all' | 'smart'>('');
const cacheFiles = ref<CacheFile[]>([]);

const frequentlyUsedDirectories = computed(() => {
  const getDirectory = (pub: string, issue?: number) => {
    const directoryParams: {
      issue?: number;
      langwritten: string;
      pub: string;
    } = {
      langwritten: currentSettings.value?.lang,
      pub,
    };
    if (issue === 0) {
      directoryParams.issue = issue;
    }
    return currentSettings.value
      ? getPublicationDirectory(directoryParams)
      : '';
  };

  const directories = [
    currentSongbook.value ? getDirectory(currentSongbook.value.pub) : '', // Background music
    currentSongbook.value ? getDirectory(currentSongbook.value.pub, 0) : '', // Songbook videos
    getDirectory('it', 0), // Insight
    getDirectory('lff', 0), // Enjoy Life Forever
    getDirectory('lmd', 0), // Love People
  ];

  return new Set(directories.filter(Boolean));
});

const confirmDeleteCacheFiles = (type: 'all' | 'smart') => {
  cacheClearType.value = type;
  cacheClearConfirmPopup.value = true;
};

const unusedParentDirectories = computed(() => {
  try {
    return cacheFiles.value.reduce(
      (acc, file) => {
        if (
          !usedParentDirectories.value[file.parentPath] &&
          !frequentlyUsedDirectories.value.has(file.parentPath) &&
          !untouchableDirectories.value.has(file.parentPath)
        ) {
          if (acc[file.parentPath]) {
            acc[file.parentPath] += file.size;
          } else {
            acc[file.parentPath] = file.size;
          }
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  } catch (error) {
    errorCatcher(error);
    return {} as Record<string, number>;
  }
});

const usedParentDirectories = computed(() => {
  try {
    return usedCacheFiles.value.reduce(
      (acc, file) => {
        if (acc[file.parentPath]) {
          acc[file.parentPath] += file.size;
        } else {
          acc[file.parentPath] = file.size;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  } catch (error) {
    errorCatcher(error);
    return {};
  }
});

const usedCacheFiles = computed(() => {
  try {
    const usedFiles = cacheFiles.value.filter((f) => !f.orphaned);
    return usedFiles;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
});

const untouchableDirectories = computed(() => {
  try {
    return new Set([
      getAdditionalMediaPath(),
      getPublicationsPath(),
      getTempDirectory(),
    ]);
  } catch (error) {
    errorCatcher(error);
    return new Set() as Set<string>;
  }
});

const unusedCacheFoldersSize = computed(() => {
  try {
    if (!cacheFiles.value.length) return '...';
    const size = Object.values(unusedParentDirectories.value).reduce(
      (a, b) => a + b,
      0,
    );
    return prettyBytes(size);
  } catch (error) {
    errorCatcher(error);
    return prettyBytes(0);
  }
});

const allCacheFilesSize = computed(() => {
  try {
    if (!cacheFiles.value.length) return '...';
    return prettyBytes(
      cacheFiles.value.reduce((size, cacheFile) => size + cacheFile.size, 0),
    );
  } catch (error) {
    errorCatcher(error);
    return prettyBytes(0);
  }
});

const calculateCacheSize = async () => {
  calculatingCacheSize.value = true;
  cacheFiles.value = [];
  try {
    const cacheDirs = [
      getAdditionalMediaPath(),
      getTempDirectory(),
      getPublicationsPath(),
    ].filter((dir) => fs.existsSync(dir));
    const lookupPeriodsCollections = Object.values(lookupPeriod.value).flatMap(
      (congregationLookupPeriods) =>
        congregationLookupPeriods.flatMap(
          (lookupPeriods) => lookupPeriods?.dynamicMedia || [],
        ),
    );
    const additionalMediaCollections = Object.values(
      additionalMediaMaps.value,
    ).flatMap((congregationAdditionalMediaMap) =>
      Object.values(congregationAdditionalMediaMap).flat(),
    );
    const mediaFileParentDirectories = new Set([
      ...additionalMediaCollections.map((media) =>
        pathToFileURL(getParentDirectory(media.fileUrl)),
      ),
      ...lookupPeriodsCollections.map((media) =>
        pathToFileURL(getParentDirectory(media.fileUrl)),
      ),
    ]);
    for (const cacheDir of cacheDirs) {
      cacheFiles.value.push(
        ...klawSync(cacheDir, {
          nodir: true,
          nofile: false,
        }).map((file) => {
          const fileParentDirectory = getParentDirectory(file.path);
          const fileParentDirectoryUrl = pathToFileURL(fileParentDirectory);

          return {
            directory: false,
            orphaned: !mediaFileParentDirectories.has(fileParentDirectoryUrl), // Not referenced on any date
            parentPath: fileParentDirectory,
            path: file.path,
            size: file.stats.size,
          };
        }),
      );
    }
  } catch (error) {
    errorCatcher(error);
  }
  calculatingCacheSize.value = false;
};
</script>
