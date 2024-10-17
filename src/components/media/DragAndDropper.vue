<template>
  <q-dialog v-model="localValue">
    <div
      class="items-center q-pb-lg q-px-lg q-gutter-y-lg bg-secondary-contrast"
    >
      <div class="text-h6 row">{{ $t('import-local-media') }}</div>
      <template
        v-if="
          localJwpubDocuments?.length === 0 ||
          localFilesLoading ||
          (!!localJwpubDb && jwpubLoading) ||
          !localJwpubDb
        "
      >
        <div class="row">
          {{ $t('local-media-explain-1') }}
          {{ $t('local-media-explain-2') }}
        </div>
        <div class="row">
          <div
            class="col rounded-borders dashed-border items-center justify-center flex"
            style="height: 20vh"
          >
            <div class="col-6">
              <template
                v-if="localFilesLoading || (!!localJwpubDb && jwpubLoading)"
              >
                <q-spinner color="primary" size="lg" />
              </template>
              <template v-else>
                <q-icon class="q-mr-sm" name="mmm-drag-n-drop" size="lg" />
                {{ $t('drag-and-drop-or ') }}
                <a @click="getLocalFiles()">{{ $t('browse for files') }}</a
                >.
              </template>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="row">
          {{ $t('choose-a-document-for-import') }}
        </div>
        <div class="row">
          <q-scroll-area
            :bar-style="barStyle()"
            :thumb-style="thumbStyle()"
            style="height: 40vh; width: -webkit-fill-available"
          >
            <q-list>
              <q-item
                v-for="jwpubImportDocument in localJwpubDocuments"
                :key="jwpubImportDocument.DocumentId"
                clickable
                @click="
                  jwpubLoading = true;
                  addJwpubDocumentMediaToFiles(
                    localJwpubDb,
                    jwpubImportDocument,
                  ).then((errors) => {
                    localValue = false;
                    jwpubLoading = false;
                    if (errors?.length)
                      errors.forEach((e) =>
                        createTemporaryNotification({
                          message: [
                            e.pub,
                            e.issue,
                            e.track,
                            e.langwritten,
                            e.fileformat,
                          ]
                            .filter(Boolean)
                            .join('_'),
                          icon: 'mmm-error',
                          caption: $t('file-not-available'),
                          type: 'negative',
                          timeout: 15000,
                        }),
                      );
                  });
                "
              >
                <q-item-section>
                  {{ jwpubImportDocument.Title }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </div>
      </template>
      <div class="row justify-end">
        <q-btn
          color="negative"
          flat
          @click="
            localJwpubDb = '';
            localValue = false;
            localFilesLoading = false;
          "
          >{{ $t('cancel') }}</q-btn
        >
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import type { DocumentItem } from 'src/types';

import { barStyle, thumbStyle } from 'src/boot/globals';
import { electronApi } from 'src/helpers/electron-api';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addJwpubDocumentMediaToFiles } from 'src/helpers/jw-media';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { ref, watch } from 'vue';

const { openFileDialog } = electronApi;
const props = defineProps<{
  filesLoading: boolean;
  jwpubDb: string;
  jwpubDocuments: DocumentItem[] | null;
  modelValue: boolean;
}>();
const emit = defineEmits([
  'update:modelValue',
  'update:jwpubDb',
  'update:jwpubDocuments',
]);
const localValue = ref(props.modelValue);
const localJwpubDb = ref(props.jwpubDb);
const localJwpubDocuments = ref(props.jwpubDocuments);
const localFilesLoading = ref(props.filesLoading);
const jwpubLoading = ref(false);

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(localJwpubDb, (newValue) => {
  emit('update:jwpubDb', newValue);
});

watch(localJwpubDocuments, (newValue) => {
  emit('update:jwpubDocuments', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  },
);

watch(
  () => props.jwpubDb,
  (newValue) => {
    localJwpubDb.value = newValue;
  },
);

watch(
  () => props.jwpubDocuments,
  (newValue) => {
    localJwpubDocuments.value = newValue;
  },
);

watch(
  () => props.filesLoading,
  (newValue) => {
    localFilesLoading.value = newValue;
  },
);

const getLocalFiles = async () => {
  openFileDialog()
    .then((result) => {
      if (result && result.filePaths.length > 0) {
        window.dispatchEvent(
          new CustomEvent('localFiles-browsed', {
            detail: result.filePaths.map((path) => {
              return {
                path,
              };
            }),
          }),
        );
      }
      localValue.value = false;
    })
    .catch((error) => {
      errorCatcher(error);
    });
};
</script>
