<template>
  <q-dialog v-model="open">
    <q-card class="modal-confirm">
      <q-card-section
        class="row items-center text-bigger text-semibold text-negative q-pb-none"
      >
        <q-icon class="q-mr-sm" name="mmm-delete" />
        {{ t('clear-cache') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{
          t(
            cacheClearType === 'all'
              ? 'are-you-sure-delete-cache'
              : 'are-you-sure-delete-unused-cache',
          )
        }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn flat :label="t('cancel')" @click="open = false" />
        <q-btn
          color="negative"
          flat
          :label="t('delete')"
          @click="deleteCacheFiles(cacheClearType)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import type { CacheFile } from 'src/types';

import { storeToRefs } from 'pinia';
import { updateLookupPeriod } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getAdditionalMediaPath, removeEmptyDirs } from 'src/utils/fs';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props
const props = defineProps<{
  cacheFiles: CacheFile[];
  untouchableDirectories: Set<string>;
  unusedParentDirectories: Record<string, number>;
}>();

const jwStore = useJwStore();
const { additionalMediaMaps } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();

const open = defineModel<boolean>({ default: false });
const cacheClearType = defineModel<'' | 'all' | 'smart'>('cacheClearType', {
  required: true,
});

const deletingCacheFiles = ref(false);

const cancelDeleteCacheFiles = () => {
  cacheClearType.value = '';
  open.value = false;
  deletingCacheFiles.value = false;
};

const deleteCacheFiles = async (type = '') => {
  try {
    deletingCacheFiles.value = true;
    const filepathsToDelete =
      type === 'smart'
        ? Object.keys(props.unusedParentDirectories)
        : props.cacheFiles.map((f) => f.path);
    for (const filepath of filepathsToDelete) {
      try {
        window.electronApi.fs.remove(filepath);
        if (
          filepath.startsWith(await getAdditionalMediaPath()) ||
          filepath.startsWith(
            await getAdditionalMediaPath(
              currentState.currentSettings?.cacheFolder,
            ),
          )
        ) {
          const folder = filepath.split('/').pop();
          const date = folder
            ? `${folder.slice(0, 4)}/${folder.slice(4, 6)}/${folder.slice(6, 8)}`
            : '0001/01/01';
          const cong = currentState.currentCongregation;
          if (additionalMediaMaps.value[cong]?.[date]) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete additionalMediaMaps.value[cong][date];
          }
        }
      } catch (error) {
        errorCatcher(error);
      }
    }
    for (const untouchableDirectory of props.untouchableDirectories) {
      await removeEmptyDirs(untouchableDirectory);
    }
    // queues.downloads[currentCongregation.value]?.clear();
    // queues.downloads[currentCongregation.value] = new PQueue({
    //   concurrency: 5,
    // });
    if (type === 'all') {
      updateLookupPeriod(true);
    }
    cancelDeleteCacheFiles();
  } catch (error) {
    errorCatcher(error);
  }
};
</script>
