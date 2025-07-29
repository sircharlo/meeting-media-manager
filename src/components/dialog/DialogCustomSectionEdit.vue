<template>
  <q-dialog v-model="open" persistent>
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
      <div class="row q-px-md overflow-auto">
        <q-list
          v-if="selectedDateObject?.customSections?.length"
          bordered
          class="full-width"
          separator
        >
          <div ref="listContainer">
            <q-item
              v-for="element in selectedDateObject?.customSections"
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
                    @click="deleteSection(element.uniqueId)"
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
          @click="addSection()"
        />
      </div>
      <div class="row q-px-md q-py-md justify-end">
        <q-btn v-close-popup color="primary" flat :label="t('close')" />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { whenever } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { addSection, deleteSection } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'src/stores/current-state';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const currentState = useCurrentStateStore();
const { selectedDateObject } = storeToRefs(currentState);

const open = defineModel<boolean>({ required: true });

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

const initializeValues = () => {
  if (!selectedDateObject.value?.customSections) return;
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
};

// Initialize drag and drop
const [listContainer] = useDragAndDrop(
  selectedDateObject.value?.customSections || [],
  {
    dragHandle: '.drag-handle',
  },
);

onMounted(() => {
  initializeValues();
});

whenever(open, () => {
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
