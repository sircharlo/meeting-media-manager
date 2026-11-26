<template>
  <template v-if="currentStep">
    <WizardSpotlight ref="spotlightRef" :selector="currentStep.selector" />
    <Teleport to="body">
      <q-card class="spotlight-tour-card" :style="cardStyle">
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
                current: (step ?? 0) + 1,
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
import { useScreenClaim } from 'src/composables/useScreenClaim';
import { computed, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';

// A short tour of real, currently-rendered elements (see WizardSpotlight):
// one step at a time, each with a card above the spotlight's arrow, and
// Next / Skip tour / Close. The quick-start tour and the Zoom display
// setup's tour are built on it. While it shows, it holds the screen (see
// the attention store): what opens on its own waits for it.

interface TourStep {
  body: string[];
  /** The element pointed at. */
  selector: string;
  title: string;
}

const props = defineProps<{
  /** The tour's name, for the attention store (e.g. 'quick-start-tour'). */
  name: string;
  steps: TourStep[];
}>();

/** The step shown (an index into `steps`); null: the tour is over. */
const step = defineModel<null | number>('step', { required: true });

const { t } = useI18n();

useScreenClaim(props.name, () => step.value !== null);

const currentStep = computed(() =>
  step.value === null ? null : (props.steps[step.value] ?? null),
);
const isLastStep = computed(() => (step.value ?? 0) >= props.steps.length - 1);

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
  step.value = null;
};

const advance = () => {
  if (isLastStep.value) {
    finish();
  } else {
    step.value = (step.value ?? 0) + 1;
  }
};
</script>

<style scoped>
/* top/bottom is set inline via :style (see cardStyle) so the card tracks
   the arrow's actual position instead of sitting at a fixed spot - see the
   comment above cardStyle for why. */
.spotlight-tour-card {
  left: 50%;
  max-width: 420px;
  position: fixed;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  z-index: 6012;
}
</style>
