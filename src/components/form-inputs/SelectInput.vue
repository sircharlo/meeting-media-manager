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
import type { JsonObject } from 'app/node_modules/obs-websocket-js/node_modules/type-fest';
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

const obsState = useObsStateStore();
const { obsConnectionState, scenes } = storeToRefs(obsState);
const { dateLocale, t } = useLocale();

const filteredJwLanguages = ref(jwLanguages.value?.list || []);
const filteredLocaleAppLang = ref(localeOptions);
const filteredResolutions = ref<string[]>([...RESOLUTIONS]);
const filteredDays = ref(
  Array.from({ length: 7 }, (_, i) => ({
    label: dateLocale.value.days[i === 6 ? 0 : i + 1] ?? '',
    value: String(i),
  })),
);
const filteredDarkModes = ref([
  { description: t('automatic'), label: t('automatic'), value: 'auto' },
  { description: t('dark'), label: t('dark'), value: true },
  { description: t('light'), label: t('light'), value: false },
]);
const filteredObsScenes = ref<JsonObject[]>([]);

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
      filteredResolutions.value = [...RESOLUTIONS];
      filteredDays.value = Array.from({ length: 7 }, (_, i) => ({
        label: dateLocale.value.days[i === 6 ? 0 : i + 1] ?? '',
        value: String(i),
      }));
      filteredDarkModes.value = [
        { description: t('automatic'), label: t('automatic'), value: 'auto' },
        { description: t('dark'), label: t('dark'), value: true },
        { description: t('light'), label: t('light'), value: false },
      ];
      filteredObsScenes.value = scenes.value ?? [];
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
            v.name.toLowerCase().includes(needle) ||
            v.vernacularName.toLowerCase().includes(needle),
        );

        filteredLocaleAppLang.value = localeOptions.filter(
          (v) =>
            v.englishName.toLowerCase().includes(needle) ||
            v.label.toLowerCase().includes(needle),
        );

        filteredResolutions.value = RESOLUTIONS.filter((r) =>
          r.toLowerCase().includes(needle),
        );

        filteredDays.value = Array.from({ length: 7 }, (_, i) => ({
          label: dateLocale.value.days[i === 6 ? 0 : i + 1] ?? '',
          value: String(i),
        })).filter((d) => d.label.toLowerCase().includes(needle));

        filteredDarkModes.value = [
          { description: t('automatic'), label: t('automatic'), value: 'auto' },
          { description: t('dark'), label: t('dark'), value: true },
          { description: t('light'), label: t('light'), value: false },
        ].filter((mode) => mode.label.toLowerCase().includes(needle));

        filteredObsScenes.value =
          scenes.value?.filter((scene) =>
            scene.sceneName?.toString().toLowerCase().includes(needle),
          ) ?? [];
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
    value: boolean | number | string;
  }[] => {
    try {
      if (props.list === 'jwLanguages') {
        return filteredJwLanguages.value.map((language) => ({
          description: language.name,
          label: language.vernacularName,
          value: language.langcode,
        }));
      } else if (props.list === 'appLanguages') {
        return [...filteredLocaleAppLang.value]
          .sort((a, b) => SORTER.compare(a.englishName, b.englishName))
          .map((language) => ({
            description: language.englishName,
            label: language.label,
            value: language.value,
          }));
      } else if (props.list === 'darkModes') {
        return filteredDarkModes.value;
      } else if (props.list === 'resolutions') {
        return filteredResolutions.value.map((r) => ({ label: r, value: r }));
      } else if (props.list === 'days') {
        return filteredDays.value;
      } else if (props.list?.startsWith('obs')) {
        return filteredObsScenes.value.map((scene) => ({
          label: scene.sceneName?.toString() ?? 'Unknown scene',
          value:
            configuredScenesAreAllUUIDs.value && scene.sceneUuid
              ? scene.sceneUuid.toString()
              : (scene.sceneName?.toString() ?? 'Unknown scene'),
        }));
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
