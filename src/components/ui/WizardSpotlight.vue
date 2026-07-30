<template>
  <Teleport to="body">
    <template v-if="rect">
      <div class="wizard-spotlight-backdrop" :style="backdropStyle" />
      <div
        class="wizard-spotlight"
        :style="{
          height: rect.height + PADDING * 2 + 'px',
          left: rect.left - PADDING + 'px',
          top: rect.top - PADDING + 'px',
          width: rect.width + PADDING * 2 + 'px',
        }"
      >
        <div class="wizard-spotlight__ring" />
      </div>
      <div
        class="wizard-spotlight-arrow"
        :style="{
          left: rect.left + rect.width / 2 - ARROW_WIDTH / 2 + 'px',
          top: rect.top - PADDING - ARROW_GAP - ARROW_HEIGHT + 'px',
        }"
      >
        <svg
          fill="none"
          :height="ARROW_HEIGHT"
          viewBox="0 0 84 110"
          :width="ARROW_WIDTH"
        >
          <path
            d="M42 14 L42 76 M14 52 L42 92 L70 52"
            stroke="white"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="20"
          />
          <path
            d="M42 14 L42 76 M14 52 L42 92 L70 52"
            stroke="var(--q-warning)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="11"
          />
        </svg>
      </div>
    </template>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// Points at a real, currently-rendered element elsewhere in the app (e.g.
// the actual footer button being described) instead of a static icon
// mockup, so the instruction always matches what's really on screen right
// now regardless of window size or nav-drawer state.
const props = defineProps<{
  selector: string;
}>();

const PADDING = 14;

// Deliberately oversized ("comically large" per explicit request) so the
// arrow reads as an attention-grabber, not a subtle hint.
const ARROW_WIDTH = 84;
const ARROW_HEIGHT = 110;
const ARROW_GAP = 14;

const rect = ref<DOMRect | null>(null);
let rafId: null | number = null;

// getBoundingClientRect() always returns a brand-new object, so writing it
// into the ref unconditionally every frame would mark it "changed" (and
// force a re-render of the teleported ring/arrow) 60 times a second even
// when the target hasn't actually moved. Comparing the fields that affect
// this component's own layout first lets most frames skip the write - the
// rAF polling loop itself still runs every frame (simpler and more robust
// against nav-drawer/footer layout shifts than wiring up a ResizeObserver +
// scroll/resize listeners), it just doesn't always touch reactive state.
const rectsDiffer = (a: DOMRect | null, b: DOMRect | null) =>
  a === null || b === null
    ? a !== b
    : a.top !== b.top ||
      a.left !== b.left ||
      a.width !== b.width ||
      a.height !== b.height;

const track = () => {
  const el = document.querySelector<HTMLElement>(props.selector);
  const nextRect = el ? el.getBoundingClientRect() : null;
  if (rectsDiffer(rect.value, nextRect)) {
    rect.value = nextRect;
  }
  rafId = requestAnimationFrame(track);
};

onMounted(track);

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
});

// Exposed so callers (e.g. QuickStartGuide) can anchor their own UI just
// above the arrow's tip instead of at an arbitrary fixed position, without
// duplicating the padding/gap/height math used to place the arrow itself.
const arrowTop = computed(() =>
  rect.value ? rect.value.top - PADDING - ARROW_GAP - ARROW_HEIGHT : null,
);

// How far past the ring's own radius the blur takes to fade in to full
// strength - a soft circular vignette around the target instead of a hard
// rectangular cutout (which, with bands cut straight through the rounded
// action-island pill, produced a visible jagged seam across its curve).
const SPOTLIGHT_FEATHER = 40;

// A single full-viewport layer (rather than four rectangular bands framing
// the ring's rect) masked with a radial gradient centered on the target, so
// the blur/dim fades smoothly outward from it instead of being clipped to a
// hard-edged rectangle - avoids both the seam a straight band edge left
// across the pill's curved outline and the risk of a band ending up with no
// explicit height/width (as the bottom band did) and silently collapsing.
const backdropStyle = computed(() => {
  if (!rect.value) return null;

  const centerX = rect.value.left + rect.value.width / 2;
  const centerY = rect.value.top + rect.value.height / 2;
  // Half the ring's diagonal, so the clear zone fully contains the pill-
  // shaped ring regardless of its width/height ratio.
  const innerRadius =
    Math.hypot(rect.value.width, rect.value.height) / 2 + PADDING;
  const outerRadius = innerRadius + SPOTLIGHT_FEATHER;

  const maskImage = `radial-gradient(circle at ${centerX}px ${centerY}px, transparent ${innerRadius}px, black ${outerRadius}px)`;

  return { maskImage, WebkitMaskImage: maskImage };
});

defineExpose({ arrowTop });

watch(
  () => props.selector,
  () => {
    rect.value = null;
  },
);
</script>

<style scoped>
.wizard-spotlight-backdrop {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  inset: 0;
  pointer-events: none;
  position: fixed;
  z-index: 6009;
}

.wizard-spotlight {
  border-radius: 999px;
  pointer-events: none;
  position: fixed;
  z-index: 6010;
}

.wizard-spotlight__ring {
  /* Deliberately NOT var(--q-primary): the footer buttons this points at
     sit on the primary-colored action-island pill, so a primary-colored
     ring was invisible against its own target. --q-warning (orange) reads
     clearly against that blue pill and against light/dark app backgrounds
     alike. */
  border: 5px solid var(--q-warning);
  border-radius: inherit;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
  inset: 0;
  position: absolute;
}

@media (prefers-reduced-motion: no-preference) {
  .wizard-spotlight__ring {
    animation: wizard-spotlight-pulse 1.8s ease-out infinite;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wizard-spotlight__ring {
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.9),
      0 0 0 10px color-mix(in srgb, var(--q-warning) 45%, transparent);
  }
}

@keyframes wizard-spotlight-pulse {
  0% {
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.9),
      0 0 0 0 color-mix(in srgb, var(--q-warning) 55%, transparent);
  }

  70% {
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.9),
      0 0 0 26px color-mix(in srgb, var(--q-warning) 0%, transparent);
  }

  100% {
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.9),
      0 0 0 0 color-mix(in srgb, var(--q-warning) 0%, transparent);
  }
}

.wizard-spotlight-arrow {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));
  pointer-events: none;
  position: fixed;
  z-index: 6011;
}

@media (prefers-reduced-motion: no-preference) {
  .wizard-spotlight-arrow {
    animation: wizard-spotlight-arrow-bounce 1.1s ease-in-out infinite;
  }
}

@keyframes wizard-spotlight-arrow-bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(14px);
  }
}
</style>
