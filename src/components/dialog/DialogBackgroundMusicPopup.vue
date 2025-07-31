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
      class="action-popup q-py-md flex"
      :class="{
        'fit-snugly': musicPlaying && musicState !== 'music.stopping',
      }"
      style="flex-flow: column"
    >
      <div class="card-title row q-px-md q-mb-none">
        {{ t('setupWizard.backgroundMusic') }}
      </div>
      <template v-if="musicPlaying">
        <p class="card-section-title text-dark-grey row q-px-md q-pt-sm">
          {{ t('current-song') }}
        </p>
        <div class="row q-px-md q-pt-xs row">
          <div class="col text-weight-medium">
            {{ musicPlayingTitle }}
          </div>
          <div class="row text-grey">
            {{ currentSongRemainingTime }}
          </div>
        </div>
        <div class="row q-px-md q-pt-sm">
          <q-separator class="bg-accent-200" />
        </div>
        <p class="row card-section-title text-dark-grey q-px-md q-pt-sm">
          {{ t('upcoming-songs') }}
        </p>
        <div class="overflow-auto col">
          <template v-for="(song, i) in songList" :key="i">
            <div class="row q-my-sm q-pl-md q-pr-scroll">
              <div class="col text-weight-medium">
                {{ song.title }}
              </div>
              <div class="row text-grey">
                {{ formatTime(song.duration ?? 0) }}
              </div>
            </div>
          </template>
        </div>
        <div class="row q-px-md q-pt-sm">
          <q-separator class="bg-accent-200" />
        </div>
      </template>
      <div class="row q-px-md q-pt-md">
        <div class="col">
          <div class="row text-subtitle1 text-weight-medium">
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
            @click="playMusic(true)"
          >
            {{ t('play-music') }}
          </q-btn>
          <q-btn
            v-else
            class=""
            color="primary"
            :disable="musicState === 'music.stopping'"
            unelevated
            @click="stopMusic"
          >
            {{ t('stop-music') }}
          </q-btn>
        </div>
      </div>
    </div>
  </q-menu>
  <audio ref="musicPlayer" style="display: none" @ended="musicEnded" />
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
import { remainingTimeBeforeMeetingStart } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { downloadBackgroundMusic } from 'src/helpers/jw-media';
import { getPublicationDirectoryContents } from 'src/utils/fs';
import { getMetadataFromMediaPath } from 'src/utils/media';
import { formatTime } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { fileUrlToPath, parseMediaFile, path, pathToFileURL } =
  window.electronApi;
const { basename } = path;

const open = defineModel<boolean>({ default: false });

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  mediaIsPlaying,
  meetingDay,
  selectedDateObject,
} = storeToRefs(currentState);

// Constants
const MEETING_STOP_BUFFER_SECONDS = computed(
  () => currentSettings.value?.meetingStopBufferSeconds ?? 60,
); // Stop music a user-defined number of seconds before meeting; default to 60 seconds
const AUTO_START_WINDOW_HOURS = 1.25; // Auto-start within 1 hour 15 minutes of meeting
const MEETING_DURATION_HOURS = 1.75; // Assume meeting lasts 1 hour 45 minutes

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

watch(
  () => [currentTime.value, currentState.selectedDateObject?.date],
  ([newTime, selectedDate]) => {
    if (newTime || selectedDate) {
      timeUntilMeeting.value = remainingTimeBeforeMeetingStart();
    }
  },
  { immediate: true },
);

// Music state management
const musicState = ref<
  '' | 'music.error' | 'music.playing' | 'music.starting' | 'music.stopping'
>('');

const musicPlayingTitle = ref('');
const songList = ref<SongItem[]>([]);
const wasStartedManually = ref(false); // Track if music was started manually

// Time calculations - cleaner and more predictable

const isMeetingToday = computed(() => {
  return (
    !!selectedDateObject.value?.today && !!selectedDateObject.value?.meeting
  );
});

// const isMeetingActive = computed(() => {
//   const timeUntil = timeUntilMeeting.value;
//   return timeUntil <= 0 && timeUntil > -(MEETING_DURATION_HOURS * 3600);
// });

const isMeetingOver = computed(() => {
  return timeUntilMeeting.value <= -(MEETING_DURATION_HOURS * 3600);
});

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

  const timeUntil = timeUntilMeeting.value;
  const withinAutoStartWindow =
    timeUntil > MEETING_STOP_BUFFER_SECONDS.value * 1.5 &&
    timeUntil <= AUTO_START_WINDOW_HOURS * 3600;

  return withinAutoStartWindow;
});

