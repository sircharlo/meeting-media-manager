<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId">
    <q-card class="round-card section-picker-card">
      <q-card-section
        class="row items-center no-wrap text-bigger text-semibold text-primary q-pb-none"
      >
        <div class="icon-chip q-mr-sm">
          <q-icon name="mmm-additional-media" size="xs" />
        </div>
        {{ t('choose-section-for-files') }}
      </q-card-section>
      <q-card-section class="q-pa-sm">
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
                section.config?.jwIconKeyword
                  ? undefined
                  : 'mmm-additional-media'
              "
              size="md"
              :style="`background-color: ${section.config?.bgColor}; color: ${
                getTextColor(section) || 'white'
              }`"
              @click="selectSection(section.config?.uniqueId || '')"
            >
              <template #default>
                <span
                  v-if="section.config?.jwIconKeyword"
                  class="jw-icon q-mr-sm"
                >
                  {{ getJwIconFromKeyword(section.config.jwIconKeyword) }}
                </span>
                {{ getSectionLabel(section) }}
              </template>
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </BaseDialog>
</template>

<script setup lang="ts">
import type { MediaSectionIdentifier, MediaSectionWithConfig } from 'src/types';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { getMeetingSections } from 'src/constants/media';
import { isCoWeek, isMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { getJwIconFromKeyword } from 'src/helpers/fonts';
import { getTextColor } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  dialogId: string;
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

const availableSections = computed(() => {
  const sections = Object.values(selectedDateObject.value?.mediaSections || {})
    .filter((section) => section.config)
    .filter((section) => {
      if (!section.config) return false;
      if (isMeetingDay(selectedDateObject.value?.date)) {
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
    isMeetingDay(selectedDateObject.value.date)
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

const getSectionLabel = (section: MediaSectionWithConfig) => {
  const config = section.config;
  if (!config) return '';

  if (
    !config.label &&
    (config.uniqueId === 'imported-media' ||
      config.uniqueId?.startsWith('custom-'))
  ) {
    return t('imported-media');
  }

  return config.label || t(config.uniqueId || '');
};

const selectSection = (section: MediaSectionIdentifier) => {
  emit('section-selected', section);
  dialogValue.value = false;
};
</script>

<style lang="scss" scoped>
.section-picker-card {
  margin: 16px;
  max-width: 400px;
}

.section-btn {
  flex: 1;
  min-width: 80px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}
</style>
