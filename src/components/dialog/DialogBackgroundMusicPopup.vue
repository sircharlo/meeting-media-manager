<template>
  <q-menu
    ref="musicPopup"
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div
      ref="popupContent"
      class="action-popup action-popup--scroll-layout q-py-md"
    >
      <div class="card-title row q-px-md q-mb-none">
        {{ t('setupWizard.backgroundMusic') }}
      </div>

      <div class="row items-center no-wrap q-px-md q-mb-sm q-gutter-x-sm">
        <q-spinner
          v-if="
            musicState === 'music.starting' || musicState === 'music.stopping'
          "
          color="primary"
          size="16px"
        />
        <q-icon v-else :color="summaryColor" :name="summaryIcon" size="16px" />
        <div class="text-caption text-weight-medium ellipsis">
          {{ summaryText }}
        </div>
      </div>

      <template v-if="musicPlaying">
        <p class="card-section-title text-dark-grey row q-px-md q-pt-sm">
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
        <q-separator class="bg-accent-200" />
        <p class="row card-section-title text-dark-grey q-px-md q-pt-sm">
          {{ t('upcoming-songs') }}
        </p>
        <div class="action-popup__scroll">
          <template v-for="(song, i) in songList" :key="i">
            <div
              class="row items-center q-my-sm q-pl-md action-popup__song-row"
              :class="{ 'action-popup__song-row--meeting': song.isMeetingSong }"
            >
              <div class="col row items-center no-wrap text-weight-medium">
                <q-icon
                  v-if="song.isMeetingSong"
                  class="q-mr-xs"
                  color="primary"
                  name="mmm-calendar-month"
                  size="xs"
                >
                  <q-tooltip>{{
                    t('background-music-meeting-song')
                  }}</q-tooltip>
                </q-icon>
                <div class="ellipsis">{{ song.title }}</div>
              </div>
              <div class="action-popup__duration row text-grey">
                {{ formatTime(song.duration ?? 0) }}
              </div>
            </div>
          </template>
        </div>
        <q-separator class="bg-accent-200" />
      </template>
      <div class="action-popup__footer row q-px-md q-pt-md">
        <div class="col">
          <div
            class="action-popup__duration row text-subtitle1 text-weight-medium"
          >
            {{ displayStatusText }}
          </div>
          <div
            v-if="
              musicPlaying && meetingStartDateTime && shouldShowMeetingCountdown
            "
            class="row text-dark-grey"
          >
            {{
              t('background-music-meeting-starts-at', {
                time: formatClockTime(meetingStartDateTime),
              })
            }}
          </div>
        </div>
        <div class="col-grow">
          <q-btn
            v-if="!musicPlaying"
            class=""
            color="primary"
            :disable="mediaIsPlaying || musicState === 'music.starting'"
            unelevated
            @click="playMusic('manual-button')"
          >
            {{ t('play-music') }}
          </q-btn>
          <q-btn
            v-else
            class=""
            color="primary"
            :disable="musicState === 'music.stopping'"
            unelevated
            @click="stopMusic(true)"
          >
            {{ t('stop-music') }}
          </q-btn>
        </div>
      </div>
    </div>
  </q-menu>
  <audio ref="musicPlayer" style="display: none" @ended="handleMusicEnded" />
</template>

<script setup lang="ts">
import type { QMenu } from 'quasar';
import type { SongItem } from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  useMediaControls,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { MEDIA_STOP_FADE_DURATION_SECONDS } from 'src/constants/media';
import {
  enrichSongsWithMetadata,
  fetchSongLibrary,
  formatRemainingTime,
  getNextSongFromQueue,
  prepareMeetingDaySongQueue,
} from 'src/helpers/background-music';
import {
  getTodaysMeetingStartDateTime,
  remainingTimeBeforeMeetingStart,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { downloadBackgroundMusic } from 'src/helpers/jw-media';
import { log } from 'src/shared/vanilla';
import { sleep } from 'src/utils/general';
import { formatTime } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const open = defineModel<boolean>({ default: false });

interface BackgroundMusicAction {
  action: 'stop';
  fadeSeconds?: number;
  requestedAt: number;
}

interface BackgroundMusicState {
  playing: boolean;
  state: MusicState;
}

type MusicState =
  '' | 'music.error' | 'music.playing' | 'music.starting' | 'music.stopping';

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  isSelectedDayToday,
  mediaIsPlaying,
  selectedDateObject,
  selectedDayMeetingType,
} = storeToRefs(currentState);

