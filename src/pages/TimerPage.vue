<template>
  <q-page-container
    class="vertical-middle overflow-hidden"
    padding
    :style="containerStyles"
  >
    <transition :name="displayTransitionName">
      <div
        :key="displayKey"
        class="timer-display"
        :class="{
          blink: paused || (isOvertime && timerData?.timerOvertimeAnimation),
          'timer-display--combined': isCombinedDisplay,
        }"
      >
        <div
          v-if="showAnalogClock"
          class="analog-clock"
          :style="analogClockStyles"
        >
          <div
            v-for="tick in clockTicks"
            :key="tick"
            class="analog-clock__tick"
            :style="{ transform: `rotate(${tick * 30}deg)` }"
          />
          <div
            class="analog-clock__hand analog-clock__hand--hour"
            :style="{ transform: `rotate(${clockHands.hour}deg)` }"
          />
          <div
            class="analog-clock__hand analog-clock__hand--minute"
            :style="{ transform: `rotate(${clockHands.minute}deg)` }"
          />
          <div
            class="analog-clock__hand analog-clock__hand--second"
            :style="{ transform: `rotate(${clockHands.second}deg)` }"
          />
          <div class="analog-clock__center" />
        </div>

        <div
          v-if="showAnalogCountdown"
          class="analog-countdown"
          :style="analogCountdownStyles"
        >
          <svg
            aria-hidden="true"
            class="analog-countdown__ring"
            focusable="false"
            viewBox="0 0 100 100"
          >
            <circle
              class="analog-countdown__track"
              cx="50"
              cy="50"
              fill="none"
              r="44"
            />
            <circle
              class="analog-countdown__progress"
              cx="50"
              cy="50"
              fill="none"
              pathLength="100"
              r="44"
            />
            <circle class="analog-countdown__dot" cx="94" cy="50" r="6" />
          </svg>
          <div class="analog-countdown__inner">
            {{ displayTime }}
          </div>
        </div>

        <div
          v-if="showDigitalDisplay"
          class="digital-display"
          :style="digitalTextStyles"
        >
          {{ digitalDisplayTime }}
        </div>
      </div>
    </transition>

    <!-- Ahead/Behind overlay -->
    <div
      v-if="aheadBehindText"
      class="ahead-behind-overlay"
      :style="overlayStyles"
    >
      {{ aheadBehindText }}
    </div>
  </q-page-container>
</template>

<script setup lang="ts">
import type { TimerData } from 'src/types';

