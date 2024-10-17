<template>
  <q-toggle v-model="localValue" checked-icon="mmm-check" color="primary" />
</template>

<script setup lang="ts">
import type { SettingsItemAction } from 'src/types';

import { getActions } from 'src/helpers/settings';
import { ref, watch } from 'vue';

// Define props and emits
const props = defineProps<{
  actions: SettingsItemAction[] | undefined;
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

// Setup component
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
