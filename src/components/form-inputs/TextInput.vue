<template>
  <q-input
    v-model="model"
    class="q-pb-none bg-accent-100 error"
    dense
    :error="customError"
    hide-bottom-space
    outlined
    :rules="getRules(rules, currentSettings?.disableMediaFetching)"
    spellcheck="false"
    v-bind="{ label: label || undefined }"
    style="width: 240px"
  >
    <template v-if="settingId === 'baseUrl'" #prepend>
      <div class="text-subtitle2 text-accent-300">https://www.</div>
    </template>
    <template v-if="customSuccess || customFailure" #append>
      <q-icon
        :color="customSuccess ? 'positive' : 'negative'"
        :name="customSuccess ? 'mmm-check' : 'mmm-clear'"
      />
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
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { useObsStateStore } from 'src/stores/obs-state';
import { getRules, performActions } from 'src/utils/settings';
import { computed, watch } from 'vue';

const obsState = useObsStateStore();
const { obsConnectionState } = storeToRefs(obsState);

const jwStore = useJwStore();
const { urlVariables } = storeToRefs(jwStore);

const { currentSettings } = storeToRefs(useCurrentStateStore());

const customError = computed(
  () =>
    props.settingId?.startsWith('obs') &&
    obsConnectionState.value !== 'connected',
);

const customFailure = computed(() => {
  if (props.settingId === 'baseUrl') {
    return !urlVariables.value?.mediator;
  } else {
    return false;
  }
});

const customSuccess = computed(() => {
  if (props.settingId?.startsWith('obs')) {
    return obsConnectionState.value === 'connected';
  } else if (props.settingId === 'baseUrl') {
    return !!urlVariables.value?.base && !!urlVariables.value?.mediator;
  } else {
    return false;
  }
});

const props = defineProps<{
  actions?: SettingsItemAction[];
  label?: null | string;
  rules?: SettingsItemRule[];
  settingId?: keyof SettingsValues;
}>();

const model = defineModel<null | string>({ required: true });

watch(model, () => {
  performActions(props.actions);
});
</script>