const shouldAutoStop = computed(() => {
  if (!musicPlaying.value || wasStartedManually.value) {
    return false;
  }

  return (
    isMeetingToday.value &&
    timeUntilMeeting.value <= MEETING_STOP_BUFFER_SECONDS.value &&
    !isMeetingOver.value
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
  if (!isMeetingToday.value || isMeetingOver.value) {
    return '';
  }

  const timeUntilStop =
    timeUntilMeeting.value - MEETING_STOP_BUFFER_SECONDS.value;
  return timeUntilStop > 0 ? formatTime(timeUntilStop) : formatTime(0);
});

const shouldShowMeetingCountdown = computed(() => {
  return (
    musicState.value !== 'music.stopping' &&
    !wasStartedManually.value &&
    !isMeetingOver.value
  );
});

const displayStatusText = computed(() => {
  switch (musicState.value) {
    case 'music.error':
      return '';
    case 'music.playing':
      if (
        !isMeetingToday.value ||
        isMeetingOver.value ||
        wasStartedManually.value
      ) {
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

// Update music state when playing changes
whenever(
  () => musicPlaying.value,
  () => {
    musicState.value = 'music.playing';
  },
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
      console.log('🎵 Auto-starting background music');
      wasStartedManually.value = false;
      playMusic();
    }
  },
);

// Main auto-stop logic
watch(shouldAutoStop, (shouldStop) => {
  if (shouldStop && musicState.value !== 'music.stopping') {
    console.log('⏹️ Auto-stopping background music before meeting');
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

const musicPopup = useTemplateRef<QMenu>('musicPopup');

// Music player functions
async function playMusic(manualStart = false) {
  console.group('🎵 Background Music Playback');
  try {
    if (
      !currentSettings.value?.enableMusicButton ||
      musicPlaying.value ||
      !musicPlayer.value
    ) {
      console.log('⏭️ Music playback conditions not met');
      console.groupEnd();
      return;
    }

    console.log('🎵 Starting background music');
    musicState.value = 'music.starting';
    if (manualStart) {
      console.log('👆 Music started manually');
      wasStartedManually.value = true;
    }
    downloadBackgroundMusic();
    songList.value = [];
    musicPlayer.value.appendChild(musicPlayerSource.value);
    volume.value = 0;

    const { nextSongDuration, nextSongUrl, secsFromEnd } = await getNextSong();
    if (!nextSongUrl) throw new Error('No next song found');

    musicPlayerSource.value.src = nextSongUrl;
    console.log(
      `🎵 Playing music from ${nextSongUrl} with duration ${nextSongDuration} seconds`,
    );

    musicPlayer.value?.load();
    const startTime = nextSongDuration ? nextSongDuration - secsFromEnd : 0;
    currentTime.value = startTime;

    musicPlayer.value?.play();
    console.log(`🎵 Music started at ${startTime} seconds`);

    const targetVolume = (currentSettings.value?.musicVolume ?? 100) / 100;
    console.log(`🔊 Fading to volume level ${targetVolume}`);
    fadeToVolumeLevel(targetVolume, 1);
  } catch (error) {
    console.log('❌ Error starting music:', error);
    musicState.value = 'music.error';
    errorCatcher(error);
  } finally {
    console.groupEnd();
  }
}

function stopMusic() {
  console.group('⏹️ Background Music Stop');
  try {
    console.log('⏹️ Stopping background music');
    if (!musicPlayer.value || musicPlayer.value.paused) {
      console.log('⏭️ Music already stopped or no player');
      console.groupEnd();
      return;
    }

    musicState.value = 'music.stopping';
    fadeToVolumeLevel(0, 5);
  } catch (error) {
    console.log('❌ Error stopping music:', error);
    errorCatcher(error);
  } finally {
    console.groupEnd();
  }
}

// Music player event handlers
musicPlayer.value?.addEventListener('error', (event) => {
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

watch(
  () => musicPlayerSource.value?.src,
  (newSrc) => {
    if (newSrc) {
      musicPlayer.value?.load();
      console.log(`🎵 Music player source set to ${newSrc}`);
    }
  },
);

const musicEnded = async () => {
  if (
    !musicPlayer.value ||
    !musicPlayerSource.value ||
    musicState.value === 'music.stopping'
  ) {
    return;
  }

  const { nextSongUrl } = await getNextSong();
  if (!nextSongUrl) return;

  musicPlayerSource.value.src = nextSongUrl;
  musicPlayer.value?.load();
  musicPlayer.value?.play();
};

// Song management functions
const getNextSong = async () => {
  try {
    let musicDurationSoFar = 0;
    const timeBeforeMeetingStart =
      timeUntilMeeting.value - MEETING_STOP_BUFFER_SECONDS.value;
    let secsFromEnd = 0;

    if (!songList.value.length) {
      let attempts = 0;
      while (songList.value.length < 10 && attempts < 10) {
        songList.value = (
          await getPublicationDirectoryContents(
            { langwritten: currentSettings.value?.lang || 'E', pub: 'sjjm' },
            'mp3',
            currentState.currentSettings?.cacheFolder,
          )
        ).sort(() => Math.random() - 0.5);

        if (songList.value.length >= 10) break;

        attempts++;
        await new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
      }

      // Get metadata for songs
      for (const queuedSong of songList.value) {
        const metadata = await getMetadataFromMediaPath(queuedSong.path);
        queuedSong.duration = metadata?.format?.duration ?? 0;
        queuedSong.title = metadata?.common.title ?? basename(queuedSong.path);
      }

      // Handle meeting day song selection
      try {
        const selectedDayMedia = selectedDateObject.value?.dynamicMedia ?? [];
        const regex = /(_r\d{3,4}P)?\.\w+$/;

        const selectedDaySongs: SongItem[] = selectedDayMedia
          .map((d) => basename(fileUrlToPath(d.fileUrl?.replace(regex, ''))))
          .map((fileBasename) => {
            const index = songList.value.findIndex(
              (s) => basename(s.path.replace(regex, '') || '') === fileBasename,
            );
            if (index !== -1) {
              return songList.value.splice(index, 1)[0];
            }
            return null;
          })
          .filter((song) => !!song);

        if (timeBeforeMeetingStart > 0) {
          let customSongList: SongItem[] = [];
          if (selectedDaySongs.length) {
            songList.value.push(...selectedDaySongs);
            songList.value.reverse();
          }

          if (songList.value.length) {
            while (musicDurationSoFar < timeBeforeMeetingStart) {
              const queuedSong = songList.value.shift();
              if (!queuedSong) {
                customSongList = songList.value;
                break;
              }
              songList.value.push(queuedSong);
              customSongList.unshift(queuedSong);
              secsFromEnd = timeBeforeMeetingStart - musicDurationSoFar;
              musicDurationSoFar += queuedSong.duration ?? 0;
            }
            songList.value = customSongList;
          }
        }
      } catch (error) {
        errorCatcher(error);
      }
    }

    if (!songList.value.length) {
      return { nextSongUrl: '', secsFromEnd: 0 };
    }

    const nextSong = songList.value.shift();
    if (!nextSong) {
      return { nextSongUrl: '', secsFromEnd: 0 };
    }

    songList.value.push(nextSong);

    try {
      const metadata = await parseMediaFile(nextSong.path);
      musicPlayingTitle.value =
        metadata.common.title ?? basename(nextSong.path);
    } catch (error) {
      errorCatcher(error);
      musicPlayingTitle.value = basename(nextSong.path) ?? '';
    }

    return {
      nextSongDuration: nextSong.duration,
      nextSongUrl: pathToFileURL(nextSong.path),
      secsFromEnd,
    };
  } catch (error) {
    errorCatcher(error);
    return { nextSongUrl: '', secsFromEnd: 0 };
  }
};

// Volume control functions
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

const fadeToVolumeLevel = (targetVolume: number, fadeSeconds: number) => {
  console.log(
    `🔊 Fading to volume level ${targetVolume} over ${fadeSeconds} seconds`,
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
        } else {
          if (musicPlayer.value.volume === 0) {
            musicPlayer.value.pause();
            musicState.value = '';
            wasStartedManually.value = false; // Reset manual flag when stopped
          }
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

// Event listeners
const toggleMusicListener = () => {
  try {
    if (!currentSettings.value?.enableMusicButton) return;

    if (musicPlaying.value) {
      stopMusic();
    } else {
      console.log('👆 Music started manually');
      wasStartedManually.value = true;
      playMusic();
    }
  } catch (error) {
    errorCatcher(error);
  }
};

useEventListener(window, 'toggleMusic', toggleMusicListener, { passive: true });

const { data: volumeData } = useBroadcastChannel<number, number>({
  name: 'volume-setter',
});

whenever(
  () => volumeData.value,
  (val) => {
    setBackgroundMusicVolume(val);
  },
);
</script>
