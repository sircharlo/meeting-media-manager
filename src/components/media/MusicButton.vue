<template>
  <q-btn
    v-if="currentSettings?.enableMusicButton"
    :color="
      musicPlaying && musicStopping
        ? 'negative'
        : localMusicPopup
          ? 'white'
          : 'white-transparent'
    "
    :outline="localMusicPopup"
    :style="musicPlaying ? 'min-width: 110px;' : ''"
    class="super-rounded"
    no-caps
    rounded
    unelevated
    @click="localMusicPopup = !localMusicPopup"
  >
    <q-icon name="mmm-music-note" />
    <div v-if="musicPlaying || musicStarting" class="q-ml-sm">
      {{ musicRemainingTime }}
    </div>

    <q-tooltip v-if="!localMusicPopup" :delay="1000" :offset="[14, 22]">
      {{ $t('setupWizard.backgroundMusic') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'src/stores/current-state';
import { ref, watch } from 'vue';

const currentState = useCurrentStateStore();
const {
  currentSettings,
  musicPlaying,
  musicRemainingTime,
  musicStarting,
  musicStopping,
} = storeToRefs(currentState);

const props = defineProps<{
  music: boolean;
}>();

const localMusicPopup = ref(props.music);

const emit = defineEmits(['update:music']);

watch(localMusicPopup, (newValue) => {
  emit('update:music', newValue);
});

watch(
  () => props.music,
  (newValue) => {
    localMusicPopup.value = newValue;
  },
);
</script>