import { useBroadcastChannel, useIntervalFn } from '@vueuse/core';
import { computed, type CSSProperties, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const displayTime = ref<string>('');
const paused = ref<boolean>(false);
const currentDate = ref(new Date());
const currentTime = ref<string>('');
const meetingCountdownRemainingSeconds = ref<null | number>(null);
const meetingCountdownTargetSeconds = ref<null | number>(null);
const clockTicks = Array.from({ length: 12 }, (_, index) => index);
const aheadBehindText = computed(() => {
  const minutes = timerData.value?.aheadBehindMinutes;
  if (minutes === null || minutes === undefined) return '';

  const humanFriendlyMinutes = Math.round(Math.abs(minutes));
  if (humanFriendlyMinutes < 1) {
    return t('on-time');
  } else {
    const direction =
      minutes > 0
        ? t('minutes-behind', { humanFriendlyMinutes })
        : t('minutes-ahead', { humanFriendlyMinutes });
    return direction;
  }
});

// Listen for timer updates from the dialog
const { data: timerData } = useBroadcastChannel<TimerData, TimerData>({
  name: 'timer-display-data',
});

const currentMode = computed(() => {
  if (timerData.value?.running) return 'timer';
  if (meetingCountdownRemainingSeconds.value !== null) return 'countdown';
  return 'clock';
});

const currentDisplayFormat = computed(() => {
  if (currentMode.value === 'clock') {
    return timerData.value?.timerTimeOfDayDisplay ?? 'digital';
  }

  if (
    timerData.value?.mode === 'countdown' ||
    currentMode.value === 'countdown'
  ) {
    return timerData.value?.timerCountdownDisplay ?? 'digital';
  }

  return 'digital';
});

const displayKey = computed(
  () => `${currentMode.value}-${currentDisplayFormat.value}`,
);

const displayTransitionName = computed(() =>
  currentMode.value === 'clock'
    ? 'q-transition--jump-right'
    : 'q-transition--jump-left',
);

const isCombinedDisplay = computed(
  () => currentDisplayFormat.value === 'analog-digital',
);

const showAnalogClock = computed(
  () =>
    currentMode.value === 'clock' &&
    ['analog', 'analog-digital'].includes(currentDisplayFormat.value),
);

const showAnalogCountdown = computed(
  () =>
    currentMode.value !== 'clock' &&
    ['analog', 'analog-digital'].includes(currentDisplayFormat.value),
);

const showDigitalDisplay = computed(
  () =>
    currentDisplayFormat.value === 'digital' ||
    currentDisplayFormat.value === 'analog-digital',
);

const digitalDisplayTime = computed(() => {
  return currentMode.value === 'clock' ? currentTime.value : displayTime.value;
});

// Check if timer is overtime
const isOvertime = computed(() => {
  return timerData.value?.running && displayTime.value.startsWith('-');
});

// Computed styles
const containerStyles = computed(() => {
  const data = timerData.value;
  const useOvertime = isOvertime.value && data?.timerOvertimeIndicator;

  return {
    alignContent: 'center',
    alignItems: 'center',
    backgroundColor: useOvertime
      ? data?.timerOvertimeBackgroundColor || '#000000'
      : data?.timerBackgroundColor || '#000000',
    color: useOvertime
      ? data?.timerOvertimeTextColor || '#ffffff'
      : data?.timerTextColor || '#ffffff',
    display: 'flex',
    height: '100vh',
    justifyContent: 'center',
    transition: 'background-color 700ms ease, color 700ms ease',
    WebkitAppRegion: 'drag',
  };
});

const timerTextSize = computed(() => timerData.value?.timerTextSize || '10vw');

const fittedDigitalFontSize = computed(() => {
  const characterCount = Math.max(digitalDisplayTime.value.length, 1);
  const characterWidthRatio = 0.62;
  const maxFontSize = `calc(94vw / ${characterCount * characterWidthRatio})`;

  return `min(${timerTextSize.value}, ${maxFontSize})`;
});

const digitalTextStyles = computed(() => ({
  fontSize: isCombinedDisplay.value
    ? `min(${fittedDigitalFontSize.value}, 14vh)`
    : fittedDigitalFontSize.value,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 'bold',
  lineHeight: 1,
  whiteSpace: 'nowrap',
}));

const clockHands = computed(() => {
  const date = currentDate.value;
  const seconds = date.getSeconds();
  const minutes = date.getMinutes() + seconds / 60;
  const hours = (date.getHours() % 12) + minutes / 60;

  return {
    hour: hours * 30,
    minute: minutes * 6,
    second: seconds * 6,
  };
});

const analogClockStyles = computed<CSSProperties>(() => ({
  '--clock-color': timerData.value?.timerTextColor || '#ffffff',
}));

const countdownProgress = computed(() => {
  if (isOvertime.value) return 1;

  const totalSeconds =
    timerData.value?.timerCountdownTargetSeconds ||
    meetingCountdownTargetSeconds.value ||
    0;
  const remainingSeconds =
    currentMode.value === 'timer'
      ? Math.max(0, totalSeconds - (timerData.value?.timerElapsedSeconds ?? 0))
      : (meetingCountdownRemainingSeconds.value ?? 0);

  if (totalSeconds <= 0) return 0;

  return Math.max(0, Math.min(1, remainingSeconds / totalSeconds));
});

const countdownRemainingSeconds = computed(() => {
  const totalSeconds =
    timerData.value?.timerCountdownTargetSeconds ||
    meetingCountdownTargetSeconds.value ||
    0;

  if (currentMode.value === 'timer') {
    return totalSeconds - (timerData.value?.timerElapsedSeconds ?? 0);
  }

  return meetingCountdownRemainingSeconds.value ?? totalSeconds;
});

const countdownRingColor = computed(() => {
  if (isOvertime.value) {
    return timerData.value?.timerOvertimeTextColor || '#ff0000';
  }

  if (!timerData.value?.timerCountdownWarningIndicator) {
    return '#35c759';
  }

  const warningProgress = Math.max(
    0,
    Math.min(1, (60 - countdownRemainingSeconds.value) / 60),
  );

  const startColor = { b: 89, g: 199, r: 53 };
  const endColor = { b: 10, g: 149, r: 255 };
  const channel = (start: number, end: number) =>
    Math.round(start + (end - start) * warningProgress);

  return `rgb(${channel(startColor.r, endColor.r)}, ${channel(startColor.g, endColor.g)}, ${channel(startColor.b, endColor.b)})`;
});

const analogCountdownStyles = computed<CSSProperties>(() => {
  const isFull = countdownProgress.value >= 1;
  const progressPercent = countdownProgress.value * 100;
  const textColor =
    isOvertime.value && timerData.value?.timerOvertimeIndicator
      ? timerData.value?.timerOvertimeTextColor || '#ff0000'
      : timerData.value?.timerTextColor || '#ffffff';

  return {
    '--countdown-progress': isFull ? '100 0' : `${progressPercent} 100`,
    '--countdown-progress-color': countdownRingColor.value,
    '--countdown-progress-linecap': isFull ? 'butt' : 'round',
    '--countdown-text-color': textColor,
  };
});

const overlayStyles = computed<CSSProperties>(() => ({
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  borderRadius: '8px',
  color: timerData.value?.timerTextColor || '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  left: '20px',
  padding: '8px 16px',
  position: 'absolute',
  textAlign: 'left',
  top: '20px',
}));

// Format time (HH:mm:ss, 24h by default)
const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    hour12: timerData.value?.timerHourFormat === '12h',
    minute: '2-digit',
    second: '2-digit',
  });

