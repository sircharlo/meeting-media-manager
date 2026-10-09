<template>
  <template v-if="visible && currentStep">
    <WizardSpotlight ref="spotlightRef" :selector="currentStep.selector" />
    <Teleport to="body">
      <q-card class="quick-start-guide-card" :style="cardStyle">
        <q-card-section>
          <div class="text-subtitle1">{{ currentStep.title }}</div>
          <p v-for="paragraph in currentStep.body" :key="paragraph">
            {{ paragraph }}
          </p>
        </q-card-section>
        <q-card-actions align="between" class="q-px-md">
          <div class="text-caption">
            {{
              t('quick-start-step-of', {
                current: tourStep + 1,
                total: steps.length,
              })
            }}
          </div>
          <div class="q-gutter-sm">
            <q-btn
              v-if="!isLastStep"
              flat
              :label="t('skip-tour')"
              @click="finish"
            />
            <q-btn
              color="primary"
              :label="isLastStep ? t('close') : t('next')"
              @click="advance"
            />
          </div>
        </q-card-actions>
      </q-card>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
import WizardSpotlight from 'components/ui/WizardSpotlight.vue';
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
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

const tourStep = ref(0);
const currentStep = computed(() => steps.value[tourStep.value] ?? null);
const isLastStep = computed(() => tourStep.value >= steps.value.length - 1);

const spotlightRef =
  useTemplateRef<InstanceType<typeof WizardSpotlight>>('spotlightRef');

// Anchors the card by its bottom edge just above the arrow's tip, rather
// than at a fixed distance from the top - a fixed top offset let a taller
// card (more body paragraphs, narrower window wrapping more lines) grow
// down far enough to overlap the arrow it's supposed to sit above. Falls
// back to a plain top offset for the brief window before the spotlighted
// element's position is known (first animation frame after mount/selector
// change).
const CARD_TO_ARROW_GAP = 12;
const FALLBACK_TOP = 24;

const cardStyle = computed(() => {
  const arrowTop = spotlightRef.value?.arrowTop;
  if (arrowTop == null) return { top: FALLBACK_TOP + 'px' };

  return { bottom: `calc(100vh - ${arrowTop - CARD_TO_ARROW_GAP}px)` };
});

const finish = () => {
  visible.value = false;
};

const advance = () => {
  if (isLastStep.value) {
    finish();
  } else {
    tourStep.value++;
  }
};

watch(visible, (isVisible) => {
  if (isVisible) tourStep.value = 0;
});
</script>

<style scoped>
/* top/bottom is set inline via :style (see cardStyle) so the card tracks
   the arrow's actual position instead of sitting at a fixed spot - see the
   comment above cardStyle for why. */
.quick-start-guide-card {
  left: 50%;
  max-width: 420px;
  position: fixed;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  z-index: 6012;
}
</style>
