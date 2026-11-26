<template>
  <SpotlightTour
    v-model:step="tourStep"
    name="zoom-display-tour"
    :steps="steps"
  />
</template>

<script setup lang="ts">
import SpotlightTour from 'components/ui/SpotlightTour.vue';
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomDisplaySetupStore } from 'stores/zoom-display-setup';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// After the Zoom display setup (see DialogZoomDisplaySetup): how to show
// Zoom's window on the TV when it's someone's turn on Zoom, on the real
// buttons. The action island opens the media display's menu for the steps
// pointing into it, and closes it at the end (see ActionIsland).

const { t } = useI18n();

const store = useZoomDisplaySetupStore();
const { tourStep } = storeToRefs(store);
const { mediaWindowVisible } = storeToRefs(useCurrentStateStore());

const MEDIA_DISPLAY_TOGGLE = "[data-wizard-target='media-display-toggle']";
// The steps pointing at Hide, then at Show: the same button, relabelled.
const HIDE_STEP = 1;
const SHOW_STEP = 2;

const steps = computed(() => [
  {
    body: [t('zoom-display-tour-button-body')],
    selector: "[data-wizard-target='media-display-button']",
    title: t('zoom-display-tour-button-title'),
  },
  {
    body: [t('zoom-display-tour-hide-body')],
    selector: MEDIA_DISPLAY_TOGGLE,
    title: t('zoom-display-tour-hide-title'),
  },
  {
    body: [t('zoom-display-tour-show-body')],
    selector: MEDIA_DISPLAY_TOGGLE,
    title: t('zoom-display-tour-show-title'),
  },
]);

// Clicking the button a step points at does what Next does: hiding the
// media display goes on to how to show it again, and showing it ends the
// tour.
watch(mediaWindowVisible, (visible) => {
  if (!visible && tourStep.value === HIDE_STEP) {
    tourStep.value = SHOW_STEP;
  } else if (visible && tourStep.value === SHOW_STEP) {
    store.endTour();
  }
});
</script>