// Update current time every second
const updateTime = () => {
  const now = new Date();
  currentDate.value = now;
  currentTime.value = formatTime(now);

  const countdown = getMeetingCountdown(now);
  if (countdown) {
    displayTime.value = countdown.display;
    meetingCountdownRemainingSeconds.value = countdown.remainingSeconds;
    meetingCountdownTargetSeconds.value = countdown.targetSeconds;
  } else {
    displayTime.value = currentTime.value;
    meetingCountdownRemainingSeconds.value = null;
    meetingCountdownTargetSeconds.value = null;
  }
};

// Return countdown string or null if not active
const getMeetingCountdown = (
  now: Date,
): null | {
  display: string;
  remainingSeconds: number;
  targetSeconds: number;
} => {
  const data = timerData.value;
  if (!data?.timerEnableMeetingCountdown || !data.timerMeetingCountdownMinutes)
    return null;

  const today = normalizeDay(now.getDay());
  const meetingInfo = getTodayMeetingInfo(today, data);
  if (!meetingInfo) return null;

  const { countdownMinutes, startTime } = meetingInfo;

  if (!countdownMinutes || !startTime) return null;

  const meetingTime = parseTime(startTime, now);
  const minutesUntil = (meetingTime.getTime() - now.getTime()) / 60000;

  if (minutesUntil <= 0 || minutesUntil > countdownMinutes) return null;

  const remainingSeconds = Math.max(
    0,
    Math.floor((meetingTime.getTime() - now.getTime()) / 1000),
  );

  return {
    display: formatCountdown(remainingSeconds),
    remainingSeconds,
    targetSeconds: countdownMinutes * 60,
  };
};

// Convert Sunday-based (0–6) day to Monday-based (0–6)
const normalizeDay = (day: number) => (day === 0 ? 6 : day - 1);

// Determine which meeting applies today
const getTodayMeetingInfo = (today: number, data: TimerData) => {
  const {
    mwDay,
    mwStartTime,
    timerMeetingCountdownMinutes,
    weDay,
    weStartTime,
  } = data;
  if (Number.parseInt(mwDay ?? '-1') === today && mwStartTime)
    return {
      countdownMinutes: timerMeetingCountdownMinutes,
      startTime: mwStartTime,
    };
  if (Number.parseInt(weDay ?? '-1') === today && weStartTime)
    return {
      countdownMinutes: timerMeetingCountdownMinutes,
      startTime: weStartTime,
    };
  return null;
};

