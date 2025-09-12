<template>
  <q-input
    v-model="model"
    class="q-pb-none bg-accent-100 error"
    :class="settingId === 'localDateFormat' ? 'q-mb-xs' : ''"
    :clearable="settingId === 'localDateFormat'"
    dense
    :error="customError"
    hide-bottom-space
    v-bind="{
      label:
        (settingId === 'localDateFormat'
          ? model
            ? getLocalDate(exampleDate, dateLocale, model)
            : undefined
          : label) || undefined,
    }"
    outlined
    :rules="getRules(rules, currentSettings?.disableMediaFetching)"
    spellcheck="false"
    style="width: 240px"
  >
    <template v-if="settingId === 'baseUrl'" #prepend>
      <div class="text-subtitle2 text-accent-300">https://www.</div>
    </template>
    <template v-if="customSuccess || customFailure" #append>
      <q-icon
        :color="customSuccess ? 'positive' : 'negative'"
        :name="customSuccess ? 'mmm-check' : 'mmm-clear'"
      />
    </template>
  </q-input>
  <q-expansion-item
    v-if="settingId === 'localDateFormat'"
    dense
    dense-toggle
    expand-icon-class="text-white"
    header-class="bg-primary text-white"
    :label="t('date-format-tokens')"
    style="width: 240px; border-radius: 8px; overflow: hidden"
  >
    <div v-for="group in dateFormatTokenGroups" :key="group.type">
      <q-chip
        v-for="fmt in group.tokens"
        :key="fmt"
        clickable
        color="primary"
        dense
        outline
        @click="addToModel(fmt)"
      >
        <q-tooltip>{{ fmt }}</q-tooltip>
        {{ getLocalDate(exampleDate, dateLocale, fmt) }}
      </q-chip>
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import type {
  SettingsItemAction,
  SettingsItemRule,
  SettingsValues,
} from 'src/types';

import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { getLocalDate } from 'src/utils/date';
import { getRules, performActions } from 'src/utils/settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { dateLocale } = useLocale();

const obsState = useObsStateStore();
const { obsConnectionState } = storeToRefs(obsState);

const jwStore = useJwStore();
const { urlVariables } = storeToRefs(jwStore);

const { currentSettings } = storeToRefs(useCurrentStateStore());

const dateFormatTokens = [
  'dd',
  'ddd',
  'dddd',
  'D',
  'DD',
  'M',
  'MM',
  'MMM',
  'MMMM',
  'YY',
  'YYYY',
];

const dateFormatTokenGroups = computed(() => {
  const groups: Record<string, string[]> = {};
  for (const fmt of dateFormatTokens) {
    const match = fmt.match(/[A-Za-z]/);
    const key = match ? match[0] : fmt;
    if (!groups[key]) groups[key] = [];
    groups[key].push(fmt);
  }
  return Object.entries(groups).map(([type, tokens]) => ({ tokens, type }));
});

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

const exampleDate = new Date(currentYear, currentMonth, 1);

const addToModel = (value: string) => {
  model.value = (model.value || '') + value;
};

const customError = computed(
  () =>
    props.settingId?.startsWith('obs') &&
    obsConnectionState.value !== 'connected',
);

const customFailure = computed(() => {
  if (props.settingId === 'baseUrl') {
    return !urlVariables.value?.mediator;
  } else {
    return false;
  }
});

const customSuccess = computed(() => {
  if (props.settingId?.startsWith('obs')) {
    return obsConnectionState.value === 'connected';
  } else if (props.settingId === 'baseUrl') {
    return !!urlVariables.value?.base && !!urlVariables.value?.mediator;
  } else {
    return false;
  }
});

const props = defineProps<{
  actions?: SettingsItemAction[];
  label?: null | string;
  rules?: SettingsItemRule[];
  settingId?: keyof SettingsValues;
}>();

const model = defineModel<null | string>({ required: true });

watch(model, () => {
  performActions(props.actions);
});
</script>
