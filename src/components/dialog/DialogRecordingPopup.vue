<template>
  <q-menu
    ref="recordingPopup"
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div class="column action-popup q-py-md">
      <div class="card-title col-shrink full-width q-px-md q-mb-none">
        {{ t('meetingRecording') }}
      </div>
      <template v-if="props.isRecording">
        <p class="card-section-title text-dark-grey row q-px-md q-pt-sm">
          {{ t('recording-duration') }}
        </p>
        <div class="row q-px-md q-pt-xs q-pb-sm">
          <div class="col text-weight-medium">
            {{ props.recordingDuration }}
          </div>
        </div>
      </template>
      <div class="overflow-auto col full-width q-px-md">
        <div class="row q-col-gutter-xs">
          <div class="col-12 q-mt-sm">
            <q-btn
              v-if="currentSettings?.recordingFolder"
              class="full-width"
              color="secondary"
              icon="mmm-folder-open"
              :label="t('open-recording-folder')"
              unelevated
              @click="openRecordingFolder"
            />
          </div>
          <div class="col-12">
            <q-btn
              class="full-width"
              :color="isRecording ? 'negative' : 'primary'"
              :icon="isRecording ? 'mmm-stop' : 'mmm-record'"
              :label="isRecording ? t('stop-recording') : t('start-recording')"
              unelevated
              @click="toggleRecording"
            />
          </div>
        </div>
      </div>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import type { QMenu } from 'quasar';

import { storeToRefs } from 'pinia';
import { sendKeyboardShortcut } from 'src/helpers/keyboard-shortcuts';
import { useCurrentStateStore } from 'stores/current-state';
import { useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const { openFolder } = window.electronApi;

const open = defineModel<boolean>({ default: false });
const props = defineProps<{
  isRecording: boolean;
  recordingDuration: string;
}>();
const emit = defineEmits<{
  'update:isRecording': [value: boolean];
}>();

const { t } = useI18n();

const recordingPopup = useTemplateRef<QMenu>('recordingPopup');

// Update popup position when recording state changes
watch(
  () => props.isRecording,
  () => {
    setTimeout(() => {
      if (recordingPopup.value) {
        recordingPopup.value.updatePosition();
      }
    }, 10);
  },
);

const toggleRecording = () => {
  if (!currentSettings.value) return;

  if (props.isRecording) {
    // Stop recording
    const stopShortcut =
      currentSettings.value.recordingStopShortcut ||
      currentSettings.value.recordingStartShortcut;
    if (stopShortcut) {
      sendKeyboardShortcut(stopShortcut, 'Recording');
      emit('update:isRecording', false);
    }
  } else {
    // Start recording
    const startShortcut = currentSettings.value.recordingStartShortcut;
    if (startShortcut) {
      sendKeyboardShortcut(startShortcut, 'Recording');
      emit('update:isRecording', true);
    }
  }
};

const openRecordingFolder = () => {
  if (!currentSettings.value?.recordingFolder) return;
  openFolder(currentSettings.value.recordingFolder);
};
</script>
