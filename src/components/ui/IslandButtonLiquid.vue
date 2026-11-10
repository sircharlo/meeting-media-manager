<template>
  <Transition name="island-liquid">
    <LiquidFill
      v-if="showing"
      :key="restartKey"
      axis="y"
      class="island-liquid"
      :class="{ 'island-liquid--open': open }"
      :clip-id="clipId"
      :done="done"
      :percent="percent"
      :scale="0.35"
      :sloshing="sloshing"
    />
  </Transition>
  <Transition name="island-liquid">
    <span
      v-if="showing"
      aria-hidden="true"
      class="island-liquid__ink"
      :class="{
        'island-liquid__ink--done': done,
        'island-liquid__ink--open': open,
      }"
      :style="{ clipPath: `url(#${clipId})` }"
    >
      <!-- The button's content again (its icon, say), in another color,
           where the liquid covers it: so the icon stays readable, and it's
           plain which button is busy. -->
      <slot />
    </span>
  </Transition>
</template>

<script setup lang="ts">
import LiquidFill from 'components/ui/LiquidFill.vue';
import { computed, useId } from 'vue';

// Fills an action island button with liquid, behind its content: white on
// the island's blue, or blue on the white of a button whose popup is open.
// The button needs the liquid-host class (see app.scss).
const props = withDefaults(
  defineProps<{
    /** Finished: fills up and turns green. */
    done?: boolean;
    /** The button's popup is open, so the button is white. */
    open?: boolean;
    percent?: number;
    /** A new value starts a new liquid, from empty. */
    restartKey?: number | string;
    /** While it shows; when it stops showing, the liquid fades away. */
    showing?: boolean;
    sloshing?: boolean;
  }>(),
  { percent: 0, restartKey: 0 },
);

const id = useId();
const clipId = computed(() => `island-liquid-${id}-${props.restartKey}`);
</script>

<style lang="scss" scoped>
.island-liquid {
  --liquid-back: rgba(255, 255, 255, 0.5);
  --liquid-back-done: rgba(33, 186, 69, 0.6);
  --liquid-bubble: rgba(48, 117, 242, 0.55);
  --liquid-front: rgba(255, 255, 255, 0.95);
  --liquid-front-done: #{$positive};
}

.island-liquid--open {
  --liquid-back: rgba(48, 117, 242, 0.3);
  --liquid-bubble: rgba(255, 255, 255, 0.7);
  --liquid-front: #{$primary};
}

.island-liquid__ink {
  align-items: center;
  color: $primary;
  display: flex;
  inset: 0;
  justify-content: center;
  pointer-events: none;
  position: absolute;
  transition: color 0.3s ease;
  // Over the real content even while that pops in (its transform puts it
  // in the same layer as this, and it comes later).
  z-index: 1;
}

.island-liquid__ink--open,
.island-liquid__ink--done {
  color: white;
}

.island-liquid-enter-active {
  transition: opacity 0.2s ease;
}

.island-liquid-leave-active {
  transition: opacity 0.5s ease;
}

.island-liquid-enter-from,
.island-liquid-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .island-liquid-enter-active,
  .island-liquid-leave-active {
    transition: none;
  }
}
</style>
