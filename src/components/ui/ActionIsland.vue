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
        <ZoomMeetingManagerButton v-model="zoomMeetingManagerPopup" />
      </div>
      <DialogDownloadsPopup v-model="downloadPopup" />
      <DialogBackgroundMusicPopup v-model="musicPopup" />
      <DialogObsPopup v-model="obsPopup" />
      <DialogRecordingPopup v-model="recordingPopup" />
      <DialogDisplayPopup v-model="displayPopup" dialog-id="display-popup" />
      <DialogZoomMeetingManagerPopup v-model="zoomMeetingManagerPopup" />
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
import ZoomMeetingManagerButton from 'components/media/ZoomMeetingManagerButton.vue';
import { useZoomDisplaySetupStore } from 'stores/zoom-display-setup';
import { ref, watch } from 'vue';

import DialogBackgroundMusicPopup from '../dialog/DialogBackgroundMusicPopup.vue';
import DialogDisplayPopup from '../dialog/DialogDisplayPopup.vue';
import DialogDownloadsPopup from '../dialog/DialogDownloadsPopup.vue';
import DialogObsPopup from '../dialog/DialogObsPopup.vue';
import DialogRecordingPopup from '../dialog/DialogRecordingPopup.vue';
import DialogTimerPopup from '../dialog/DialogTimerPopup.vue';
import DialogZoomMeetingManagerPopup from '../dialog/DialogZoomMeetingManagerPopup.vue';

const zoomDisplaySetup = useZoomDisplaySetupStore();

// Popups
const downloadPopup = ref(false);
const musicPopup = ref(false);
const obsPopup = ref(false);
const recordingPopup = ref(false);
const displayPopup = ref(false);
const zoomMeetingManagerPopup = ref(false);
const timerPopup = ref(false);

const popups = {
  displayPopup,
  downloadPopup,
  musicPopup,
  obsPopup,
  recordingPopup,
  timerPopup,
  zoomMeetingManagerPopup,
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

// The Zoom display setup's tour points at the Hide button in the media
// display's menu (see ZoomDisplaySetupTour): the menu opens for those
// steps, and closes once the tour is over.
watch(
  () => zoomDisplaySetup.tourStep,
  (step, previous) => {
    if (step !== null && step > 0) {
      displayPopup.value = true;
    } else if (step === null && previous !== null && previous > 0) {
      displayPopup.value = false;
    }
  },
);

// Opening the menu by hand on the tour's first step moves the tour on.
whenever(displayPopup, () => {
  if (zoomDisplaySetup.tourStep === 0) zoomDisplaySetup.tourStep = 1;
});
</script>
