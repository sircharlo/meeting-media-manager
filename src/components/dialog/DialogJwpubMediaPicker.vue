<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId" persistent>
    <div
      class="bg-secondary-contrast large-overlay q-px-none flex"
      style="flex-flow: column"
    >
      <div class="row q-px-md q-pt-lg text-h6">
        <div class="col">
          {{ t('select-media-items') }}
        </div>
      </div>
      <div class="row q-px-md q-py-md">
        {{ t('select-media-items-explain') }}
      </div>

      <div
        class="q-pr-scroll overflow-auto col items-start q-pt-sm"
        :class="{ 'content-center': loading }"
      >
        <div
          v-if="loading && !mediaItems.length"
          class="col q-px-md full-width"
        >
          <div class="text-secondary text-uppercase q-my-sm">
            {{ t('select-media-items') }}
          </div>
          <div class="col full-width">
            <q-list class="full-width" separator>
              <q-item v-for="skeletonIndex in 4" :key="skeletonIndex">
                <q-item-section avatar>
                  <q-skeleton size="24px" type="QCheckbox" />
                </q-item-section>
                <q-item-section avatar>
                  <q-skeleton height="48px" type="rect" width="48px" />
                </q-item-section>
                <q-item-section>
                  <q-skeleton height="16px" type="text" width="80%" />
                  <q-skeleton
                    class="q-mt-xs"
                    height="14px"
                    type="text"
                    width="60%"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
        <template v-else>
          <div v-if="mediaItems.length" class="col q-px-md full-width">
            <div class="text-secondary text-uppercase q-my-sm">
              {{ t('select-media-items') }}
            </div>
            <div class="col full-width">
              <q-list class="full-width" separator>
                <q-item
                  v-for="(item, index) in mediaItems"
                  :key="item.MultimediaId"
                  clickable
                  :disable="isProcessing"
                  @click="toggleItem(index)"
                >
                  <q-item-section avatar>
                    <q-checkbox
                      :disable="isProcessing"
                      :model-value="selectedItems.includes(index)"
                      @update:model-value="toggleItem(index)"
                    />
                  </q-item-section>
                  <q-item-section avatar>
                    <q-img
                      v-if="item.ResolvedPreviewPath"
                      :alt="item.Label"
                      class="thumbnail"
                      fit="cover"
                      height="48px"
                      :src="pathToFileURL(item.ResolvedPreviewPath)"
                      width="48px"
                    />
                    <q-icon
                      v-else
                      color="primary"
                      :name="getMediaIcon(item)"
                      size="md"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ item.Label }}</q-item-label>
                    <q-item-label caption>
                      {{
                        item.FilePath ||
                        [
                          item.KeySymbol,
                          item.IssueTagNumber,
                          item.MepsDocumentId,
                          (item.MepsLanguageIndex &&
                            mepslangs[item.MepsLanguageIndex]) ||
                            '',
                          item.Track,
                        ]
                          .filter((x) => !!x)
                          .join('_')
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
          <div v-else-if="!loading" class="row q-px-md col flex-center">
            <div class="text-center">
              <q-icon color="secondary" name="mmm-local-media" size="xl" />
              <div class="text-secondary q-mt-md">
                {{ t('no-media-items-found') }}
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="row q-px-md q-py-md">
        <div class="col">
          <q-btn
            v-if="selectedItems.length < mediaItems.length"
            color="primary"
            :disable="isProcessing"
            flat
            :label="t('select-all')"
            @click="selectAll"
          />
          <q-btn
            v-else-if="
              selectedItems.length === mediaItems.length &&
              mediaItems.length > 0
            "
            color="primary"
            :disable="isProcessing"
            flat
            :label="t('deselect-all')"
            @click="deselectAll"
          />
        </div>
        <div class="col-shrink q-gutter-x-sm">
          <q-btn
            color="negative"
            :disable="isProcessing"
            flat
            :label="t('cancel')"
            @click="handleCancel"
          />
          <q-btn
            v-if="selectedItems.length"
            color="primary"
            :label="t('add') + ` (${selectedItems.length})`"
            :loading="isProcessing"
            @click="addSelectedItems"
          />
        </div>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import type {
  DocumentItem,
  MediaSectionIdentifier,
  MultimediaItem,
} from 'src/types';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import mepslangs from 'src/constants/mepslangs';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  addFullFilePathToMultimediaItem,
  addJwpubDocumentMediaToFiles,
  resolveMultimediaPreviewPath,
} from 'src/helpers/jw-media';
import {
  getDocumentMultimediaItems,
  getPublicationInfoFromDb,
} from 'src/utils/sqlite';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { pathToFileURL } = window.electronApi;
const props = defineProps<{
  dbPath: string;
  dialogId: string;
  document: DocumentItem | undefined;
  modelValue: boolean;
  section: MediaSectionIdentifier | undefined;
}>();

// Emits
const emit = defineEmits<{
  cancel: [];
  ok: [];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const loading = ref<boolean>(false);
const isProcessing = ref<boolean>(false);
const mediaItems = ref<(MultimediaItem & { ResolvedPreviewPath?: string })[]>(
  [],
);
const selectedItems = ref<number[]>([]);

const loadMediaItems = async () => {
  try {
    loading.value = true;
    if (!props.dbPath || !props.document) return;

    const items = getDocumentMultimediaItems(
      {
        db: props.dbPath,
        docId: props.document.DocumentId,
      },
      false, // includePrinted
    );

    // Get publication info to resolve full file paths
    const publication = getPublicationInfoFromDb(props.dbPath);

    // Resolve full file paths for all multimedia items
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        const fullPathItem = await addFullFilePathToMultimediaItem(
          item,
          publication,
        );
        const resolvedPreviewPath =
          await resolveMultimediaPreviewPath(fullPathItem);
        return {
          ...fullPathItem,
          ResolvedPreviewPath: resolvedPreviewPath,
        };
      }),
    );

    mediaItems.value = resolvedItems;
  } catch (error) {
    errorCatcher(error);
  } finally {
    loading.value = false;
  }
};

