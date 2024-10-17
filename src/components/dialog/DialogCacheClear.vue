<template>
  <q-dialog v-model="open">
    <q-card class="modal-confirm">
      <q-card-section
        class="row items-center text-bigger text-semibold text-negative q-pb-none"
      >
        <q-icon class="q-mr-sm" name="mmm-delete" />
        {{ $t('clear-cache') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{ $t('are-you-sure-you-want-to-clear-the-cache') }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn :label="$t('cancel')" flat @click="open = false" />
        <q-btn
          :label="$t('delete')"
          color="negative"
          flat
          @click="deleteCacheFiles(cacheClearType)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
// Packages
import PQueue from 'p-queue';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

// Globals
import { queues } from 'src/boot/globals';

// Helpers
import { updateLookupPeriod } from 'src/helpers/date';
import { electronApi } from 'src/helpers/electron-api';
import { errorCatcher } from 'src/helpers/error-catcher';
import { removeEmptyDirs } from 'src/helpers/fs';

// Stores
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';

// Types
import type { CacheFile } from 'src/types';

// Props
const props = defineProps<{
  cacheFiles: CacheFile[];
  untouchableDirectories: Set<string>;
  unusedParentDirectories: Record<string, number>;
}>();

const { fs } = electronApi;

const jwStore = useJwStore();
const { additionalMediaMaps, lookupPeriod } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { currentCongregation } = storeToRefs(currentState);

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

const deleteCacheFiles = (type: '' | 'all' | 'smart') => {
  try {
    deletingCacheFiles.value = true;
    const filepathsToDelete =
      type === 'smart'
        ? Object.keys(props.unusedParentDirectories)
        : props.cacheFiles.map((f) => f.path);
    for (const filepath of filepathsToDelete) {
      try {
        fs.rmSync(filepath, { recursive: true });
      } catch (error) {
        errorCatcher(error);
      }
      additionalMediaMaps.value = {};
    }
    for (const untouchableDirectory of props.untouchableDirectories) {
      removeEmptyDirs(untouchableDirectory);
    }
    queues.downloads[currentCongregation.value]?.clear();
    queues.downloads[currentCongregation.value] = new PQueue({
      concurrency: 5,
    });
    if (type === 'all') {
      lookupPeriod.value[currentCongregation.value] = [];
      updateLookupPeriod();
    }
    cancelDeleteCacheFiles();
  } catch (error) {
    errorCatcher(error);
  }
};
</script>
