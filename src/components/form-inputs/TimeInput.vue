<template>
  <q-input
    v-model="model"
    class="q-pb-none bg-accent-100 date-time-input"
    dense
    hide-bottom-space
    mask="time"
    outlined
    :rules="getRules(rules, currentSettings?.disableMediaFetching)"
    style="width: 240px"
    v-bind="{ label: label || undefined }"
    @focus="focusHandler"
  >
    <template #append>
      <q-icon name="mmm-time" size="xs" />
    </template>
    <q-popup-proxy
      breakpoint="1000"
      transition-hide="scale"
      transition-show="scale"
    >
      <q-time v-model="model" format24h :options="getTimeOptions(options)">
        <div class="row items-center justify-end">
          <q-btn
            v-close-popup
            color="negative"
            flat
            :label="t('clear')"
            @click="clearTime"
          />
          <q-btn v-close-popup color="primary" flat :label="t('save')" />
        </div>
      </q-time>
    </q-popup-proxy>
  </q-input>
</template>

<script setup lang="ts">
import type { SettingsItemOption, SettingsItemRule } from 'src/types';

import { storeToRefs } from 'pinia';
import { getRules, getTimeOptions } from 'src/utils/settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { currentSettings } = storeToRefs(useCurrentStateStore());

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
