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
      <!-- {{ totalFiles || (!!jwpubDb && jwpubLoading) }} -->
      <div
        class="row items-center no-wrap text-bigger text-semibold text-primary q-px-md q-pt-lg q-pb-md"
      >
        <div class="icon-chip q-mr-sm">
          <q-icon name="mmm-add-media" size="xs" />
        </div>
        {{ jwpubTitle || t('add-extra-media') }}
      </div>
      <template v-if="jwpubDocuments?.length && !(!!jwpubDb && jwpubLoading)">
        <div
          v-if="jwpubDocuments?.length && !(!!jwpubDb && jwpubLoading)"
          class="row q-px-md q-pb-sm text-body2 text-secondary"
        >
          {{ t('choose-a-document-for-import') }}
        </div>
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
                <q-item-label>{{ jwpubImportDocument.Title }}</q-item-label>
                <q-item-label
                  v-if="
                    formatPageLabel(
                      t,
                      jwpubImportDocument.FirstPageNumber,
                      jwpubImportDocument.LastPageNumber,
                    )
                  "
                  caption
                >
                  {{
                    formatPageLabel(
                      t,
                      jwpubImportDocument.FirstPageNumber,
                      jwpubImportDocument.LastPageNumber,
                    )
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </template>
      <template v-else-if="!!jwpubDb && jwpubLoading">
        <div class="row q-px-md overflow-auto">
          <q-list class="full-width">
            <q-item
              v-for="skeletonIndex in 6"
              :key="skeletonIndex"
              class="rounded-borders"
            >
              <q-item-section>
                <q-skeleton height="20px" type="text" width="100%" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </template>
      <template v-else>
        <div class="row q-px-md">
          <p>
            {{ t('local-media-explain-1') }} {{ t('local-media-explain-2') }}
            <q-icon
              class="q-ml-xs cursor-pointer"
              color="primary"
              name="mmm-info"
              size="xs"
              tabindex="0"
            >
              <q-tooltip>
                <div class="row">
                  <strong>{{ t('images:') }}&nbsp;</strong>
                  {{ imageExtensionsLabel }}
                </div>
                <div class="row">
                  <strong>{{ t('videos:') }}&nbsp;</strong>
                  {{ videoExtensionsLabel }}
                </div>
                <div class="row">
                  <strong>{{ t('audio:') }}&nbsp;</strong>
                  {{ audioExtensionsLabel }}
                </div>
                <div class="row">
                  <strong>{{ t('other:') }}&nbsp;</strong>
                  {{ otherExtensionsLabel }}
                </div>
              </q-tooltip>
            </q-icon>
          </p>
        </div>
        <div class="row q-px-md q-pt-md">
          <div
            ref="dropArea"
            class="col rounded-borders dashed-border items-center justify-center flex bg-accent-100 animated slow file-import-zone"
            :class="{
              'cursor-pointer': canBrowseLocalFiles,
              'bg-accent-200':
                isOverDropZone || (hovering && canBrowseLocalFiles),
              'liquid-host': showsImportCount,
            }"
            :role="canBrowseLocalFiles ? 'button' : undefined"
            style="min-height: 200px"
            :tabindex="canBrowseLocalFiles ? 0 : undefined"
            @click="browseLocalFiles"
            @keydown.enter.space.prevent="browseLocalFiles"
          >
            <!-- Several files: the zone fills up as each one is added. One
                 file (or a JWPUB being read) has no steps to show. -->
            <template v-if="showsImportCount">
              <LiquidFill
                axis="y"
                :done="!!finishedImportTotal"
                :percent="importPercent"
                steady
                @report="importCount?.bump($event)"
              />
              <progress
                :aria-label="t('loading')"
                class="mmm-visually-hidden"
                :max="importTotal"
                :value="importedCount"
              />
              <div class="column items-center">
                <DoneCheck
                  v-if="finishedImportTotal"
                  class="q-mb-xs"
                  :size="44"
                  variant="solid"
                />
                <div
                  class="file-import-zone__count"
                  :class="{
                    'file-import-zone__count--done': finishedImportTotal,
                  }"
                >
                  <RollingNumber
                    ref="importCount"
                    :max="999"
                    :value="importedCount"
                  />
                  <span aria-hidden="true" class="file-import-zone__total">
                    / {{ importTotal }}
                  </span>
                </div>
              </div>
            </template>
            <q-spinner
              v-else-if="totalFiles || (!!jwpubDb && jwpubLoading)"
              color="primary"
              size="xl"
            />
            <template v-else>
              <q-icon class="q-mr-sm" name="mmm-drag-n-drop" size="lg" />
              {{ t('drag-and-drop-or-click-to-browse') }}
            </template>
          </div>
        </div>
      </template>
      <div class="row q-px-md q-py-md justify-end">
        <q-btn flat :label="t('cancel')" @click="handleCancel" />
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import type { DocumentItem, MediaSectionIdentifier } from 'src/types';

