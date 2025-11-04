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

      <!-- Window Type Selection -->
      <q-separator class="bg-accent-200 q-mb-md" />
      <div class="card-section-title row q-px-md">
        {{ t('window-type') }}
      </div>
      <div class="row q-px-md q-pb-sm q-col-gutter-sm">
        <div class="col-6">
          <q-btn
            class="full-width full-height"
            color="primary"
            :disable="screenList?.length < 2"
            :outline="screenList?.length < 2 || timerPreferences.preferWindowed"
            unelevated
            @click="
              () => {
                console.log('🔍 [Timer Full Screen Button] Clicked');
                timerPreferences.preferWindowed = false;
                console.log(
                  '🔍 [Timer Full Screen Button] Calling moveTimerWindow with:',
                  {
                    screen: timerPreferences.preferredScreenNumber,
                    fullscreen: true,
                  },
                );
                moveTimerWindow(timerPreferences.preferredScreenNumber, true);
              }
            "
          >
            <q-icon class="q-mr-sm" name="mmm-fullscreen" size="xs" />
            {{ t('full-screen') }}
          </q-btn>
        </div>
        <div class="col-6">
          <q-btn
            class="full-width full-height"
            color="primary"
            :disable="screenList?.length < 2"
            :outline="
              !(screenList?.length < 2 || timerPreferences.preferWindowed)
            "
            :text-color="
              screenList?.length < 2 || timerPreferences.preferWindowed
                ? ''
                : 'primary'
            "
            unelevated
            @click="
              () => {
                console.log('🔍 [Timer Windowed Button] Clicked');
                timerPreferences.preferWindowed = true;
                console.log(
                  '🔍 [Timer Windowed Button] Calling moveTimerWindow with:',
                  {
                    screen: timerPreferences.preferredScreenNumber,
                    fullscreen: false,
                  },
                );
                moveTimerWindow(timerPreferences.preferredScreenNumber, false);
              }
            "
          >
            <q-icon class="q-mr-sm" name="mmm-window" size="xs" />
            {{ t('windowed') }}
          </q-btn>
        </div>
      </div>

      <template
        v-if="!timerPreferences.preferWindowed && screenList?.length > 2"
      >
        <q-separator class="bg-accent-200 q-mb-md" />
        <div class="card-section-title row q-px-md">
          {{ t('display') }}
        </div>
        <div class="q-px-md q-pb-sm">
          <div
            class="display-map"
            :style="{
              position: 'relative',
              width: '100%',
              aspectRatio: virtualBounds.width + ' / ' + virtualBounds.height,
              overflow: 'hidden',
              '--screen-gap': '1%',
            }"
          >
            <template v-for="(screen, index) in screenList" :key="screen.id">
              <q-btn
                class="screen-rect column items-center justify-center"
                :class="{
                  'border-dashed': screen.mainWindow,
                }"
                :color="!screen.mainWindow ? 'primary' : 'secondary'"
                :disable="screen.mainWindow"
                :outline="!isTimerScreenSelected(index, screen)"
                :style="{
                  position: 'absolute',
                  left:
                    'calc(' +
                    (screenRects[index]?.left ?? 0) +
                    '% + var(--screen-gap))',
                  top:
                    'calc(' +
                    (screenRects[index]?.top ?? 0) +
                    '% + var(--screen-gap))',
                  width:
                    'calc(' +
                    (screenRects[index]?.width ?? 0) +
                    '% - (var(--screen-gap) * 2))',
                  height:
                    'calc(' +
                    (screenRects[index]?.height ?? 0) +
                    '% - (var(--screen-gap) * 2))',
                }"
              >
                <q-tooltip v-if="screen.mainWindow">
                  {{ t('main-window-is-on-this-screen') }}
                </q-tooltip>
                <q-icon
                  v-if="!screen.mainWindow"
                  class="q-mr-sm"
                  name="mmm-timer"
                  size="xs"
                />
                {{ !screen.mainWindow ? t('display') + ' ' + (index + 1) : '' }}
              </q-btn>
            </template>
          </div>
        </div>
        <q-separator class="bg-accent-200 q-mb-md" />
      </template>
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
            {{
              t(
                screenList?.length < 2 || timerPreferences.preferWindowed
                  ? 'windowed'
                  : 'external-screen',
              )
            }}
          </div>
        </div>
        <div class="col-grow">
          <q-btn
            v-if="timerWindowVisible"
            class="full-width"
            color="primary"
            unelevated
            @click="handleTimerWindowVisibility(false)"
          >
            {{ t('hide-timer-display') }}
          </q-btn>
          <q-btn
            v-else
            class="full-width"
            color="primary"
            unelevated
            @click="handleTimerWindowVisibility(true)"
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
import { useAppSettingsStore } from 'src/stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const timerPopup = useTemplateRef<QMenu>('timerPopup');

