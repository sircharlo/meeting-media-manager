<template>
  <ActionPopup
    v-model="open"
    :status-color="statusColor"
    :status-icon="summaryIcon"
    :status-loading="
      musicState === 'music.starting' || musicState === 'music.stopping'
    "
    :status-text="statusText"
    :title="t('setupWizard.backgroundMusic')"
  >
    <template v-if="musicPlaying">
      <div
        v-if="meetingStartDateTime && shouldShowMeetingCountdown"
        class="text-caption text-dark-grey q-px-md"
      >
        {{
          t('background-music-meeting-starts-at', {
            time: formatClockTime(meetingStartDateTime),
          })
        }}
      </div>
      <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
        {{ t('current-song') }}
      </p>
      <div class="row q-px-md q-pt-xs q-pb-sm">
        <div class="col text-weight-medium">
          {{ musicPlayingTitle }}
        </div>
        <div class="action-popup__duration row text-grey">
          {{ currentSongRemainingTime }}
        </div>
      </div>
      <template v-if="songList.length">
        <q-separator class="bg-accent-200 q-my-sm" />
        <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
          {{ t('upcoming-songs') }}
        </p>
        <div
          v-for="(song, i) in songList"
          :key="i"
          class="row items-center q-my-sm q-px-md"
          :class="{
            'action-popup__song-row--meeting': song.isMeetingSong,
          }"
        >
          <div class="col row items-center no-wrap text-weight-medium">
            <q-icon
              v-if="song.isMeetingSong"
              class="q-mr-xs"
              color="primary"
              name="mmm-calendar-month"
              size="xs"
            >
              <q-tooltip>{{ t('background-music-meeting-song') }}</q-tooltip>
            </q-icon>
            <div class="ellipsis">{{ song.title }}</div>
          </div>
          <div class="action-popup__duration row text-grey">
            {{ formatTime(song.duration ?? 0) }}
          </div>
        </div>
      </template>
    </template>

    <template #footer>
      <q-btn
        v-if="!musicPlaying"
        class="full-width"
        color="primary"
        :disable="mediaIsActivelyPlaying || musicState === 'music.starting'"
        icon="mmm-play"
        :label="t('play-music')"
        unelevated
        @click="requestMusicStart('manual-button')"
      />
      <q-btn
        v-else
        class="full-width"
        color="primary"
        :disable="musicState === 'music.stopping'"
        icon="mmm-stop"
        :label="t('stop-music')"
        unelevated
        @click="stopMusic(true)"
      />
    </template>
  </ActionPopup>
</template>

<script setup lang="ts">
import ActionPopup from 'components/ui/ActionPopup.vue';
import { storeToRefs } from 'pinia';
import { formatTime } from 'src/utils/time';
import { useMusicStore } from 'stores/music';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const open = defineModel<boolean>({ default: false });

const music = useMusicStore();
const {
  currentSongRemainingTime,
  mediaIsActivelyPlaying,
  meetingStartDateTime,
  musicPlaying,
  musicPlayingTitle,
  musicState,
  shouldShowMeetingCountdown,
  songList,
  summaryIcon,
  summaryText,
  timeUntilMusicStops,
} = storeToRefs(music);
const { formatClockTime, requestMusicStart, stopMusic } = music;

// One line for both the summary ("Stops at 7:25") and the live status the
// music button shows (displayStatusText). That live status only adds to the
// summary while music counts down to today's meeting - the time left before
// it stops; otherwise it repeats the summary, or the current song's remaining
// time shown in the body.
const statusText = computed(() => {
  if (musicState.value !== 'music.playing' || !timeUntilMusicStops.value) {
    return summaryText.value;
  }
  return `${summaryText.value} · ${timeUntilMusicStops.value}`;
});

const statusColor = computed(() => {
  if (musicState.value === 'music.error') return 'warning';
  return musicPlaying.value ? 'positive' : 'grey';
});
</script>

<style scoped>
.action-popup__duration {
  font-variant-numeric: tabular-nums;
  min-width: 6ch;
  text-align: center;
  white-space: nowrap;
}

.action-popup__song-row--meeting {
  background: color-mix(in srgb, var(--q-primary) 10%, transparent);
  border-radius: 4px;
}
</style>
