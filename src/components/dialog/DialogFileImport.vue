<template>
  <q-dialog
    v-model="open"
    persistent
    @dragenter="dropHandler($event, 'dragenter')"
    @dragover="dropHandler($event, 'dragover')"
    @dragstart="dropHandler($event, 'dragstart')"
    @drop="dropHandler($event, 'drop')"
  >
    <div
      class="bg-secondary-contrast flex medium-overlay q-px-none"
      style="flex-flow: column"
    >
      <div class="text-h6 row q-px-md q-pt-lg q-pb-md">
        {{
          t(
            jwpubDocuments?.length && !(!!jwpubDb && jwpubLoading)
              ? 'choose-a-document-for-import'
              : 'add-extra-media',
          )
        }}
      </div>
      <template v-if="jwpubDocuments?.length && !(!!jwpubDb && jwpubLoading)">
        <div class="row q-px-md overflow-auto">
          <q-list class="full-width">
            <q-item
              v-for="jwpubImportDocument in jwpubDocuments"
              :key="jwpubImportDocument.DocumentId"
              class="rounded-borders"
              clickable
              @click="
                jwpubLoading = true;
                addJwpubDocumentMediaToFiles(
                  jwpubDb,
                  jwpubImportDocument,
                  section,
                ).then(() => {
                  open = false;
                });
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
        <div class="row q-px-md">
          <p>{{ t('local-media-explain-1') }}</p>
          <a>
            {{ t('local-media-explain-2') }}
            <q-tooltip>
              <div class="row">
                <strong>{{ t('images:') }}&nbsp;</strong>
                {{ IMG_EXTENSIONS.sort().join(', ') }}
              </div>
              <div class="row">
                <strong>{{ t('videos:') }}&nbsp;</strong>
                {{ VIDEO_EXTENSIONS.sort().join(', ') }}
              </div>
              <div class="row">
                <strong>{{ t('audio:') }}&nbsp;</strong>
                {{ AUDIO_EXTENSIONS.sort().join(', ') }}
              </div>
              <div class="row">
                <strong>{{ t('other:') }}&nbsp;</strong>
                {{ OTHER_EXTENSIONS.sort().join(', ') }}
              </div>
            </q-tooltip>
          </a>
        </div>
        <div class="row q-px-md q-pt-md">
          <div
            ref="dropArea"
            class="col rounded-borders dashed-border items-center justify-center flex bg-accent-100 animated slow"
            :class="{
              'cursor-pointer': !totalFiles && !(!!jwpubDb || jwpubLoading),
              'bg-accent-200':
                isOverDropZone ||
                (hovering && !totalFiles && !(!!jwpubDb || jwpubLoading)),
            }"
            style="min-height: 200px"
            @click="
              () => {
                if (!totalFiles && !(!!jwpubDb || jwpubLoading)) {
                  getLocalFiles();
                }
              }
            "
          >
            <template v-if="totalFiles || (!!jwpubDb && jwpubLoading)">
              <q-circular-progress
                color="primary"
                :indeterminate="totalFiles === 1"
                :max="totalFiles"
                size="xl"
                track-color="accent-200"
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
              </q-circular-progress>
            </template>
            <template v-else>
              <q-icon class="q-mr-sm" name="mmm-drag-n-drop" size="lg" />
              {{ t('drag-and-drop-or-click-to-browse') }}
            </template>
          </div>
        </div>
      </template>
      <div class="row q-px-md q-py-md justify-end">
        <q-btn
          v-close-popup
          color="negative"
          flat
          :label="t('cancel')"
          @click="open = false"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import type { DocumentItem, MediaSectionIdentifier } from 'src/types';

import { useDropZone, useElementHover, watchImmediate } from '@vueuse/core';
import {
  AUDIO_EXTENSIONS,
  IMG_EXTENSIONS,
  OTHER_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addJwpubDocumentMediaToFiles } from 'src/helpers/jw-media';
import { computed, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  currentFile: number;
  section: MediaSectionIdentifier | undefined;
  totalFiles: number;
}>();

const open = defineModel<boolean>({ required: true });
const jwpubDb = defineModel<string>('jwpubDb', { required: true });
const jwpubDocuments = defineModel<DocumentItem[]>('jwpubDocuments', {
  required: true,
});

const dropArea = useTemplateRef('dropArea');
const hovering = useElementHover(dropArea);
const authorizedDrop = ref(false);
const jwpubLoading = ref(false);

const percentValue = computed(() => {
  return props.currentFile && props.totalFiles
    ? props.currentFile / props.totalFiles
    : 0;
});

watchImmediate(
  () => open.value,
  (value) => {
    if (!value) {
      hovering.value = false;
      jwpubDb.value = '';
      jwpubLoading.value = false;
      jwpubDocuments.value = [];
      authorizedDrop.value = false;
    }
  },
);

const getLocalFiles = async () => {
  window.electronApi
    .openFileDialog()
    .then((result) => {
      if (result && result.filePaths.length > 0) {
        window.dispatchEvent(
          new CustomEvent<{
            files: { filename?: string; filetype?: string; path: string }[];
            section: MediaSectionIdentifier | undefined;
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

const dropHandler = (event: DragEvent, eventType: string) => {
  if (eventType !== 'drop') {
    // Prevent the default for the drag event, to eventually allow the drop event to be fired
    event.preventDefault();
  } else if (eventType === 'drop') {
    if (!authorizedDrop.value) {
      // Prevent the drop event from propagating, since it's outside the drop area
      event.stopPropagation();
      event.stopImmediatePropagation();
      // Animate the drop area
      const element = dropArea.value;
      if (element) {
        element.classList.add('shakeX');
        // Remove the animation class after the animation ends
        element.addEventListener(
          'animationend',
          () => {
            element.classList.remove('shakeX');
          },
          { once: true },
        );
      }
    }
  }
};

function onDrop() {
  authorizedDrop.value = true;
}

const { isOverDropZone } = useDropZone(dropArea, {
  onDrop,
  preventDefaultForUnhandled: true,
});
</script>
