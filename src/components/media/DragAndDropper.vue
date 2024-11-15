<template>
  <q-dialog v-model="open" persistent>
    <div
      class="items-center q-pb-lg q-px-lg q-gutter-y-lg bg-secondary-contrast"
    >
      <div class="text-h6 row">
        {{
          $t(
            jwpubDocuments?.length && !(!!jwpubDb && jwpubLoading)
              ? 'choose-a-document-for-import'
              : 'add-extra-media',
          )
        }}
      </div>
      <template v-if="jwpubDocuments?.length && !(!!jwpubDb && jwpubLoading)">
        <div class="row">
          <q-scroll-area
            :bar-style="barStyle"
            :thumb-style="thumbStyle"
            style="height: 40vh; width: -webkit-fill-available"
          >
            <q-list class="full-width">
              <q-item
                v-for="jwpubImportDocument in jwpubDocuments"
                :key="jwpubImportDocument.DocumentId"
                clickable
                @click="
                  jwpubLoading = true;
                  addJwpubDocumentMediaToFiles(
                    jwpubDb,
                    jwpubImportDocument,
                  ).then((errors) => {
                    resetModal();
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
                <q-item-section class="no-wrap">
                  {{ jwpubImportDocument.Title }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </div>
      </template>
      <template v-else>
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
            <template v-if="totalFiles || (!!jwpubDb && jwpubLoading)">
              <q-linear-progress
                :indeterminate="totalFiles === 1"
                :value="percentValue"
                class="full-height"
                color="primary"
              >
                <div
                  v-if="totalFiles > 1"
                  class="absolute-full flex flex-center"
                >
                  <q-badge
                    :label="(percentValue * 100).toFixed(0) + '%'"
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
      <div class="row justify-end">
        <q-btn
          v-close-popup
          :label="$t('cancel')"
          color="negative"
          flat
          @click="resetModal()"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import type { DocumentItem, MediaSection } from 'src/types';

import { useScrollbar } from 'src/composables/useScrollbar';
import {
  AUDIO_EXTENSIONS,
  IMG_EXTENSIONS,
  OTHER_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from 'src/constants/fs';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addJwpubDocumentMediaToFiles } from 'src/helpers/jw-media';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { computed, ref } from 'vue';

const { openFileDialog } = window.electronApi;
const { barStyle, thumbStyle } = useScrollbar();

const props = defineProps<{
  currentFile: number;
  section?: MediaSection;
  totalFiles: number;
}>();

const jwpubLoading = ref(false);

const open = defineModel<boolean>({ required: true });
const jwpubDb = defineModel<string>('jwpubDb', { required: true });
const jwpubDocuments = defineModel<DocumentItem[]>('jwpubDocuments', {
  required: true,
});

const percentValue = computed(() => {
  return props.currentFile && props.totalFiles
    ? props.currentFile / props.totalFiles
    : 0;
});

const resetModal = () => {
  open.value = false;
  jwpubDb.value = '';
  jwpubLoading.value = false;
  jwpubDocuments.value = [];
};

const getLocalFiles = async () => {
  openFileDialog()
    .then((result) => {
      if (result && result.filePaths.length > 0) {
        window.dispatchEvent(
          new CustomEvent<{
            files: { filename?: string; filetype?: string; path: string }[];
            section?: MediaSection;
          }>('localFiles-browsed', {
            detail: {
              files: result.filePaths.map((path) => ({ path })),
              section: props.section,
            },
          }),
        );
      }
    })
    .catch((error) => {
      errorCatcher(error);
    });
};
</script>
