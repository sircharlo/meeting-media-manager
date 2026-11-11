<template>
  <q-card
    bordered
    class="meeting-quick-actions-panel meeting-quick-actions-panel--before"
    :class="{
      'liquid-host': hourglassPercent !== null,
      'meeting-quick-actions-panel--last-minute': isLastMinute,
    }"
    flat
  >
    <!-- An hourglass for the last few minutes: always calm, since the room
         is filling up while it drains. -->
    <LiquidFill
      v-if="hourglassPercent !== null"
      axis="y"
      gentle
      no-bubbles
      :percent="hourglassPercent"
      steady
    />
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
      <template v-if="isMeetingStartTimeInPast">
        <div class="meeting-quick-actions-panel__time">
          {{ t('quick-actions-meeting-started-at', { time: startTime }) }}
        </div>
      </template>
      <template v-else>
        <div class="text-caption">
          {{ t('quick-actions-meeting-starts-at', { time: startTime }) }}
        </div>
        <div class="meeting-quick-actions-panel__time">
          {{ countdown }}
        </div>
      </template>
    </q-card-section>

    <!-- Today's files this computer can't play: time to convert them, or to
         know before pressing play. -->
    <q-card-section
      v-if="unplayableItems.length"
      class="row items-center no-wrap q-py-none"
    >
      <q-icon class="q-mr-sm" color="warning" name="mmm-warning" size="sm" />
      <div class="col">
        {{ t('quick-actions-media-cannot-play', unplayableItems.length) }}
      </div>
      <q-btn
        color="primary"
        flat
        :label="t('convert-media')"
        no-caps
        @click="requestMediaConversion(unplayableItems)"
      />
    </q-card-section>

    <q-card-section class="meeting-quick-actions-panel__actions">
      <q-btn
        v-if="
          currentSettings?.enableMusicButton &&
          (musicPlaying ||
            (!isInFinalProtectedWindow && !isMeetingStartTimeInPast))
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
        <LiquidSpinner v-if="musicIsBusy" size="24px" />
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
        :loading="togglePending"
        unelevated
        @click="toggleRecording"
      >
        <template #loading>
          <LiquidSpinner />
        </template>
      </q-btn>
    </q-card-section>

    <q-card-section>
      <MeetingQuickActionsChecklist mode="before" />
    </q-card-section>
    <q-card-actions
      v-if="currentSettings?.meetingQuickActionsAllowDismiss !== false"
      align="right"
    >
      <q-btn
        flat
        :label="t('quick-actions-dismiss')"
        @click="dismissConfirmPending = true"
      />
    </q-card-actions>

    <ConfirmDialog
      v-model="dismissConfirmPending"
      :confirm-label="t('quick-actions-dismiss')"
      dialog-id="quick-actions-dismiss-before-confirm"
      icon="mmm-clear"
      :message="t('quick-actions-dismiss-before-confirmation')"
      persistent
      :title="t('confirm')"
      @cancel="dismissConfirmPending = false"
      @confirm="confirmDismissBefore"
    />
  </q-card>
</template>

<script setup lang="ts">
import type { MediaItem } from 'src/types';

import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import MeetingQuickActionsChecklist from 'components/media/MeetingQuickActionsChecklist.vue';
import LiquidFill from 'components/ui/LiquidFill.vue';
import LiquidSpinner from 'components/ui/LiquidSpinner.vue';
import { storeToRefs } from 'pinia';
import { getTodaysMeetingStartDateTime } from 'src/helpers/date';
import {
  canConvertMediaItem,
  requestMediaConversion,
} from 'src/helpers/media-conversion';
import { formatTime } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import {
  isActiveConversion,
  useMediaConversionStore,
} from 'stores/media-conversion';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { useMusicStore } from 'stores/music';
import { useRecordingStore } from 'stores/recording-state';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ now: number }>();

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings, mediaIsActivelyPlaying } = storeToRefs(currentState);

const quickActions = useMeetingQuickActionsStore();
const { dismissBefore } = quickActions;

