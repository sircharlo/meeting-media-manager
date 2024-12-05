<template>
  <q-select
    v-model="model"
    class="bg-accent-100"
    :clearable="!rules || !rules.includes('notEmpty')"
    dense
    :disable="customDisabled"
    :disabled="customDisabled"
    emit-value
    :fill-input="useInput"
    hide-bottom-space
    :hide-selected="useInput"
    input-debounce="0"
    :label="label"
    map-options
    :options="listOptions"
    outlined
    :rules="getRules(rules, currentSettings?.disableMediaFetching)"
    spellcheck="false"
    style="width: 240px"
    :use-input="useInput"
    @filter="filterFn"
  >
    <template
      v-if="listOptions.some((o) => !!o.description || !!o.icon)"
      #option="scope"
    >
      <q-item v-bind="scope.itemProps">
        <q-item-section v-if="scope.opt.icon" avatar>
          <q-icon :name="scope.opt.icon" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
          <q-item-label v-if="scope.opt.description" caption>
            {{ scope.opt.description }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import type {
  SettingsItemListKey,
  SettingsItemRule,
  SettingsValues,
} from 'src/types';

import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { SORTER } from 'src/constants/general';
import { RESOLUTIONS } from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { localeOptions } from 'src/i18n';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { useObsStateStore } from 'src/stores/obs-state';
import { getRules } from 'src/utils/settings';
import { computed, ref } from 'vue';

const jwStore = useJwStore();
const { jwLanguages } = storeToRefs(jwStore);
const { configuredScenesAreAllUUIDs, currentSettings } = storeToRefs(
  useCurrentStateStore(),
);

const props = defineProps<{
  label?: string;
  list?: SettingsItemListKey;
  rules?: SettingsItemRule[] | undefined;
  settingId?: keyof SettingsValues;
  useInput?: boolean;
}>();

const model = defineModel<boolean | null | number | string>({
  get: (value) => {
    if (typeof value === 'number') {
      return String(value);
    }
    return value;
  },
  required: true,
});

const filteredJwLanguages = ref(jwLanguages.value?.list || []);
const filteredLocaleAppLang = ref(localeOptions);
const obsState = useObsStateStore();
const { obsConnectionState, scenes } = storeToRefs(obsState);
const { dateLocale, t } = useLocale();

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

const listOptions = computed(
  (): {
    description?: string;
    icon?: string;
    label: string;
    value: boolean | string;
  }[] => {
    try {
      if (props.list === 'jwLanguages') {
        return filteredJwLanguages.value.map((language) => {
          return {
            description: language.name,
            label: language.vernacularName,
            value: language.langcode,
          };
        });
      } else if (props.list === 'appLanguages') {
        return [...filteredLocaleAppLang.value]
          .sort((a, b) => SORTER.compare(a.englishName, b.englishName))
          .map((language) => {
            return {
              description: language.englishName,
              label: language.label,
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
          label: dateLocale.value.days[i === 6 ? 0 : i + 1] ?? '',
          value: String(i),
        }));
      } else if (props.list?.startsWith('obs')) {
        return scenes.value?.map((scene) => {
          return {
            label: scene.sceneName?.toString() ?? 'Unknown scene',
            value:
              configuredScenesAreAllUUIDs.value && scene.sceneUuid
                ? scene.sceneUuid.toString()
                : (scene.sceneName?.toString() ?? 'Unknown scene'),
          };
        });
      } else {
        throw new Error('List not found: ' + props.list);
      }
    } catch (error) {
      errorCatcher(error);
      return [];
    }
  },
);
</script>
