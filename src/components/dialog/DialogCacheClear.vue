<template>
  <ConfirmDialog
    v-model="dialogValue"
    card-class="large-overlay"
    :confirm-label="t('delete')"
    :dialog-id="dialogId"
    icon="mmm-delete"
    :loading="deletingCacheFiles"
    :message="
      t(
        cacheClearType === 'all'
          ? 'are-you-sure-delete-cache'
          : 'are-you-sure-delete-unused-cache',
      )
    "
    persistent
    :title="t('clear-cache')"
    @cancel="handleCancel"
    @confirm="handleDeleteCacheFiles(cacheClearType)"
  >
    <q-card-section class="q-pt-none">
      <q-expansion-item
        class="bg-accent-100"
        :label="
          (cacheClearType === 'all' ? t('files') : t('directories')) +
          ': ' +
          filepathsToDelete.length
        "
      >
        <q-scroll-area style="height: 200px; width: 100%">
          <div
            v-for="(filepath, index) in filepathsToDelete"
            :key="index"
            class="cache-file-row ellipsis"
            :title="filepath"
          >
            {{ filepath }}
          </div>
        </q-scroll-area>
      </q-expansion-item>
    </q-card-section>
  </ConfirmDialog>
</template>
<script setup lang="ts">
import type { CacheAnalysis } from 'src/types';

import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import prettyBytes from 'pretty-bytes';
import { deleteCacheFiles } from 'src/helpers/cleanup';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props
const props = defineProps<{
  cacheAnalysis: CacheAnalysis | null;
  cacheClearType: '' | 'all' | 'smart';
  dialogId: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  hide: [];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const deletingCacheFiles = ref(false);

const handleCancel = () => {
  dialogValue.value = false;
  emit('hide');
};

const filepathsToDelete = computed(() => {
  if (!props.cacheAnalysis) return [];

  if (props.cacheClearType === 'smart') {
    return Object.keys(props.cacheAnalysis.unusedParentDirectories);
  }
  return props.cacheAnalysis.cacheFiles.map((f) => f.path);
});

const handleDeleteCacheFiles = async (type: '' | 'all' | 'smart') => {
  if (!type || (type !== 'all' && type !== 'smart')) return;

  try {
    deletingCacheFiles.value = true;
    const { bytesFreed, itemsDeleted, mode } = await deleteCacheFiles(type);
    dialogValue.value = false;
    emit('hide');

    const sizeStr = prettyBytes(bytesFreed || 0);
    if (itemsDeleted) {
      createTemporaryNotification({
        icon: 'mmm-shimmer',
        message: t('cleared-item-s-from-cache', {
          itemsDeleted,
          sizeStr,
        }),
        timeout: 5000,
        type: 'positive',
      });
    } else {
      createTemporaryNotification({
        message:
          mode === 'all'
            ? t('no-cache-items-found-to-clear')
            : t('no-unused-cache-items-found-to-clear'),
        type: 'info',
      });
    }
  } catch (error) {
    errorCatcher(error);
  } finally {
    // This dialog is mounted unconditionally (toggled via v-model, not
    // v-if), so the component instance - and this ref - persists across
    // repeated opens. Resetting on every exit path (not just the catch
    // block) keeps the Confirm button clickable again next time the dialog
    // opens; previously a *successful* clear never reset it, permanently
    // stuck the button behind Quasar's loading no-op click guard.
    deletingCacheFiles.value = false;
  }
};
</script>

<style scoped>
/* Each path was previously its own <ul><li><pre> - a fresh bulleted list
   per row plus <pre>'s default browser styling (border, background, no
   truncation) instead of one plain, evenly-spaced list. */
.cache-file-row {
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 0.9em;
  padding: 0.35em 0.5em;
}

.cache-file-row:last-child {
  border-bottom: none;
}

.cache-file-row:nth-child(odd) {
  background: rgba(128, 128, 128, 0.05);
}
</style>
