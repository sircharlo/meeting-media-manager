<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId" persistent>
    <div
      class="bg-secondary-contrast flex medium-overlay q-px-none"
      style="flex-flow: column"
    >
      <div class="text-h6 row q-px-md q-pt-lg q-pb-md">
        {{ t('edit-sections') }}
      </div>
      <div class="row q-px-md q-py-md">
        {{ t('edit-sections-explain') }}
      </div>
      <div class="row q-px-md">
        <q-list
          v-if="sortableItems?.length"
          bordered
          class="full-width"
          separator
        >
          <div ref="listContainer">
            <q-item
              v-for="element in sortableItems"
              :key="element.config?.uniqueId"
              :data-unique-id="element.config?.uniqueId"
              :style="{
                '--bg-color': element.config?.bgColor,
              }"
            >
              <q-item-section side>
                <div class="row">
                  <q-icon
                    class="drag-handle"
                    color="accent-100"
                    flat
                    name="mmm-sort"
                    size="sm"
                    style="cursor: grab"
                  />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  <q-input
                    v-model="labels[element.config?.uniqueId || '']"
                    dense
                    @blur="updateLabel(element.config?.uniqueId)"
                    @keyup.enter="updateLabel(element.config?.uniqueId)"
                  />
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row">
                  <q-btn flat icon="mmm-palette" round>
                    <q-popup-proxy
                      cover
                      transition-hide="scale"
                      transition-show="scale"
                    >
                      <q-color
                        v-model="hexValues[element.config?.uniqueId || '']"
                        format-model="hex"
                        no-footer
                        no-header
                        @change="
                          (val) => {
                            if (element.config) element.config.bgColor = val;
                          }
                        "
                      />
                    </q-popup-proxy>
                  </q-btn>

                  <q-btn
                    color="negative"
                    flat
                    icon="mmm-delete"
                    round
                    @click="handleDeleteSection(element.config?.uniqueId)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </div>
        </q-list>
      </div>
      <div
        class="row q-px-md q-pb-md"
        :class="selectedDateObject?.mediaSections?.length ? 'q-mt-md' : ''"
      >
        <q-btn
          v-if="selectedDateObject"
          color="primary"
          icon="mmm-plus"
          :label="t('new-section')"
          outline
          @click="handleAddSection"
        />
      </div>
      <div class="row q-px-md q-py-md justify-end">
        <q-btn color="primary" flat :label="t('close')" @click="closeDialog" />
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import type { MediaSectionWithConfig } from 'src/types';

import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { whenever } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { MW_MEETING_SECTIONS, WE_MEETING_SECTIONS } from 'src/constants/media';
import { addSection, deleteSection } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const currentState = useCurrentStateStore();
const { selectedDateObject } = storeToRefs(currentState);

const props = defineProps<{
  dialogId: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  ok: [];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const hexValues = ref<Record<string, string | undefined>>({});
const labels = ref<Record<string, string | undefined>>({});

const updateLabel = (uuid: string | undefined) => {
  if (!uuid) return;
  const newLabel = labels.value[uuid];
  if (!selectedDateObject.value?.mediaSections || !newLabel) return;

  const sectionData = selectedDateObject.value.mediaSections.find(
    (section) => section.config.uniqueId === uuid,
  );
  if (!sectionData?.config) return;

  sectionData.config.label = newLabel;
};

// Handle order change after drag and drop
const handleOrderChange = () => {
  if (!selectedDateObject.value?.mediaSections) return;

  // Get standard sections (meeting sections) that should remain in their positions
  const standardSections = [
    'ayfm',
    'lac',
    'tgw',
    'wt',
    'pt',
    'circuit-overseer',
  ];
  const existingStandardSections =
    selectedDateObject.value.mediaSections.filter((section) =>
      standardSections.includes(section.config.uniqueId),
    );

  // Reorder the sections: standard sections first, then reordered custom sections
  selectedDateObject.value.mediaSections = [
    ...existingStandardSections,
    ...sortableItems.value,
  ];

  console.log('✅ Custom sections reordered:', {
    newOrder: sortableItems.value.map((section) => ({
      label: section.config?.label,
      uniqueId: section.config?.uniqueId,
    })),
  });
};

// Initialize drag and drop with proper [parent, values] pattern
const [listContainer, sortableItems] = useDragAndDrop<MediaSectionWithConfig>(
  [],
  {
    dragHandle: '.drag-handle',
    onDragend: handleOrderChange,
  },
);

const closeDialog = () => {
  emit('update:modelValue', false);
};

const handleAddSection = () => {
  addSection();
  // Force re-initialization after adding a section
  setTimeout(() => {
    initializeValues();
  }, 0);
};

const handleDeleteSection = (uniqueId: string | undefined) => {
  if (!uniqueId) return;
  deleteSection(uniqueId);
  // Force re-initialization after deleting a section
  setTimeout(() => {
    initializeValues();
  }, 0);
};

const initializeValues = () => {
  const daySections = selectedDateObject.value?.mediaSections;
  if (!daySections) return;
  console.log('🔍 initializeValues called', {
    mediaSections: selectedDateObject.value?.mediaSections,
    selectedDateObject: !!selectedDateObject.value,
  });

  if (!selectedDateObject.value?.mediaSections) {
    console.log('❌ No mediaSections available');
    return;
  }

  // Get custom sections (non-standard sections)

  labels.value = daySections.reduce(
    (acc, section) => ({
      ...acc,
      [section.config.uniqueId]:
        section.config?.label || t(section.config.uniqueId || ''),
    }),
    {},
  );
  hexValues.value = daySections.reduce(
    (acc, section) => ({
      ...acc,
      [section.config.uniqueId]: section.config?.bgColor || '#ffffff',
    }),
    {},
  );
  const meetingSections =
    WE_MEETING_SECTIONS.concat(MW_MEETING_SECTIONS).concat('circuit-overseer');
  sortableItems.value = daySections
    .filter(
      (section) =>
        !meetingSections.includes(section.config.uniqueId) && !!section?.config,
    )
    .map((section) => ({
      config: section.config,
      items: section.items,
      uniqueId: section.config.uniqueId,
    }));

  console.log('✅ Values initialized', {
    hexValues: hexValues.value,
    labels: labels.value,
    sortableItems: sortableItems.value,
  });
};

// Watch for changes in selectedDateObject and dialog visibility
watch(
  () => [selectedDateObject.value?.mediaSections, dialogValue.value],
  ([mediaSections, isDialogOpen]) => {
    console.log('👀 Watch triggered', {
      isDialogOpen,
      mediaSections: !!mediaSections,
    });

    if (isDialogOpen && mediaSections) {
      console.log(
        '🔄 Dialog opened or mediaSections changed, initializing values',
      );
      initializeValues();
    }
  },
  { immediate: true },
);

whenever(dialogValue, () => {
  initializeValues();
});
</script>

<style lang="scss" scoped>
.custom-text-color {
  color: var(--bg-color);
}
.custom-bg-color {
  background-color: var(--bg-color);
  color: var(--text-color);
}
.q-dialog__backdrop {
  backdrop-filter: blur(7px);
}

// FormKit drag and drop styles
.drag-handle {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

// Optional: Add drag state styles
[data-dragging='true'] {
  opacity: 0.5;
}

[data-drag-placeholder='true'] {
  background-color: rgba(0, 0, 0, 0.1);
  border: 2px dashed #ccc;
}
</style>
