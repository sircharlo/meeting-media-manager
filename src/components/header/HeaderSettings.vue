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
    {{ t('tools') }}
    <q-tooltip v-if="!moreOptionsMenuActive" :delay="1000">
      {{ t('tools') }}
    </q-tooltip>
    <q-menu
      v-model="moreOptionsMenuActive"
      :offset="[0, 11]"
      @show="calculateCacheSize()"
    >
      <q-list>
        <template v-if="invalidSettings()">
          <q-item-label header>{{ t('invalid-settings') }}</q-item-label>
          <q-item
            clickable
            @click="onlyShowInvalidSettings = !onlyShowInvalidSettings"
          >
            <q-item-section avatar>
              <q-icon
                :color="onlyShowInvalidSettings ? 'accent-400' : 'negative'"
                :name="onlyShowInvalidSettings ? 'mmm-menu' : 'mmm-error'"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{
                  onlyShowInvalidSettings
                    ? t('show-all-settings')
                    : t('only-show-settings-that-are-not-valid')
                }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <q-item-label header>{{ t('cache') }}</q-item-label>
        <q-item
          v-close-popup
          clickable
          :disable="calculatingCacheSize"
          @click="confirmDeleteCacheFiles('smart')"
        >
          <q-item-section avatar>
            <q-icon color="accent-400" name="mmm-delete-smart" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('remove-unused-cache') }} </q-item-label>
            <q-item-label caption>{{ unusedCacheFoldersSize }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          :disable="calculatingCacheSize"
          @click="confirmDeleteCacheFiles('all')"
        >
          <q-item-section avatar>
            <q-icon color="accent-400" name="mmm-delete-all" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('remove-all-cache') }} </q-item-label>
            <q-item-label caption>{{ allCacheFilesSize }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
import type { CacheFile, JwLangCode, PublicationFetcher } from 'src/types';

import DialogCacheClear from 'components/dialog/DialogCacheClear.vue';
import { storeToRefs } from 'pinia';
import prettyBytes from 'pretty-bytes';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  getAdditionalMediaPath,
  getParentDirectory,
  getPublicationDirectory,
  getPublicationsPath,
  getTempPath,
} from 'src/utils/fs';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const jwStore = useJwStore();
const { lookupPeriod } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { invalidSettings } = currentState;
const { onlyShowInvalidSettings, selectedDate } = storeToRefs(currentState);

const moreOptionsMenuActive = ref(false);
const calculatingCacheSize = ref(false);
const cacheClearConfirmPopup = ref(false);
const cacheClearType = ref<'' | 'all' | 'smart'>('');
const cacheFiles = ref<CacheFile[]>([]);

const frequentlyUsedDirectories = ref(new Set());

const { fs, path, pathToFileURL, readdir } = window.electronApi;

const { pathExists } = fs;

const loadFrequentlyUsedDirectories = async () => {
  const getDirectory = async (
    pub: string,
    issue?: number | string,
    lang?: '' | JwLangCode,
  ) => {
    const directoryParams: PublicationFetcher = {
      issue,
      langwritten: lang ?? currentState.currentSettings?.lang ?? 'E',
      pub,
    };

    return currentState.currentSettings
      ? [
          await getPublicationDirectory(directoryParams),
          await getPublicationDirectory(
            directoryParams,
            currentState.currentSettings?.cacheFolder,
          ),
        ]
      : '';
  };

  const directories = [
    await getDirectory(currentState.currentSongbook.pub), // Background music
    await getDirectory(currentState.currentSongbook.pub, 0), // Songbook videos
    await getDirectory('nwtsty'), // Study Bible
    await getDirectory('it', 0), // Insight
    await getDirectory('lff', 0), // Enjoy Life Forever
    await getDirectory('lmd', 0), // Love People
    await getDirectory('lmdv', 0), // Love People Videos
    await getDirectory('jwlb', undefined, 'E'), // JW Library
    await getDirectory('S-34mp', currentState.currentCongregation, ''), // Public Talk Publication
  ].flat();

  frequentlyUsedDirectories.value = new Set(directories.filter(Boolean));
};

loadFrequentlyUsedDirectories();

const confirmDeleteCacheFiles = (type: 'all' | 'smart') => {
  cacheClearType.value = type;
  cacheClearConfirmPopup.value = true;
};

