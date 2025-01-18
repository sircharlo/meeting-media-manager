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
                  '--text-color': element.textColor,
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
                      <q-color
                        v-model="element.bgColor"
                        format-model="rgb"
                        @update:model-value="setTextColor(element)"
                      />
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
import { useCurrentStateStore } from 'src/stores/current-state';
import { ref } from 'vue';
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

const getRandomColor = () => {
  const min = 60; // Minimum brightness for each RGB channel
  const max = 200; // Maximum brightness for each RGB channel
  const randomChannel = () => Math.floor(Math.random() * (max - min + 1)) + min;

  const r = randomChannel();
  const g = randomChannel();
  const b = randomChannel();

  return `rgb(${r}, ${g}, ${b})`;
};

const addSection = () => {
  if (selectedDateObject.value && !selectedDateObject.value?.customSections)
    selectedDateObject.value.customSections = [];
  const newSection: DynamicMediaSection = {
    alwaysShow: true,
    bgColor: getRandomColor(),
    extraMediaShortcut: true,
    items: [],
    label: ref(t('imported-media')).value,
    textColor: '#ffffff',
    uniqueId: 'custom-' + Date.now().toString(),
  };
  setTextColor(newSection);
  selectedDateObject.value?.customSections?.push(newSection);
};

const deleteSection = (uniqueId: string) => {
  selectedDateObject.value?.customSections?.splice(
    selectedDateObject.value?.customSections.findIndex(
      (s) => s.uniqueId === uniqueId,
    ),
    1,
  );
};

const setTextColor = (section: DynamicMediaSection) => {
  const bgColor = section.bgColor;
  if (!bgColor) return;
  // Convert HEX to RGB
  let b, g, r;
  if (bgColor.startsWith('#')) {
    const hex = bgColor.replace('#', '');
    [r, g, b] = [0, 1, 2].map((i) =>
      parseInt(
        hex.length === 3
          ? hex.charAt(i) + hex.charAt(i)
          : hex.slice(i * 2, i * 2 + 2),
        16,
      ),
    );
  } else if (bgColor.startsWith('rgb')) {
    [r, g, b] = bgColor
      .replace(/rgba?|\(|\)|\s/g, '')
      .split(',')
      .map(Number);
  } else {
    console.warn('Invalid color format');
    section.textColor = '#000000'; // Default to black if invalid input
  }

  // Calculate relative luminance
  const luminance = (val: number | undefined) => {
    if (val === undefined) return 0;
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  const lum =
    0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b);

  // Return white or black based on contrast
  section.textColor = lum > 0.179 ? '#000000' : '#ffffff';
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