// Constants
const MEETING_STOP_BUFFER_SECONDS = computed(
  () => currentSettings.value?.meetingStopBufferSeconds ?? 60,
);
const AUTO_START_WINDOW_HOURS = 1.25;

// Music player setup
const musicPlayerSource = ref<HTMLSourceElement>(
  document.createElement('source'),
);

const musicPlayer = useTemplateRef('musicPlayer');
const {
  currentTime,
  duration,
  playing: musicPlaying,
  volume,
} = useMediaControls(musicPlayer, {
  src: musicPlayerSource,
});

const timeUntilMeeting = ref(remainingTimeBeforeMeetingStart());
const musicAlreadyStoppedManually = ref(false);

// Music state management
const musicState = ref<MusicState>('');

const musicPlayingTitle = ref('');
const songList = ref<SongItem[]>([]);
// Meeting-day queues are time-boxed to end exactly at fadeout, with the
// meeting's own song(s) last - they must NOT be requeued once played, or
// playback loops back around to earlier, non-meeting songs. Only ambient
// (non-meeting-day) playback should loop indefinitely.
const shouldLoopQueue = ref(true);
const initialStartOffset = ref(0); // Stores the calculated start offset for first song
const musicStartId = ref(0);
const musicStartTiming = ref<null | {
  id: number;
  reason: string;
  startedAt: number;
}>(null);

// Meeting day checks
const isMeetingToday = computed(() => {
  return isSelectedDayToday.value && !!selectedDayMeetingType.value;
});

const isMeetingStartTimeInPast = computed(() => {
  return timeUntilMeeting.value <= 0;
});

// Auto-start logic
const shouldAutoStart = computed(() => {
  if (
    !currentSettings.value?.enableMusicButton ||
    !currentSettings.value?.autoStartMusic
  ) {
    return false;
  }

  if (!isMeetingToday.value || musicPlaying.value) {
    return false;
  }

  if (musicAlreadyStoppedManually.value) {
    return false;
  }

  const timeUntil = timeUntilMeeting.value;
  const withinAutoStartWindow =
    timeUntil > MEETING_STOP_BUFFER_SECONDS.value * 1.5 &&
    timeUntil <= AUTO_START_WINDOW_HOURS * 3600;

  return withinAutoStartWindow;
});

// Auto-stop logic
const shouldAutoStop = computed(() => {
  if (!musicPlaying.value) {
    return false;
  }

  return (
    isMeetingToday.value &&
    timeUntilMeeting.value <= MEETING_STOP_BUFFER_SECONDS.value &&
    !isMeetingStartTimeInPast.value
  );
});

// Display text calculations
const currentSongRemainingTime = computed(() => {
  if (musicPlaying.value) {
    return formatTime(duration.value - currentTime.value);
  }
  return t('music.not-playing');
});

const timeUntilMusicStops = computed(() => {
  if (!isMeetingToday.value || isMeetingStartTimeInPast.value) {
    return '';
  }

  const timeUntilStop =
    timeUntilMeeting.value - MEETING_STOP_BUFFER_SECONDS.value;
  return formatRemainingTime(timeUntilStop);
});

const shouldShowMeetingCountdown = computed(() => {
  return (
    musicState.value !== 'music.stopping' && !isMeetingStartTimeInPast.value
  );
});

const displayStatusText = computed(() => {
  switch (musicState.value) {
    case 'music.error':
      return '';
    case 'music.playing':
      if (!isMeetingToday.value || isMeetingStartTimeInPast.value) {
        return currentSongRemainingTime.value;
      }
      return timeUntilMusicStops.value;
    case 'music.starting':
      return t('music.starting');
    case 'music.stopping':
      return t('music.stopping');
    default:
      return t('music.not-playing');
  }
});

