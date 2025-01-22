<template>
  <div class="row">
    <div class="col content-center q-py-xl">
      <div
        v-if="
          !currentSettings?.disableMediaFetching ||
          !getVisibleMediaForSection.additional?.length
        "
        class="row justify-center"
      >
        <div class="col-6 text-center">
          <div class="row items-center justify-center q-my-lg">
            <q-spinner
              v-if="
                !currentSettings?.disableMediaFetching &&
                selectedDateObject?.meeting &&
                !selectedDateObject?.complete &&
                !selectedDateObject?.error
              "
              color="primary"
              size="lg"
            />
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
            {{
              !selectedDate
                ? t('noDateSelected')
                : !currentSettings?.disableMediaFetching &&
                    selectedDateObject?.meeting &&
                    !selectedDateObject?.error
                  ? t('please-wait')
                  : t('there-are-no-media-items-for-the-selected-date')
            }}
          </div>
          <div class="row items-center justify-center text-center">
            {{
              !selectedDate
                ? t('select-a-date-to-begin')
                : !currentSettings?.disableMediaFetching &&
                    selectedDateObject?.meeting &&
                    !selectedDateObject?.error
                  ? t('currently-loading')
                  : t(
                      'use-the-import-button-to-add-media-for-this-date-or-select-another-date-to-view-the-corresponding-meeting-media',
                    )
            }}
          </div>
          <div
            v-if="
              currentSettings?.disableMediaFetching ||
              !selectedDateObject?.meeting ||
              selectedDateObject?.error
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
import { useCurrentStateStore } from 'stores/current-state';
import { ref, watch } from 'vue';
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
const {
  currentSettings,
  getVisibleMediaForSection,
  selectedDate,
  selectedDateObject,
} = storeToRefs(currentState);
</script>
