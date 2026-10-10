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
          'timer-display--labelled': !!displayLabel,
        }"
      >
        <!-- What the number means: the pre-meeting countdown must never be
             read as the time of day ("4:59" five minutes before a 5 PM
             meeting), and the part being timed is useful to see. -->
        <div
          v-if="displayLabel"
          class="timer-display__label"
          :style="labelStyles"
        >
          <q-icon
            v-if="currentMode === 'countdown'"
            class="timer-display__label-icon"
            name="mmm-time"
          />
          {{ displayLabel }}
        </div>

        <div class="timer-display__main">
          <div
            v-if="showAnalogClock"
            class="analog-clock"
            :style="analogClockStyles"
          >
            <svg
              v-if="clockArc"
              aria-hidden="true"
              class="analog-clock__arc"
              focusable="false"
              viewBox="0 0 100 100"
            >
              <path
                class="analog-clock__arc-remaining"
                :d="clockArc.remainingPath"
                :fill="clockArc.remainingColor"
              />
              <path
                v-if="clockArc.overtimePath"
                class="analog-clock__arc-overtime"
                :d="clockArc.overtimePath"
                :fill="clockArc.overtimeColor"
              />
            </svg>
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
            <div
              v-if="clockArc"
              class="analog-clock__inner-time"
              :style="{ color: clockArc.textColor }"
            >
              {{ displayTime }}
            </div>
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
      </div>
    </transition>

    <!-- Hand alert: someone on Zoom raised their hand (or the operator
         switched it on), shown big enough to catch the chairman's eye. -->
    <transition name="q-transition--scale">
      <div
        v-if="timerData?.handAlertActive"
        aria-live="polite"
        class="hand-alert"
        role="status"
      >
        <div class="hand-alert__hand">
          <svg
            aria-hidden="true"
            class="hand-alert__icon"
            focusable="false"
            viewBox="0 0 64 64"
          >
            <path
              d="M22 58c-5 0-9-3-11-7L4 36c-1-3 1-6 4-6s4 2 5 4l4 8V12c0-2 2-4 4-4s4 2 4 4v18h2V7c0-2 2-4 4-4s4 2 4 4v23h2V10c0-2 2-4 4-4s4 2 4 4v20h2V17c0-2 2-4 4-4s4 2 4 4v27c0 8-6 14-14 14H22z"
            />
          </svg>
        </div>
        <div v-if="timerData?.handAlertNames?.length" class="hand-alert__names">
          {{ timerData.handAlertNames.join(' · ') }}
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
import { formatAheadBehind } from 'src/composables/useTimerAheadBehindText';
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

// Listen for timer updates from the dialog
const { data: timerData } = useBroadcastChannel<TimerData, TimerData>({
  name: 'timer-display-data',
});

const aheadBehindText = computed(() =>
  formatAheadBehind(
    timerData.value?.aheadBehindMinutes,
    t as (key: string, named?: Record<string, unknown>) => string,
  ),
);

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

  // Counting up: the arc on the clock face still shows the part's planned
  // time, the other analog modes have nothing to count down from.
  return timerData.value?.timerCountdownDisplay === 'analog-clock'
    ? 'analog-clock'
    : 'digital';
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

const isClockArcDisplay = computed(
  () =>
    currentMode.value !== 'clock' &&
    currentDisplayFormat.value === 'analog-clock',
);

