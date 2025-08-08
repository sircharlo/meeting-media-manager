<template>
  <BaseDialog
    v-model="dialogValue"
    :dialog-id="dialogId"
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
      {{ totalFiles || (!!jwpubDb && jwpubLoading) }}
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
              @click="handleJwpubImport(jwpubImportDocument)"
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
          color="negative"
          flat
          :label="t('cancel')"
          @click="handleCancel"
        />
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import type { DocumentItem, MediaSectionIdentifier } from 'src/types';

import { useDropZone, useElementHover, useEventListener } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import {
  AUDIO_EXTENSIONS,
  IMG_EXTENSIONS,
  OTHER_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addJwpubDocumentMediaToFiles } from 'src/helpers/jw-media';
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  currentFile: number;
  dialogId: string;
  jwpubDb?: string;
  jwpubDocuments?: DocumentItem[];
  modelValue: boolean;
  section: MediaSectionIdentifier | undefined;
  totalFiles: number;
}>();

const emit = defineEmits<{
  cancel: [];
  ok: [];
  'update:jwpub-db': [value: string];
  'update:jwpub-documents': [value: DocumentItem[]];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const jwpubDb = computed({
  get: () => props.jwpubDb || '',
  set: (value) => emit('update:jwpub-db', value),
});

const jwpubDocuments = computed({
  get: () => props.jwpubDocuments || [],
  set: (value) => emit('update:jwpub-documents', value),
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

// Watch for dialog closing to reset loading states and data
watch(
  () => dialogValue.value,
  (isOpen) => {
    if (!isOpen) {
      // Reset loading states and data when dialog closes
      jwpubLoading.value = false;
      jwpubDb.value = '';
      jwpubDocuments.value = [];
    }
  },
);

// Watch for processing completion to auto-close dialog
watch(
  () => props.totalFiles || (!!jwpubDb.value && jwpubLoading.value),
  (isProcessing, wasProcessing) => {
    // Only close if we were processing and now we're not
    if (wasProcessing && !isProcessing && dialogValue.value) {
      console.log('🎯 File processing complete, auto-closing dialog');
      dialogValue.value = false;
    }
  },
);

// Listen for JW Playlist mode activation
useEventListener(
  window,
  'openJwPlaylistDialog',
  () => {
    console.log('🎯 JW Playlist mode activated, closing file import dialog');
    // Reset JW PUB data when switching to JW playlist dialog
    jwpubLoading.value = false;
    jwpubDb.value = '';
    jwpubDocuments.value = [];
    dialogValue.value = false;
    emit('cancel');
  },
  { passive: true },
);

// Reset state when component unmounts
onUnmounted(() => {
  hovering.value = false;
  jwpubDb.value = '';
  jwpubLoading.value = false;
  jwpubDocuments.value = [];
  authorizedDrop.value = false;
});

const getLocalFiles = async () => {
  window.electronApi
    .openFileDialog()
    .then((result) => {
      if (result && result.filePaths.length > 0) {
        window.dispatchEvent(
          new CustomEvent<{
            files: (File | string)[];
            section: MediaSectionIdentifier | undefined;
          }>('localFiles-browsed', {
            detail: { files: result.filePaths, section: props.section },
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
          { once: true, passive: true },
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

const handleJwpubImport = async (jwpubImportDocument: DocumentItem) => {
  try {
    jwpubLoading.value = true;
    await addJwpubDocumentMediaToFiles(
      jwpubDb.value,
      jwpubImportDocument,
      props.section,
    );
    dialogValue.value = false;
    emit('ok');
  } catch (error) {
    console.error('❌ JW Playlist import failed:', error);
    errorCatcher(error);
  } finally {
    jwpubLoading.value = false;
  }
};

const handleCancel = () => {
  // Reset loading states and JW PUB data
  jwpubLoading.value = false;
  jwpubDb.value = '';
  jwpubDocuments.value = [];
  dialogValue.value = false;
  emit('cancel');
};
</script>
