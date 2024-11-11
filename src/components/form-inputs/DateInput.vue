<template>
  <q-input
    v-model="model"
    :rules="getRules(rules)"
    class="q-pb-none bg-accent-100 date-time-input"
    dense
    hide-bottom-space
    mask="date"
    outlined
    style="width: 240px"
    v-bind="{ label: label || undefined }"
    @focus="focusHandler"
  >
    <template #append>
      <q-icon name="mmm-calendar-month" size="xs" />
    </template>
    <q-popup-proxy
      breakpoint="1000"
      transition-hide="scale"
      transition-show="scale"
    >
      <q-date
        v-model="model"
        :first-day-of-week="
          friendlyDayToJsDay(currentSettings?.firstDayOfWeek || 7)
        "
        :locale="dateLocale"
        :options="getDateOptions(options)"
        :rules="rules"
        dense
        minimal
      >
        <div class="row items-center justify-end q-gutter-sm">
          <q-btn
            v-close-popup
            :label="$t('clear')"
            color="negative"
            flat
            @click="clearDate"
          />
          <q-btn v-close-popup :label="$t('save')" color="primary" flat />
        </div>
      </q-date>
    </q-popup-proxy>
  </q-input>
</template>

<script setup lang="ts">
import type { SettingsItemOption, SettingsItemRule } from 'src/types';

import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { friendlyDayToJsDay } from 'src/helpers/date';
import { getDateOptions, getRules } from 'src/helpers/settings';
import { useCurrentStateStore } from 'src/stores/current-state';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const { dateLocale } = useLocale();

defineProps<{
  label?: null | string;
  options?: SettingsItemOption[];
  rules?: SettingsItemRule[];
}>();

const model = defineModel<null | string>({ required: true });

const clearDate = () => {
  model.value = '';
};

const focusHandler = (evt: Event) => {
  (evt.target as HTMLInputElement)?.blur();
};
</script>
