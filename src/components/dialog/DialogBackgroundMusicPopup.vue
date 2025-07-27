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
            {{
              musicButtonStatusText.includes('music.')
                ? t(musicButtonStatusText)
                : musicButtonStatusText
            }}
          </div>
          <div
            v-if="
              musicPlaying &&
              musicState !== 'music.stopping' &&
              meetingDay &&
              meetingWillStartSoon
            "
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
            :disable="mediaPlaying || musicState === 'music.starting'"
            unelevated
            @click="playMusic"
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
      <!-- </q-card-section> -->
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

const open = defineModel<boolean>({ default: false });

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  mediaPlaying,
  meetingDay,
  selectedDateObject,
} = storeToRefs(currentState);

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

const currentSongRemainingTime = computed(() => {
  if (musicPlaying.value) {
    return formatTime(duration.value - currentTime.value);
  }
  return t('music.not-playing');
});

const musicState = ref<
  '' | 'music.error' | 'music.playing' | 'music.starting' | 'music.stopping'
>('');

const musicButtonStatusText = computed(() => {
  switch (musicState.value) {
    case 'music.error':
      return '';
    case 'music.playing':
      return !meetingDay.value || meetingShouldBeOver.value
        ? currentSongRemainingTime.value
        : timeRemainingBeforeMusicStop.value;
    case 'music.starting':
      return t('music.starting');
    case 'music.stopping':
      return t('music.stopping');
    default:
      return 'music.not-playing';
  }
});

const meetingStartBufferTime = 60; // seconds before the meeting starts to stop music

defineExpose({
  musicButtonStatusText,
  musicPlaying,
  musicState,
});

whenever(
  () => musicPlaying.value,
  () => {
    musicState.value = 'music.playing';
  },
);

const timeBeforeMeeting = ref(remainingTimeBeforeMeetingStart());

const timeRemainingBeforeMusicStop = computed(() => {
  if (timeBeforeMeeting.value > 0) {
    return formatTime(timeBeforeMeeting.value - meetingStartBufferTime);
  }
  return formatTime(0);
});

const meetingStartBufferIsInPast = computed(() => {
  return (
    timeBeforeMeeting.value <= meetingStartBufferTime // Meeting has started or is starting within the buffer time
  );
});

const meetingShouldBeOver = computed(() => {
  return (
    meetingStartBufferIsInPast.value &&
    timeBeforeMeeting.value <= -(60 * 60 * 1.75) // Meeting started more than 1 hour 45 minutes ago
  );
});

const meetingWillStartSoon = computed(() => {
  return (
    timeBeforeMeeting.value > meetingStartBufferTime && // Current time before meeting is greater than the buffer time
    timeBeforeMeeting.value <= 60 * 60 * 2 // Meeting will start within the next 2 hours
  );
});

watch(currentTime, (newCurrentTime) => {
  // Skip processing if music isn't playing or music player isn't available
  if (newCurrentTime <= 0 || !musicPlayer.value) {
    return;
  }

  // Update remaining time until meeting starts
  timeBeforeMeeting.value = remainingTimeBeforeMeetingStart();

  // Stop music if meeting starts within the specified meetingStartBufferTime and music isn't already stopping
  const shouldStopMusic =
    musicState.value !== 'music.stopping' &&
    meetingDay.value &&
    meetingStartBufferIsInPast.value &&
    !meetingShouldBeOver.value;

  if (shouldStopMusic) {
    stopMusic();
  }
});

const musicPlayingTitle = ref('');
const songList = ref<SongItem[]>([]);

const { fileUrlToPath, parseMediaFile, path, pathToFileURL } =
  window.electronApi;
const { basename } = path;

