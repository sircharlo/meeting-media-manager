<template>
  <q-btn
    v-if="currentSettings?.zoomMeetingManagerEnable"
    class="super-rounded"
    :class="classes"
    :color="color"
    rounded
    :text-color="textColor"
    unelevated
    @click="zoomMeetingManagerPopup = !zoomMeetingManagerPopup"
  >
    <q-spinner v-if="busy" size="sm" />
    <q-icon v-else name="mmm-video-meeting" />
    <q-tooltip
      v-if="!zoomMeetingManagerPopup"
      anchor="bottom left"
      :delay="1000"
      :offset="[14, 22]"
      self="top left"
    >
      <div class="text-weight-medium">
        {{ t('zoomMeetingManagerControls') }}
      </div>
      <div>{{ t(STATUS_TOOLTIPS[zoomStatus]) }}</div>
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import {
  type IslandButtonStatus,
  useIslandButton,
} from 'src/composables/useIslandButton';
import { getRendererPlatform } from 'src/helpers/fs';
import { getZoomMeetingState, isAroundMeetingTime } from 'src/helpers/zoom';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomStateStore } from 'stores/zoom-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// How Zoom is doing, shown in the action island's status language:
// - checking: the startup check is running (busy);
// - paused: a failed check paused the Zoom automations (error);
// - missing: it's meeting time, but no Zoom meeting is open (attention);
// - live: a Zoom meeting is open (normal);
// - idle: no meeting now, and no Zoom meeting open either (off).
type ZoomStatus = 'checking' | 'idle' | 'live' | 'missing' | 'paused';

const STATUS_TOOLTIPS: Record<ZoomStatus, string> = {
  checking: 'zoom-check-running',
  idle: 'zoom-meeting-window-not-found',
  live: 'zoom-meeting-window-found',
  missing: 'zoom-meeting-window-time-not-found',
  paused: 'zoom-automations-paused',
};

const ISLAND_STATUSES: Record<ZoomStatus, IslandButtonStatus> = {
  checking: 'busy',
  idle: 'off',
  live: 'normal',
  missing: 'attention',
  paused: 'error',
};

// The Zoom popup looks more often while it's open.
const POLL_INTERVAL_MS = 15_000;

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);
const zoomState = useZoomStateStore();
const { automationsPaused, checkRunning, meeting } = storeToRefs(zoomState);

const zoomMeetingManagerPopup = defineModel<boolean>({ required: true });

const aroundMeetingTime = ref(isAroundMeetingTime());

const zoomStatus = computed<ZoomStatus>(() => {
  if (checkRunning.value) return 'checking';
  if (automationsPaused.value) return 'paused';
  if (meeting.value?.found) return 'live';
  return aroundMeetingTime.value ? 'missing' : 'idle';
});

const { busy, classes, color, textColor } = useIslandButton(
  () => ISLAND_STATUSES[zoomStatus.value],
  zoomMeetingManagerPopup,
);

const enabled = computed(
  () =>
    !!currentSettings.value?.zoomMeetingManagerEnable &&
    getRendererPlatform() === 'win32',
);

let polling = false;

// Only reads Zoom: nothing moves on screen.
const poll = async () => {
  aroundMeetingTime.value = isAroundMeetingTime();
  // A run looks at Zoom itself, and the popup does while it's open.
  if (polling || zoomState.runActive || zoomMeetingManagerPopup.value) return;
  polling = true;
  try {
    await getZoomMeetingState();
  } finally {
    polling = false;
  }
};

const { pause, resume } = useIntervalFn(poll, POLL_INTERVAL_MS, {
  immediate: false,
  immediateCallback: true,
});

watch(
  enabled,
  (isEnabled) => {
    if (isEnabled) {
      resume();
    } else {
      pause();
      zoomState.setMeeting(null);
    }
  },
  { immediate: true },
);
</script>
