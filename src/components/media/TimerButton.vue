<template>
  <q-btn
    v-if="currentSettings?.enableTimerDisplay"
    class="super-rounded"
    :color="
      timerPopup
        ? 'white'
        : timerWindowVisible
          ? 'white-transparent'
          : 'negative'
    "
    :icon="timerWindowVisible ? 'mmm-alarm' : 'mmm-alarm-off'"
    rounded
    :text-color="
      timerPopup ? (timerWindowVisible ? 'primary' : 'negative') : ''
    "
    unelevated
    @click="timerPopup = !timerPopup"
  >
    <q-tooltip
      v-if="!timerPopup"
      anchor="bottom left"
      :delay="1000"
      :offset="[14, 22]"
      self="top left"
    >
      {{ t('timer') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings, timerWindowVisible } = storeToRefs(currentState);

const timerPopup = defineModel<boolean>({ required: true });
</script>
