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
    data-wizard-target="music-button"
    no-caps
    rounded
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
    <div
      class="music-button__clip"
      :style="clipWidth === null ? {} : { width: `${clipWidth}px` }"
    >
      <div ref="measureEl" class="music-button__inner">
        <q-icon name="mmm-music-note" />
        <div
          v-if="musicPlaying || musicState === 'music.starting'"
          class="music-button__status q-ml-sm"
        >
          {{ displayStatusText }}
        </div>
      </div>
    </div>

    <q-tooltip v-if="!musicPopup" :delay="1000" :offset="[14, 22]">
      {{ t('setupWizard.backgroundMusic') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useMusicStore } from 'stores/music';
import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const music = useMusicStore();
const { displayStatusText, musicPlaying, musicState } = storeToRefs(music);

const musicPopup = defineModel<boolean>({ required: true });

// The button's content (icon-only vs icon+status text of varying length)
// changes width whenever playback state changes - starting/playing/
// stopping/idle. `.music-button__clip` is animated to the inner content's
// measured natural width via a ResizeObserver, so the button smoothly
// grows/shrinks instead of snapping between sizes.
const measureEl = useTemplateRef<HTMLElement>('measureEl');
const clipWidth = ref<null | number>(null);
let widthObserver: ResizeObserver | undefined;

watch(measureEl, (el) => {
  widthObserver?.disconnect();
  widthObserver = undefined;
  if (!el) return;
  widthObserver = new ResizeObserver(([entry]) => {
    if (!entry) return;
    clipWidth.value = entry.contentRect.width;
  });
  widthObserver.observe(el);
});

onBeforeUnmount(() => widthObserver?.disconnect());
</script>

<style scoped>
.music-button__clip {
  align-items: center;
  display: flex;
  overflow: hidden;
  transition: width 0.25s ease;
}

.music-button__inner {
  align-items: center;
  display: inline-flex;
  white-space: nowrap;
}

.music-button__status {
  font-variant-numeric: tabular-nums;
  min-width: 6ch;
  text-align: center;
  white-space: nowrap;
}
</style>
