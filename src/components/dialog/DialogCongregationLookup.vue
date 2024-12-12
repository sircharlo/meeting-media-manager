<template>
  <q-dialog v-model="open" persistent>
    <div class="bg-secondary-contrast flex q-px-none" style="flex-flow: column">
      <div class="text-h6 row q-px-md q-pt-lg">
        {{ t('congregation-lookup') }}
      </div>
      <div class="row q-px-md q-pt-md">
        {{ t('congregation-lookup-explain') }}
      </div>
      <div class="row q-px-md q-py-md">
        <q-input
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
          <q-item v-if="!results?.length">
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
          <template v-for="congregation in results" :key="congregation">
            <q-item clickable @click="selectCongregation(congregation)">
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
          <q-btn v-close-popup color="negative" flat @click="dismissPopup">
            {{ t('cancel') }}
          </q-btn>
        </div>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import type { CongregationLanguage, GeoRecord } from 'src/types';

import { whenever } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { fetchJson } from 'src/utils/api';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const jwStore = useJwStore();
const { jwLanguages, urlVariables } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const { dateLocale } = useLocale();

const open = defineModel<boolean>({ default: false });
const congregationFilter = ref('');
const results = ref<GeoRecord[]>([]);

whenever(open, () => {
  congregationFilter.value = currentSettings.value?.congregationName || '';
  results.value = [];
  lookupCongregation();
});

const lookupCongregation = async () => {
  try {
    if (congregationFilter.value?.length > 2) {
      await fetchJson<{ geoLocationList: GeoRecord[] }>(
        `https://apps.${urlVariables.value.base || 'jw.org'}/api/public/meeting-search/weekly-meetings`,
        new URLSearchParams({
          includeSuggestions: 'true',
          keywords: congregationFilter.value,
          latitude: '0',
          longitude: '0',
          searchLanguageCode: '',
        }),
        useCurrentStateStore().online,
      ).then((response) => {
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
      });
    } else {
      results.value = [];
    }
  } catch (error) {
    errorCatcher(error);
    results.value = [];
  }
};

const congregationLookupLanguages = ref<CongregationLanguage[]>([]);
fetchJson<CongregationLanguage[]>(
  `https://apps.${urlVariables.value.base || 'jw.org'}/api/public/meeting-search/languages`,
  undefined,
  useCurrentStateStore().online,
)
  .then((response) => {
    congregationLookupLanguages.value = response || [];
  })
  .catch((error) => {
    congregationLookupLanguages.value = [];
    errorCatcher(error);
  });

const selectCongregation = (congregation: GeoRecord) => {
  try {
    if (!currentSettings.value) return;

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

    // Midweek day & time
    const { midweek, weekend } = properties.schedule.current;

    if (Number.isInteger(midweek?.weekday)) {
      currentSettings.value.mwDay = (midweek.weekday - 1).toString();
    }
    if (midweek?.time) {
      currentSettings.value.mwStartTime = midweek.time;
    }

    // Weekend day & time
    if (Number.isInteger(weekend?.weekday)) {
      currentSettings.value.weDay = (weekend.weekday - 1).toString();
    }
    if (weekend?.time) {
      currentSettings.value.weStartTime = weekend.time;
    }

    // Congregation name
    if (properties.orgName) {
      currentSettings.value.congregationName = properties.orgName;
    }
  } catch (error) {
    errorCatcher(error);
  }
  dismissPopup();
};

const dismissPopup = () => {
  open.value = false;
  results.value = [];
  congregationFilter.value = '';
};
</script>
