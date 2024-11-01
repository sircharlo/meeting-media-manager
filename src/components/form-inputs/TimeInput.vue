<template>
  <q-input
    v-model="model"
    :rules="getRules(rules)"
    class="q-pb-none bg-accent-100 date-time-input"
    dense
    hide-bottom-space
    mask="time"
    outlined
    style="width: 240px"
    v-bind="{ label: label || undefined }"
    @focus="focusHandler($event)"
  >
    <template #append>
      <q-icon name="mmm-time" size="xs" />
    </template>
    <q-popup-proxy
      breakpoint="1000"
      transition-hide="scale"
      transition-show="scale"
    >
      <q-time v-model="model" :options="getTimeOptions(options)" format24h>
        <div class="row items-center justify-end">
          <q-btn
            v-close-popup
            :label="$t('clear')"
            color="negative"
            flat
            @click="clearTime"
          />
          <q-btn v-close-popup :label="$t('save')" color="primary" flat />
        </div>
      </q-time>
    </q-popup-proxy>
  </q-input>
</template>

<script setup lang="ts">
import type { SettingsItemOption, SettingsItemRule } from 'src/types';

import { getRules, getTimeOptions } from 'src/helpers/settings';

defineProps<{
  label?: string;
  options: SettingsItemOption[] | undefined;
  rules?: SettingsItemRule[] | undefined;
}>();

const model = defineModel<null | string>({ required: true });

const clearTime = () => {
  model.value = '';
};

const focusHandler = (evt: Event) => {
  (evt.target as HTMLInputElement)?.blur();
};
</script>
