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
        <MediaDisplayButton v-model="displayPopup" />
      </div>
      <DialogDownloadsPopup v-model="downloadPopup" />
      <DialogBackgroundMusicPopup v-model="musicPopup" />
      <DialogObsPopup v-model="obsPopup" />
      <DialogDisplayPopup v-model="displayPopup" />
    </q-chip>
  </div>
</template>

<script setup lang="ts">
import { whenever } from '@vueuse/core';
import DownloadStatus from 'components/media/DownloadStatus.vue';
import MediaDisplayButton from 'components/media/MediaDisplayButton.vue';
import MusicButton from 'components/media/MusicButton.vue';
import ObsStatus from 'components/media/ObsStatus.vue';
import SubtitlesButton from 'components/media/SubtitlesButton.vue';
import { ref } from 'vue';

import DialogBackgroundMusicPopup from '../dialog/DialogBackgroundMusicPopup.vue';
import DialogDisplayPopup from '../dialog/DialogDisplayPopup.vue';
import DialogDownloadsPopup from '../dialog/DialogDownloadsPopup.vue';
import DialogObsPopup from '../dialog/DialogObsPopup.vue';

const downloadPopup = ref(false);
const musicPopup = ref(false);
const obsPopup = ref(false);
const displayPopup = ref(false);

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
