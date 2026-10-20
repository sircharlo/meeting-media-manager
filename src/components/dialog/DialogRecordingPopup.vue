<template>
  <ActionPopup
    v-model="open"
    :status-color="statusColor"
    status-icon="mmm-record"
    :status-text="statusText"
    :title="t('meetingRecording')"
  >
    <template #footer>
      <q-btn
        class="full-width"
        :color="isRecording ? 'negative' : 'primary'"
        :icon="isRecording ? 'mmm-stop' : 'mmm-record'"
        :label="isRecording ? t('stop-recording') : t('start-recording')"
        unelevated
        @click="toggleRecording()"
      />
    </template>
    <template v-if="currentSettings?.recordingFolder" #footer-secondary>
      <q-btn
        class="col btn-tonal"
        color="secondary"
        flat
        icon="mmm-folder-open"
        :label="t('open-recording-folder')"
        no-caps
        @click="openRecordingFolder"
      />
    </template>
  </ActionPopup>
</template>

<script setup lang="ts">
import ActionPopup from 'components/ui/ActionPopup.vue';
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useRecordingStore } from 'stores/recording-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const recording = useRecordingStore();
const { formattedDuration, isRecording } = storeToRefs(recording);
const { toggleRecording } = recording;
const { openFolder } = globalThis.electronApi;

const open = defineModel<boolean>({ default: false });

const { t } = useI18n();

const statusText = computed(() =>
  isRecording.value
    ? t('recording-status-live', { duration: formattedDuration.value })
    : t('recording-status-idle'),
);

const statusColor = computed(() => (isRecording.value ? 'negative' : 'grey'));

const openRecordingFolder = () => {
  if (!currentSettings.value?.recordingFolder) return;
  void openFolder(currentSettings.value.recordingFolder);
};
</script>
