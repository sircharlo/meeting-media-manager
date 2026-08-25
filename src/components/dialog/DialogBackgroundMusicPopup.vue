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
        <template v-if="songList.length">
          <q-separator class="bg-accent-200" />
          <p class="row card-section-title text-dark-grey q-px-md q-pt-sm">
            {{ t('upcoming-songs') }}
          </p>
          <div class="action-popup__scroll">
            <template v-for="(song, i) in songList" :key="i">
              <div
                class="row items-center q-my-sm q-pl-md action-popup__song-row"
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
            :disable="mediaIsActivelyPlaying || musicState === 'music.starting'"
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
</template>

<script setup lang="ts">
import type { QMenu } from 'quasar';

import { storeToRefs } from 'pinia';
import { formatTime } from 'src/utils/time';
import { useMusicStore } from 'stores/music';
import { onBeforeUnmount, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const open = defineModel<boolean>({ default: false });

const music = useMusicStore();
const {
  currentSongRemainingTime,
  displayStatusText,
  mediaIsActivelyPlaying,
  meetingStartDateTime,
  musicPlaying,
  musicPlayingTitle,
  musicState,
  shouldShowMeetingCountdown,
  songList,
  summaryColor,
  summaryIcon,
  summaryText,
} = storeToRefs(music);
const { formatClockTime, playMusic, stopMusic } = music;

const musicPopup = useTemplateRef<QMenu>('musicPopup');
const popupContent = useTemplateRef<HTMLElement>('popupContent');
let popupResizeObserver: ResizeObserver | undefined;

// Anchored bottom-up (self="bottom middle") so it visually grows out of the
// action island. A ResizeObserver repositions it whenever its rendered size
// actually changes.
watch(popupContent, (el) => {
  popupResizeObserver?.disconnect();
  popupResizeObserver = undefined;
  if (!el) return;
  popupResizeObserver = new ResizeObserver(() => {
    musicPopup.value?.updatePosition();
  });
  popupResizeObserver.observe(el);
});

onBeforeUnmount(() => {
  popupResizeObserver?.disconnect();
});
</script>

<style scoped>
.action-popup__duration {
  font-variant-numeric: tabular-nums;
  min-width: 6ch;
  text-align: center;
  white-space: nowrap;
}

.action-popup__song-row {
  padding-right: 6px;
}

.action-popup__song-row--meeting {
  background: color-mix(in srgb, var(--q-primary) 10%, transparent);
  border-radius: 4px;
}
</style>
