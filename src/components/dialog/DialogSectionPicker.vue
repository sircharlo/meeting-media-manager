<template>
  <q-dialog v-model="dialogValue" :persistent="false" transition-duration="200">
    <q-card class="section-picker-card" flat square>
      <q-card-section class="q-pa-sm">
        <div class="text-subtitle2 q-mb-sm">
          {{ t('choose-section-for-files') }}
        </div>
        <div class="row">
          <div
            v-for="section in availableSections"
            :key="section.config?.uniqueId"
            class="col-12 q-mt-sm"
          >
            <q-btn
              class="section-btn"
              :class="`bg-${section.config?.uniqueId} full-width`"
              flat
              :icon="
                section.config?.jwIcon ? undefined : 'mmm-additional-media'
              "
              size="md"
              :style="`background-color: ${section.config?.bgColor}; color: ${
                getTextColor(section) || 'white'
              }`"
              @click="selectSection(section.config?.uniqueId || '')"
            >
              <template #default>
                <span v-if="section.config?.jwIcon" class="jw-icon q-mr-sm">{{
                  section.config.jwIcon
                }}</span>
                {{ section.config?.label || t(section.config?.uniqueId || '') }}
              </template>
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { MediaSectionIdentifier } from 'src/types';

import { storeToRefs } from 'pinia';
import { getMeetingSections } from 'src/constants/media';
import { isCoWeek, isMwMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { getTextColor } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  files: (File | string)[];
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'section-selected': [section: MediaSectionIdentifier];
  'update:modelValue': [value: boolean];
}>();

const currentState = useCurrentStateStore();
const { selectedDateObject } = storeToRefs(currentState);

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// // Auto-close after 5 seconds
// const autoCloseTimer = ref<null | number>(null);

// watch(
//   () => dialogValue.value,
//   (isOpen) => {
//     if (isOpen) {
//       // Start auto-close timer
//       autoCloseTimer.value = window.setTimeout(() => {
//         dialogValue.value = false;
//       }, 5000);
//     } else {
//       // Clear timer when dialog closes
//       if (autoCloseTimer.value) {
//         clearTimeout(autoCloseTimer.value);
//         autoCloseTimer.value = null;
//       }
//     }
//   },
// );

const availableSections = computed(() => {
  const sections = Object.values(selectedDateObject.value?.mediaSections || {})
    .filter((section) => section.config)
    .filter((section) => {
      if (!section.config) return false;
      if (
        isWeMeetingDay(selectedDateObject.value?.date) ||
        isMwMeetingDay(selectedDateObject.value?.date)
      ) {
        return getMeetingSections(
          isWeMeetingDay(selectedDateObject.value?.date) ? 'we' : 'mw',
          isCoWeek(selectedDateObject.value?.date),
        ).includes(section.config?.uniqueId || '');
      }
      return true;
    });

  // Sort sections by the order they appear in getMeetingSections
  if (
    selectedDateObject.value?.date &&
    (isWeMeetingDay(selectedDateObject.value.date) ||
      isMwMeetingDay(selectedDateObject.value.date))
  ) {
    const meetingSections = getMeetingSections(
      isWeMeetingDay(selectedDateObject.value.date) ? 'we' : 'mw',
      isCoWeek(selectedDateObject.value.date),
    );

    sections.sort((a, b) => {
      const aIndex = meetingSections.indexOf(a.config?.uniqueId || '');
      const bIndex = meetingSections.indexOf(b.config?.uniqueId || '');

      // If both sections are in the meeting sections array, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one is in the meeting sections array, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // If neither is in the meeting sections array, maintain original order
      return 0;
    });
  }

  return sections;
});

const selectSection = (section: MediaSectionIdentifier) => {
  // // Clear auto-close timer
  // if (autoCloseTimer.value) {
  //   clearTimeout(autoCloseTimer.value);
  //   autoCloseTimer.value = null;
  // }

  emit('section-selected', section);
  dialogValue.value = false;
};
</script>

<style lang="scss" scoped>
.section-picker-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin: 16px;
  max-width: 400px;
}

.section-btn {
  flex: 1;
  min-width: 80px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}
</style>
