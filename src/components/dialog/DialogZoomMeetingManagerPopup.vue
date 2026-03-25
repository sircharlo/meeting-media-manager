<template>
  <q-menu
    ref="zoomMeetingManagerPopupRef"
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div class="flex action-popup q-py-md" style="flex-flow: column">
      <div class="card-title row q-px-md q-mb-none">
        {{ t('zoomMeetingManagerControls') }}
      </div>
      <div class="row q-px-md q-pt-sm q-col-gutter-sm">
        <div class="col-12">
          <q-btn
            class="full-width"
            color="primary"
            :disable="!meetingId"
            unelevated
            @click="launchZoomMeeting(meetingId)"
          >
            <q-icon class="q-mr-sm" name="mmm-open-web" size="xs" />
            {{ t('launch-zoom-meeting') }}
          </q-btn>
          <q-tooltip v-if="!meetingId" :delay="500">
            {{ t('zoom-meeting-manager-meeting-id-missing') }}
          </q-tooltip>
        </div>
        <div class="col-12">
          <q-btn
            class="full-width"
            color="primary"
            outline
            unelevated
            @click="listMainZoomWindows"
          >
            <q-icon class="q-mr-sm" name="mmm-groups" size="xs" />
            {{ t('list-zoom-windows') }}
          </q-btn>
        </div>
        <div v-if="zoomWindows.length" class="col-12">
          <q-select
            v-model="selectedZoomWindow"
            dense
            :label="t('select-zoom-window')"
            option-label="title"
            :options="zoomWindows"
            outlined
          />
        </div>
      </div>

      <div
        v-if="
          selectedZoomWindow &&
          currentSettings?.zoomMeetingManagerAutomateMeetingAudioSettings
        "
        class="row q-px-md q-pt-sm q-gutter-x-sm"
      >
        <q-btn
          class="col"
          color="primary"
          no-caps
          outline
          @click="automateZoomMeetingSettings"
        >
          {{ t('zoomMeetingManagerAutomateMeetingAudioSettings') }}
          <q-tooltip>{{
            t('zoomMeetingManagerAutomateMeetingAudioSettings-explain')
          }}</q-tooltip>
        </q-btn>
        <q-btn
          class="col"
          color="primary"
          no-caps
          outline
          @click="automateZoomPostMeetingSettings"
        >
          {{ t('zoomMeetingManagerAutomatePostMeetingAudioSettings') }}
          <q-tooltip>{{
            t('zoomMeetingManagerAutomatePostMeetingAudioSettings-explain')
          }}</q-tooltip>
        </q-btn>
      </div>

      <div class="row q-px-md q-pt-md q-gutter-x-sm">
        <q-btn
          class="col-12"
          color="primary"
          dense
          no-caps
          outline
          @click="restartZoomHelper"
        >
          {{ t('restart') }}
        </q-btn>
      </div>

      <div v-if="zoomHelperLogs.length" class="row q-px-md q-pt-md">
        <q-expansion-item
          v-model="logsExpanded"
          class="col-12 bg-grey-2 rounded-borders"
          dense
          dense-toggle
          expand-separator
          :label="t('logs')"
        >
          <div
            class="bg-dark text-white q-pa-sm rounded-borders scroll"
            style="max-height: 200px; font-family: monospace; font-size: 10px"
          >
            <div v-for="(logLine, index) in zoomHelperLogs" :key="index">
              {{ logLine }}
            </div>
          </div>
        </q-expansion-item>
      </div>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import type { ZoomUIElement } from 'src/types/electron';

import { storeToRefs } from 'pinia';
import { QMenu } from 'quasar';
import {
  automateZoomMeetingSettings,
  automateZoomPostMeetingSettings,
} from 'src/helpers/zoom';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const zoomMeetingManagerPopupRef = useTemplateRef<QMenu>(
  'zoomMeetingManagerPopupRef',
);

const open = defineModel<boolean>({ required: true });

const { launchZoomMeeting, listZoomWindows, restartZoomHelper } =
  globalThis.electronApi;

const currentState = useCurrentStateStore();
const { currentSettings, zoomHelperLogs } = storeToRefs(currentState);

const meetingId = computed(
  () => currentSettings.value?.zoomMeetingManagerMeetingId?.trim() || '',
);

const zoomWindows = ref<ZoomUIElement[]>([]);
const selectedZoomWindow = ref<null | ZoomUIElement>(null);
const logsExpanded = ref(false);
let mainWindowPollingInterval: null | ReturnType<typeof setInterval> = null;

const listMainZoomWindows = async () => {
  selectedZoomWindow.value = null;
  zoomWindows.value = await listZoomWindows(true);
  if (zoomWindows.value?.[0]) {
    selectedZoomWindow.value = zoomWindows.value[0];
  }
  log(zoomWindows.value, 'zoom', 'debug', zoomWindows.value);
};

const syncMainWindowSelection = async () => {
  const windows = await listZoomWindows(true);
  zoomWindows.value = windows;

  const selectedHandle = selectedZoomWindow.value?.handle;
  if (selectedHandle) {
    const existingWindow = windows.find((w) => w.handle === selectedHandle);
    if (existingWindow) {
      selectedZoomWindow.value = existingWindow;
      return;
    }
  }

  selectedZoomWindow.value = windows[0] ?? null;
};

const { t } = useI18n();

// UI update handler
watch(
  () => [zoomWindows.value.length, selectedZoomWindow.value],
  () => {
    setTimeout(() => {
      if (zoomMeetingManagerPopupRef.value) {
        zoomMeetingManagerPopupRef.value.updatePosition();
      }
    }, 10);
  },
);

watch(
  () => open.value,
  (isOpen) => {
    if (mainWindowPollingInterval) {
      clearInterval(mainWindowPollingInterval);
      mainWindowPollingInterval = null;
    }

    if (!isOpen) return;

    void syncMainWindowSelection();
    mainWindowPollingInterval = setInterval(() => {
      void syncMainWindowSelection();
    }, 5000);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (mainWindowPollingInterval) {
    clearInterval(mainWindowPollingInterval);
    mainWindowPollingInterval = null;
  }
});
</script>