// ─── Planned clock times ────────────────────────────────────────────────────
// Today's actual meeting start/stop/auto-start moments, so the popup can
// show concrete times ("stops at 7:28 PM") alongside the countdown text
// already used on the compact island button.

const formatClockTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const meetingStartDateTime = computed(() =>
  isMeetingToday.value ? getTodaysMeetingStartDateTime() : null,
);

const musicStopDateTime = computed(() => {
  const start = meetingStartDateTime.value;
  if (!start) return null;
  return new Date(start.getTime() - MEETING_STOP_BUFFER_SECONDS.value * 1000);
});

const autoStartDateTime = computed(() => {
  const start = meetingStartDateTime.value;
  if (!start || !currentSettings.value?.autoStartMusic) return null;
  return new Date(start.getTime() - AUTO_START_WINDOW_HOURS * 3600 * 1000);
});

// ─── Summary row ────────────────────────────────────────────────────────────

const summaryText = computed(() => {
  switch (musicState.value) {
    case 'music.error':
      return t('background-music-error');
    case 'music.playing':
      return musicStopDateTime.value
        ? t('background-music-stops-at', {
            time: formatClockTime(musicStopDateTime.value),
          })
        : t('background-music-playing');
    case 'music.starting':
      return t('music.starting');
    case 'music.stopping':
      return t('music.stopping');
    default:
      return autoStartDateTime.value &&
        autoStartDateTime.value.getTime() > Date.now()
        ? t('background-music-auto-starts-at', {
            time: formatClockTime(autoStartDateTime.value),
          })
        : t('background-music-idle');
  }
});

const summaryIcon = computed(() =>
  musicState.value === 'music.error' ? 'mmm-warning' : 'mmm-music-note',
);

const summaryColor = computed(() =>
  musicState.value === 'music.error' ? 'warning' : 'primary',
);

// Expose for parent components
defineExpose({
  musicButtonStatusText: displayStatusText,
  musicPlaying,
  musicState,
});

const musicPopup = useTemplateRef<QMenu>('musicPopup');
const popupContent = useTemplateRef<HTMLElement>('popupContent');
let popupResizeObserver: ResizeObserver | undefined;

const getDebugTimestamp = () => new Date().toISOString();

const getElapsedMilliseconds = (startedAt: number) => {
  return Math.round(performance.now() - startedAt);
};

const logMusicStartTiming = (
  message: string,
  type: 'debug' | 'info' | 'warn' = 'debug',
  details?: Record<string, unknown>,
) => {
  const timing = musicStartTiming.value;
  const elapsed = timing
    ? ` +${getElapsedMilliseconds(timing.startedAt)}ms`
    : '';
  const startId = timing ? ` #${timing.id}` : '';
  const reason = timing ? ` ${timing.reason}` : '';

  log(
    `[${getDebugTimestamp()}]${elapsed}${startId}${reason} ${message}`,
    'backgroundMusic',
    type,
    details,
  );
};

const logMusicStartStep = (
  message: string,
  stepStartedAt: number,
  details?: Record<string, unknown>,
) => {
  logMusicStartTiming(
    `${message} (step ${getElapsedMilliseconds(stepStartedAt)}ms)`,
    'debug',
    details,
  );
};

// How long to keep retrying an empty song library before giving up. Auto
// start can fire before the songbook/library has anything in it yet (e.g.
// right after downloadBackgroundMusic() kicks off, or before currentSongbook
// itself has resolved) - that's a startup race, not a real "no songs"
// state, so it's worth waiting rather than failing immediately.
const SONG_LIBRARY_RETRY_TIMEOUT_MS = 2 * 60 * 1000;
const SONG_LIBRARY_RETRY_INTERVAL_MS = 15 * 1000;

/**
 * Initializes and plays background music
 */