const toggleItem = (index: number) => {
  const currentIndex = selectedItems.value.indexOf(index);
  if (currentIndex === -1) {
    selectedItems.value.push(index);
  } else {
    selectedItems.value.splice(currentIndex, 1);
  }
  selectedItems.value.sort((a, b) => a - b);
};

const selectAll = () => {
  selectedItems.value = mediaItems.value.map((_, index) => index);
};

const deselectAll = () => {
  selectedItems.value = [];
};

const getMediaIcon = (item: MultimediaItem) => {
  if (item.MimeType?.startsWith('video/')) return 'mmm-movie';
  if (item.MimeType?.startsWith('audio/')) return 'mmm-audio';
  return 'mmm-local-media';
};

const addSelectedItems = async () => {
  try {
    if (!props.dbPath || !props.document) return;

    isProcessing.value = true;
    if (!selectedItems.value.length) return;

    const selectedMultimediaIds = selectedItems.value
      .map((index) => mediaItems.value[index]?.MultimediaId)
      .filter((id): id is number => id !== undefined);

    console.log('🎯 Selected multimedia IDs:', selectedMultimediaIds);

    await addJwpubDocumentMediaToFiles(
      props.dbPath,
      props.document,
      props.section,
      undefined, // pubFolder
      undefined, // meetingDate
      selectedMultimediaIds,
    );

    dialogValue.value = false;
    emit('ok');
  } catch (error) {
    errorCatcher(error);
  } finally {
    isProcessing.value = false;
  }
};

const handleCancel = () => {
  selectedItems.value = [];
  mediaItems.value = [];
  dialogValue.value = false;
  emit('cancel');
};

// Watch for dialog opening to load media items
watch(
  () => dialogValue.value,
  (isOpen) => {
    if (isOpen) {
      loadMediaItems();
    } else {
      selectedItems.value = [];
      mediaItems.value = [];
    }
  },
);
</script>
