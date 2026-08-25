<template>
  <q-card
    bordered
    class="meeting-quick-actions-panel meeting-quick-actions-panel--after"
    flat
  >
    <q-card-section class="meeting-quick-actions-panel__header">
      <div>
        <div class="meeting-quick-actions-panel__eyebrow">
          {{ t('quick-actions-after-eyebrow') }}
        </div>
        <div class="meeting-quick-actions-panel__title">
          {{ t('quick-actions-after-title') }}
        </div>
      </div>
      <q-icon name="mmm-check" size="28px" />
    </q-card-section>

    <q-card-section class="meeting-quick-actions-panel__countdown">
      <div class="text-caption">{{ statusText }}</div>
      <div class="meeting-quick-actions-panel__time">{{ countdown }}</div>
    </q-card-section>

    <q-card-section
      v-if="currentSettings?.enableMusicButton"
      class="meeting-quick-actions-panel__actions meeting-quick-actions-panel__actions--music"
    >
      <div class="quick-actions-after-prayer-title">
        {{ t('quick-actions-after-concluding-prayer') }}
      </div>
      <q-btn
        class="big-button full-width quick-actions-music-button"
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
        <span>{{ musicButtonLabel }}</span>
      </q-btn>
    </q-card-section>
    <q-card-section
      v-if="recordingEnabled && isRecording"
      class="meeting-quick-actions-panel__actions"
    >
      <q-btn
        class="big-button"
        color="negative"
        :disable="!canStopRecording"
        icon="mmm-stop"
        :label="t('quick-actions-stop-recording')"
        unelevated
        @click="stopRecording"
      />
    </q-card-section>

    <q-card-section>
      <MeetingQuickActionsChecklist mode="after" />
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat :label="t('quick-actions-dismiss')" @click="dismissAfter" />
    </q-card-actions>

    <ConfirmDialog
      v-model="startMusicConfirmPending"
      :confirm-label="t('quick-actions-play-music')"
      dialog-id="quick-actions-start-music-confirm"
      icon="mmm-music-note"
      icon-color="primary"
      :message="t('quick-actions-start-music-confirm-message')"
      persistent
      :title="t('quick-actions-start-music-confirm-title')"
      @cancel="startMusicConfirmPending = false"
      @confirm="confirmStartMusic"
    />
  </q-card>
</template>

<script setup lang="ts">
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import MeetingQuickActionsChecklist from 'components/media/MeetingQuickActionsChecklist.vue';
import { storeToRefs } from 'pinia';
import {
  getTodaysScheduledMeetingEndDateTime,
  predictLastSongEndDateTime,
} from 'src/helpers/meeting-quick-actions';
import { formatTime } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { useMusicStore } from 'stores/music';
import { useRecordingStore } from 'stores/recording-state';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ now: number }>();

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings, mediaPlaying, selectedDateObject } =
  storeToRefs(currentState);

const quickActions = useMeetingQuickActionsStore();
const { lastSongEndedAt } = storeToRefs(quickActions);
const { dismissAfter } = quickActions;

const music = useMusicStore();
const { mediaIsActivelyPlaying, musicPlaying, musicState } = storeToRefs(music);
const { formatClockTime, playMusic, stopMusic } = music;

const recording = useRecordingStore();
const { canStopRecording, isRecording } = storeToRefs(recording);
const { stopRecording } = recording;

const scheduledEnd = computed(() =>
  getTodaysScheduledMeetingEndDateTime(new Date(props.now)),
);
const predictedEnd = computed(() => {
  // `now` (props.now) is the only tracked dependency here - the prediction
  // itself reads Date.now() internally, which Vue can't see, so this read
  // is what forces the countdown to actually re-tick every second. Looks
  // like a no-op guard; isn't one - don't "simplify" it away.
  const currentNow = props.now;
  const prediction = predictLastSongEndDateTime(
    mediaPlaying.value,
    selectedDateObject.value,
    currentNow,
  );
  return currentNow >= 0 ? prediction : null;
});
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
// Starting background music after the meeting is only ever intentional when
// the last song has actually finished and the meeting isn't still scheduled
// to be going - otherwise it's likely a mis-click, so confirm first rather
// than starting playback over a meeting that may still be in progress.
const shouldConfirmStartMusic = computed(() => {
  if (lastSongEndedAt.value === null) return true;
  const oneMinuteAfterSongEnd = lastSongEndedAt.value + 60 * 1000;
  return props.now < oneMinuteAfterSongEnd;
});
const startMusicConfirmPending = ref(false);
const confirmStartMusic = () => {
  startMusicConfirmPending.value = false;
  playMusic('quick-action');
};
const onMusicClick = () => {
  if (musicPlaying.value) {
    stopMusic(true);
    return;
  }
  if (shouldConfirmStartMusic.value) {
    startMusicConfirmPending.value = true;
    return;
  }
  playMusic('quick-action');
};
const phase = computed<'ended' | 'last-song' | 'scheduled'>(() => {
  if (lastSongEndedAt.value !== null) return 'ended';
  if (predictedEnd.value) return 'last-song';
  return 'scheduled';
});
const targetEnd = computed(() =>
  phase.value === 'last-song' ? predictedEnd.value : scheduledEnd.value,
);
const statusText = computed(() => {
  if (phase.value === 'ended' && lastSongEndedAt.value !== null) {
    return t('quick-actions-song-ended-at');
  }
  if (phase.value === 'last-song' && predictedEnd.value) {
    return t('quick-actions-last-song-ends-at', {
      time: formatClockTime(predictedEnd.value),
    });
  }
  return t('quick-actions-meeting-ends-at', {
    time: targetEnd.value ? formatClockTime(targetEnd.value) : '',
  });
});
const countdown = computed(() => {
  if (phase.value === 'ended' && lastSongEndedAt.value !== null) {
    return formatClockTime(new Date(lastSongEndedAt.value));
  }
  if (!targetEnd.value) return '00:00';
  return formatTime(
    Math.max(0, (targetEnd.value.getTime() - props.now) / 1000),
  );
});
const recordingEnabled = computed(
  () =>
    !!currentSettings.value?.recordingEnable ||
    !!(
      currentSettings.value?.obsEnable &&
      currentSettings.value?.obsEnableRecordingControls
    ),
);
</script>

<style scoped>
.meeting-quick-actions-panel {
  margin-bottom: 1rem;
  overflow: hidden;
}

.meeting-quick-actions-panel--after {
  border-color: color-mix(in srgb, var(--q-positive) 38%, transparent);
}

.meeting-quick-actions-panel__header {
  align-items: center;
  background: color-mix(in srgb, var(--q-positive) 9%, transparent);
  display: flex;
  justify-content: space-between;
}

.meeting-quick-actions-panel__eyebrow {
  color: var(--q-positive);
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
  color: var(--q-positive);
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

.meeting-quick-actions-panel__actions--music {
  grid-template-columns: 1fr;
}

.quick-actions-after-prayer-title {
  color: var(--q-primary);
  font-size: 0.9rem;
  font-weight: 700;
  padding-bottom: 0.25rem;
}

.quick-actions-music-button :deep(.q-btn__content) {
  gap: 0.5rem;
}
</style>
