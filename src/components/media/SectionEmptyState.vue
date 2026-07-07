<template>
  <q-item>
    <q-item-section class="align-center text-grey text-subtitle2">
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
  allItemsAreHidden?: boolean;
  isCategory?: boolean;
  isCustomSection?: boolean;
  isDragging: boolean;
  sectionType?: string;
  selectedDate: DateInfo | null;
  someItemsAreHidden?: boolean;
}>();

const { t } = useI18n();

const message = computed(() => {
  const date = props.selectedDate?.date;

  // 1. Dragging
  if (props.isDragging) return t('drop-media-here');

  // 2. No date
  if (!date) return t('noDateSelected');

  // 3. Hidden items logic
  if (props.allItemsAreHidden) return t('all-items-hidden');
  if (props.someItemsAreHidden) return t('some-media-items-are-hidden');

  // 4. Meeting-day logic
  if (isWeMeetingDay(date)) {
    const mediaSections = props.selectedDate.mediaSections || {};
    const hasAnyMedia = Object.values(mediaSections).some(
      (section) => section.items?.length,
    );

    if (!hasAnyMedia) {
      return t('there-are-no-media-items-for-the-selected-date');
    }

    return t('dont-forget-add-missing-media');
  }

  // 5. Category empty
  if (props.isCategory) return t('no-media-for-this-category');

  // 6. Default
  return t('no-media-files-for-section');
});
</script>
