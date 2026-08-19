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
import type { JsonObject } from 'type-fest';

import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { SORTER } from 'src/constants/general';
import { RESOLUTIONS } from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { localeOptions } from 'src/i18n';
import { getRules } from 'src/utils/settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';
import { computed, ref, watch } from 'vue';

const jwStore = useJwStore();
const { jwLanguages } = storeToRefs(jwStore);
const { configuredScenesAreAllUUIDs, currentSettings } = storeToRefs(
  useCurrentStateStore(),
);

const props = defineProps<{
  label?: string;
  list?: SettingsItemListKey;
  rules?: SettingsItemRule[];
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
const { dateLocale, localeObject, t } = useLocale();

// Built as functions (not inline literals) so both the initial ref value and
// the locale-change watcher below can rebuild them with fresh t() calls -
// a plain ref([...]) built once at setup time would otherwise keep showing
// stale labels (including the closed select's own selected-value label)
// after the app language changes, until the dropdown was reopened.
const buildDays = () =>
  Array.from({ length: 7 }, (_, i) => ({
    label: dateLocale.value.days[i === 6 ? 0 : i + 1] ?? '',
    value: String(i),
  }));
const buildDarkModes = () => [
  { label: t('automatic'), value: 'auto' as boolean | string },
  { label: t('dark'), value: true },
  { label: t('light'), value: false },
];
const buildTimerModes = () => [
  { label: t('count-up'), value: 'countup' },
  { label: t('count-down'), value: 'countdown' },
];
const buildTimerDisplayFormats = () => [
  { label: t('digital'), value: 'digital' },
  { label: t('analog'), value: 'analog' },
  { label: t('analog-digital'), value: 'analog-digital' },
];
const buildTimerHourFormats = () => [
  { label: t('24-hour'), value: '24h' },
  { label: t('12-hour'), value: '12h' },
];

const filteredJwLanguages = ref([...(jwLanguages.value?.list || [])]);
const filteredLocaleAppLang = ref([...localeOptions]);
const filteredResolutions = ref<string[]>([...RESOLUTIONS]);
const filteredDays = ref(buildDays());
const filteredDarkModes = ref(buildDarkModes());
const filteredObsScenes = ref<JsonObject[]>([...scenes.value]);
const filteredTimerModes = ref(buildTimerModes());
const filteredTimerDisplayFormats = ref(buildTimerDisplayFormats());
const filteredTimerHourFormats = ref(buildTimerHourFormats());

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
      filteredDays.value = buildDays();
      filteredDarkModes.value = buildDarkModes();
      filteredObsScenes.value = scenes.value ?? [];
      filteredTimerModes.value = buildTimerModes();
      filteredTimerDisplayFormats.value = buildTimerDisplayFormats();
      filteredTimerHourFormats.value = buildTimerHourFormats();
    });
  };

  try {
    if (val) {
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

        filteredDays.value = buildDays().filter((d) =>
          d.label.toLowerCase().includes(needle),
        );

        filteredDarkModes.value = buildDarkModes().filter((mode) =>
          mode.label.toLowerCase().includes(needle),
        );

        filteredObsScenes.value =
          scenes.value?.filter((scene) =>
            scene.sceneName?.toString().toLowerCase().includes(needle),
          ) ?? [];
        filteredTimerModes.value = buildTimerModes().filter((mode) =>
          mode.label.toLowerCase().includes(needle),
        );

        filteredTimerDisplayFormats.value = buildTimerDisplayFormats().filter(
          (mode) => mode.label.toLowerCase().includes(needle),
        );

        filteredTimerHourFormats.value = buildTimerHourFormats().filter(
          (mode) => mode.label.toLowerCase().includes(needle),
        );
      });
    } else {
      noFilter();
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
          label: scene.sceneName?.toString() || 'Unknown scene',
          value:
            configuredScenesAreAllUUIDs.value && scene.sceneUuid
              ? scene.sceneUuid.toString()
              : scene.sceneName?.toString() || 'Unknown scene',
        }));
      } else if (props.list === 'fontSizes') {
        return [
          { label: t('small'), value: '5vw' },
          { label: t('medium'), value: '7.5vw' },
          { label: t('large'), value: '10vw' },
          { label: t('extra-large'), value: '12.5vw' },
          { label: t('huge'), value: '20vw' },
        ];
      } else if (props.list === 'timerModes') {
        return filteredTimerModes.value;
      } else if (props.list === 'timerDisplayFormats') {
        return filteredTimerDisplayFormats.value;
      } else if (props.list === 'timerHourFormats') {
        return filteredTimerHourFormats.value;
      } else {
        throw new Error('List not found: ' + props.list);
      }
    } catch (error) {
      errorCatcher(error);
      return [];
    }
  },
);

// Keep the closed select's own displayed label (and any currently-open,
// unfiltered dropdown) in sync when the app language changes - @filter only
// fires from user interaction with the dropdown, not on a locale change
// happening elsewhere (e.g. switching to a congregation with a different
// configured language).
watch(localeObject, () => {
  filteredDays.value = buildDays();
  filteredDarkModes.value = buildDarkModes();
  filteredTimerModes.value = buildTimerModes();
  filteredTimerDisplayFormats.value = buildTimerDisplayFormats();
  filteredTimerHourFormats.value = buildTimerHourFormats();
});
</script>
