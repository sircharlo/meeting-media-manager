<template>
  <q-toggle v-model="model" checked-icon="mmm-check" color="primary" />
</template>

<script setup lang="ts">
import type { SettingsItemAction } from 'src/types';

import { performActions } from 'src/helpers/settings';
import { watch } from 'vue';

// Define props
const props = defineProps<{
  actions: SettingsItemAction[] | undefined;
}>();

const model = defineModel<boolean>({ required: true });

// Setup component
watch(model, () => {
  performActions(props.actions);
});
</script>
