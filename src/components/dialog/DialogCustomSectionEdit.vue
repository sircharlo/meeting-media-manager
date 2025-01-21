<template>
  <q-dialog v-model="open" persistent>
    <div
      class="bg-secondary-contrast flex medium-overlay q-px-none"
      style="flex-flow: column"
    >
      <div class="text-h6 row q-px-md q-pt-lg q-pb-md">
        {{ t('custom-sections') }}
      </div>
      <div class="row q-px-md overflow-auto">
        <q-list bordered class="full-width" separator>
          <Sortable
            item-key="uniqueId"
            :list="selectedDateObject?.customSections"
            @end="handleMediaSectionSort"
          >
            <template #item="{ element }: { element: DynamicMediaSection }">
              <q-item
                :key="element.uniqueId"
                clickable
                :style="{
                  '--bg-color': element.bgColor,
                  // '--text-color': element.textColor,
                }"
              >
                <q-item-section>
                  <q-item-label>
                    <q-input v-model="element.label" outlined />
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip class="custom-bg-color custom-text-color" round>
                    {{ t('color') }}
                    <q-popup-proxy
                      cover
                      transition-hide="scale"
                      transition-show="scale"
                    >
                      <q-color v-model="element.bgColor" format-model="rgb" />
                    </q-popup-proxy>
                  </q-chip>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    color="negative"
                    flat
                    icon="mmm-delete"
                    round
                    size="sm"
                    @click="deleteSection(element.uniqueId)"
                  />
                </q-item-section>
              </q-item>
            </template>
          </Sortable>
        </q-list>
      </div>
      <div class="row q-px-md q-pb-md">
        <q-btn color="primary" label="Add section" @click="addSection" />
      </div>
      <!-- <div class="row q-px-md"></div>
      <div class="row q-px-md q-pt-md"></div> -->
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
