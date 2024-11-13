<template>
  <q-select
    v-model="model"
    :clearable="!rules || !rules.includes('notEmpty')"
    :disable="customDisabled"
    :disabled="customDisabled"
    :fill-input="useInput"
    :hide-selected="useInput"
    :options="listOptions"
    :rules="getRules(rules)"
    :use-input="useInput"
    class="bg-accent-100"
    dense
    emit-value
    hide-bottom-space
    input-debounce="0"
    map-options
    outlined
    v-bind="{ label: label || undefined }"
    spellcheck="false"
    style="width: 240px"
    @filter="filterFn"
  >
  </q-select>
</template>

<script setup lang="ts">
import type { SettingsItemRule, SettingsValues } from 'src/types';

import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { RESOLUTIONS } from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { configuredScenesAreAllUUIDs } from 'src/helpers/obs';
import { getRules } from 'src/helpers/settings';
import { localeOptions } from 'src/i18n';
import { useJwStore } from 'src/stores/jw';
import { useObsStateStore } from 'src/stores/obs-state';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const jwStore = useJwStore();
const { jwLanguages } = storeToRefs(jwStore);

const props = defineProps<{
  label?: null | string;
  list?: string;
  rules?: SettingsItemRule[] | undefined;
  settingId?: keyof SettingsValues;
  useInput?: boolean;
}>();

const model = defineModel<null | string>({ required: true });

const filteredJwLanguages = ref(jwLanguages.value?.list || []);
const filteredLocaleAppLang = ref(localeOptions);
const obsState = useObsStateStore();
const { obsConnectionState, scenes } = storeToRefs(obsState);
const { dateLocale } = useLocale();
const { t } = useI18n();

const customDisabled = computed(() => {
  return (
    (props.settingId?.startsWith('obs') &&
      obsConnectionState.value !== 'connected') ||
    undefined
  );
});

const filterFn = (
  val: string,
  update: (arg0: { (): void; (): void }) => void,
) => {
  const noFilter = () => {
    update(() => {
      filteredJwLanguages.value = jwLanguages.value?.list || [];
      filteredLocaleAppLang.value = localeOptions;
    });
  };
  try {
    if (!val) {
      noFilter();
    } else {
      update(() => {
        const needle = val.toLowerCase();
        filteredJwLanguages.value = (jwLanguages.value?.list || []).filter(
          (v) =>
            v.name.toLowerCase().indexOf(needle) > -1 ||
            v.vernacularName.toLowerCase().indexOf(needle) > -1,
        );
        filteredLocaleAppLang.value = localeOptions.filter(
          (v) =>
            v.englishName.toLowerCase().indexOf(needle) > -1 ||
            v.label.toLowerCase().indexOf(needle) > -1,
        );
      });
    }
  } catch (error) {
    noFilter();
    errorCatcher(error);
  }
};

const listOptions = computed(() => {
  try {
    if (props.list === 'jwLanguages') {
      return filteredJwLanguages.value.map((language) => {
        return {
          label: `${language.vernacularName} (${language.name})`,
          value: language.langcode,
        };
      });
    } else if (props.list === 'appLanguages') {
      return [...filteredLocaleAppLang.value]
        .sort((a, b) => a.englishName.localeCompare(b.englishName))
        .map((language) => {
          return {
            label:
              language.label +
              (language.englishName !== language.label
                ? ` (${language.englishName})`
                : ''),
            value: language.value,
          };
        });
    } else if (props.list === 'darkModes') {
      return [
        { label: t('automatic'), value: 'auto' },
        { label: t('dark'), value: true },
        { label: t('light'), value: false },
      ];
    } else if (props.list === 'resolutions') {
      return RESOLUTIONS.map((r) => ({ label: r, value: r }));
    } else if (props.list === 'days') {
      return Array.from({ length: 7 }, (_, i) => ({
        label: dateLocale.value.days[i === 6 ? 0 : i + 1],
        value: String(i),
      }));
    } else if (props.list?.startsWith('obs')) {
      return scenes.value?.map((scene) => {
        return {
          label: scene.sceneName,
          value:
            configuredScenesAreAllUUIDs() && scene.sceneUuid
              ? scene.sceneUuid
              : scene.sceneName,
        };
      });
    } else {
      throw new Error('List not found: ' + props.list);
    }
  } catch (error) {
    errorCatcher(error);
    return [];
  }
});
</script>