const { t } = useI18n();

const screenList = ref<Display[]>([]);

const currentState = useCurrentStateStore();
const { currentSettings, selectedDateObject, timerWindowVisible } =
  storeToRefs(currentState);

const appSettingsStore = useAppSettingsStore();
const { timerPreferences } = storeToRefs(appSettingsStore);

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

const { getAllScreens, moveTimerWindow, toggleTimerWindow } =
  window.electronApi;

// Broadcast channel for timer data
const { post: postTimerData } = useBroadcastChannel<TimerData, TimerData>({
  name: 'timer-display-data',
});

// Listen for timer page ready
const { data: timerPageReady } = useBroadcastChannel<string, string>({
  name: 'timerpageready',
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

// Virtual desktop extents across all displays (in physical pixels as provided by Electron)
const virtualBounds = computed(() => {
  const list = screenList.value;
  if (!list || list.length === 0) {
    return { height: 9, width: 16, x: 0, y: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const d of list) {
    const b = d.bounds;
    if (!b) continue;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return { height, width, x: minX, y: minY };
});

// Percentage-based rectangles for each screen relative to the virtual desktop
const screenRects = computed(() => {
  const vb = virtualBounds.value;
  const list = screenList.value ?? [];
  return list.map((d) => {
    const b = d.bounds;
    const left = ((b.x - vb.x) / vb.width) * 100;
    const top = ((b.y - vb.y) / vb.height) * 100;
    const width = (b.width / vb.width) * 100;
    const height = (b.height / vb.height) * 100;
    return {
      height: Number.isFinite(height) ? height : 0,
      left: Number.isFinite(left) ? left : 0,
      top: Number.isFinite(top) ? top : 0,
      width: Number.isFinite(width) ? width : 0,
    };
  });
});

// Selected when timer window is on this screen and it's not the app's main window
const isTimerScreenSelected = (index: number, screen: Display) => {
  void index; // index kept for potential future preference logic
  return !!screen.timerWindow && !screen.mainWindow;
};

// UI update handler
watch(
  () => [
    timerWindowVisible.value,
    timerRunning.value,
    timerMode.value,
    timerPreferences.value?.preferWindowed,
  ],
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

// Watch for timer page ready
watch(timerPageReady, (timestamp) => {
  console.log('🔍 [DialogTimerPopup] Timer page ready:', timestamp);
  if (timestamp) {
    handleTimerWindowVisibility(true);
  }
});

const handleTimerWindowVisibility = (visible: boolean) => {
  toggleTimerWindow(visible);
  currentState.setTimerWindowVisible(visible);
  if (visible) {
    // Broadcast initial timer settings
    postTimerData({
      mode: 'countup',
      paused: false,
      running: false,
      time: '',
      timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
      timerTextColor: currentSettings.value?.timerTextColor,
      timerTextSize: currentSettings.value?.timerTextSize,
    });
  }
};

// Initialize timer when window becomes visible
watch(timerWindowVisible, (visible) => {
  if (visible) {
    // Initialize timer with current settings
    updateTimerWindow();
  }
});
</script>

<style scoped>
.blink {
  animation: gentle-blink 2s infinite;
}

.border-dashed::before {
  border-style: dashed;
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
