<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId" persistent>
    <q-card class="modal-confirm large-overlay">
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
      <q-card-section>
        <q-expansion-item
          class="bg-accent-100"
          :label="
            (cacheClearType === 'all' ? t('files') : t('directories')) +
            ': ' +
            filepathsToDelete.length
          "
        >
          <q-scroll-area style="height: 200px; width: 100%">
            <ul
              v-for="(filepath, index) in filepathsToDelete"
              :key="index"
              class="text-body2"
              dense
            >
              <li>
                <pre>{{ filepath }}</pre>
              </li>
            </ul>
          </q-scroll-area>
        </q-expansion-item>
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn flat :label="t('cancel')" @click="handleCancel" />
        <q-btn
          color="negative"
          flat
          :label="t('delete')"
          :loading="deletingCacheFiles"
          @click="handleDeleteCacheFiles(cacheClearType)"
        />
      </q-card-actions>
    </q-card>
  </BaseDialog>
</template>
<script setup lang="ts">
import type { CacheAnalysis } from 'src/types';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import { deleteCacheFiles } from 'src/helpers/cleanup';
import { errorCatcher } from 'src/helpers/error-catcher';
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
    await deleteCacheFiles(type);
    dialogValue.value = false;
    emit('hide');
  } catch (error) {
    errorCatcher(error);
    deletingCacheFiles.value = false;
  }
};
</script>