// UX-15 (full-audit-2026-09-05.md): dismissing used to be a single
// irreversible click, with no production way to bring the panel back for
// the rest of the day/session - a mis-click permanently lost the
// pre-meeting checklist reminder. Confirming first at least prevents that
// accidental loss.
const dismissConfirmPending = ref(false);
const confirmDismissBefore = () => {
  dismissConfirmPending.value = false;
  dismissBefore();
};

const music = useMusicStore();
const { musicPlaying, musicState, timeUntilMusicStops } = storeToRefs(music);
const { formatClockTime, requestMusicStart, stopMusic } = music;

const recording = useRecordingStore();
const { canStartRecording, canStopRecording, isRecording, togglePending } =
  storeToRefs(recording);
const { toggleRecording } = recording;

const meetingStart = computed(() =>
  getTodaysMeetingStartDateTime(new Date(props.now)),
);
const isMeetingStartTimeInPast = computed(() => {
  const start = meetingStart.value;
  return start ? start.getTime() <= props.now : false;
});
const startTime = computed(() =>
  meetingStart.value ? formatClockTime(meetingStart.value) : '',
);
const countdown = computed(() =>
  meetingStart.value
    ? formatTime(Math.max(0, (meetingStart.value.getTime() - props.now) / 1000))
    : '00:00',
);

// The hourglass only shows for the last ten minutes, and turns orange for
// the last one, like the timer's countdown warning.
const HOURGLASS_SECONDS = 600;
const LAST_MINUTE_SECONDS = 60;
const secondsUntilStart = computed(() =>
  meetingStart.value ? (meetingStart.value.getTime() - props.now) / 1000 : 0,
);
const hourglassPercent = computed(() => {
  const seconds = secondsUntilStart.value;
  if (seconds <= 0 || seconds > HOURGLASS_SECONDS) return null;
  return (seconds / HOURGLASS_SECONDS) * 100;
});
const isLastMinute = computed(
  () =>
    hourglassPercent.value !== null &&
    secondsUntilStart.value <= LAST_MINUTE_SECONDS,
);
// Same final-approach window the music store auto-stops in (see
// shouldAutoStop in stores/music.ts) - starting music here would just get
// immediately auto-stopped again, so hide the Start action entirely rather
// than offer a button that can't meaningfully do anything. Only hides the
// Start path: if music is already playing, the Stop button must stay
// available regardless of this window.
const isInFinalProtectedWindow = computed(() => {
  if (!meetingStart.value) return false;
  const bufferSeconds = currentSettings.value?.meetingStopBufferSeconds ?? 60;
  return (
    secondsUntilStart.value > 0 && secondsUntilStart.value <= bufferSeconds
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

const conversionStore = useMediaConversionStore();
const { fileUrlToPath } = globalThis.electronApi;

const unplayableItems = computed(() => {
  const found: MediaItem[] = [];
  const visit = (items?: MediaItem[]) => {
    for (const item of items ?? []) {
      if (
        !item.hidden &&
        item.fileUrl &&
        canConvertMediaItem(item) &&
        conversionStore.problemFor(fileUrlToPath(item.fileUrl)) &&
        !isActiveConversion(conversionStore.jobForItem(item.uniqueId))
      ) {
        found.push(item);
      }
      visit(item.children);
    }
  };
  for (const section of currentState.selectedDateObject?.mediaSections ?? []) {
    visit(section.items);
  }
  return found;
});

const onMusicClick = () => {
  if (musicPlaying.value) {
    stopMusic(true);
  } else {
    requestMusicStart('quick-action');
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

.meeting-quick-actions-panel--before.liquid-host {
  --liquid-back: color-mix(in srgb, var(--q-primary) 6%, transparent);
  --liquid-front: color-mix(in srgb, var(--q-primary) 12%, transparent);
}

.meeting-quick-actions-panel--last-minute.liquid-host {
  --liquid-back: color-mix(in srgb, var(--q-warning) 9%, transparent);
  --liquid-front: color-mix(in srgb, var(--q-warning) 18%, transparent);
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
