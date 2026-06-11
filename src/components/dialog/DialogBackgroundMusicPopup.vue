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
    <div class="action-popup action-popup--scroll-layout q-py-md">
      <div class="card-title row q-px-md q-mb-none">
        {{ t('setupWizard.backgroundMusic') }}
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
            <div class="row q-my-sm q-pl-md q-pr-scroll">
              <div class="col text-weight-medium">
                {{ song.title }}
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
            v-if="musicPlaying && meetingDay && shouldShowMeetingCountdown"
            class="row text-dark-grey"
          >
            {{ t('until-meeting-starts') }}
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
import { remainingTimeBeforeMeetingStart } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { downloadBackgroundMusic } from 'src/helpers/jw-media';
import {
  autoLaunchZoomMeetingIfNeeded,
  automateZoomMeetingSettings,
  automateZoomPostMeetingSettings,
} from 'src/helpers/zoom';
import { log } from 'src/shared/vanilla';
import { formatTime } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
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
  | ''
  | 'music.error'
  | 'music.playing'
  | 'music.starting'
  | 'music.stopping';

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  isSelectedDayToday,
  mediaIsPlaying,
  meetingDay,
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

// Expose for parent components
defineExpose({
  musicButtonStatusText: displayStatusText,
  musicPlaying,
  musicState,
});

const musicPopup = useTemplateRef<QMenu>('musicPopup');

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

/**
 * Initializes and plays background music
 */
async function playMusic(reason = 'manual') {
  musicStartTiming.value = {
    id: musicStartId.value + 1,
    reason,
    startedAt: performance.now(),
  };
  musicStartId.value = musicStartTiming.value.id;

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

    // Fetch and prepare song library
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
      // Not a meeting day: just shuffle and play
      songList.value = enrichedSongs;
      initialStartOffset.value = 0;
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
    );
    logMusicStartStep('next song selected', nextSongStartedAt, {
      hasNextSongUrl: !!nextSongUrl,
      title: musicPlayingTitle.value,
    });

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
function stopMusic(
  manualStop = false,
  fadeSeconds = 5,
  automateMeetingSettings = false,
) {
  try {
    log('⏹️ Stopping background music', 'backgroundMusic', 'info');
    if (!musicPlayer.value || musicPlayer.value.paused) {
      log('⏭️ Music already stopped or no player', 'backgroundMusic', 'info');
      return;
    }

    musicState.value = 'music.stopping';
    if (automateMeetingSettings) {
      automateZoomMeetingSettings();
    }
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
  );

  if (!nextSongUrl) return;

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

// Update music state when playing changes
whenever(
  () => musicPlaying.value,
  () => {
    musicState.value = 'music.playing';
    autoLaunchZoomMeetingIfNeeded(timeUntilMeeting.value);
    automateZoomPostMeetingSettings();
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
    stopMusic(false, 5, true);
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

// UI update handler
watch(
  () => [musicState.value, musicPlaying.value, songList.value.length],
  () => {
    setTimeout(() => {
      if (musicPopup.value) {
        musicPopup.value.updatePosition();
      }
    }, 10);
  },
);

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
</style>
