<template>
  <q-toggle
    v-model="model"
    checked-icon="mmm-check"
    :color="settingId === 'disableMediaFetching' ? 'negative' : 'primary'"
    :disable="customDisabled"
    :disabled="customDisabled"
  />
</template>

<script setup lang="ts">
import type { SettingsItemAction, SettingsValues } from 'src/types';

import { storeToRefs } from 'pinia';
import { performActions } from 'src/utils/settings';
import { useObsStateStore } from 'stores/obs-state';
import { computed, watch } from 'vue';

const obsState = useObsStateStore();
const { obsConnectionState } = storeToRefs(obsState);

// Define props
const props = defineProps<{
  actions: SettingsItemAction[] | undefined;
  settingId?: keyof SettingsValues;
}>();

const customDisabled = computed(() => {
  return (
    (props.settingId !== 'obsEnable' &&
      props.settingId?.startsWith('obs') &&
      obsConnectionState.value !== 'connected') ||
    undefined
  );
});

const model = defineModel<boolean | undefined>({ required: true });

// Setup component
watch(model, () => {
  performActions(props.actions);
});
</script>
