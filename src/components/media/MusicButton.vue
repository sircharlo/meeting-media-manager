<template>
  <q-btn
    v-if="currentSettings?.enableMusicButton"
    class="super-rounded"
    :color="
      musicPopup
        ? 'white'
        : !(musicPlaying && musicStopping)
          ? 'white-transparent'
          : 'negative'
    "
    no-caps
    rounded
    :style="musicPlaying ? 'min-width: 110px;' : ''"
    :text-color="
      musicPopup
        ? !(musicPlaying && musicStopping)
          ? 'primary'
          : 'negative'
        : ''
    "
    unelevated
    @click="musicPopup = !musicPopup"
  >
    <q-icon name="mmm-music-note" />
    <div v-if="musicPlaying || musicStarting" class="q-ml-sm">
      {{
        musicRemainingTime.includes('music.')
          ? t(musicRemainingTime)
          : musicRemainingTime
      }}
    </div>

    <q-tooltip v-if="!musicPopup" :delay="1000" :offset="[14, 22]">
      {{ t('setupWizard.backgroundMusic') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
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
