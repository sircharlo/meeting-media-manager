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
    <div
      class="action-popup action-popup--scroll-layout action-popup--expanded q-py-md"
    >
      <div class="card-title col-shrink full-width q-px-md q-mb-none">
        {{ t('meetingRecording') }}
      </div>

      <div class="action-popup__scroll full-width">
        <template v-if="props.isRecording">
          <p class="card-section-title text-dark-grey row q-px-md">
            {{ t('recording-duration') }}
          </p>
          <div class="row q-px-md q-pt-xs q-pb-sm">
            <div class="col text-weight-medium">
              {{ props.recordingDuration }}
            </div>
          </div>
        </template>
      </div>

      <q-separator class="bg-accent-200" />
      <div
        class="action-popup__footer full-width q-px-md q-pt-md row q-col-gutter-xs"
      >
        <div v-if="currentSettings?.recordingFolder" class="col-12 q-mb-sm">
          <q-btn
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

const { openFolder } = globalThis.electronApi;

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
</script>
