<template>
  <q-btn
    v-if="
      currentSettings?.recordingEnable &&
      !(
        currentSettings?.obsEnable &&
        currentSettings?.obsEnableRecordingControls
      )
    "
    class="super-rounded"
    :class="classes"
    :color="color"
    :disable="!currentSettings?.recordingStartShortcut"
    no-caps
    rounded
    :style="isRecording ? 'min-width: 110px;' : ''"
    :text-color="textColor"
    unelevated
    @click="onClick"
  >
    <q-icon class="island-btn__icon" name="mmm-record" />
    <div v-if="isRecording" class="recording-status__duration q-ml-sm">
      {{ formattedDuration }}
    </div>

    <q-tooltip v-if="!recordingPopup" :delay="1000" :offset="[14, 22]">
      {{ t('meetingRecording') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  type IslandButtonStatus,
  useIslandButton,
} from 'src/composables/useIslandButton';
import { useCurrentStateStore } from 'stores/current-state';
import { useRecordingStore } from 'stores/recording-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const recording = useRecordingStore();
const { formattedDuration, isRecording } = storeToRefs(recording);

const recordingPopup = defineModel<boolean>({ default: false });

const { classes, color, textColor } = useIslandButton(
  computed<IslandButtonStatus>(() => (isRecording.value ? 'live' : 'normal')),
  recordingPopup,
);

const { t } = useI18n();

const onClick = () => {
  recordingPopup.value = !recordingPopup.value;
};
</script>

<style scoped>
.recording-status__duration {
  font-variant-numeric: tabular-nums;
  min-width: 6ch;
  text-align: center;
  white-space: nowrap;
}
</style>