async function playMusic(reason = 'manual') {
  musicStartTiming.value = {
    id: musicStartId.value + 1,
    reason,
    startedAt: performance.now(),
  };
  const thisStartId = musicStartTiming.value.id;
  musicStartId.value = thisStartId;
  const isStale = () => musicStartId.value !== thisStartId;

  try {
    logMusicStartTiming('start requested', 'debug', {
      enableMusicButton: currentSettings.value?.enableMusicButton,
      hasMusicPlayer: !!musicPlayer.value,
      musicPlaying: musicPlaying.value,
    });

    if (
      !currentSettings.value?.enableMusicButton ||
      musicPlaying.value ||
      !musicPlayer.value
    ) {
      logMusicStartTiming('playback conditions not met', 'debug', {
        enableMusicButton: currentSettings.value?.enableMusicButton,
        hasMusicPlayer: !!musicPlayer.value,
        musicPlaying: musicPlaying.value,
      });
      return;
    }

    log('🎵 Starting background music', 'backgroundMusic', 'info');
    musicState.value = 'music.starting';
    logMusicStartTiming('state set to music.starting');

    const downloadStepStartedAt = performance.now();
    downloadBackgroundMusic();
    logMusicStartStep(
      'download background music check dispatched',
      downloadStepStartedAt,
    );

    songList.value = [];
    musicPlayer.value.appendChild(musicPlayerSource.value);
    volume.value = 0;
    logMusicStartTiming('audio source attached and volume set to 0');

    // Fetches the song library, prepares the queue (meeting-day or not),
    // and picks the next song. Returns '' if the library came back empty.
    const buildQueueAndGetNextSongUrl = async () => {
      // Settings may not have finished loading yet on a very early auto
      // start; treat that the same as an empty library so the retry loop
      // below waits it out instead of failing immediately.
      if (!currentSettings.value) return '';

      const fetchLibraryStartedAt = performance.now();
      const rawSongLibrary = await fetchSongLibrary(
        currentSettings.value?.lang || 'E',
      );
      logMusicStartStep('song library fetched', fetchLibraryStartedAt, {
        songs: rawSongLibrary.length,
      });

      const enrichMetadataStartedAt = performance.now();
      const enrichedSongs = await enrichSongsWithMetadata(rawSongLibrary);
      logMusicStartStep('song metadata enriched', enrichMetadataStartedAt, {
        songs: enrichedSongs.length,
      });

      // Prepare queue based on meeting day or not
      const timeBeforeMeetingStart =
        timeUntilMeeting.value - MEETING_STOP_BUFFER_SECONDS.value;
      logMusicStartTiming('queue preparation started', 'debug', {
        isMeetingToday: isMeetingToday.value,
        timeBeforeMeetingStart,
      });

      if (isMeetingToday.value && timeBeforeMeetingStart > 0) {
        // Meeting day: optimize queue to end precisely at fadeout time
        const meetingQueueStartedAt = performance.now();
        const selectedDayMedia = Object.values(
          selectedDateObject.value?.mediaSections ?? {},
        ).flatMap((section) => section.items || []);

        const { queue, startOffsetSeconds } = await prepareMeetingDaySongQueue(
          enrichedSongs,
          {
            currentSettings: currentSettings.value,
            selectedDayMedia,
            timeBeforeMeetingStart,
          },
        );

        songList.value = queue;
        initialStartOffset.value = startOffsetSeconds;
        shouldLoopQueue.value = false;
        logMusicStartStep(
          'meeting day song queue prepared',
          meetingQueueStartedAt,
          {
            queueLength: queue.length,
            selectedDayMedia: selectedDayMedia.length,
            startOffsetSeconds,
          },
        );
      } else {
        // No meeting to build a time-boxed queue around - either it's not a
        // meeting day, or it is but the meeting has already started/ended
        // (e.g. music manually restarted after the meeting). Either way
        // there's no fadeout point to aim for, so just shuffle and loop
        // through the whole library indefinitely.
        songList.value = enrichedSongs;
        initialStartOffset.value = 0;
        shouldLoopQueue.value = true;
        logMusicStartTiming('non-meeting song queue prepared', 'debug', {
          queueLength: songList.value.length,
        });
      }

      // Get and play the first song
      const nextSongStartedAt = performance.now();
      const { nextSongUrl } = await getNextSongFromQueue(
        songList.value,
        (title) => {
          musicPlayingTitle.value = title;
        },
        shouldLoopQueue.value,
      );
      logMusicStartStep('next song selected', nextSongStartedAt, {
        hasNextSongUrl: !!nextSongUrl,
        title: musicPlayingTitle.value,
      });

      return nextSongUrl;
    };

    const retryDeadline = performance.now() + SONG_LIBRARY_RETRY_TIMEOUT_MS;
    let nextSongUrl = await buildQueueAndGetNextSongUrl();
    while (!nextSongUrl && performance.now() < retryDeadline) {
      if (isStale()) return;
      logMusicStartTiming(
        'song library empty, waiting for songs to appear',
        'debug',
      );
      await sleep(SONG_LIBRARY_RETRY_INTERVAL_MS);
      if (isStale()) return;
      nextSongUrl = await buildQueueAndGetNextSongUrl();
    }

    if (isStale()) return;
    if (!nextSongUrl) throw new Error('No next song found');

    musicPlayerSource.value.src = nextSongUrl;
    log(`🎵 Playing music from ${nextSongUrl}`, 'backgroundMusic', 'info');

    const loadStartedAt = performance.now();
    logMusicStartTiming('audio load requested');
    musicPlayer.value?.load();
    logMusicStartStep('audio load call returned', loadStartedAt);

    // Apply start offset if we calculated one (for meeting day timing)
    const startTime = initialStartOffset.value;
    if (startTime > 0) {
      log(
        `⏩ Starting ${startTime.toFixed(1)}s into first song to align with meeting time`,
        'backgroundMusic',
        'info',
      );
    }
    const seekStartedAt = performance.now();
    currentTime.value = startTime;
    logMusicStartStep('initial currentTime applied', seekStartedAt, {
      startTime,
    });

    const playStartedAt = performance.now();
    logMusicStartTiming('audio play requested');
    await musicPlayer.value?.play();
    logMusicStartStep('audio play promise resolved', playStartedAt);
    log(`🎵 Music started at ${startTime} seconds`, 'backgroundMusic', 'info');

    // Fade in volume
    const targetVolume = (currentSettings.value?.musicVolume ?? 100) / 100;
    log(`🔊 Fading to volume level ${targetVolume}`, 'backgroundMusic', 'info');
    logMusicStartTiming('fade in starting', 'debug', { targetVolume });
    fadeToVolumeLevel(targetVolume, 1);
  } catch (error) {
    musicState.value = 'music.error';
    logMusicStartTiming('start failed', 'warn');
    errorCatcher(error);
  }
}

