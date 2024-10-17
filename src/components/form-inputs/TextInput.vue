<template>
  <q-input
    v-model="localValue"
    :rules="getRules(rules)"
    class="q-pb-none bg-accent-100"
    dense
    hide-bottom-space
    outlined
    spellcheck="false"
    v-bind="{ label: label || undefined }"
    style="width: 240px"
  />
</template>

<script setup lang="ts">
import type { SettingsItemAction, SettingsItemRule } from 'src/types';

import { getActions, getRules } from 'src/helpers/settings';
import { ref, watch } from 'vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
  actions?: SettingsItemAction[];
  label?: null | string;
  modelValue?: string;
  rules?: SettingsItemRule[];
}>();

const localValue = ref(props.modelValue);

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
  getActions(props.actions);
});

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  },
);
</script>
