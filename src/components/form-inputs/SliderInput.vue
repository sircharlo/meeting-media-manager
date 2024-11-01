<template>
  <q-slider
    v-model="localValue"
    :max="max"
    :min="min"
    :step="step"
    class="q-pb-none q-mr-md"
    dense
    filled
    style="width: 240px"
  />
</template>

<script setup lang="ts">
import type { SettingsItemAction } from 'src/types';

import { useBroadcastChannel } from '@vueuse/core';
import { ref, watch } from 'vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
  actions?: SettingsItemAction[];
  max?: number;
  min?: number;
  modelValue?: number;
  step?: number;
}>();

const localValue = ref(props.modelValue);

const { post } = useBroadcastChannel<number, number>({ name: 'volume-setter' });

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
  if (props?.actions?.includes('setBackgroundMusicVolume')) {
    if (newValue !== undefined) post(newValue);
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  },
);
</script>