/**
 * Stops background music with fadeout
 */
function stopMusic(manualStop = false, fadeSeconds = 5) {
  try {
    log('⏹️ Stopping background music', 'backgroundMusic', 'info');
    if (!musicPlayer.value || musicPlayer.value.paused) {
      log('⏭️ Music already stopped or no player', 'backgroundMusic', 'info');
      return;
    }

    musicState.value = 'music.stopping';
    fadeToVolumeLevel(0, fadeSeconds);
  } catch (error) {
    errorCatcher(error);
  } finally {
    if (manualStop) {
      log('⏹️ Music stopped manually', 'backgroundMusic', 'info');
      musicAlreadyStoppedManually.value = true;
    }
  }
}

/**
 * Handles when a song ends - plays next song
 */
const handleMusicEnded = async () => {
  if (
    !musicPlayer.value ||
    !musicPlayerSource.value ||
    musicState.value === 'music.stopping'
  ) {
    return;
  }

  const { nextSongUrl } = await getNextSongFromQueue(
    songList.value,
    (title) => {
      musicPlayingTitle.value = title;
    },
    shouldLoopQueue.value,
  );

  if (!nextSongUrl) {
    // Meeting-day queue ran out (its own song(s) already played last) -
    // this is a natural end, not an error, so just settle back to idle
    // instead of leaving the UI stuck showing "playing".
    log(
      '🎵 Song queue exhausted, stopping background music',
      'backgroundMusic',
      'info',
    );
    musicState.value = '';
    return;
  }

  musicPlayerSource.value.src = nextSongUrl;
  log(
    '🎵 Advancing to next background music track',
    'backgroundMusic',
    'debug',
    {
      nextSongUrl,
      title: musicPlayingTitle.value,
    },
  );
  musicPlayer.value?.load();
  musicPlayer.value?.play();
};

