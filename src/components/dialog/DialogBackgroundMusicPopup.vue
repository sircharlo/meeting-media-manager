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
        <div class="row q-px-md q-pt-xs q-pb-sm">
          <div class="col text-weight-medium">
            {{ musicPlayingTitle }}
          </div>
          <div class="row text-grey">
            {{ currentSongRemainingTime }}
          </div>
        </div>
        <q-separator class="bg-accent-200" />
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
        <q-separator class="bg-accent-200" />
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
            @click="playMusic()"
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
import { formatTime } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const open = defineModel<boolean>({ default: false });

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
const musicState = ref<
  '' | 'music.error' | 'music.playing' | 'music.starting' | 'music.stopping'
>('');

const musicPlayingTitle = ref('');
const songList = ref<SongItem[]>([]);
const initialStartOffset = ref(0); // Stores the calculated start offset for first song

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

/**
 * Initializes and plays background music
 */
async function playMusic() {
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
    downloadBackgroundMusic();
    songList.value = [];
    musicPlayer.value.appendChild(musicPlayerSource.value);
    volume.value = 0;

    // Fetch and prepare song library
    const rawSongLibrary = await fetchSongLibrary(
      currentSettings.value?.lang || 'E',
    );
    const enrichedSongs = await enrichSongsWithMetadata(rawSongLibrary);

    // Prepare queue based on meeting day or not
    const timeBeforeMeetingStart =
      timeUntilMeeting.value - MEETING_STOP_BUFFER_SECONDS.value;

    if (isMeetingToday.value && timeBeforeMeetingStart > 0) {
      // Meeting day: optimize queue to end precisely at fadeout time
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
    } else {
      // Not a meeting day: just shuffle and play
      songList.value = enrichedSongs;
      initialStartOffset.value = 0;
    }

    // Get and play the first song
    const { nextSongUrl } = await getNextSongFromQueue(
      songList.value,
      (title) => {
        musicPlayingTitle.value = title;
      },
    );

    if (!nextSongUrl) throw new Error('No next song found');

    musicPlayerSource.value.src = nextSongUrl;
    console.log(`🎵 Playing music from ${nextSongUrl}`);

    musicPlayer.value?.load();

    // Apply start offset if we calculated one (for meeting day timing)
    const startTime = initialStartOffset.value;
    if (startTime > 0) {
      console.log(
        `⏩ Starting ${startTime.toFixed(1)}s into first song to align with meeting time`,
      );
    }
    currentTime.value = startTime;

    musicPlayer.value?.play();
    console.log(`🎵 Music started at ${startTime} seconds`);

    // Fade in volume
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

/**
 * Stops background music with fadeout
 */
function stopMusic(manualStop = false) {
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
    if (manualStop) {
      console.log('⏹️ Music stopped manually');
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
  musicPlayer.value?.load();
  musicPlayer.value?.play();
};

/**
 * Fades volume to a target level over specified seconds
 */
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
        } else if (musicPlayer.value.volume === 0) {
          musicPlayer.value.pause();
          musicState.value = '';
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

// Music player error handling
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

// Watch for source changes
watch(
  () => musicPlayerSource.value?.src,
  (newSrc) => {
    if (newSrc) {
      musicPlayer.value?.load();
      console.log(`🎵 Music player source set to ${newSrc}`);
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

// Event listeners
const toggleMusicListener = () => {
  try {
    if (!currentSettings.value?.enableMusicButton) return;

    if (musicPlaying.value) {
      stopMusic();
    } else {
      console.log('👆 Music started manually');
      playMusic();
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

whenever(
  () => volumeData.value,
  (val) => {
    setBackgroundMusicVolume(val);
  },
);
</script>
