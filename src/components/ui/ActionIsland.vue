<template>
  <div id="actionIsland" class="flex" style="justify-content: center">
    <q-chip
      class="action-island"
      color="primary"
      :ripple="false"
      rounded
      size="xl"
    >
      <div class="flex q-gutter-x-md">
        <DownloadStatus v-model="downloadPopup" />
        <q-separator class="bg-semi-white-24" vertical />
        <MusicButton
          v-model="musicPopup"
          :music-button-status-text="musicPopupRef?.musicButtonStatusText"
          :music-playing="musicPopupRef?.musicPlaying"
          :music-state="musicPopupRef?.musicState"
        />
        <SubtitlesButton />
        <ObsStatus v-model="obsPopup" />
        <RecordingStatus
          v-model="recordingPopup"
          :is-recording="isRecording"
          :recording-duration="formattedRecordingDuration"
        />
        <MediaDisplayButton v-model="displayPopup" />
      </div>
      <DialogDownloadsPopup v-model="downloadPopup" />
      <DialogBackgroundMusicPopup ref="musicPopupRef" v-model="musicPopup" />
      <DialogObsPopup v-model="obsPopup" />
      <DialogRecordingPopup
        v-model="recordingPopup"
        :is-recording="isRecording"
        :recording-duration="formattedRecordingDuration"
        @update:is-recording="isRecording = $event"
      />
      <DialogDisplayPopup v-model="displayPopup" dialog-id="display-popup" />
    </q-chip>
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn, whenever } from '@vueuse/core';
import DownloadStatus from 'components/media/DownloadStatus.vue';
import MediaDisplayButton from 'components/media/MediaDisplayButton.vue';
import MusicButton from 'components/media/MusicButton.vue';
import ObsStatus from 'components/media/ObsStatus.vue';
import RecordingStatus from 'components/media/RecordingStatus.vue';
import SubtitlesButton from 'components/media/SubtitlesButton.vue';
import { formatTime } from 'src/utils/time';
import { computed, ref } from 'vue';

import DialogBackgroundMusicPopup from '../dialog/DialogBackgroundMusicPopup.vue';
import DialogDisplayPopup from '../dialog/DialogDisplayPopup.vue';
import DialogDownloadsPopup from '../dialog/DialogDownloadsPopup.vue';
import DialogObsPopup from '../dialog/DialogObsPopup.vue';
import DialogRecordingPopup from '../dialog/DialogRecordingPopup.vue';

const downloadPopup = ref(false);
const musicPopup = ref(false);
const obsPopup = ref(false);
const recordingPopup = ref(false);
const displayPopup = ref(false);
const isRecording = ref(false);

// Recording timer
const recordingStartTime = ref<null | number>(null);
const recordingDurationSeconds = ref(0);

const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(() => {
  if (recordingStartTime.value) {
    recordingDurationSeconds.value = Math.floor(
      (Date.now() - recordingStartTime.value) / 1000,
    );
  }
}, 1000);

whenever(isRecording, (recording) => {
  if (recording) {
    recordingStartTime.value = Date.now();
    recordingDurationSeconds.value = 0;
    resumeTimer();
  } else {
    recordingStartTime.value = null;
    recordingDurationSeconds.value = 0;
    pauseTimer();
  }
});

const formattedRecordingDuration = computed(() =>
  isRecording.value ? formatTime(recordingDurationSeconds.value) : '',
);

const musicPopupRef = ref<InstanceType<
  typeof DialogBackgroundMusicPopup
> | null>(null);

const popups = {
  displayPopup,
  downloadPopup,
  musicPopup,
  obsPopup,
} as const;

// Define a type for the keys of the `popups` object
type PopupKey = keyof typeof popups;

function setActivePopup(activePopup: PopupKey) {
  Object.keys(popups).forEach((key) => {
    popups[key as PopupKey].value = key === activePopup;
  });
}

// Watch each popup and update the others when any one is set to true
Object.keys(popups).forEach((popup) => {
  whenever(popups[popup as PopupKey], () => {
    setActivePopup(popup as PopupKey);
  });
});
</script>