/**
 * Fades volume to a target level over specified seconds
 */
const fadeToVolumeLevel = (targetVolume: number, fadeSeconds: number) => {
  log(
    `🔊 Fading to volume level ${targetVolume} over ${fadeSeconds} seconds`,
    'backgroundMusic',
    'info',
  );

  if (!musicPlayer.value) return;

  targetVolume = Math.min(Math.max(targetVolume, 0), 1);

  try {
    const initialVolume = Math.min(musicPlayer.value.volume, 1);
    const volumeChange = targetVolume - initialVolume;
    const startTime = performance.now();

    function updateVolume(currentTime: number) {
      try {
        if (!musicPlayer.value) return;

        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / (fadeSeconds * 1000), 1);
        musicPlayer.value.volume = Math.min(
          Math.max(initialVolume + volumeChange * progress, 0),
          1,
        );

        if (progress < 1) {
          requestAnimationFrame(updateVolume);
        } else if (musicPlayer.value.volume === 0) {
          musicPlayer.value.pause();
          musicState.value = '';
        } else {
          logMusicStartTiming('fade completed', 'debug', {
            targetVolume,
          });
        }
      } catch (error) {
        errorCatcher(error);
        if (musicPlayer.value) {
          musicPlayer.value.volume = targetVolume;
        }
      }
    }

    requestAnimationFrame(updateVolume);
  } catch (error) {
    errorCatcher(error);
  }
};

/**
 * Sets background music volume directly
 */
const setBackgroundMusicVolume = (desiredVolume: number) => {
  try {
    if (
      !musicPlayer.value ||
      !Number.isInteger(desiredVolume) ||
      desiredVolume < 0
    ) {
      return;
    }
    volume.value = Math.min(Math.max(desiredVolume / 100, 0), 1);
  } catch (error) {
    errorCatcher(error);
  }
};

const logAudioEventTiming = (event: Event) => {
  if (!(event.target instanceof HTMLAudioElement)) return;

  logMusicStartTiming(`audio event: ${event.type}`, 'debug', {
    currentSrc: event.target.currentSrc,
    currentTime: event.target.currentTime,
    duration: event.target.duration,
    networkState: event.target.networkState,
    paused: event.target.paused,
    readyState: event.target.readyState,
    volume: event.target.volume,
  });
};

useEventListener(
  musicPlayer,
  ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'playing'],
  logAudioEventTiming,
  { passive: true },
);

// Music player error handling
useEventListener(musicPlayer, 'error', (event) => {
  logAudioEventTiming(event);
  if (event.target instanceof HTMLAudioElement) {
    musicState.value = 'music.error';
    if (event.target.error?.message) {
      const ignoredErrors = [
        'removed from the document',
        'new load request',
        'interrupted by a call to pause',
      ];

      if (
        !ignoredErrors.some((msg) =>
          (event.target as HTMLAudioElement)?.error?.message?.includes(msg),
        )
      ) {
        errorCatcher(event.target.error);
      }
    }
  }
});

// Event listeners
const toggleMusicListener = () => {
  try {
    if (!currentSettings.value?.enableMusicButton) return;

    if (musicPlaying.value) {
      stopMusic();
    } else {
      log('👆 Music started manually', 'backgroundMusic', 'info');
      playMusic('manual-shortcut');
    }
  } catch (error) {
    errorCatcher(error);
  }
};

useEventListener(globalThis, 'toggleMusic', toggleMusicListener, {
  passive: true,
});

const { data: volumeData } = useBroadcastChannel<number, number>({
  name: 'volume-setter',
});
const { data: backgroundMusicAction } = useBroadcastChannel<
  BackgroundMusicAction,
  BackgroundMusicAction
>({
  name: 'background-music-action',
});
const { post: postBackgroundMusicState } = useBroadcastChannel<
  BackgroundMusicState,
  BackgroundMusicState
>({
  name: 'background-music-state',
});

