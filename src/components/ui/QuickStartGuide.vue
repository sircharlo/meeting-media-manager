<template>
  <SpotlightTour
    v-model:step="tourStep"
    name="quick-start-tour"
    :steps="steps"
  />
</template>

<script setup lang="ts">
import SpotlightTour from 'components/ui/SpotlightTour.vue';
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface TourStep {
  body: string[];
  selector: string;
  title: string;
}

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const visible = defineModel<boolean>({ required: true });

// Reuses the exact copy the wizard's own footer-button tutorial steps used
// to show inline (steps 101/102, now cut from the wizard itself) - only the
// delivery mechanism changed, from a mandatory setup screen to an optional
// tour shown once the user is actually looking at the real buttons.
const steps = computed<TourStep[]>(() => {
  const list: TourStep[] = [];

  if (currentSettings.value?.enableMediaDisplayButton) {
    list.push({
      body: [
        t('look-for-this-button-in-m-s-footer'),
        t(
          'clicking-it-will-allow-you-to-temporarily-hide-the-media-and-yeartext-and-reveal-the-zoom-participants-underneath-once-the-zoom-part-is-over-you-can-show-the-yeartext-again-using-the-same-button',
        ),
        t(
          'to-quickly-show-and-hide-zoom-participants-on-the-tv-screens-when-needed-make-sure-that-the-setting-to-use-dual-monitors-in-zoom-is-enabled',
        ),
      ],
      selector: "[data-wizard-target='media-display-button']",
      title: t('media-display'),
    });
  }

  if (currentSettings.value?.enableMusicButton) {
    list.push({
      body: [
        t('also-look-for-this-button-in-m-s-footer'),
        t(
          'clicking-it-will-allow-you-to-start-and-stop-the-playback-of-background-music-music-will-start-playing-automatically-before-a-meeting-is-scheduled-to-start-when-m-is-launched-and-will-also-stop-automatically-before-the-meeting-starts-however-background-music-playback-will-need-to-be-manually-started-after-the-closing-prayer-using-this-button',
        ),
      ],
      selector: "[data-wizard-target='music-button']",
      title: t('setupWizard.backgroundMusic'),
    });
  }

  return list;
});

const currentIndex = ref(0);

// The tour shows while `visible`; ending it (Skip tour / Close) hides it.
const tourStep = computed({
  get: () => (visible.value ? currentIndex.value : null),
  set: (value: null | number) => {
    if (value === null) {
      visible.value = false;
    } else {
      currentIndex.value = value;
    }
  },
});

watch(visible, (isVisible) => {
  if (isVisible) currentIndex.value = 0;
});
</script>
