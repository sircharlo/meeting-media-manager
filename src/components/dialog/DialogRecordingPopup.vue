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
      ref="popupContent"
      class="action-popup action-popup--scroll-layout q-py-md"
    >
      <div class="card-title col-shrink full-width q-px-md q-mb-none">
        {{ t('meetingRecording') }}
      </div>

      <div class="action-popup__scroll full-width">
        <template v-if="isRecording">
          <p class="card-section-title text-dark-grey row q-px-md">
            {{ t('recording-duration') }}
          </p>
          <div class="row q-px-md q-pt-xs q-pb-sm">
            <div class="recording-popup__duration col text-weight-medium">
              {{ formattedDuration }}
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
            @click="toggleRecording()"
          />
        </div>
      </div>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import type { QMenu } from 'quasar';

import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useRecordingStore } from 'stores/recording-state';
import { onBeforeUnmount, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const recording = useRecordingStore();
const { formattedDuration, isRecording } = storeToRefs(recording);
const { toggleRecording } = recording;
const { openFolder } = globalThis.electronApi;

const open = defineModel<boolean>({ default: false });

const { t } = useI18n();

const recordingPopup = useTemplateRef<QMenu>('recordingPopup');
const popupContent = useTemplateRef<HTMLElement>('popupContent');
let popupResizeObserver: ResizeObserver | undefined;

const openRecordingFolder = () => {
  if (!currentSettings.value?.recordingFolder) return;
  openFolder(currentSettings.value.recordingFolder);
};

watch(popupContent, (el) => {
  popupResizeObserver?.disconnect();
  popupResizeObserver = undefined;
  if (!el) return;
  popupResizeObserver = new ResizeObserver(() => {
    recordingPopup.value?.updatePosition();
  });
  popupResizeObserver.observe(el);
});

onBeforeUnmount(() => popupResizeObserver?.disconnect());
</script>

<style scoped>
.recording-popup__duration {
  font-variant-numeric: tabular-nums;
  min-width: 6ch;
  white-space: nowrap;
}
</style>
