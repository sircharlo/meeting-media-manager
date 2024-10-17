<template>
  <q-dialog v-model="open" persistent>
    <div
      class="items-center q-pb-lg q-px-lg q-gutter-y-lg bg-secondary-contrast"
    >
      <div class="text-h6 row">{{ $t('congregation-lookup') }}</div>
      <div class="row">{{ $t('congregation-lookup-explain') }}</div>
      <div class="row">
        <div class="col-grow">
          <q-input
            v-model="congregationName"
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
      </div>
      <div class="row">
        <q-scroll-area
          :bar-style="barStyle()"
          :thumb-style="thumbStyle()"
          style="height: 25vh; width: -webkit-fill-available"
        >
          <q-list class="full-width" padding separator>
            <q-item v-if="!results?.length">
              <q-item-section>
                <q-item-label
                  >{{
                    congregationName?.length > 2
                      ? $t('no-results')
                      : $t('no-results-short')
                  }}
                </q-item-label>
                <q-item-label caption>{{
                  congregationName?.length > 2
                    ? $t('no-results-explain')
                    : $t('no-results-short-explain')
                }}</q-item-label>
              </q-item-section>
            </q-item>
            <template v-for="congregation in results" :key="congregation">
              <q-item clickable @click="selectCongregation(congregation)">
                <q-item-section>
                  <q-item-label>{{
                    congregation.properties.orgName
                  }}</q-item-label>
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
                    {{
                      congregation.properties.schedule.current.weekend.time
                    }}</q-item-label
                  >
                </q-item-section>
                <q-item-section side top>
                  <q-item-label caption>{{
                    jwLanguages.list?.find(
                      (l) =>
                        l.langcode === congregation?.properties?.languageCode,
                    )?.vernacularName
                  }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-scroll-area>
      </div>
      <div class="row">
        <div class="col text-right">
          <q-btn
            v-close-popup
            color="negative"
            flat
            @click="
              congregationName = '';
              results = [];
            "
            >{{ $t('cancel') }}</q-btn
          >
        </div>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import type { CongregationLanguage, GeoRecord } from 'src/types';

import { storeToRefs } from 'pinia';
import { get } from 'src/boot/axios';
import { barStyle, thumbStyle } from 'src/boot/globals';
import { useLocale } from 'src/composables/useLocale';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { ref, watch } from 'vue';

const jwStore = useJwStore();
const { jwLanguages } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const { dateLocale } = useLocale();

const open = defineModel<boolean>({ default: false });
const congregationName = ref('');
const results = ref<GeoRecord[]>([]);

watch(open, (newOpen) => {
  if (newOpen) {
    congregationName.value = currentSettings.value?.congregationName || '';
    results.value = [];
    lookupCongregation();
  }
});

const lookupCongregation = async () => {
  try {
    if (congregationName.value?.length > 2) {
      await get(
        'https://apps.jw.org/api/public/meeting-search/weekly-meetings?includeSuggestions=true&keywords=' +
          encodeURIComponent(congregationName.value) +
          '&latitude=0&longitude=0&searchLanguageCode=',
      ).then((response) => {
        results.value = ((response.geoLocationList as GeoRecord[]) || []).map(
          (location) => {
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
          },
        );
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
get('https://apps.jw.org/api/public/meeting-search/languages')
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
      currentSettings.value.lang = resolvedLangCode;
      currentSettings.value.langSubtitles = resolvedLangCode;
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
  open.value = false;
  results.value = [];
  congregationName.value = '';
};
</script>
