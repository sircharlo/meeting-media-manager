<template>
  <q-card
    bordered
    class="meeting-quick-actions-panel meeting-quick-actions-panel--before"
    flat
  >
    <q-card-section class="meeting-quick-actions-panel__header">
      <div>
        <div class="meeting-quick-actions-panel__eyebrow">
          {{ t('quick-actions-before-eyebrow') }}
        </div>
        <div class="meeting-quick-actions-panel__title">
          {{ t('quick-actions-before-title') }}
        </div>
      </div>
      <q-icon name="mmm-timer" size="28px" />
    </q-card-section>

    <q-card-section class="meeting-quick-actions-panel__countdown">
      <div class="text-caption">
        {{ t('quick-actions-meeting-starts-at', { time: startTime }) }}
      </div>
      <div class="meeting-quick-actions-panel__time">{{ countdown }}</div>
    </q-card-section>

    <q-card-section class="meeting-quick-actions-panel__actions">
      <q-btn
        v-if="
          currentSettings?.enableMusicButton &&
          (musicPlaying || !isInFinalProtectedWindow)
        "
        class="big-button quick-actions-music-button"
        color="primary"
        :disable="
          musicPlaying
            ? musicState === 'music.stopping'
            : mediaIsActivelyPlaying || musicState === 'music.starting'
        "
        unelevated
        @click="onMusicClick"
      >
        <q-spinner v-if="musicIsBusy" size="24px" />
        <q-icon
          v-else
          :name="musicPlaying ? 'mmm-stop' : 'mmm-music-note'"
          size="24px"
        />
        <div class="quick-actions-music-button__label">
          <span>{{ musicButtonLabel }}</span>
          <span
            v-if="musicPlaying && !musicIsBusy"
            class="quick-actions-music-button__sublabel"
          >
            {{
              t('quick-actions-music-stops-in', { time: timeUntilMusicStops })
            }}
          </span>
        </div>
      </q-btn>
      <q-btn
        v-if="recordingEnabled"
        class="big-button"
        color="negative"
        :disable="isRecording ? !canStopRecording : !canStartRecording"
        :icon="isRecording ? 'mmm-stop' : 'mmm-record'"
        :label="
          isRecording
            ? t('quick-actions-stop-recording')
            : t('quick-actions-start-recording')
        "
        unelevated
        @click="toggleRecording"
      />
    </q-card-section>

    <q-card-section>
      <MeetingQuickActionsChecklist mode="before" />
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat :label="t('quick-actions-dismiss')" @click="dismissBefore" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import MeetingQuickActionsChecklist from 'components/media/MeetingQuickActionsChecklist.vue';
import { storeToRefs } from 'pinia';
import { getTodaysMeetingStartDateTime } from 'src/helpers/date';
import { formatTime } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { useMusicStore } from 'stores/music';
import { useRecordingStore } from 'stores/recording-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ now: number }>();

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings, mediaIsActivelyPlaying } = storeToRefs(currentState);

const quickActions = useMeetingQuickActionsStore();
const { dismissBefore } = quickActions;

const music = useMusicStore();
const { musicPlaying, musicState, timeUntilMusicStops } = storeToRefs(music);
const { formatClockTime, playMusic, stopMusic } = music;

const recording = useRecordingStore();
const { canStartRecording, canStopRecording, isRecording } =
  storeToRefs(recording);
const { toggleRecording } = recording;

const meetingStart = computed(() =>
  getTodaysMeetingStartDateTime(new Date(props.now)),
);
const startTime = computed(() =>
  meetingStart.value ? formatClockTime(meetingStart.value) : '',
);
const countdown = computed(() =>
  meetingStart.value
    ? formatTime(Math.max(0, (meetingStart.value.getTime() - props.now) / 1000))
    : '00:00',
);
// Same final-approach window the music store auto-stops in (see
// shouldAutoStop in stores/music.ts) - starting music here would just get
// immediately auto-stopped again, so hide the Start action entirely rather
// than offer a button that can't meaningfully do anything. Only hides the
// Start path: if music is already playing, the Stop button must stay
// available regardless of this window.
const isInFinalProtectedWindow = computed(() => {
  if (!meetingStart.value) return false;
  const secondsUntilStart = (meetingStart.value.getTime() - props.now) / 1000;
  const bufferSeconds = currentSettings.value?.meetingStopBufferSeconds ?? 60;
  return secondsUntilStart > 0 && secondsUntilStart <= bufferSeconds;
});
const recordingEnabled = computed(
  () =>
    !!currentSettings.value?.recordingEnable ||
    !!(
      currentSettings.value?.obsEnable &&
      currentSettings.value?.obsEnableRecordingControls
    ),
);
const musicIsBusy = computed(
  () =>
    musicState.value === 'music.starting' ||
    musicState.value === 'music.stopping',
);
const musicButtonLabel = computed(() => {
  if (musicState.value === 'music.starting') return t('music.starting');
  if (musicState.value === 'music.stopping') return t('music.stopping');
  return musicPlaying.value
    ? t('quick-actions-stop-music')
    : t('quick-actions-play-music');
});

const onMusicClick = () => {
  if (musicPlaying.value) {
    stopMusic(true);
  } else {
    playMusic('quick-action');
  }
};
</script>

<style scoped>
.meeting-quick-actions-panel {
  margin-bottom: 1rem;
  overflow: hidden;
}

.meeting-quick-actions-panel--before {
  border-color: color-mix(in srgb, var(--q-primary) 35%, transparent);
}

.meeting-quick-actions-panel__header {
  align-items: center;
  background: color-mix(in srgb, var(--q-primary) 9%, transparent);
  display: flex;
  justify-content: space-between;
}

.meeting-quick-actions-panel__eyebrow {
  color: var(--q-primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.meeting-quick-actions-panel__title {
  font-size: 1.25rem;
  font-weight: 750;
  margin-top: 0.2rem;
}

.meeting-quick-actions-panel__countdown {
  color: var(--q-primary);
  text-align: center;
}

.meeting-quick-actions-panel__time {
  font-size: clamp(2rem, 7vw, 3.5rem);
  font-variant-numeric: tabular-nums;
  font-weight: 750;
  line-height: 1.1;
  margin-top: 0.25rem;
}

.meeting-quick-actions-panel__actions {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.quick-actions-music-button :deep(.q-btn__content) {
  gap: 0.5rem;
}

.quick-actions-music-button__label {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  text-align: left;
}

.quick-actions-music-button__sublabel {
  font-size: 0.7rem;
  font-weight: 400;
  opacity: 0.85;
}
</style>
