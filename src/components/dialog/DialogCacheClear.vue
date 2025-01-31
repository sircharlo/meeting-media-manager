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

import { updateLookupPeriod } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { removeEmptyDirs } from 'src/utils/fs';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props
const props = defineProps<{
  cacheFiles: CacheFile[];
  untouchableDirectories: Set<string>;
  unusedParentDirectories: Record<string, number>;
}>();

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

    try {
      await Promise.allSettled(
        filepathsToDelete.map((f) => window.electronApi.fs.remove(f)),
      );
    } catch (e) {
      errorCatcher(e);
    }

    try {
      await Promise.allSettled(
        [...props.untouchableDirectories].map((d) => removeEmptyDirs(d)),
      );
    } catch (e) {
      errorCatcher(e);
    }

    if (type === 'all') {
      updateLookupPeriod(true);
    }
    cancelDeleteCacheFiles();
  } catch (error) {
    errorCatcher(error);
  }
};
</script>
