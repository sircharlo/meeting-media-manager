import type { MediaItem, SongItem } from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  useIntervalFn,
  useMediaControls,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import { i18n } from 'boot/i18n';
import { defineStore, storeToRefs } from 'pinia';
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
import { getDemoSongLibrary } from 'src/helpers/demo-mode';
import { errorCatcher } from 'src/helpers/error-catcher';
import { downloadBackgroundMusic } from 'src/helpers/jw-media';
import { log } from 'src/shared/vanilla';
import { sleep } from 'src/utils/general';
import { formatTime } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import { useDemoModeStore } from 'stores/demo-mode';
import { computed, ref, watch } from 'vue';

export interface BackgroundMusicAction {
  action: 'start' | 'stop';
  fadeSeconds?: number;
  reason?: string;
  requestedAt: number;
}

export interface BackgroundMusicState {
  playing: boolean;
  state: MusicState;
}

export type MusicState =
  '' | 'music.error' | 'music.playing' | 'music.starting' | 'music.stopping';

const IGNORABLE_PLAYBACK_ERROR_MESSAGES = [
  'removed from the document',
  'new load request',
  'interrupted by a call to pause',
];
const isIgnorablePlaybackError = (message?: null | string) =>
  !!message &&
  IGNORABLE_PLAYBACK_ERROR_MESSAGES.some((msg) => message.includes(msg));

// How far ahead of the meeting start background music is allowed to
// auto-start. Exported so the before-meeting quick-actions panel can show
// itself over the same window - independent of whether autoStartMusic
// itself is enabled, since the panel's usefulness (recording/checklist/
// manual music controls) doesn't depend on that one setting.
export const AUTO_START_WINDOW_HOURS = 1.25;

