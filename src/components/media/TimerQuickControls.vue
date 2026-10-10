<template>
  <div
    class="timer-quick-controls"
    :class="{ 'timer-quick-controls--dense': dense }"
  >
    <div class="timer-quick-controls__status">
      <div class="timer-quick-controls__part ellipsis">
        {{ timerRunning ? currentPartLabel : t('no-part-being-timed') }}
      </div>
      <div
        class="timer-quick-controls__time"
        :class="{
          blink: timerPaused,
          'text-negative': timerRunning && formattedTime.startsWith('-'),
        }"
      >
        {{ timerRunning ? formattedTime : '--:--' }}
      </div>
      <div v-if="timerRunning" class="text-caption text-dark-grey">
        {{ timerMode === 'countup' ? t('elapsed') : t('remaining') }}
      </div>
    </div>
    <div
      class="timer-quick-controls__buttons row no-wrap q-gutter-xs justify-center"
    >
      <q-btn
        v-if="!timerRunning"
        :aria-label="t('start')"
        color="positive"
        :disable="!canStart"
        icon="mmm-play"
        :label="dense ? undefined : t('start')"
        no-caps
        :round="dense"
        unelevated
        @click="startCurrentPart"
      >
        <q-tooltip v-if="dense" :delay="500">{{ t('start') }}</q-tooltip>
      </q-btn>
      <template v-else>
        <q-btn
          :aria-label="timerPaused ? t('resume') : t('pause')"
          :color="timerPaused ? 'positive' : 'warning'"
          :icon="timerPaused ? 'mmm-play' : 'mmm-pause'"
          :label="dense ? undefined : timerPaused ? t('resume') : t('pause')"
          no-caps
          :round="dense"
          unelevated
          @click="togglePause"
        >
          <q-tooltip v-if="dense" :delay="500">
            {{ timerPaused ? t('resume') : t('pause') }}
          </q-tooltip>
        </q-btn>
        <q-btn
          :aria-label="t('stop')"
          color="negative"
          icon="mmm-stop"
          :label="dense ? undefined : t('stop')"
          no-caps
          :round="dense"
          unelevated
          @click="stopTimer"
        >
          <q-tooltip v-if="dense" :delay="500">{{ t('stop') }}</q-tooltip>
        </q-btn>
      </template>
      <q-btn
        :aria-label="t('next-part')"
        class="btn-tonal"
        color="primary"
        :disable="!nextPart"
        flat
        icon="mmm-right"
        :label="dense ? undefined : t('next-part')"
        no-caps
        :round="dense"
        @click="startNextPart"
      >
        <q-tooltip :delay="500">
          {{
            nextPart ? `${t('next-part')}: ${nextPart.label}` : t('next-part')
          }}
        </q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import useTimer from 'src/composables/useTimer';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{ dense?: boolean }>();

const { t } = useI18n();

const {
  currentPart,
  currentPartLabel,
  formattedTime,
  nextPart,
  partTimings,
  selectPart,
  startNextPart,
  stopTimer,
  timerMode,
  timerPaused,
  timerRunning,
  togglePause,
} = useTimer();

// A part that was already timed needs a reset first (see the parts list):
// "Start" then moves on to the next untimed part instead.
const canStart = computed(
  () => !partTimings.value[currentPart.value]?.startTime || !!nextPart.value,
);

const startCurrentPart = () => {
  if (!partTimings.value[currentPart.value]?.startTime) {
    selectPart(currentPart.value);
    return;
  }
  startNextPart();
};
</script>

<style scoped>
.timer-quick-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
}

.timer-quick-controls--dense {
  align-items: center;
  flex-direction: row;
  gap: 12px;
}

.timer-quick-controls__status {
  min-width: 0;
  text-align: center;
}

.timer-quick-controls--dense .timer-quick-controls__status {
  flex: 1 1 auto;
  text-align: start;
}

.timer-quick-controls__part {
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.85;
}

.timer-quick-controls__time {
  font-size: 1.6rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1.1;
  min-width: 6ch;
  white-space: nowrap;
}

.timer-quick-controls--dense .timer-quick-controls__time {
  font-size: 1.25rem;
}

.timer-quick-controls__buttons {
  flex: 0 0 auto;
}

.blink {
  animation: timer-quick-blink 2s infinite;
}

@keyframes timer-quick-blink {
  0%,
  60% {
    opacity: 1;
  }
  61%,
  100% {
    opacity: 0.6;
  }
}
</style>
