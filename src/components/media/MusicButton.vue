<template>
  <q-btn
    v-if="currentSettings?.enableMusicButton"
    class="super-rounded"
    :color="
      musicPopup
        ? 'white'
        : !(musicPlaying && musicState === 'music.stopping')
          ? 'white-transparent'
          : 'negative'
    "
    no-caps
    rounded
    :style="musicPlaying ? 'min-width: 110px;' : ''"
    :text-color="
      musicPopup
        ? !(musicPlaying && musicState === 'music.stopping')
          ? 'primary'
          : 'negative'
        : ''
    "
    unelevated
    @click="musicPopup = !musicPopup"
  >
    <q-icon name="mmm-music-note" />
    <div v-if="musicPlaying || musicState === 'music.starting'" class="q-ml-sm">
      {{ musicButtonStatusText }}
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
const { currentSettings } = storeToRefs(currentState);

defineProps<{
  musicButtonStatusText?: string;
  musicPlaying?: boolean;
  musicState?:
    | ''
    | 'music.error'
    | 'music.playing'
    | 'music.starting'
    | 'music.stopping';
}>();

const musicPopup = defineModel<boolean>({ required: true });
</script>
