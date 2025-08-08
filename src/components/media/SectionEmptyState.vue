<template>
  <q-item>
    <q-item-section
      class="align-center text-secondary text-grey text-subtitle2"
    >
      <div class="row items-center">
        <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
        <span>{{ message }}</span>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { DateInfo } from 'src/types';

import { isWeMeetingDay } from 'src/helpers/date';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  isCategory?: boolean;
  isCustomSection?: boolean;
  isDragging: boolean;
  sectionType?: string;
  selectedDate: DateInfo | null;
}>();

const { t } = useI18n();

const message = computed(() => {
  // When dragging media files
  if (props.isDragging) {
    return t('drop-media-here');
  }

  // When no date is selected
  if (!props.selectedDate) {
    return t('noDateSelected');
  }

  // When it's a meeting day but no media is available
  if (props.selectedDate && isWeMeetingDay(props.selectedDate.date)) {
    // Check if there's any media at all for this date
    const hasAnyMedia =
      props.selectedDate.mediaSections &&
      Object.values(props.selectedDate.mediaSections).some(
        (section) => section.length > 0,
      );

    if (!hasAnyMedia) {
      return t('there-are-no-media-items-for-the-selected-date');
    }

    return t('dont-forget-add-missing-media');
  }

  // For category-specific sections
  if (props.isCategory) {
    return t('no-media-for-this-category');
  }

  // Default case for section-specific empty state
  return t('no-media-files-for-section');
});
</script>
