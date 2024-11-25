<template>
  <q-dialog v-model="open" persistent>
    <div
      class="bg-secondary-contrast column fit-snugly medium-overlay q-px-none"
    >
      <div class="text-h6 col-shrink full-width q-px-md q-pt-lg">
        {{
          $t(
            jwpubDocuments?.length && !(!!jwpubDb && jwpubLoading)
              ? 'choose-a-document-for-import'
              : 'add-extra-media',
          )
        }}
      </div>
      <template v-if="jwpubDocuments?.length && !(!!jwpubDb && jwpubLoading)">
        <div class="row" style="max-height: 40vh">
          <q-list class="full-width">
            <q-item
              v-for="jwpubImportDocument in jwpubDocuments"
              :key="jwpubImportDocument.DocumentId"
              clickable
              @click="
                jwpubLoading = true;
                addJwpubDocumentMediaToFiles(jwpubDb, jwpubImportDocument).then(
                  resetModal,
                );
              "
            >
              <q-item-section class="no-wrap">
                {{ jwpubImportDocument.Title }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </template>
      <template v-else>
        <div class="col-shrink full-width q-px-md q-pt-md">
          <p>{{ $t('local-media-explain-1') }}</p>
          <a>
            {{ $t('local-media-explain-2') }}
            <q-tooltip>
              <div class="row">
                <strong>{{ $t('images:') }}&nbsp;</strong>
                {{ IMG_EXTENSIONS.sort().join(', ') }}
              </div>
              <div class="row">
                <strong>{{ $t('videos:') }}&nbsp;</strong>
                {{ VIDEO_EXTENSIONS.sort().join(', ') }}
              </div>
              <div class="row">
                <strong>{{ $t('audio:') }}&nbsp;</strong>
                {{ AUDIO_EXTENSIONS.sort().join(', ') }}
              </div>
              <div class="row">
                <strong>{{ $t('other:') }}&nbsp;</strong>
                {{ OTHER_EXTENSIONS.sort().join(', ') }}
              </div>
            </q-tooltip>
          </a>
        </div>
        <div class="col full-width q-px-md q-pt-md">
          <div
            ref="dropArea"
            class="col rounded-borders dashed-border items-center justify-center flex"
            :class="{
              'cursor-pointer': !totalFiles && !(!!jwpubDb || jwpubLoading),
              'bg-accent-100':
                hovering && !totalFiles && !(!!jwpubDb || jwpubLoading),
              'full-height': true,
            }"
            @click="
              () => {
                if (!totalFiles && !(!!jwpubDb || jwpubLoading)) {
                  getLocalFiles();
                }
              }
            "
          >
            <template v-if="totalFiles || (!!jwpubDb && jwpubLoading)">
              <q-linear-progress
                class="full-height"
                color="primary"
                :indeterminate="totalFiles === 1"
                :value="percentValue"
              >
                <div
                  v-if="totalFiles > 1"
                  class="absolute-full flex flex-center"
                >
                  <q-badge
                    color="white"
                    :label="(percentValue * 100).toFixed(0) + '%'"
                    text-color="primary"
                  />
                </div>
              </q-linear-progress>
            </template>
            <template v-else>
              <q-icon class="q-mr-sm" name="mmm-drag-n-drop" size="lg" />
              {{ $t('drag-and-drop-or-click-to-browse') }}
            </template>
          </div>
        </div>
      </template>
      <div class="row q-px-md q-py-md col-shrink full-width justify-end">
        <q-btn
          v-close-popup
          color="negative"
          flat
          :label="$t('cancel')"
          @click="resetModal()"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import type { DocumentItem, MediaSection } from 'src/types';

import { useElementHover } from '@vueuse/core';
import {
  AUDIO_EXTENSIONS,
  IMG_EXTENSIONS,
  OTHER_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from 'src/constants/fs';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addJwpubDocumentMediaToFiles } from 'src/helpers/jw-media';
import { computed, ref, useTemplateRef } from 'vue';

const { openFileDialog } = window.electronApi;

const props = defineProps<{
  currentFile: number;
  section?: MediaSection;
  totalFiles: number;
}>();

const open = defineModel<boolean>({ required: true });
const jwpubDb = defineModel<string>('jwpubDb', { required: true });
const jwpubDocuments = defineModel<DocumentItem[]>('jwpubDocuments', {
  required: true,
});

const dropArea = useTemplateRef('dropArea');
const hovering = useElementHover(dropArea);
const jwpubLoading = ref(false);

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