import {
  useDropZone,
  useElementHover,
  useEventListener,
  useTimeoutFn,
} from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import DoneCheck from 'components/ui/DoneCheck.vue';
import LiquidFill from 'components/ui/LiquidFill.vue';
import RollingNumber from 'components/ui/RollingNumber.vue';
import { useMotionMode } from 'src/composables/useMotionMode';
import {
  AUDIO_EXTENSIONS,
  IMG_EXTENSIONS,
  OTHER_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { formatPageLabel } from 'src/utils/general';
import { LIQUID_DONE_HOLD_MS } from 'src/utils/liquid-motion';
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// toSorted, not sort: the extension lists are shared constants, and sorting
// them in place would reorder them for every other module that reads them.
// localeCompare rather than the default code-unit order, which isn't
// alphabetical.
const formatExtensions = (extensions: string[]) =>
  extensions.toSorted((a, b) => a.localeCompare(b)).join(', ');
const imageExtensionsLabel = formatExtensions(IMG_EXTENSIONS);
const videoExtensionsLabel = formatExtensions(VIDEO_EXTENSIONS);
const audioExtensionsLabel = formatExtensions(AUDIO_EXTENSIONS);
const otherExtensionsLabel = formatExtensions(OTHER_EXTENSIONS);

const props = defineProps<{
  currentFile: number;
  dialogId: string;
  jwpubDb?: string;
  jwpubDocuments?: DocumentItem[];
  jwpubTitle?: string;
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
  get: () => props.jwpubDb ?? '',
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

const motion = useMotionMode();
const importCount =
  useTemplateRef<InstanceType<typeof RollingNumber>>('importCount');

// The parent resets both counts the moment the last file is in, so the
// finished import is kept here to show it full, and green, for a moment.
const finishedImportTotal = ref(0);
const { start: closeAfterFinishedImport, stop: keepOpenForNextImport } =
  useTimeoutFn(
    () => {
      finishedImportTotal.value = 0;
      if (dialogValue.value && !props.totalFiles) dialogValue.value = false;
    },
    LIQUID_DONE_HOLD_MS,
    { immediate: false },
  );

const importTotal = computed(
  () => finishedImportTotal.value || props.totalFiles, // NOSONAR: 0 means no finished import
);
const importedCount = computed(() =>
  finishedImportTotal.value
    ? finishedImportTotal.value
    : Math.min(props.currentFile, props.totalFiles),
);
const importPercent = computed(() =>
  importTotal.value ? (importedCount.value / importTotal.value) * 100 : 0,
);
const showsImportCount = computed(
  () => props.totalFiles > 1 || !!finishedImportTotal.value,
);

// Listen for JW Playlist mode activation
useEventListener(
  globalThis,
  'openJwPlaylistDialog',
  () => {
    log(
      '🎯 JW Playlist mode activated, closing file import dialog',
      'fileImport',
      'log',
    );
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

const getLocalFiles = () => {
  globalThis.electronApi
    .openFileDialog()
    .then((result) => {
      if (result && result.filePaths.length > 0) {
        globalThis.dispatchEvent(
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

// The drop zone doubles as a "browse" button, but only while it shows its
// idle prompt - not while it shows import progress or a JWPUB is loading.
const canBrowseLocalFiles = computed(
  () =>
    !props.totalFiles &&
    !finishedImportTotal.value &&
    !(!!jwpubDb.value || jwpubLoading.value),
);

const browseLocalFiles = () => {
  if (canBrowseLocalFiles.value) getLocalFiles();
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

const handleJwpubImport = (jwpubImportDocument: DocumentItem) => {
  log(
    '🎯 Emitting openJwpubMediaPicker event for document:',
    'fileImport',
    'log',
    jwpubImportDocument,
  );
  globalThis.dispatchEvent(
    new CustomEvent<{
      dbPath: string;
      document: DocumentItem;
    }>('openJwpubMediaPicker', {
      detail: {
        dbPath: jwpubDb.value,
        document: jwpubImportDocument,
      },
    }),
  );
  dialogValue.value = false;
};

const importSingleJwpubDocument = () => {
  if (!dialogValue.value) return;
  if (!jwpubDb.value || jwpubLoading.value) return;
  if (jwpubDocuments.value.length !== 1) return;

  const document = jwpubDocuments.value[0];
  if (!document) return;

  handleJwpubImport(document);
};

const handleCancel = () => {
  // Reset loading states and JW PUB data
  jwpubLoading.value = false;
  jwpubDb.value = '';
  jwpubDocuments.value = [];
  dialogValue.value = false;
  emit('cancel');
};

// Watch for dialog closing to reset loading states and data
watch(
  () => dialogValue.value,
  (isOpen) => {
    if (!isOpen) {
      // Reset loading states and data when dialog closes
      jwpubLoading.value = false;
      // Don't clear jwpubDb here as it might be needed by the media picker
      jwpubDocuments.value = [];
    }
  },
);

// Watch for a single JWPUB document and skip the document picker.
watch(
  () => [
    dialogValue.value,
    jwpubDb.value,
    jwpubLoading.value,
    jwpubDocuments.value,
  ],
  importSingleJwpubDocument,
);

// Watch for processing completion to auto-close dialog
watch(
  () => props.totalFiles || (!!jwpubDb.value && jwpubLoading.value),
  (isProcessing, wasProcessing) => {
    if (isProcessing) {
      // More files dropped while the last import was still on show.
      keepOpenForNextImport();
      finishedImportTotal.value = 0;
      return;
    }
    // Only close if we were processing and now we're not
    if (!wasProcessing || !dialogValue.value) return;

    log(
      '🎯 File processing complete, auto-closing dialog',
      'fileImport',
      'log',
    );
    const finishedSeveralFiles =
      typeof wasProcessing === 'number' && wasProcessing > 1;
    if (finishedSeveralFiles && motion.value !== 'still') {
      finishedImportTotal.value = wasProcessing;
      closeAfterFinishedImport();
      return;
    }
    dialogValue.value = false;
  },
);
</script>

<style lang="scss" scoped>
.file-import-zone {
  --liquid-back: rgba(48, 117, 242, 0.1);
  --liquid-front: rgba(48, 117, 242, 0.2);
  --liquid-bubble: rgba(48, 117, 242, 0.35);
}

.file-import-zone__count {
  align-items: baseline;
  color: $primary;
  display: flex;
  font-size: 38px;
  gap: 6px;
  transition: color 0.3s ease;

  :deep(.rolling-number) {
    --rolling-number-origin: center;
  }
}

.file-import-zone__count--done {
  color: $positive-strong;
}

.file-import-zone__total {
  font-size: 18px;
  font-weight: 600;
  opacity: 0.7;
}

body.body--dark .file-import-zone {
  --liquid-back: rgba(75, 132, 237, 0.18);
  --liquid-front: rgba(75, 132, 237, 0.34);
  --liquid-bubble: rgba(255, 255, 255, 0.3);

  .file-import-zone__count:not(.file-import-zone__count--done) {
    color: color-mix(in srgb, var(--q-primary) 55%, white);
  }
}
</style>
