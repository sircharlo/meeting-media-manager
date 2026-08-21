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
        <MusicButton v-model="musicPopup" />
        <SubtitlesButton />
        <ObsStatus v-model="obsPopup" />
        <RecordingStatus v-model="recordingPopup" />
        <TimerButton v-model="timerPopup" />
        <q-separator class="bg-semi-white-24" vertical />
        <MediaDisplayButton v-model="displayPopup" />
      </div>
      <DialogDownloadsPopup v-model="downloadPopup" />
      <DialogBackgroundMusicPopup v-model="musicPopup" />
      <DialogObsPopup v-model="obsPopup" />
      <DialogRecordingPopup v-model="recordingPopup" />
      <DialogDisplayPopup v-model="displayPopup" dialog-id="display-popup" />
      <DialogTimerPopup v-model="timerPopup" dialog-id="timer-popup" />
    </q-chip>
  </div>
</template>

<script setup lang="ts">
import { whenever } from '@vueuse/core';
import DownloadStatus from 'components/media/DownloadStatus.vue';
import MediaDisplayButton from 'components/media/MediaDisplayButton.vue';
import MusicButton from 'components/media/MusicButton.vue';
import ObsStatus from 'components/media/ObsStatus.vue';
import RecordingStatus from 'components/media/RecordingStatus.vue';
import SubtitlesButton from 'components/media/SubtitlesButton.vue';
import TimerButton from 'components/media/TimerButton.vue';
import { ref } from 'vue';

import DialogBackgroundMusicPopup from '../dialog/DialogBackgroundMusicPopup.vue';
import DialogDisplayPopup from '../dialog/DialogDisplayPopup.vue';
import DialogDownloadsPopup from '../dialog/DialogDownloadsPopup.vue';
import DialogObsPopup from '../dialog/DialogObsPopup.vue';
import DialogRecordingPopup from '../dialog/DialogRecordingPopup.vue';
import DialogTimerPopup from '../dialog/DialogTimerPopup.vue';

// Popups
const downloadPopup = ref(false);
const musicPopup = ref(false);
const obsPopup = ref(false);
const recordingPopup = ref(false);
const displayPopup = ref(false);
const timerPopup = ref(false);

const popups = {
  displayPopup,
  downloadPopup,
  musicPopup,
  obsPopup,
  recordingPopup,
  timerPopup,
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
