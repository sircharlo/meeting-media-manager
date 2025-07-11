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
          <Sortable
            item-key="uniqueId"
            :list="selectedDateObject?.customSections"
            :options="{
              handle: '.sort-handle',
              ghostClass: 'bg-accent-200',
              animation: 150,
            }"
            @end="handleMediaSectionSort"
          >
            <template #item="{ element }: { element: MediaSection }">
              <q-item
                :key="element.uniqueId"
                :style="{
                  '--bg-color': element.bgColor,
                }"
              >
                <q-item-section side>
                  <div class="row">
                    <q-icon
                      class="sort-handle"
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
            </template>
          </Sortable>
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
import type { SortableEvent } from 'sortablejs';
import type { MediaSection } from 'src/types';

import { whenever } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { Sortable } from 'sortablejs-vue3';
import { addSection, deleteSection } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'src/stores/current-state';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const currentState = useCurrentStateStore();
const { selectedDateObject } = storeToRefs(currentState);

const selectedDaySections = selectedDateObject.value?.customSections || [];

const open = defineModel<boolean>({ required: true });

const handleMediaSectionSort = (event: SortableEvent) => {
  if (
    !selectedDaySections ||
    event?.oldIndex === undefined ||
    event?.newIndex === undefined
  )
    return;

  console.log('Before Move:', [...selectedDaySections]);
  if (event.oldIndex === event.newIndex) return;

  const [item] = selectedDaySections.splice(event.oldIndex, 1);
  if (!item) {
    console.error('No item found at old index:', event.oldIndex);
    return;
  }

  selectedDaySections.splice(event.newIndex, 0, item);
  console.log('After Move:', [...selectedDaySections]);
};

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
</style>
