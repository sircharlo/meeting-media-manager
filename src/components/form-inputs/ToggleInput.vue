<template>
  <q-toggle v-model="model" checked-icon="mmm-check" color="primary" />
</template>

<script setup lang="ts">
import type { SettingsItemAction } from 'src/types';

import { getActions } from 'src/helpers/settings';
import { watch } from 'vue';

// Define props and emits
const props = defineProps<{
  actions: SettingsItemAction[] | undefined;
  modelValue: boolean;
}>();

const model = defineModel<boolean>({ required: true });

// Setup component
watch(model, () => {
  getActions(props.actions);
});
</script>
