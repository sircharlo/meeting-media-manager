<template>
  <div class="row">
    <div class="col content-center q-py-xl">
      <div
        v-if="
          !currentSettings?.disableMediaFetching ||
          !selectedDateObject?.mediaSections ||
          !Object.values(selectedDateObject.mediaSections).some(
            (section) => section.items?.length,
          )
        "
        class="row justify-center"
      >
        <div class="col-6 text-center">
          <div class="row items-center justify-center q-my-lg">
            <q-spinner v-if="shouldShowSpinner" color="primary" size="lg" />
            <q-img
              v-else
              fit="contain"
              src="~assets/img/no-media.svg"
              style="max-height: 30vh"
            />
          </div>
          <div
            class="row items-center justify-center text-subtitle1 text-semibold"
          >
            {{ primaryEmptyStateMessage }}
          </div>
          <div class="row items-center justify-center text-center">
            {{ secondaryEmptyStateMessage }}
          </div>
          <div
            v-if="
              currentSettings?.disableMediaFetching ||
              !selectedDayMeetingType ||
              selectedDateObject?.status === 'error'
            "
            class="row items-center justify-center q-mt-lg q-gutter-md"
          >
            <q-btn color="primary" outline @click="goToNextDayWithMedia(true)">
              <q-icon class="q-mr-sm" name="mmm-go-to-date" size="xs" />
              {{ t('next-day-with-media') }}
            </q-btn>
            <q-btn
              v-if="selectedDate"
              color="primary"
              @click="openImportMenu(undefined)"
            >
              <q-icon class="q-mr-sm" name="mmm-add-media" size="xs" />
              {{ t('add-extra-media') }}
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { DocumentItem, MediaSectionIdentifier } from 'src/types';

import { storeToRefs } from 'pinia';
import { getDateDiff } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  goToNextDayWithMedia: (ignoreTodaysDate?: boolean) => void;
  openImportMenu: (section: MediaSectionIdentifier | undefined) => void;
}>();

const showFileImportDialog = ref(false);
const jwpubImportDb = ref('');
const jwpubImportDocuments = ref<DocumentItem[]>([]);

watch(
  () => [jwpubImportDb.value, jwpubImportDocuments.value],
  ([newJwpubImportDb, newJwpubImportDocuments]) => {
    if (!!newJwpubImportDb || newJwpubImportDocuments?.length) {
      showFileImportDialog.value = true;
    }
  },
);

const currentState = useCurrentStateStore();
const { selectedDayMeetingType } = storeToRefs(currentState);
const { currentSettings, selectedDate, selectedDateObject } =
  storeToRefs(currentState);

const shouldShowSpinner = computed(() => {
  if (
    currentSettings.value?.disableMediaFetching ||
    !selectedDayMeetingType.value ||
    selectedDateObject.value?.status
  ) {
    return false;
  }

  if (!currentSettings.value?.meteredConnection) {
    return true;
  }

  const selectedDate = selectedDateObject.value?.date;
  if (!selectedDate) {
    return false;
  }

  return getDateDiff(selectedDate, new Date(), 'days') <= 1;
});

const primaryEmptyStateMessage = computed(() => {
  if (!selectedDate.value) {
    return t('noDateSelected');
  }

  const fetchingEnabled = !currentSettings.value?.disableMediaFetching;
  const hasMeetingType = !!selectedDayMeetingType.value;
  const status = selectedDateObject.value?.status;

  if (fetchingEnabled && hasMeetingType && status !== 'error') {
    if (currentSettings.value?.meteredConnection) {
      const selectedDateValue = selectedDateObject.value?.date;
      if (
        selectedDateValue &&
        getDateDiff(selectedDateValue, new Date(), 'days') > 1
      ) {
        return t('this-meeting-is-far-in-the-future');
      }
    }
    return t('please-wait');
  }

  return t('there-are-no-media-items-for-the-selected-date');
});

const secondaryEmptyStateMessage = computed(() => {
  if (!selectedDate.value) {
    return t('select-a-date-to-begin');
  }

  const fetchingEnabled = !currentSettings.value?.disableMediaFetching;
  const hasMeetingType = !!selectedDayMeetingType.value;
  const status = selectedDateObject.value?.status;

  if (fetchingEnabled && hasMeetingType && status !== 'error') {
    if (currentSettings.value?.meteredConnection) {
      const selectedDateValue = selectedDateObject.value?.date;
      if (
        selectedDateValue &&
        getDateDiff(selectedDateValue, new Date(), 'days') > 1
      ) {
        return t('not-yet-available-due-to-metered-connection');
      }
    }
    return t('currently-loading');
  }

  return t(
    'use-the-import-button-to-add-media-for-this-date-or-select-another-date-to-view-the-corresponding-meeting-media',
  );
});
</script>
