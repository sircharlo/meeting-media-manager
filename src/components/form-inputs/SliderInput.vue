<template>
  <q-slider
    v-model="model"
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
import { watch } from 'vue';

const props = defineProps<{
  actions?: SettingsItemAction[];
  max?: number;
  min?: number;
  modelValue?: number;
  step?: number;
}>();

const model = defineModel<number>({ required: true });

const { post } = useBroadcastChannel<number, number>({ name: 'volume-setter' });

watch(model, (newValue) => {
  if (props.actions?.includes('setBackgroundMusicVolume')) {
    if (newValue !== undefined) post(newValue);
  }
});
</script>