// Parse "HH:mm" into a Date object for today
const parseTime = (timeStr: string, base: Date) => {
  const [h = 0, m = 0] = timeStr.split(':').map(Number);
  const d = new Date(base);
  if (Number.isNaN(h) || Number.isNaN(m)) return d;
  d.setHours(h, m, 0, 0);
  return d;
};

// Format countdown as MM:SS
const formatCountdown = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const { pause: pauseClock, resume: resumeClock } = useIntervalFn(
  updateTime,
  500,
);

const { post } = useBroadcastChannel<string, string>({
  name: 'timer-page-ready',
});

// Post timer-page-ready when component is mounted
onMounted(() => {
  post(new Date().toISOString());
});

// Start the clock on load
updateTime();
resumeClock();

// Listen for timer updates from the dialog (moved above)
watch(timerData, (newData) => {
  if (newData?.running) {
    displayTime.value = newData.time;
    paused.value = newData.paused;
    meetingCountdownRemainingSeconds.value = null;
    meetingCountdownTargetSeconds.value = null;
    pauseClock(); // Stop the fallback local clock interval to prevent flashing
  } else {
    paused.value = false;
    updateTime();
    resumeClock(); // Ensure local clock runs when no timer is active
  }
});
</script>

<style scoped>
.blink {
  animation: gentle-blink 2s infinite;
}

.ahead-behind-overlay {
  z-index: 10;
}

.timer-display {
  align-items: center;
  display: flex;
  gap: clamp(24px, 5vw, 80px);
  justify-content: center;
}

.timer-display--combined {
  flex-wrap: wrap;
}

.digital-display {
  max-width: 96vw;
  text-align: center;
}

.analog-clock {
  aspect-ratio: 1;
  border: clamp(6px, 0.8vw, 14px) solid var(--clock-color);
  border-radius: 50%;
  height: min(62vh, 62vw);
  position: relative;
}

.analog-clock__center {
  background: var(--clock-color);
  border-radius: 50%;
  height: 4%;
  left: 48%;
  position: absolute;
  top: 48%;
  width: 4%;
}

.analog-clock__hand {
  background: var(--clock-color);
  border-radius: 999px;
  bottom: 50%;
  left: 49%;
  position: absolute;
  transform-origin: 50% 100%;
  width: 2%;
}

.analog-clock__hand--hour {
  height: 26%;
}

.analog-clock__hand--minute {
  height: 36%;
}

.analog-clock__hand--second {
  background: #ff453a;
  height: 42%;
  width: 1%;
}

.analog-clock__tick {
  background: var(--clock-color);
  height: 8%;
  left: 49%;
  opacity: 0.8;
  position: absolute;
  top: 3%;
  transform-origin: 50% 590%;
  width: 2%;
}

.analog-countdown {
  align-items: center;
  aspect-ratio: 1;
  border-radius: 50%;
  display: flex;
  height: min(62vh, 62vw);
  justify-content: center;
  position: relative;
}

.analog-countdown__ring {
  height: 100%;
  inset: 0;
  pointer-events: none;
  position: absolute;
  transform: rotate(-90deg);
  width: 100%;
}

.analog-countdown__track,
.analog-countdown__progress {
  stroke-width: 12;
}

.analog-countdown__track {
  stroke: rgba(255, 255, 255, 0.16);
}

.analog-countdown__progress {
  stroke: var(--countdown-progress-color);
  stroke-dasharray: var(--countdown-progress);
  stroke-linecap: var(--countdown-progress-linecap);
  transition:
    stroke 700ms ease,
    stroke-dasharray 200ms linear;
}

.analog-countdown__dot {
  fill: var(--countdown-progress-color);
  transition: fill 700ms ease;
}

.analog-countdown__inner {
  align-items: center;
  background: rgba(0, 0, 0, 0.72);
  border-radius: 50%;
  color: var(--countdown-text-color);
  display: flex;
  font-size: clamp(2rem, 8vw, 8rem);
  font-variant-numeric: tabular-nums;
  font-weight: bold;
  height: 76%;
  justify-content: center;
  transition: color 700ms ease;
  width: 76%;
  z-index: 1;
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
