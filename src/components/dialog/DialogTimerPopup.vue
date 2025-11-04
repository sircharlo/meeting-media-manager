<template>
  <q-menu
    ref="timerPopup"
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
        {{ t('timer') }}
      </div>

      <!-- Meeting Detection and Mode Selection -->
      <div class="card-section-title row q-px-md">
        {{ t('timer-mode') }}
      </div>
      <div class="row q-px-md q-pb-sm">
        <q-btn-toggle
          v-model="timerMode"
          class="full-width"
          color="secondary"
          :disable="timerRunning"
          :options="[
            { label: t('count-up'), value: 'countup' },
            { label: t('count-down'), value: 'countdown' },
          ]"
          spread
          toggle-color="primary"
          unelevated
        />
      </div>
      <template v-if="timerMode === 'countdown'">
        <!-- Meeting Part Selection (only on meeting days) -->
        <template v-if="isWeMeetingDay(selectedDateObject?.date)">
          <q-separator class="bg-accent-200 q-mb-md" />
          <div class="card-section-title row q-px-md">
            {{ t('meeting-part') }}
          </div>
          <div class="row q-px-md q-pb-sm">
            <q-btn-toggle
              v-model="currentPart"
              class="full-width"
              color="secondary"
              :disable="timerRunning"
              :options="[
                { label: t('public-talk'), value: 'public-talk' },
                { label: 'WT', value: 'wt' },
              ]"
              spread
              toggle-color="primary"
              unelevated
            />
          </div>
        </template>
      </template>

      <!-- Timer Controls -->
      <q-separator class="bg-accent-200 q-mb-md" />
      <div class="card-section-title row q-px-md">
        {{ t('timer-controls') }}
      </div>

      <div class="q-px-md q-pt-md">
        <template v-if="!timerRunning">
          <q-btn
            class="full-width q-mb-sm"
            color="primary"
            :disable="
              timerMode === 'countdown' && calculateCountdownTarget() === 0
            "
            unelevated
            @click="startTimer()"
          >
            <q-icon class="q-mr-sm" name="play_arrow" />
            {{ t('start') }}
          </q-btn>
        </template>
        <template v-else>
          <div class="row q-gutter-sm q-mb-sm">
            <q-btn
              class="col"
              :color="timerPaused ? 'positive' : 'warning'"
              unelevated
              @click="timerPaused ? resumeTimer() : pauseTimer()"
            >
              <q-icon
                class="q-mr-sm"
                :name="timerPaused ? 'play_arrow' : 'pause'"
              />
              {{ timerPaused ? t('resume') : t('pause') }}
            </q-btn>
            <q-btn class="col" color="negative" unelevated @click="stopTimer()">
              <q-icon class="q-mr-sm" name="stop" />
              {{ t('stop') }}
            </q-btn>
          </div>
        </template>

        <!-- Timer Display -->
        <div v-if="timerRunning" class="text-center q-py-md">
          <div class="text-h4 text-weight-bold" :class="{ blink: timerPaused }">
            {{ formattedTime }}
          </div>
          <div class="text-caption text-grey-6">
            {{ timerMode === 'countup' ? t('elapsed') : t('remaining') }}
          </div>
        </div>
      </div>

      <!-- Show/Hide Section -->
      <q-separator class="bg-accent-200" />
      <div class="q-px-md q-pt-md row">
        <div class="col">
          <div class="row text-subtitle1 text-weight-medium">
            {{ timerWindowVisible ? t('projecting') : t('inactive') }}
          </div>
          <div class="row text-dark-grey">
            {{ t('windowed') }}
          </div>
        </div>
        <div class="col-grow">
          <q-btn
            v-if="timerWindowVisible"
            class="full-width"
            color="primary"
            unelevated
            @click="hideTimerWindow()"
          >
            {{ t('hide-timer-display') }}
          </q-btn>
          <q-btn
            v-else
            class="full-width"
            color="primary"
            unelevated
            @click="showTimerWindow()"
          >
            {{ t('show-timer-display') }}
          </q-btn>
        </div>
      </div>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import type { TimerData } from 'src/pages/TimerPage.vue';
import type { Display } from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  useIntervalFn,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { QMenu } from 'quasar';
import { isMeetingDay, isWeMeetingDay } from 'src/helpers/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const timerPopup = useTemplateRef<QMenu>('timerPopup');

const { t } = useI18n();

const screenList = ref<Display[]>([]);

const currentState = useCurrentStateStore();
const { currentSettings, selectedDateObject, timerWindowVisible } =
  storeToRefs(currentState);

defineProps<{
  dialogId?: string;
}>();

const open = defineModel<boolean>({ required: true });

// Timer state
const timerRunning = ref(false);
const timerPaused = ref(false);
const timerStartTime = ref<null | number>(null);
const timerPausedTime = ref<null | number>(null);
const elapsedSeconds = ref(0);

// Timer configuration
const timerMode = ref<'countdown' | 'countup'>('countup');
const currentPart = ref<'public-talk' | 'wt'>('public-talk');
const countdownTarget = ref<number>(0); // Target time in seconds for countdown

const { getAllScreens, toggleTimerWindow } = window.electronApi;

// Broadcast channel for timer data
const { post: postTimerData } = useBroadcastChannel<TimerData, TimerData>({
  name: 'timer-display-data',
});