export const useMusicStore = defineStore('music', () => {
  // The store can be instantiated outside component setup (e.g. the dev-menu
  // boot file and demo-mode helpers), where `useI18n()` would throw. Use the
  // global i18n composer instead, like other non-component code.
  const t = i18n.global.t;
  const currentState = useCurrentStateStore();
  const demoMode = useDemoModeStore();
  const {
    currentCongregation,
    currentSettings,
    isSelectedDayToday,
    mediaIsActivelyPlaying,
    selectedDateObject,
    selectedDayMeetingType,
  } = storeToRefs(currentState);

  const getClockDate = () =>
    new Date(demoMode.enabled ? demoMode.now : Date.now());

  const MEETING_STOP_BUFFER_SECONDS = computed(
    () => currentSettings.value?.meetingStopBufferSeconds ?? 60,
  );

  // Lazily create the audio element on first use so the store doesn't
  // create DOM elements during module import (before Pinia install).
  const musicPlayer = ref<HTMLAudioElement | null>(null);
  const handleMusicPlayerError = (event: Event) => {
    if (!(event.target instanceof HTMLAudioElement)) return;
    logAudioEventTiming(event);
    if (musicState.value === 'music.stopping' || musicState.value === '') {
      return;
    }
    musicState.value = 'music.error';
    scheduleAutoStartRetry();
    if (
      event.target.error?.message &&
      !isIgnorablePlaybackError(event.target.error.message)
    ) {
      errorCatcher(event.target.error);
    }
  };
  const ensureMusicPlayer = (): HTMLAudioElement => {
    if (!musicPlayer.value) {
      musicPlayer.value = document.createElement('audio');
      musicPlayer.value.style.display = 'none';
      document.body.appendChild(musicPlayer.value);
      musicPlayer.value.addEventListener('ended', handleMusicEnded);
      musicPlayer.value.addEventListener('error', handleMusicPlayerError);
    }
    return musicPlayer.value;
  };
  const musicPlayerSource = ref<HTMLSourceElement>(
    document.createElement('source'),
  );
  // Deliberately NOT passing `src` here. useMediaControls' own `src` option
  // expects a URL string (or {src,type,media}) and, when given ANY object -
  // including a raw <source> element like musicPlayerSource - destructures
  // {src,type,media} off it, wipes out every existing <source> child of the
  // target, and injects its own brand-new <source> built from those fields.
  // That watchEffect fires once the (lazily-created) audio element first
  // becomes non-null, which happens inside playMusic() itself now -
  // immediately AFTER we've just appendChild()'d our real, manually-managed
  // musicPlayerSource. The result: VueUse's watcher removes the source we
  // just attached (before its .src is even set) and replaces it with an
  // empty dummy one, so playback never has a real source to load - audio
  // element sits in the DOM with nothing playable, and musicState never
  // leaves 'music.starting' since 'playing'/'durationchange' never fire.
  // Song swapping is already handled entirely manually elsewhere (playMusic,
  // handleMusicEnded set musicPlayerSource.value.src + call .load()), so
  // useMediaControls doesn't need to manage sources at all here.
  const {
    currentTime,
    duration,
    playing: musicPlaying,
    volume,
  } = useMediaControls(musicPlayer);

  const timeUntilMeeting = ref(remainingTimeBeforeMeetingStart(getClockDate()));
  const musicAlreadyStoppedManually = ref(false);

  const musicState = ref<MusicState>('');

  const musicPlayingTitle = ref('');
  const songList = ref<SongItem[]>([]);
  const shouldLoopQueue = ref(true);
  const initialStartOffset = ref(0);
  const musicStartId = ref(0);
  const musicStartTiming = ref<null | {
    id: number;
    reason: string;
    startedAt: number;
  }>(null);

  // ─── Diagnostic logging ────────────────────────────────────────────────────
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

  // Diagnostic audio event listeners
  useEventListener(
    musicPlayer,
    ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'playing'],
    logAudioEventTiming,
    { passive: true },
  );

  // ─── Computed ──────────────────────────────────────────────────────────────

  const isMeetingToday = computed(
    () => isSelectedDayToday.value && !!selectedDayMeetingType.value,
  );

  const isMeetingStartTimeInPast = computed(() => timeUntilMeeting.value <= 0);

  const shouldAutoStart = computed(() => {
    if (
      !currentSettings.value?.enableMusicButton ||
      !currentSettings.value?.autoStartMusic
    )
      return false;
    if (!isMeetingToday.value || musicPlaying.value) return false;
    if (musicAlreadyStoppedManually.value) return false;
    const timeUntil = timeUntilMeeting.value;
    return (
      timeUntil > MEETING_STOP_BUFFER_SECONDS.value * 1.5 &&
      timeUntil <= AUTO_START_WINDOW_HOURS * 3600
    );
  });

  const shouldAutoStop = computed(() => {
    if (!musicPlaying.value && musicState.value !== 'music.starting')
      return false;
    return (
      isMeetingToday.value &&
      timeUntilMeeting.value <= MEETING_STOP_BUFFER_SECONDS.value &&
      !isMeetingStartTimeInPast.value
    );
  });

  const currentSongRemainingTime = computed(() => {
    if (musicPlaying.value)
      return formatTime(duration.value - currentTime.value);
    return t('music.not-playing');
  });

  const timeUntilMusicStops = computed(() => {
    if (!isMeetingToday.value || isMeetingStartTimeInPast.value) return '';
    return formatRemainingTime(
      timeUntilMeeting.value - MEETING_STOP_BUFFER_SECONDS.value,
    );
  });

  const shouldShowMeetingCountdown = computed(
    () =>
      musicState.value !== 'music.stopping' && !isMeetingStartTimeInPast.value,
  );

  const displayStatusText = computed(() => {
    switch (musicState.value) {
      case 'music.error':
        return '';
      case 'music.playing':
        if (!isMeetingToday.value || isMeetingStartTimeInPast.value)
          return currentSongRemainingTime.value;
        return timeUntilMusicStops.value;
      case 'music.starting':
        return t('music.starting');
      case 'music.stopping':
        return t('music.stopping');
      default:
        return t('music.not-playing');
    }
  });

  // ─── Clock-time computeds ──────────────────────────────────────────────────

  const formatClockTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const meetingStartDateTime = computed(() =>
    isMeetingToday.value ? getTodaysMeetingStartDateTime(getClockDate()) : null,
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

  // ─── Summary row computeds ─────────────────────────────────────────────────

  const summaryText = computed(() => {
    switch (musicState.value) {
      case 'music.error':
        return t('background-music-error');
      case 'music.playing':
        if (isMeetingStartTimeInPast.value)
          return t('background-music-playing');
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
          autoStartDateTime.value.getTime() > getClockDate().getTime()
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

  // ─── Actions ───────────────────────────────────────────────────────────────

  const SONG_LIBRARY_RETRY_TIMEOUT_MS = 2 * 60 * 1000;
  const SONG_LIBRARY_RETRY_INTERVAL_MS = 15 * 1000;
  const AUTO_START_ERROR_COOLDOWN_MS = SONG_LIBRARY_RETRY_TIMEOUT_MS;
  let autoStartRetryTimer: ReturnType<typeof setTimeout> | undefined;
  let activeFadeId = 0;

  const scheduleAutoStartRetry = () => {
    clearTimeout(autoStartRetryTimer);
    autoStartRetryTimer = setTimeout(() => {
      autoStartRetryTimer = undefined;
      if (shouldAutoStart.value && musicState.value === 'music.error') {
        log('Retrying auto-start after cooldown', 'backgroundMusic', 'info');
        playMusic('auto');
      }
    }, AUTO_START_ERROR_COOLDOWN_MS);
  };

  async function playMusic(reason = 'manual') {
    clearTimeout(autoStartRetryTimer);
    activeFadeId += 1;
    autoStartRetryTimer = undefined;

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
        mediaIsActivelyPlaying.value ||
        musicState.value === 'music.starting' ||
        musicState.value === 'music.stopping'
      ) {
        logMusicStartTiming('playback conditions not met', 'debug', {
          enableMusicButton: currentSettings.value?.enableMusicButton,
          mediaIsActivelyPlaying: mediaIsActivelyPlaying.value,
          musicPlaying: musicPlaying.value,
          musicState: musicState.value,
        });
        return;
      }

      log('Starting background music', 'backgroundMusic', 'info');
      musicState.value = 'music.starting';
      logMusicStartTiming('state set to music.starting');

      const downloadStepStartedAt = performance.now();
      downloadBackgroundMusic();
      logMusicStartStep(
        'download background music check dispatched',
        downloadStepStartedAt,
      );

      songList.value = [];
      const player = ensureMusicPlayer();
      player.appendChild(musicPlayerSource.value);
      volume.value = 0;
      logMusicStartTiming('audio source attached and volume set to 0');

      const buildQueueAndGetNextSongUrl = async () => {
        if (!currentSettings.value) return '';

        const fetchLibraryStartedAt = performance.now();
        const rawSongLibrary = demoMode.enabled
          ? getDemoSongLibrary()
          : await fetchSongLibrary(currentSettings.value?.lang || 'E');
        logMusicStartStep('song library fetched', fetchLibraryStartedAt, {
          songs: rawSongLibrary.length,
        });

        const enrichMetadataStartedAt = performance.now();
        const enrichedSongs = await enrichSongsWithMetadata(rawSongLibrary);
        logMusicStartStep('song metadata enriched', enrichMetadataStartedAt, {
          songs: enrichedSongs.length,
        });

        const timeBeforeMeetingStart =
          timeUntilMeeting.value - MEETING_STOP_BUFFER_SECONDS.value;
        logMusicStartTiming('queue preparation started', 'debug', {
          isMeetingToday: isMeetingToday.value,
          timeBeforeMeetingStart,
        });

        if (isMeetingToday.value && timeBeforeMeetingStart > 0) {
          const meetingQueueStartedAt = performance.now();
          const selectedDayMedia = Object.values(
            selectedDateObject.value?.mediaSections ?? {},
          ).flatMap((section) => (section.items ?? []) as MediaItem[]);

          const { queue, startOffsetSeconds } =
            await prepareMeetingDaySongQueue(enrichedSongs, {
              currentSettings: currentSettings.value,
              selectedDayMedia,
              timeBeforeMeetingStart,
            });

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
          songList.value = enrichedSongs;
          initialStartOffset.value = 0;
          shouldLoopQueue.value = true;
          logMusicStartTiming('non-meeting song queue prepared', 'debug', {
            queueLength: songList.value.length,
          });
        }

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
      log(`Playing music from ${nextSongUrl}`, 'backgroundMusic', 'info');

      const loadStartedAt = performance.now();
      logMusicStartTiming('audio load requested');
      musicPlayer.value?.load();
      logMusicStartStep('audio load call returned', loadStartedAt);

      const startTime = initialStartOffset.value;
      if (startTime > 0) {
        log(
          `Starting ${startTime.toFixed(1)}s into first song to align with meeting time`,
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
      try {
        await musicPlayer.value?.play();
        if (isStale()) {
          musicPlayer.value?.pause();
          return;
        }
      } catch (error) {
        if (
          isIgnorablePlaybackError(error instanceof Error ? error.message : '')
        ) {
          logMusicStartTiming('audio play interrupted (ignorable)', 'debug');
          return;
        }
        throw error;
      }
      logMusicStartStep('audio play promise resolved', playStartedAt);
      log(`Music started at ${startTime} seconds`, 'backgroundMusic', 'info');

      // The stop deadline can already have been crossed when a manual start
      // finishes its asynchronous library/download setup. The reactive
      // auto-stop watcher only observes the false -> true transition, so a
      // manual start made after that transition would otherwise escape the
      // deadline forever. Re-check immediately after playback starts; the
      // configured deadline wins even for a manual start.
      if (shouldAutoStop.value) {
        log(
          'Stopping music because the meeting stop deadline has passed',
          'backgroundMusic',
          'info',
        );
        stopMusic();
        return;
      }

      const targetVolume = (currentSettings.value?.musicVolume ?? 100) / 100;
      log(`Fading to volume level ${targetVolume}`, 'backgroundMusic', 'info');
      logMusicStartTiming('fade in starting', 'debug', { targetVolume });
      fadeToVolumeLevel(targetVolume, 1);
    } catch (error) {
      if (isStale()) return;
      musicState.value = 'music.error';
      logMusicStartTiming('start failed', 'warn');
      errorCatcher(error, {
        contexts: {
          fn: {
            lang: currentSettings.value?.lang,
            name: 'playMusic',
            pub: currentState.currentSongbook?.pub,
            reason,
          },
        },
      });
      scheduleAutoStartRetry();
    }
  }

  function stopMusic(manualStop = false, fadeSeconds = 5) {
    musicStartId.value += 1;
    activeFadeId += 1;
    clearTimeout(autoStartRetryTimer);
    autoStartRetryTimer = undefined;
    try {
      log('Stopping background music', 'backgroundMusic', 'info');
      if (!musicPlayer.value || musicPlayer.value.paused) {
        musicState.value = '';
        musicPlayer.value?.pause();
        log('Music already stopped or no player', 'backgroundMusic', 'info');
        return;
      }

      musicState.value = 'music.stopping';
      fadeToVolumeLevel(0, fadeSeconds);
    } catch (error) {
      errorCatcher(error);
    } finally {
      if (manualStop) {
        log('Music stopped manually', 'backgroundMusic', 'info');
        musicAlreadyStoppedManually.value = true;
      }
    }
  }

  async function handleMusicEnded() {
    if (
      !musicPlayer.value ||
      !musicPlayerSource.value ||
      musicState.value !== 'music.playing'
    )
      return;

    const endOperationId = musicStartId.value;
    const { nextSongUrl } = await getNextSongFromQueue(
      songList.value,
      (title) => {
        musicPlayingTitle.value = title;
      },
      shouldLoopQueue.value,
    );

    if (
      endOperationId !== musicStartId.value ||
      (musicState.value as MusicState) === 'music.stopping'
    ) {
      return;
    }

    if (!nextSongUrl) {
      log(
        'Song queue exhausted, stopping background music',
        'backgroundMusic',
        'info',
      );
      musicState.value = '';
      return;
    }

    musicPlayerSource.value.src = nextSongUrl;
    log(
      'Advancing to next background music track',
      'backgroundMusic',
      'debug',
      {
        nextSongUrl,
        title: musicPlayingTitle.value,
      },
    );
    musicPlayer.value?.load();
    musicPlayer.value?.play().catch((error: Error) => {
      if (!isIgnorablePlaybackError(error.message)) {
        errorCatcher(error, {
          contexts: { fn: { name: 'handleMusicEnded' } },
        });
      }
    });
  }

  const fadeToVolumeLevel = (targetVolume: number, fadeSeconds: number) => {
    log(
      `Fading to volume level ${targetVolume} over ${fadeSeconds} seconds`,
      'backgroundMusic',
      'info',
    );

    if (!musicPlayer.value) return;
    targetVolume = Math.min(Math.max(targetVolume, 0), 1);
    const fadeId = ++activeFadeId;

    try {
      const initialVolume = Math.min(musicPlayer.value.volume, 1);
      const volumeChange = targetVolume - initialVolume;
      const startTime = performance.now();

      function updateVolume(currentTime: number) {
        try {
          if (!musicPlayer.value || fadeId !== activeFadeId) return;
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
        } catch {
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

  const toggleMusicListener = () => {
    try {
      if (!currentSettings.value?.enableMusicButton) return;
      if (musicPlaying.value) {
        stopMusic();
      } else {
        log('Music started manually', 'backgroundMusic', 'info');
        playMusic('manual-shortcut');
      }
    } catch (error) {
      errorCatcher(error);
    }
  };

  // BroadcastChannels
  const { post: postBackgroundMusicState } = useBroadcastChannel<
    BackgroundMusicState,
    BackgroundMusicState
  >({ name: 'background-music-state' });

  const { data: backgroundMusicAction } = useBroadcastChannel<
    BackgroundMusicAction,
    BackgroundMusicAction
  >({ name: 'background-music-action' });

  const { data: volumeData } = useBroadcastChannel<number, number>({
    name: 'volume-setter',
  });

  // Listen for external music actions
  watch(
    () => backgroundMusicAction.value?.requestedAt,
    () => {
      const action = backgroundMusicAction.value;
      if (action?.action === 'stop') {
        stopMusic(true, action.fadeSeconds ?? MEDIA_STOP_FADE_DURATION_SECONDS);
      } else if (action?.action === 'start') {
        playMusic(action.reason ?? 'external');
      }
    },
  );

  // Post state changes
  watchImmediate(
    () => [musicPlaying.value, musicState.value] as const,
    ([playing, state]) => {
      postBackgroundMusicState({ playing, state });
    },
  );

  // Volume setter
  whenever(
    () => volumeData.value,
    (val) => {
      try {
        if (!musicPlayer.value || !Number.isInteger(val) || val < 0) return;
        volume.value = Math.min(Math.max(val / 100, 0), 1);
      } catch (error) {
        errorCatcher(error);
      }
    },
  );

  // When playing changes
  whenever(
    () => musicPlaying.value && duration.value > 0,
    () => {
      musicState.value = 'music.playing';
    },
  );

  // Toggle music event
  useEventListener(globalThis, 'toggleMusic', toggleMusicListener, {
    passive: true,
  });

  // Keep meeting deadlines independent of audio currentTime. Auto-start must
  // still fire when the clock enters its window while music is idle.
  useIntervalFn(() => {
    timeUntilMeeting.value = remainingTimeBeforeMeetingStart(getClockDate());
  }, 1000);

  watch(
    () => demoMode.now,
    () => {
      timeUntilMeeting.value = remainingTimeBeforeMeetingStart(getClockDate());
    },
  );

  // Time changes
  watch(
    () => [currentTime.value, selectedDateObject.value?.date],
    (values, oldValues) => {
      const [, newSelectedDate] = values;
      const [, oldSelectedDate] = oldValues || [];
      timeUntilMeeting.value = remainingTimeBeforeMeetingStart(getClockDate());
      if (oldSelectedDate !== newSelectedDate) {
        musicAlreadyStoppedManually.value = false;
        if (musicState.value === 'music.error') {
          musicState.value = '';
        }
      }
    },
    { immediate: true },
  );

  // Auto-start
  watchImmediate(
    () => [shouldAutoStart.value, musicState.value],
    ([shouldStart, state]) => {
      if (
        shouldStart &&
        state !== 'music.starting' &&
        state !== 'music.stopping' &&
        state !== 'music.playing' &&
        state !== 'music.error'
      ) {
        log('Auto-starting background music', 'backgroundMusic', 'info');
        playMusic('auto');
      }
    },
  );

  // Auto-stop
  watch(shouldAutoStop, (shouldStop) => {
    if (shouldStop && musicState.value !== 'music.stopping') {
      log(
        'Auto-stopping background music before meeting',
        'backgroundMusic',
        'info',
      );
      stopMusic();
    }
  });

  // Settings/congregation changes
  watch(
    () =>
      [
        currentSettings.value?.enableMusicButton,
        currentCongregation.value,
        selectedDateObject.value?.date,
        selectedDayMeetingType.value,
      ] as const,
    ([musicEnabled, newCongregation, newDate, newMeetingType], oldValues) => {
      const [, oldCongregation, oldDate, oldMeetingType] = oldValues;
      if (
        !musicEnabled ||
        (newCongregation && oldCongregation !== newCongregation) ||
        newDate !== oldDate ||
        newMeetingType !== oldMeetingType
      ) {
        stopMusic();
      }
    },
  );

  // Source changes are loaded explicitly by the serialized playback path.
  // Keeping a second watcher here causes duplicate load events and can abort a
  // just-started play request on some Chromium versions.

  return {
    autoStartDateTime,
    currentSongRemainingTime,
    displayStatusText,
    duration,
    formatClockTime,
    // Exposed so play/stop buttons (popup + meeting quick-action panels) can
    // disable manual starts while the main meeting media is actively playing.
    mediaIsActivelyPlaying,
    meetingStartDateTime,
    musicPlayer,
    musicPlaying,
    musicPlayingTitle,
    musicState,
    musicStopDateTime,
    playMusic,
    shouldShowMeetingCountdown,
    songList,
    stopMusic,
    summaryColor,
    summaryIcon,
    summaryText,
    timeUntilMusicStops,
    volume,
  };
});
