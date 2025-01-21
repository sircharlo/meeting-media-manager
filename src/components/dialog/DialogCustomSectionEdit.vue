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
            <template #item="{ element }: { element: DynamicMediaSection }">
              <q-item
                :key="element.uniqueId"
                :style="{
                  '--bg-color': element.bgColor,
                  // '--text-color': element.textColor,
                }"
              >
                <q-item-section side>
                  <div class="row">
                    <q-icon
                      class="sort-handle"
                      color="accent-100"
                      flat
                      name="mmm-reorder"
                      size="sm"
                      style="cursor: grab"
                    />
                  </div>
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    <q-input v-model="element.label" dense />
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row">
                    <q-btn flat round>
                      <q-badge class="custom-bg-color" clickable round />
                      <q-popup-proxy
                        cover
                        transition-hide="scale"
                        transition-show="scale"
                      >
                        <q-color v-model="element.bgColor" format-model="rgb" />
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
          v-if="selectedDateObject && !selectedDateObject.meeting"
          class="full-width dashed-border"
          color="accent-100"
          icon="mmm-plus"
          :label="t('new-section')"
          text-color="primary"
          unelevated
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
import type { DynamicMediaSection } from 'src/types';

import { storeToRefs } from 'pinia';
import { Sortable } from 'sortablejs-vue3';
import { addSection, deleteSection } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const currentState = useCurrentStateStore();
const { selectedDateObject } = storeToRefs(currentState);

const open = defineModel<boolean>({ required: true });

const handleMediaSectionSort = (event: SortableEvent) => {
  const sections = selectedDateObject.value?.customSections;
  if (
    !sections ||
    event?.oldIndex === undefined ||
    event?.newIndex === undefined
  )
    return;

  console.log('Before Move:', [...sections]);
  if (event.oldIndex === event.newIndex) return;

  const [item] = sections.splice(event.oldIndex, 1);
  if (!item) {
    console.error('No item found at old index:', event.oldIndex);
    return;
  }

  sections.splice(event.newIndex, 0, item);
  console.log('After Move:', [...sections]);
};
</script>
<style lang="scss" scoped>
.custom-text-color {
  color: var(--bg-color);
}
.custom-bg-color {
  background-color: var(--bg-color);
  color: var(--text-color);
}
</style>
