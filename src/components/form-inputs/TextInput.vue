<template>
  <q-input
    v-model="localValue"
    :error="customError"
    :rules="getRules(rules)"
    class="q-pb-none bg-accent-100 error"
    dense
    hide-bottom-space
    outlined
    spellcheck="false"
    v-bind="{ label: label || undefined }"
    clearable
    style="width: 240px"
  >
    <template v-if="settingId === 'baseUrl'" #prepend>
      <div class="text-subtitle2 text-accent-300">https://www.</div>
    </template>
    <template v-if="customSuccess" #append>
      <q-icon class="cursor-pointer" color="positive" name="mmm-check" />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import type { SettingsItemAction, SettingsItemRule } from 'src/types';

import { storeToRefs } from 'pinia';
import { getActions, getRules } from 'src/helpers/settings';
import { useObsStateStore } from 'src/stores/obs-state';
import { computed, ref, watch } from 'vue';

const obsState = useObsStateStore();
const { obsConnectionState } = storeToRefs(obsState);

const customError = computed(
  () =>
    props.settingId?.startsWith('obs') &&
    obsConnectionState.value !== 'connected',
);

const customSuccess = computed(
  () =>
    props.settingId?.startsWith('obs') &&
    obsConnectionState.value === 'connected',
);

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
  actions?: SettingsItemAction[];
  label?: null | string;
  modelValue?: string;
  rules?: SettingsItemRule[];
  settingId?: string;
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
