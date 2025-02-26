<template>
  <q-input
    v-model="model"
    class="q-pb-none bg-accent-100 date-time-input"
    dense
    hide-bottom-space
    mask="date"
    outlined
    :rules="getRules(rules, currentSettings?.disableMediaFetching)"
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
        dense
        :first-day-of-week="friendlyDayToJsDay(currentSettings?.firstDayOfWeek)"
        :locale="dateLocale"
        minimal
        :navigation-min-year-month="minNavigationDate"
        :no-unset="rules?.includes('notEmpty')"
        :options="getDateOptions(options)"
        :rules="rules"
      >
        <div class="row items-center justify-end q-gutter-sm">
          <q-btn
            v-close-popup
            color="negative"
            flat
            :label="t('clear')"
            @click="clearDate"
          />
          <q-btn v-close-popup color="primary" flat :label="t('save')" />
        </div>
      </q-date>
    </q-popup-proxy>
  </q-input>
</template>

<script setup lang="ts">
import type { SettingsItemOption, SettingsItemRule } from 'src/types';

import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import {
  formatDate,
  friendlyDayToJsDay,
  getSpecificWeekday,
} from 'src/utils/date';
import { getDateOptions, getRules } from 'src/utils/settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const { dateLocale } = useLocale();

const props = defineProps<{
  label?: null | string;
  options?: SettingsItemOption[];
  rules?: SettingsItemRule[];
}>();

const model = defineModel<null | string>({ required: true });

const clearDate = () => {
  model.value = '';
};

const minNavigationDate = computed(() => {
  if (props.options?.includes('futureDate')) {
    return formatDate(new Date().toISOString(), 'YYYY/MM');
  } else if (props.options?.includes('coTuesdays')) {
    return formatDate(getSpecificWeekday(new Date(), 0), 'YYYY/MM');
  }

  return undefined;
});

const focusHandler = (evt: Event) => {
  (evt.target as HTMLInputElement)?.blur();
};
</script>
