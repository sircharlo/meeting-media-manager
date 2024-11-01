<template>
  <q-btn
    v-if="currentSettings?.enableMusicButton"
    :color="
      musicPopup
        ? 'white'
        : !(musicPlaying && musicStopping)
          ? 'white-transparent'
          : 'negative'
    "
    :style="musicPlaying ? 'min-width: 110px;' : ''"
    :text-color="
      musicPopup
        ? !(musicPlaying && musicStopping)
          ? 'primary'
          : 'negative'
        : ''
    "
    class="super-rounded"
    no-caps
    rounded
    unelevated
    @click="musicPopup = !musicPopup"
  >
    <q-icon name="mmm-music-note" />
    <div v-if="musicPlaying || musicStarting" class="q-ml-sm">
      {{
        musicRemainingTime.includes('music.')
          ? $t(musicRemainingTime)
          : musicRemainingTime
      }}
    </div>

    <q-tooltip v-if="!musicPopup" :delay="1000" :offset="[14, 22]">
      {{ $t('setupWizard.backgroundMusic') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'src/stores/current-state';

const currentState = useCurrentStateStore();
const {
  currentSettings,
  musicPlaying,
  musicRemainingTime,
  musicStarting,
  musicStopping,
} = storeToRefs(currentState);

const musicPopup = defineModel<boolean>({ required: true });
</script>