const toggleMusicListener = () => {
  try {
    if (!currentSettings.value?.enableMusicButton) return;
    if (musicPlaying.value) {
      stopMusic();
    } else {
      playMusic();
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const musicPopup = useTemplateRef<QMenu>('musicPopup');

async function playMusic() {
  try {
    if (
      !currentSettings.value?.enableMusicButton ||
      musicPlaying.value ||
      !musicPlayer.value
    ) {
      return;
    }

    musicState.value = 'music.starting';
    downloadBackgroundMusic();
    songList.value = [];
    musicPlayer.value.appendChild(musicPlayerSource.value);
    volume.value = 0;
    const { nextSongDuration, nextSongUrl, secsFromEnd } = await getNextSong();
    if (!nextSongUrl) throw new Error('No next song found');
    musicPlayerSource.value.src = nextSongUrl;
    console.log(
      `Playing music from ${nextSongUrl} with duration ${nextSongDuration} seconds`,
    );
    musicPlayer.value?.load();
    const startTime = nextSongDuration ? nextSongDuration - secsFromEnd : 0;
    if (!musicPlayer.value) throw new Error('Music player not found');
    currentTime.value = startTime;
    console.log(`Music started at ${startTime} seconds`);
    musicPlaying.value = true;
    console.log('Music is now playing');
    console.log(
      `Fading to volume level ${(currentSettings.value?.musicVolume ?? 100) / 100}`,
    );
    fadeToVolumeLevel((currentSettings.value?.musicVolume ?? 100) / 100, 1);
  } catch (error) {
    errorCatcher(error);
  }
}

musicPlayer.value?.addEventListener('error', (event) => {
  if (event.target instanceof HTMLAudioElement) {
    musicState.value = 'music.error';
    if (event.target.error?.message) {
      if (
        !(
          event.target.error.message.includes('removed from the document') ||
          event.target.error.message.includes('new load request') ||
          event.target.error.message.includes('interrupted by a call to pause')
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
      console.log(`Music player source set to ${newSrc}`);
    }
  },
);

function stopMusic() {
  try {
    console.log('Stopping music');
    console.log(
      `Current music state: ${musicState.value}, Music player paused: ${musicPlayer.value?.paused}`,
    );
    if (!musicPlayer.value || musicPlayer.value.paused) return;
    musicState.value = 'music.stopping';
    fadeToVolumeLevel(0, 5);
  } catch (error) {
    errorCatcher(error);
  }
}

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
  musicPlaying.value = true;
};

const getNextSong = async () => {
  try {
    let musicDurationSoFar = 0;
    const timeBeforeMeetingStart =
      remainingTimeBeforeMeetingStart() - meetingStartBufferTime;
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
        if (songList.value.length >= 10) {
          break;
        }
        attempts++;
        await new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
      }
      for (const queuedSong of songList.value) {
        const metadata = await getMetadataFromMediaPath(queuedSong.path);
        queuedSong.duration = metadata?.format?.duration ?? 0;
        queuedSong.title = metadata?.common.title ?? basename(queuedSong.path);
      }
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
    if (!songList.value.length)
      return {
        nextSongUrl: '',
        secsFromEnd: 0,
      };
    const nextSong = songList.value.shift();
    if (!nextSong) {
      return {
        nextSongUrl: '',
        secsFromEnd: 0,
      };
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
    return {
      nextSongUrl: '',
      secsFromEnd: 0,
    };
  }
};

const setBackgroundMusicVolume = (desiredVolume: number) => {
  try {
    if (
      !musicPlayer.value ||
      !Number.isInteger(desiredVolume) ||
      desiredVolume < 0
    )
      return;
    volume.value = Math.min(Math.max(desiredVolume / 100, 0), 1);
  } catch (error) {
    errorCatcher(error);
  }
};

const fadeToVolumeLevel = (targetVolume: number, fadeOutSeconds: number) => {
  console.log(
    `Fading to volume level ${targetVolume} over ${fadeOutSeconds} seconds`,
  );
  if (!musicPlayer.value) return;
  targetVolume = Math.min(Math.max(targetVolume, 0), 1);
  console.log(
    `Target volume set to ${targetVolume}, current volume is ${musicPlayer.value.volume}`,
  );
  try {
    const initialVolume = Math.min(musicPlayer.value.volume, 1);
    const volumeChange = targetVolume - initialVolume;
    const startTime = performance.now();

    function updateVolume(currentSongTime: number) {
      try {
        if (!musicPlayer.value) return;
        const elapsedTime = currentSongTime - startTime;
        const progress = Math.min(elapsedTime / fadeOutSeconds / 1000, 1);
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
          }
        }
      } catch (error) {
        errorCatcher(error);
        if (!musicPlayer.value) return;
        musicPlayer.value.volume = targetVolume;
      }
    }
    requestAnimationFrame(updateVolume);
  } catch (error) {
    errorCatcher(error);
  }
};

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

watchImmediate(
  () => [
    selectedDateObject.value?.today,
    selectedDateObject.value?.meeting,
    musicPlayer.value,
  ],
  ([newToday, newMeeting]) => {
    try {
      meetingDay.value = !!newToday && !!newMeeting;
      const timeBeforeMeetingStart = remainingTimeBeforeMeetingStart();
      if (
        currentSettings.value?.enableMusicButton && // background music feature is enabled
        currentSettings.value?.autoStartMusic && // auto-start music is enabled
        meetingDay.value && // today is a meeting day
        timeBeforeMeetingStart > meetingStartBufferTime * 1.5 && // meeting is starting in at least meetingStartBufferTime * 1.5
        meetingWillStartSoon.value && // meeting will start soon
        !musicPlaying.value && // music is not already playing
        musicState.value !== 'music.starting' && // music is not already starting
        musicState.value !== 'music.stopping' // music is not already stopping
      ) {
        playMusic();
      }
    } catch (error) {
      errorCatcher(error);
    }
  },
);

watch(
  () => [currentSettings.value?.enableMusicButton, currentCongregation.value],
  ([newMusicButtonEnabled, newCongregation], [, oldCongregation]) => {
    if (
      !newMusicButtonEnabled ||
      !newCongregation ||
      oldCongregation !== newCongregation
    ) {
      stopMusic();
    }
  },
);
/*
const muteBackgroundMusic = () => fadeToVolumeLevel(0.001, 1);
const unmuteBackgroundMusic = () =>
  fadeToVolumeLevel((currentSettings?.value?.musicVolume ?? 100) / 100, 1);

watch(
  () => [mediaPlayingAction.value, mediaPlayingUrl.value],
  ([newAction, newUrl]) => {
    if (newUrl && isVideo(newUrl) && newAction !== 'pause') {
      muteBackgroundMusic();
    } else {
      unmuteBackgroundMusic();
    }
  },
);*/
</script>
