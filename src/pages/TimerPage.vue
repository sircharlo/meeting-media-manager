<template>
  <q-page-container
    class="vertical-middle overflow-hidden"
    padding
    :style="containerStyles"
  >
    <transition mode="out-in" name="scale">
      <div :key="currentMode" :class="{ blink: paused }" :style="textStyles">
        {{ displayTime }}
      </div>
    </transition>
  </q-page-container>
</template>

<script setup lang="ts">
import { useBroadcastChannel, useIntervalFn } from '@vueuse/core';
import { computed, onMounted, ref, watch } from 'vue';

// Simple timer page for now

// Timer data from main dialog
export interface TimerData {
  enableMeetingCountdown?: boolean;
  meetingCountdownMinutes?: number;
  meetingStartTime?: string;
  mode: 'countdown' | 'countup';
  mwDay?: null | string;
  mwStartTime?: null | string;
  paused: boolean;
  running: boolean;
  time: string;
  timerBackgroundColor?: string;
  timerTextColor?: string;
  timerTextSize?: string;
  weDay?: null | string;
  weStartTime?: null | string;
}

const displayTime = ref<string>('');
const paused = ref<boolean>(false);
const currentTime = ref<string>('');

// Listen for timer updates from the dialog
const { data: timerData } = useBroadcastChannel<TimerData, TimerData>({
  name: 'timer-display-data',
});

// Computed to determine current display mode
const currentMode = computed(() => (timerData.value?.time ? 'timer' : 'clock'));

// Computed styles
const containerStyles = computed(() => ({
  alignContent: 'center',
  alignItems: 'center',
  backgroundColor: timerData.value?.timerBackgroundColor || '#000000',
  color: timerData.value?.timerTextColor || '#ffffff',
  display: 'flex',
  height: '100vh',
  justifyContent: 'center',
  WebkitAppRegion: 'drag',
}));

const textStyles = computed(() => ({
  fontSize: timerData.value?.timerTextSize || '10vw',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 'bold',
}));

// Format time (HH:mm:ss, 24h)
const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
  });

// Update current time every second
const updateTime = () => {
  const now = new Date();
  currentTime.value = formatTime(now);

  const countdown = getMeetingCountdown(now);
  displayTime.value = countdown ?? currentTime.value;
};

// Return countdown string or null if not active
const getMeetingCountdown = (now: Date): null | string => {
  const data = timerData.value;
  if (!data?.enableMeetingCountdown || !data.meetingCountdownMinutes)
    return null;

  const today = normalizeDay(now.getDay());
  const meetingInfo = getTodayMeetingInfo(today, data);
  if (!meetingInfo) return null;

  const { countdownMinutes, startTime } = meetingInfo;

  if (!countdownMinutes || !startTime) return null;

  const meetingTime = parseTime(startTime, now);
  const minutesUntil = (meetingTime.getTime() - now.getTime()) / 60000;

  if (minutesUntil <= 0 || minutesUntil > countdownMinutes) return null;

  return formatCountdown(meetingTime, now);
};

// Convert Sunday-based (0–6) day to Monday-based (0–6)
const normalizeDay = (day: number) => (day === 0 ? 6 : day - 1);

// Determine which meeting applies today
const getTodayMeetingInfo = (today: number, data: TimerData) => {
  const { meetingCountdownMinutes, mwDay, mwStartTime, weDay, weStartTime } =
    data;
  if (parseInt(mwDay ?? '-1') === today && mwStartTime)
    return {
      countdownMinutes: meetingCountdownMinutes,
      startTime: mwStartTime,
    };
  if (parseInt(weDay ?? '-1') === today && weStartTime)
    return {
      countdownMinutes: meetingCountdownMinutes,
      startTime: weStartTime,
    };
  return null;
};

// Parse "HH:mm" into a Date object for today
const parseTime = (timeStr: string, base: Date) => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(base);
  if (!h || !m) return d;
  d.setHours(h, m, 0, 0);
  return d;
};

// Format countdown as MM:SS
const formatCountdown = (meetingTime: Date, now: Date) => {
  const diff = Math.max(0, meetingTime.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
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
  if (newData?.time) {
    displayTime.value = newData.time;
    paused.value = newData.paused;
    if (paused.value) {
      pauseClock();
    } else {
      resumeClock();
    }
  } else {
    displayTime.value = currentTime.value;
    paused.value = false;
    resumeClock(); // Ensure clock runs when no timer data
  }
});
</script>

<style scoped>
.blink {
  animation: gentle-blink 2s infinite;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.5s ease;
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(1.2);
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
