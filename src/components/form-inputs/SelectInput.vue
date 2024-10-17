<template>
  <q-select
    v-model="localValue"
    :fill-input="useInput"
    :hide-selected="useInput"
    :options="
      (getListOptions(options) as Array<{ value: string; label: string }>)?.map(
        (option) => {
          return {
            value: option.value,
            label:
              options === 'jwLanguages' || options?.startsWith('obs')
                ? option.label
                : options === 'days'
                  ? dateLocale.days[
                      parseInt(option.label) === 6
                        ? 0
                        : parseInt(option.label) + 1
                    ]
                  : $t(option.label),
          };
        },
      )
    "
    :rules="getRules(rules)"
    :use-input="useInput"
    class="bg-accent-100"
    clearable
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
import type { SettingsItemRule } from 'src/types';

import { useLocale } from 'src/composables/useLocale';
import { filterFn, getListOptions, getRules } from 'src/helpers/settings';
import { ref, watch } from 'vue';

const { dateLocale } = useLocale();

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
  label?: null | string;
  modelValue?: string;
  options?: string;
  rules?: SettingsItemRule[] | undefined;
  useInput?: boolean;
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
</script>
