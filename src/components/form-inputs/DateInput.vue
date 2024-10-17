<template>
  <q-input
    v-model="localValue"
    :rules="getRules(rules)"
    class="q-pb-none bg-accent-100 date-time-input"
    dense
    hide-bottom-space
    mask="date"
    outlined
    style="width: 240px"
    v-bind="{ label: label || undefined }"
    @focus="focusHandler($event)"
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
        v-model="localValue"
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

import { useLocale } from 'src/composables/useLocale';
import { getDateOptions, getRules } from 'src/helpers/settings';
import { ref, watch } from 'vue';

const { dateLocale } = useLocale();

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
  label?: null | string;
  modelValue?: string;
  options?: SettingsItemOption[];
  rules?: SettingsItemRule[];
}>();

const localValue = ref(props.modelValue);

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  },
);

const clearDate = () => {
  localValue.value = '';
};

const focusHandler = (evt: Event) => {
  (evt.target as HTMLInputElement)?.blur();
};
</script>
