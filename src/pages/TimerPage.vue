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
  mode: 'countdown' | 'countup';
  paused: boolean;
  running: boolean;
  time: string;
  timerBackgroundColor?: string;
  timerTextColor?: string;
  timerTextSize?: string;
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

// Update current time every second
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
  });
  if (!timerData.value?.time) {
    displayTime.value = currentTime.value;
  }
};

const { pause: pauseClock, resume: resumeClock } = useIntervalFn(
  updateTime,
  1000,
);

const { post } = useBroadcastChannel<string, string>({
  name: 'timerpageready',
});

// Post timerpageready when component is mounted
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