const unusedParentDirectories = computed(() => {
  try {
    return cacheFiles.value.reduce<Record<string, number>>((acc, file) => {
      if (
        !usedParentDirectories.value[file.parentPath] &&
        !frequentlyUsedDirectories.value.has(file.parentPath) &&
        !untouchableDirectories.value.has(file.parentPath)
      ) {
        acc[file.parentPath] = file.size + (acc[file.parentPath] ?? 0);
      }
      return acc;
    }, {});
  } catch (error) {
    errorCatcher(error);
    return {};
  }
});

const usedParentDirectories = computed(() => {
  try {
    return usedCacheFiles.value.reduce<Record<string, number>>((acc, file) => {
      acc[file.parentPath] = file.size + (acc[file.parentPath] ?? 0);
      return acc;
    }, {});
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

const untouchableDirectories = ref(new Set<string>());

const fetchUntouchableDirectories = async () => {
  try {
    untouchableDirectories.value = new Set([
      await getAdditionalMediaPath(),
      await getAdditionalMediaPath(currentState.currentSettings?.cacheFolder),
      await getPublicationsPath(),
      await getPublicationsPath(currentState.currentSettings?.cacheFolder),
      await getTempPath(),
    ]);
  } catch (error) {
    errorCatcher(error);
    untouchableDirectories.value = new Set(); // Reset to empty set on error
  }
};

watchEffect(() => {
  fetchUntouchableDirectories();
});

const unusedCacheFoldersSize = computed(() => {
  try {
    if (!cacheFiles.value.length) return prettyBytes(0);
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
    if (!cacheFiles.value.length) return prettyBytes(0);
    return prettyBytes(
      cacheFiles.value.reduce((size, cacheFile) => size + cacheFile.size, 0),
    );
  } catch (error) {
    errorCatcher(error);
    return prettyBytes(0);
  }
});

const getCacheFiles = async (cacheDirs: string[]) => {
  const lookupPeriodsCollections = Object.values(lookupPeriod.value).flatMap(
    (congregationLookupPeriods) =>
      congregationLookupPeriods?.flatMap(
        (lookupPeriods) => lookupPeriods?.dynamicMedia || [],
      ),
  );

  const mediaFileParentDirectories = new Set(
    lookupPeriodsCollections.map((media) =>
      media ? pathToFileURL(getParentDirectory(media.fileUrl)) : '',
    ),
  );

  const files: CacheFile[] = [];
  for (const cacheDir of cacheDirs) {
    try {
      const items = await readdir(cacheDir, true, true);
      for (const item of items) {
        const filePath = path.join(item.parentPath, item.name);
        if (item.isFile) {
          const parentFolder = item.parentPath.split('/').pop() || '';
          if (
            !parentFolder.startsWith('S-34mp') ||
            parentFolder === `S-34mp_${currentState.currentCongregation}` ||
            /^S-34mp_[A-Z]+_0$/.test(parentFolder)
          ) {
            const fileParentDirectoryUrl = pathToFileURL(item.parentPath);
            files.push({
              orphaned: !mediaFileParentDirectories.has(fileParentDirectoryUrl),
              parentPath: item.parentPath,
              path: filePath,
              size: item.size || 0,
            });
          }
        }
      }
    } catch (error) {
      errorCatcher(error);
    }
  }
  return files;
};

const calculateCacheSize = async () => {
  calculatingCacheSize.value = true;
  cacheFiles.value = [];
  try {
    const dirs = [
      ...new Set([
        await getPublicationsPath(),
        await getPublicationsPath(currentState.currentSettings?.cacheFolder),
        await getTempPath(),
        path.join(
          await getAdditionalMediaPath(),
          currentState.currentCongregation,
        ),
        path.join(
          await getAdditionalMediaPath(
            currentState.currentSettings?.cacheFolder,
          ),
          currentState.currentCongregation,
        ),
      ]),
    ];
    const cacheDirs = (
      await Promise.all(
        dirs.map(async (dir) => ((await pathExists(dir)) ? dir : null)),
      )
    ).filter((s) => typeof s === 'string');
    cacheFiles.value = await getCacheFiles(cacheDirs);
  } catch (error) {
    errorCatcher(error);
  }
  calculatingCacheSize.value = false;
};
</script>
