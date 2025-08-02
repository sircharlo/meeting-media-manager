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
              :key="element.uniqueId"
              :data-unique-id="element.uniqueId"
              :style="{
                '--bg-color': element.bgColor,
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
                    v-model="labels[element.uniqueId]"
                    dense
                    @blur="updateLabel(element.uniqueId)"
                    @keyup.enter="updateLabel(element.uniqueId)"
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
                        v-model="hexValues[element.uniqueId]"
                        format-model="hex"
                        no-footer
                        no-header
                        @change="
                          (val) => {
                            element.bgColor = val;
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
                    @click="handleDeleteSection(element.uniqueId)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </div>
        </q-list>
      </div>
      <div
        class="row q-px-md q-pb-md"
        :class="selectedDateObject?.customSections?.length ? 'q-mt-md' : ''"
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
import type { MediaSection } from 'src/types';

import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { whenever } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
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

const hexValues = ref<Record<string, string>>({});
const labels = ref<Record<string, string>>({});

const updateLabel = (uuid: string) => {
  const newLabel = labels.value[uuid];
  if (!selectedDateObject.value?.customSections || !newLabel) return;

  const section = selectedDateObject.value.customSections.find(
    (s) => s.uniqueId === uuid,
  );
  if (!section) return;

  section.label = newLabel;
};

// Handle order change after drag and drop
const handleOrderChange = () => {
  if (!selectedDateObject.value?.customSections) return;

  // Update the customSections array with the new order
  selectedDateObject.value.customSections = sortableItems.value;

  console.log('✅ Custom sections reordered:', {
    newOrder: sortableItems.value.map((section) => ({
      label: section.label,
      uniqueId: section.uniqueId,
    })),
  });
};

// Initialize drag and drop with proper [parent, values] pattern
const [listContainer, sortableItems] = useDragAndDrop<MediaSection>([], {
  dragHandle: '.drag-handle',
  onDragend: handleOrderChange,
});

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

const handleDeleteSection = (uniqueId: string) => {
  deleteSection(uniqueId);
  // Force re-initialization after deleting a section
  setTimeout(() => {
    initializeValues();
  }, 0);
};

const initializeValues = () => {
  console.log('🔍 initializeValues called', {
    customSections: selectedDateObject.value?.customSections,
    customSectionsLength: selectedDateObject.value?.customSections?.length,
    selectedDateObject: !!selectedDateObject.value,
  });

  if (!selectedDateObject.value?.customSections) {
    console.log('❌ No customSections available');
    return;
  }

  labels.value = selectedDateObject.value.customSections.reduce(
    (acc, section) => ({
      ...acc,
      [section.uniqueId]: section.label || '',
    }),
    {},
  );
  hexValues.value = selectedDateObject.value.customSections.reduce(
    (acc, section) => ({
      ...acc,
      [section.uniqueId]: section.bgColor || '#ffffff',
    }),
    {},
  );
  sortableItems.value = selectedDateObject.value.customSections || [];

  console.log('✅ Values initialized', {
    hexValues: hexValues.value,
    labels: labels.value,
    sortableItems: sortableItems.value,
  });
};

// Watch for changes in selectedDateObject and dialog visibility
watch(
  () => [selectedDateObject.value?.customSections, dialogValue.value],
  ([customSections, isDialogOpen]) => {
    console.log('👀 Watch triggered', {
      customSections: !!customSections,
      customSectionsLength: Array.isArray(customSections)
        ? customSections.length
        : 0,
      isDialogOpen,
    });

    if (isDialogOpen && customSections) {
      console.log(
        '🔄 Dialog opened or customSections changed, initializing values',
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
