<template>
  <q-input
    v-model="model"
    class="q-pb-none bg-accent-100"
    dense
    :error="customError"
    hide-bottom-space
    :label="label || ''"
    outlined
    :rules="colorRules"
    spellcheck="false"
    style="width: 240px"
  >
    <template #append>
      <q-icon class="cursor-pointer" name="mmm-palette">
        <q-popup-proxy cover transition-hide="scale" transition-show="scale">
          <q-color v-model="model" />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import type {
  SettingsItemAction,
  SettingsItemRule,
  SettingsValues,
} from 'src/types';

import { storeToRefs } from 'pinia';
import { getRules, performActions } from 'src/utils/settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, watch } from 'vue';

const { currentSettings } = storeToRefs(useCurrentStateStore());

const customError = computed(() => false);

const props = defineProps<{
  actions?: SettingsItemAction[];
  label?: null | string;
  rules?: SettingsItemRule[];
  settingId?: keyof SettingsValues;
}>();

const model = defineModel<null | string>({ required: true });

// Custom rules for color input
const colorRules = computed(() => {
  const baseRules =
    getRules(props.rules, currentSettings.value?.disableMediaFetching) || [];
  return [
    ...baseRules,
    (val: string) => {
      if (!val) return true; // Allow empty if not required
      return (
        /^#[0-9A-F]{6}$/i.test(val) ||
        'Invalid hex color format (e.g., #FFFFFF)'
      );
    },
  ];
});

watch(model, () => {
  performActions(props.actions);
});
</script>
