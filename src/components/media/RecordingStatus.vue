<template>
  <q-btn
    v-if="currentSettings?.recordingEnable"
    class="super-rounded"
    :color="
      recordingPopup
        ? 'white'
        : props.isRecording
          ? 'negative'
          : 'white-transparent'
    "
    :disable="!currentSettings?.recordingStartShortcut"
    no-caps
    rounded
    :style="props.isRecording ? 'min-width: 110px;' : ''"
    :text-color="
      recordingPopup ? (props.isRecording ? 'negative' : 'primary') : ''
    "
    unelevated
    @click="onClick"
  >
    <q-icon name="mmm-record" />
    <div v-if="props.isRecording" class="q-ml-sm">
      {{ props.recordingDuration }}
    </div>

    <q-tooltip v-if="!recordingPopup" :delay="1000" :offset="[14, 22]">
      {{ t('meetingRecording') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const recordingPopup = defineModel<boolean>({ default: false });
const props = defineProps<{
  isRecording: boolean;
  recordingDuration: string;
}>();

const { t } = useI18n();

const onClick = () => {
  recordingPopup.value = !recordingPopup.value;
};
</script>