const fetchScreens = async () => {
  try {
    screenList.value = await getAllScreens();
  } catch (error) {
    console.error(error);
  }
};

whenever(
  () => open.value,
  async () => {
    fetchScreens();
  },
);

useEventListener(window, 'screen-trigger-update', fetchScreens, {
  passive: true,
});

// UI update handler
watch(
  () => [timerWindowVisible.value, timerRunning.value, timerMode.value],
  () => {
    setTimeout(() => {
      if (timerPopup.value) {
        timerPopup.value.updatePosition();
      }
    }, 10);
  },
);

// Timer logic
const { pause: pauseInterval, resume: resumeInterval } = useIntervalFn(() => {
  if (timerRunning.value && !timerPaused.value) {
    const now = Date.now();
    const startTime = timerStartTime.value;
    if (startTime) {
      elapsedSeconds.value = Math.floor((now - startTime) / 1000);
      updateTimerWindow(); // Update the timer window with new time
    }
  }
}, 1000);

const formattedTime = computed(() => {
  const totalSeconds =
    timerMode.value === 'countup'
      ? elapsedSeconds.value
      : Math.max(0, countdownTarget.value - elapsedSeconds.value);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const calculateCountdownTarget = () => {
  if (
    !selectedDateObject.value ||
    !isMeetingDay(selectedDateObject.value?.date) ||
    timerMode.value === 'countup'
  )
    return 0;
  if (isWeMeetingDay(selectedDateObject.value?.date)) {
    const now = new Date();
    const configuredMeetingStartTime = currentSettings.value?.weStartTime;
    if (!configuredMeetingStartTime) return 0;
    const [startHour, startMinute] = configuredMeetingStartTime.split(':');
    if (!startHour || !startMinute) return 0;
    const meetingStartTime = new Date(selectedDateObject.value.date);
    meetingStartTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const timeToMeeting =
      Math.max(0, meetingStartTime.getTime() - now.getTime()) / 1000 / 60; // minutes

    if (currentPart.value === 'public-talk') {
      // Public talk: 30 minutes max, or time until (meeting start + 5min + 30min)
      const maxTime = Math.min(30, Math.max(0, timeToMeeting + 5 + 30));
      return maxTime * 60; // Convert to seconds
    } else {
      // WT: 60 minutes max, or time until (meeting start + 5min + 30min + 5min + 60min)
      const maxTime = Math.min(
        60,
        Math.max(0, timeToMeeting + 5 + 30 + 5 + 60),
      );
      return maxTime * 60; // Convert to seconds
    }
  } else {
    return 0;
  }
};

const startTimer = () => {
  if (timerMode.value === 'countdown') {
    countdownTarget.value = calculateCountdownTarget();
  }

  timerRunning.value = true;
  timerPaused.value = false;
  timerStartTime.value = Date.now() - elapsedSeconds.value * 1000;
  timerPausedTime.value = null;

  resumeInterval();
  updateTimerWindow();
};

const pauseTimer = () => {
  timerPaused.value = true;
  timerPausedTime.value = Date.now();
  pauseInterval();
  updateTimerWindow();
};

const resumeTimer = () => {
  const pauseDuration = Date.now() - (timerPausedTime.value || 0);
  if (timerStartTime.value !== null) {
    timerStartTime.value += pauseDuration;
  }
  timerPaused.value = false;
  timerPausedTime.value = null;
  resumeInterval();
  updateTimerWindow();
};

const stopTimer = () => {
  timerRunning.value = false;
  timerPaused.value = false;
  elapsedSeconds.value = 0;
  timerStartTime.value = null;
  timerPausedTime.value = null;
  countdownTarget.value = 0;
  pauseInterval();
  updateTimerWindow();
};

const updateTimerWindow = () => {
  // Send timer data to the timer window via broadcast channel
  const timerData = {
    mode: timerMode.value,
    paused: timerPaused.value,
    running: timerRunning.value,
    time: timerRunning.value ? formattedTime.value : '',
    timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
    timerTextColor: currentSettings.value?.timerTextColor,
    timerTextSize: currentSettings.value?.timerTextSize,
  };

  postTimerData(timerData);
};

// Watch for timer mode changes
watch([timerMode, currentPart], () => {
  if (timerRunning.value) {
    stopTimer();
  }
});

// Watch for timer settings changes and broadcast to timer window
watchImmediate(
  () => [
    currentSettings.value?.timerBackgroundColor,
    currentSettings.value?.timerTextColor,
    currentSettings.value?.timerTextSize,
  ],
  () => {
    updateTimerWindow();
  },
);

// Initialize timer when window becomes visible
watch(timerWindowVisible, (visible) => {
  if (visible) {
    // Initialize timer with current settings
    updateTimerWindow();
  }
});

const hideTimerWindow = () => {
  toggleTimerWindow(false);
  currentState.setTimerWindowVisible(false);
};

const showTimerWindow = () => {
  toggleTimerWindow(true);
  currentState.setTimerWindowVisible(true);
};

// TODO: fix color and text size initialization logic
</script>

<style scoped>
.blink {
  animation: gentle-blink 2s infinite;
}

@keyframes gentle-blink {
  0%,
  60% {
    opacity: 1;
  }
  61%,
  100% {
    opacity: 0.7;
  }
}
</style>