// Update music state when playing changes. Also wait for duration metadata
// (populated asynchronously via the audio element's durationchange event) -
// switching to 'music.playing' before it's available makes
// currentSongRemainingTime briefly compute against a duration of 0 (a
// negative diff, clamped to "00:00" by formatTime), flashing a wrong time
// before it corrects itself a moment later.
whenever(
  () => musicPlaying.value && duration.value > 0,
  () => {
    musicState.value = 'music.playing';
  },
);

watchImmediate(
  () => [musicPlaying.value, musicState.value] as const,
  ([playing, state]) => {
    postBackgroundMusicState({ playing, state });
  },
);

watch(
  () => backgroundMusicAction.value?.requestedAt,
  () => {
    if (backgroundMusicAction.value?.action === 'stop') {
      stopMusic(
        true,
        backgroundMusicAction.value.fadeSeconds ??
          MEDIA_STOP_FADE_DURATION_SECONDS,
      );
    }
  },
);

// Watch for time changes
watch(
  () => [currentTime.value, selectedDateObject.value?.date],
  (values, oldValues) => {
    const [newTime, newSelectedDate] = values;
    const [, oldSelectedDate] = oldValues || [];

    if (newTime || newSelectedDate) {
      timeUntilMeeting.value = remainingTimeBeforeMeetingStart();
    }
    if (oldSelectedDate !== newSelectedDate) {
      musicAlreadyStoppedManually.value = false;
    }
  },
  { immediate: true },
);

// Main auto-start logic
watchImmediate(
  () => [shouldAutoStart.value, musicState.value],
  ([shouldStart, state]) => {
    if (
      shouldStart &&
      state !== 'music.starting' &&
      state !== 'music.stopping' &&
      state !== 'music.playing'
    ) {
      log('🎵 Auto-starting background music', 'backgroundMusic', 'info');
      playMusic('auto');
    }
  },
);

// Main auto-stop logic
watch(shouldAutoStop, (shouldStop) => {
  if (shouldStop && musicState.value !== 'music.stopping') {
    log(
      '⏹️ Auto-stopping background music before meeting',
      'backgroundMusic',
      'info',
    );
    stopMusic();
  }
});

// Settings change handling
watch(
  () => [currentSettings.value?.enableMusicButton, currentCongregation.value],
  ([musicEnabled, newCongregation], [, oldCongregation]) => {
    if (
      !musicEnabled ||
      (newCongregation && oldCongregation !== newCongregation)
    ) {
      stopMusic();
    }
  },
);

// Watch for source changes
watch(
  () => musicPlayerSource.value?.src,
  (newSrc) => {
    if (newSrc) {
      musicPlayer.value?.load();
      log(`🎵 Music player source set to ${newSrc}`, 'backgroundMusic', 'info');
    }
  },
);

// Anchored bottom-up (self="bottom middle") so it visually grows out of the
// action island. A ResizeObserver repositions it whenever its rendered size
// actually changes - song list growing/shrinking, playing state toggling
// the whole song section, the meeting-countdown row, etc. - instead of
// guessing which reactive values might affect height.
watch(popupContent, (el) => {
  popupResizeObserver?.disconnect();
  popupResizeObserver = undefined;
  if (!el) return;
  popupResizeObserver = new ResizeObserver(() => {
    musicPopup.value?.updatePosition();
  });
  popupResizeObserver.observe(el);
});

onBeforeUnmount(() => popupResizeObserver?.disconnect());

whenever(
  () => volumeData.value,
  (val) => {
    setBackgroundMusicVolume(val);
  },
);
</script>

<style scoped>
.action-popup__duration {
  font-variant-numeric: tabular-nums;
  min-width: 6ch;
  text-align: center;
  white-space: nowrap;
}

/* 6px + the 10px scrollbar gutter reserved on .action-popup__scroll = the 16px (q-px-md) used by the current-song row above */
.action-popup__song-row {
  padding-right: 6px;
}

.action-popup__song-row--meeting {
  background: color-mix(in srgb, var(--q-primary) 10%, transparent);
  border-radius: 4px;
}
</style>
