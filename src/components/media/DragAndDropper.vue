<template>
  <q-dialog v-model="localValue">
    <div
      class="items-center q-pb-lg q-px-lg q-gutter-y-lg bg-secondary-contrast"
    >
      <div class="text-h6 row">{{ $t('add-extra-media') }}</div>
      <template
        v-if="
          localJwpubDocuments?.length === 0 ||
          localFilesLoading > -1 ||
          (!!localJwpubDb && jwpubLoading) ||
          !localJwpubDb
        "
      >
        <div class="row">
          <p>{{ $t('local-media-explain-1') }}</p>
          <a
            >{{ $t('local-media-explain-2') }}
            <q-tooltip
              ><div class="row">
                <strong>{{ $t('images:') }}</strong
                >&nbsp;
                {{ IMG_EXTENSIONS.sort().join(', ') }}
              </div>
              <div class="row">
                <strong>{{ $t('videos:') }}</strong
                >&nbsp;
                {{ VIDEO_EXTENSIONS.sort().join(', ') }}
              </div>
              <div class="row">
                <strong>{{ $t('audio:') }}</strong
                >&nbsp;
                {{ AUDIO_EXTENSIONS.sort().join(', ') }}
              </div>
              <div class="row">
                <strong>{{ $t('other:') }}</strong
                >&nbsp;
                {{ OTHER_EXTENSIONS.sort().join(', ') }}
              </div>
            </q-tooltip>
          </a>
        </div>
        <div class="row">
          <div
            class="col rounded-borders dashed-border items-center justify-center flex"
            style="height: 20vh"
          >
            <template
              v-if="
                (-1 < localFilesLoading && localFilesLoading < 1) ||
                (!!localJwpubDb && jwpubLoading)
              "
            >
              <q-linear-progress
                :value="localFilesLoading"
                class="full-height"
                color="primary"
              >
                <div class="absolute-full flex flex-center">
                  <q-badge
                    :label="(localFilesLoading * 100).toFixed(0) + '%'"
                    color="white"
                    text-color="primary"
                  />
                </div>
              </q-linear-progress>
            </template>
            <template v-else>
              <q-icon class="q-mr-sm" name="mmm-drag-n-drop" size="lg" />
              {{ $t('drag-and-drop-or ') }}&nbsp;
              <a @click="getLocalFiles()"> {{ $t('browse for files') }}</a
              >.
            </template>
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
import {
  AUDIO_EXTENSIONS,
  IMG_EXTENSIONS,
  OTHER_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from 'src/constants/fs';
import { electronApi } from 'src/helpers/electron-api';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addJwpubDocumentMediaToFiles } from 'src/helpers/jw-media';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { ref, watch } from 'vue';

const { openFileDialog } = electronApi;
const props = defineProps<{
  filesLoading: number;
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
