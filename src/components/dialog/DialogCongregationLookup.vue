<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId" persistent>
    <div class="bg-secondary-contrast flex q-px-none" style="flex-flow: column">
      <div class="text-h6 row q-px-md q-pt-lg">
        {{ t('congregation-lookup') }}
      </div>
      <div class="row q-px-md q-pt-md">
        {{ t('congregation-lookup-explain') }}
      </div>
      <div class="row q-px-md q-py-md">
        <q-input
          ref="congregationFilterInput"
          v-model="congregationFilter"
          clearable
          dense
          outlined
          spellcheck="false"
          @update:model-value="lookupCongregation"
        >
          <template #prepend>
            <q-icon name="mmm-search" />
          </template>
        </q-input>
      </div>
      <div class="q-pl-md overflow-auto row flex">
        <q-list
          class="q-pr-scroll full-width"
          padding
          separator
          style="max-height: 20vh"
        >
          <!-- Loading skeletons -->
          <template v-if="loading">
            <q-item
              v-for="skeletonIndex in 3"
              :key="skeletonIndex"
              class="items-center"
            >
              <q-item-section>
                <q-item-label>
                  <q-skeleton height="20px" type="text" width="50%" />
                </q-item-label>
                <q-item-label caption>
                  <q-skeleton height="10px" type="text" width="50%" />
                </q-item-label>
              </q-item-section>
              <q-item-section side top>
                <q-item-label caption>
                  <q-skeleton height="10px" type="text" width="50px" />
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <q-item v-else-if="!results?.length">
            <q-item-section>
              <q-item-label>
                {{
                  congregationFilter?.length > 2
                    ? t('no-results')
                    : t('no-results-short')
                }}
              </q-item-label>
              <q-item-label caption>
                {{
                  congregationFilter?.length > 2
                    ? t('no-results-explain')
                    : t('no-results-short-explain')
                }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <template
            v-for="congregation in results"
            :key="congregation.properties.orgGuid"
          >
            <q-item
              v-if="congregation.properties.schedule.current"
              clickable
              @click="selectCongregation(congregation)"
            >
              <q-item-section>
                <q-item-label>
                  {{ congregation.properties.orgName }}
                </q-item-label>
                <q-item-label caption>
                  {{
                    dateLocale.days[
                      congregation.properties.schedule.current.midweek
                        .weekday === 7
                        ? 0
                        : congregation.properties.schedule.current.midweek
                            .weekday
                    ]
                  }}
                  {{ congregation.properties.schedule.current.midweek.time }}
                  |
                  {{
                    dateLocale.days[
                      congregation.properties.schedule.current.weekend
                        .weekday === 7
                        ? 0
                        : congregation.properties.schedule.current.weekend
                            .weekday
                    ]
                  }}
                  {{ congregation.properties.schedule.current.weekend.time }}
                </q-item-label>
              </q-item-section>
              <q-item-section side top>
                <q-item-label caption>
                  {{
                    jwLanguages.list?.find(
                      (l) =>
                        l.langcode === congregation?.properties?.languageCode,
                    )?.vernacularName
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </div>
      <div class="row q-px-md q-py-md row flex-center">
        <div class="col text-right">
          <q-btn color="negative" flat @click="dismissPopup">
            {{ t('cancel') }}
          </q-btn>
        </div>
      </div>
    </div>
  </BaseDialog>
</template>
<script setup lang="ts">
import type { CongregationLanguage, GeoRecord } from 'src/types';

import { whenever } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import {
  applyScheduleToSettings,
  fetchMeetingLocations,
  normalizeSchedule,
} from 'src/helpers/congregation-schedule';
import { errorCatcher } from 'src/helpers/error-catcher';
import { fetchJson } from 'src/utils/api';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const jwStore = useJwStore();
const { jwLanguages, urlVariables } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const { dateLocale } = useLocale();

const props = defineProps<{
  dialogId: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const congregationFilter = ref('');
const congregationFilterInput = ref();
const loading = ref(false);
const results = ref<GeoRecord[]>([]);

const lookupCongregation = async () => {
  try {
    loading.value = true;
    results.value = [];
    if (congregationFilter.value?.length > 2) {
      const response = await fetchMeetingLocations(congregationFilter.value);
      results.value = (response?.geoLocationList || []).map((location) => {
        const languageIsAlreadyGood = !!jwLanguages.value?.list.find(
          (l) => l.langcode === location.properties.languageCode,
        );
        if (!languageIsAlreadyGood) {
          location.properties.languageCode =
            congregationLookupLanguages.value.find(
              (l) => l.languageCode === location.properties.languageCode,
            )?.writtenLanguageCode[0] || location.properties.languageCode;
        }
        return location;
      });
    } else {
      results.value = [];
    }
  } catch (error) {
    errorCatcher(error);
    results.value = [];
  } finally {
    loading.value = false;
  }
};

const congregationLookupLanguages = ref<CongregationLanguage[]>([]);

const loadLanguages = async () => {
  try {
    congregationLookupLanguages.value =
      (await fetchJson<CongregationLanguage[]>(
        `https://apps.${urlVariables.value.base || 'jw.org'}/api/public/meeting-search/languages`,
        undefined,
        useCurrentStateStore().online,
      )) || [];
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'DialogCongregationLookup.vue',
          subroutine: 'loadLanguages',
        },
      },
    });
    congregationLookupLanguages.value = [];
  }
};

loadLanguages();

const selectCongregation = (congregation: GeoRecord) => {
  try {
    if (!currentSettings.value) return;

    currentState.lookupInProgress = true;
    const { properties } = congregation;

    // Language
    if (properties.languageCode) {
      const resolvedLangCode =
        jwLanguages.value?.list.find(
          (l) => l.langcode === properties.languageCode,
        )?.langcode || '';
      currentSettings.value.lang = resolvedLangCode || 'E';
      currentSettings.value.langSubtitles = resolvedLangCode || null;
    }

    // Schedule
    const normalized = normalizeSchedule(properties.schedule);
    applyScheduleToSettings(currentSettings.value, normalized);

    // Congregation name
    if (properties.orgName) {
      currentSettings.value.congregationName = properties.orgName;
      currentSettings.value.congregationNameModified = false;
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'DialogCongregationLookup.vue',
          subroutine: 'selectCongregation',
        },
      },
    });
  }
  currentState.lookupInProgress = false;
  dismissPopup();
};

const dismissPopup = () => {
  results.value = [];
  congregationFilter.value = '';
  dialogValue.value = false;
};

// Focus the input when dialog opens
whenever(dialogValue, () => {
  congregationFilter.value = currentSettings.value?.congregationName || '';
  results.value = [];
  lookupCongregation();
  setTimeout(() => {
    console.log('🔍 Focusing input', congregationFilterInput.value);
    congregationFilterInput.value?.focus();
  }, 100);
});
</script>