const showAnalogClock = computed(
  () =>
    (currentMode.value === 'clock' &&
      ['analog', 'analog-digital'].includes(currentDisplayFormat.value)) ||
    isClockArcDisplay.value,
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

const displayLabel = computed(() => {
  if (currentMode.value === 'countdown') return t('meeting-starts-in');
  if (currentMode.value === 'timer') {
    return timerData.value?.timerCurrentPartLabel ?? '';
  }
  return '';
});

// Check if timer is overtime
const isOvertime = computed(() => {
  return timerData.value?.running && displayTime.value.startsWith('-');
});

const textColor = computed(() => {
  const data = timerData.value;
  const useOvertime = isOvertime.value && data?.timerOvertimeIndicator;
  return useOvertime
    ? data?.timerOvertimeTextColor || '#ffffff'
    : data?.timerTextColor || '#ffffff';
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
    color: textColor.value,
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

const labelStyles = computed<CSSProperties>(() => ({
  color: textColor.value,
  fontSize: `clamp(1rem, calc(${timerTextSize.value} / 4), 8vh)`,
  opacity: 0.85,
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

const GREEN = { b: 89, g: 199, r: 53 };
const ORANGE = { b: 10, g: 149, r: 255 };

const countdownRingColor = computed(() => {
  if (isOvertime.value) {
    return timerData.value?.timerOvertimeTextColor || '#ff0000';
  }

  if (!timerData.value?.timerCountdownWarningIndicator) {
    return `rgb(${GREEN.r}, ${GREEN.g}, ${GREEN.b})`;
  }

  const warningProgress = Math.max(
    0,
    Math.min(1, (60 - countdownRemainingSeconds.value) / 60),
  );

  const channel = (start: number, end: number) =>
    Math.round(start + (end - start) * warningProgress);

  return `rgb(${channel(GREEN.r, ORANGE.r)}, ${channel(GREEN.g, ORANGE.g)}, ${channel(GREEN.b, ORANGE.b)})`;
});

const analogCountdownStyles = computed<CSSProperties>(() => {
  const isFull = countdownProgress.value >= 1;
  const progressPercent = countdownProgress.value * 100;
  const countdownTextColor =
    isOvertime.value && timerData.value?.timerOvertimeIndicator
      ? timerData.value?.timerOvertimeTextColor || '#ff0000'
      : timerData.value?.timerTextColor || '#ffffff';

  return {
    '--countdown-progress': isFull ? '100 0' : `${progressPercent} 100`,
    '--countdown-progress-color': countdownRingColor.value,
    '--countdown-progress-linecap': isFull ? 'butt' : 'round',
    '--countdown-text-color': countdownTextColor,
  };
});

// --- The arc on the clock face ---------------------------------------------------
//
// Like a classroom timer: the minutes the part has left are a wedge on the
// clock face, from the minute hand to the planned end, so a glance at the
// clock shows both the time and what's left. Overtime shows as a second
// wedge, from the planned end to the minute hand.

const ARC_RADIUS = 46;
const CENTER = 50;

const polar = (angleDegrees: number) => {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: CENTER + ARC_RADIUS * Math.cos(radians),
    y: CENTER + ARC_RADIUS * Math.sin(radians),
  };
};

/** An SVG wedge from one clock angle to another, clockwise (degrees). */
const wedgePath = (fromDegrees: number, toDegrees: number) => {
  let sweep = toDegrees - fromDegrees;
  if (sweep <= 0) return '';
  // A full turn can't be drawn as one arc: stop a hair short.
  sweep = Math.min(sweep, 359.99);
  const start = polar(fromDegrees);
  const end = polar(fromDegrees + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

const clockArc = computed(() => {
  if (!isClockArcDisplay.value) return null;

  const now = currentDate.value.getTime();
  let targetSeconds: number;
  let endTime: number;
  if (currentMode.value === 'timer') {
    const data = timerData.value;
    const elapsed = data?.timerElapsedSeconds ?? 0;
    targetSeconds =
      data?.timerCountdownTargetSeconds || data?.timerPartTargetSeconds || 0;
    endTime = now - elapsed * 1000 + targetSeconds * 1000;
  } else {
    targetSeconds = meetingCountdownTargetSeconds.value ?? 0;
    endTime = now + (meetingCountdownRemainingSeconds.value ?? 0) * 1000;
  }
  if (targetSeconds <= 0) return null;

  const nowAngle = clockHands.value.minute;
  const remainingMs = endTime - now;
  // One hour fills the face; longer parts show their final hour.
  const remainingDegrees =
    Math.min(60 * 60 * 1000, Math.max(0, remainingMs)) / 10000;
  const overtimeDegrees =
    Math.min(60 * 60 * 1000, Math.max(0, -remainingMs)) / 10000;

  const remainingPath = wedgePath(nowAngle, nowAngle + remainingDegrees);
  const overtimePath = wedgePath(nowAngle - overtimeDegrees, nowAngle);

  const overtimeColor = timerData.value?.timerOvertimeTextColor || '#ff453a';
  return {
    overtimeColor,
    overtimePath,
    remainingColor: countdownRingColor.value,
    remainingPath,
    textColor: isOvertime.value ? overtimeColor : textColor.value,
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

// Format the time of day in the main window's language (24h by default)
const formatTime = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    hour12: timerData.value?.timerHourFormat === '12h',
    minute: '2-digit',
    second: '2-digit',
  };
  try {
    return date.toLocaleTimeString(timerData.value?.locale || [], options);
  } catch {
    return date.toLocaleTimeString([], options);
  }
};

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
    // The clock face with the arc keeps its hands moving; the other
    // displays stop the local clock to prevent flashing.
    if (isClockArcDisplay.value) {
      currentDate.value = new Date();
      resumeClock();
    } else {
      pauseClock();
    }
  } else {
    paused.value = false;
    updateTime();
    resumeClock(); // Ensure local clock runs when no timer is active
  }
});

// Part timer data arrives every half second; the clock hands only need the
// local tick when the arc display is up (no countdown string to overwrite).
watch(isClockArcDisplay, (showing) => {
  if (showing && timerData.value?.running) {
    resumeClock();
  }
});
</script>

<style scoped>
.blink {
  animation: gentle-blink 2s infinite;
}

.hand-alert {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 1vh;
  inset: 0;
  justify-content: center;
  pointer-events: none;
  position: absolute;
  z-index: 20;
}

.hand-alert__hand {
  animation: hand-alert-pulse 1.2s ease-in-out infinite;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  display: flex;
  padding: 4vh;
}

.hand-alert__icon {
  fill: #ffd60a;
  filter: drop-shadow(0 0 1.5vh rgba(0, 0, 0, 0.6));
  height: min(50vh, 50vw);
  width: min(50vh, 50vw);
}

.hand-alert__names {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 999px;
  color: #ffd60a;
  font-size: clamp(1rem, 4vh, 3rem);
  font-weight: bold;
  max-width: 90vw;
  overflow: hidden;
  padding: 0.3em 1em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes hand-alert-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(0.94);
  }
}

.ahead-behind-overlay {
  z-index: 10;
}

.timer-display {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 2vh, 24px);
  justify-content: center;
}

.timer-display__main {
  align-items: center;
  display: flex;
  gap: clamp(24px, 5vw, 80px);
  justify-content: center;
}

.timer-display--combined .timer-display__main {
  flex-wrap: wrap;
}

.timer-display__label {
  align-items: center;
  display: flex;
  font-weight: 600;
  gap: 0.4em;
  letter-spacing: 0.04em;
  max-width: 94vw;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.timer-display__label-icon {
  font-size: 1.1em;
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

.timer-display--labelled .analog-clock,
.timer-display--labelled .analog-countdown {
  height: min(56vh, 62vw);
}

.analog-clock__arc {
  height: 100%;
  inset: 0;
  pointer-events: none;
  position: absolute;
  width: 100%;
}

.analog-clock__arc-remaining {
  opacity: 0.55;
  transition: fill 700ms ease;
}

.analog-clock__arc-overtime {
  opacity: 0.6;
}

.analog-clock__center {
  background: var(--clock-color);
  border-radius: 50%;
  height: 4%;
  left: 48%;
  position: absolute;
  top: 48%;
  width: 4%;
  z-index: 2;
}

.analog-clock__hand {
  background: var(--clock-color);
  border-radius: 999px;
  bottom: 50%;
  left: 49%;
  position: absolute;
  transform-origin: 50% 100%;
  width: 2%;
  z-index: 2;
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
  z-index: 1;
}

.analog-clock__inner-time {
  background: rgba(0, 0, 0, 0.55);
  border-radius: 999px;
  bottom: 14%;
  font-size: clamp(1rem, 3.5vw, 3.5rem);
  font-variant-numeric: tabular-nums;
  font-weight: bold;
  left: 50%;
  line-height: 1;
  padding: 0.25em 0.6em;
  position: absolute;
  transform: translateX(-50%);
  transition: color 700ms ease;
  z-index: 3;
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
