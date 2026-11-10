<template>
  <span
    aria-hidden="true"
    class="liquid-host liquid-spinner"
    :class="color ? `text-${color}` : undefined"
    :style="{ '--liquid-spinner-size': cssSize }"
  >
    <!-- In place of Quasar's q-spinner, wherever something is busy with no
         telling how far along it is: a small round glass whose liquid
         sloshes. Decorative, as q-spinner is: what's busy says so itself. -->
    <LiquidFill axis="y" no-bubbles :percent="0" :scale="waveScale" sloshing />
  </span>
</template>

<script setup lang="ts">
import LiquidFill from 'components/ui/LiquidFill.vue';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** A Quasar color name; by default, the color of the text around it. */
    color?: string;
    /** A CSS size, or one of Quasar's own: xs, sm, md, lg or xl. */
    size?: string;
  }>(),
  { color: undefined, size: '1em' },
);

// The same sizes as q-spinner's.
const QUASAR_SIZES: Partial<Record<string, string>> = {
  lg: '38px',
  md: '32px',
  sm: '24px',
  xl: '46px',
  xs: '18px',
};

const cssSize = computed(() => QUASAR_SIZES[props.size] ?? props.size);

// Waves big enough to see in a large glass; a small one mostly just tips.
const waveScale = computed(() => {
  const pixels = /^(\d+(?:\.\d+)?)px$/.exec(cssSize.value)?.[1];
  if (!pixels) return 0.15;
  return Math.min(0.6, Math.max(0.12, Number(pixels) / 120));
});
</script>

<style lang="scss" scoped>
.liquid-spinner {
  --liquid-back: color-mix(in srgb, currentColor 45%, transparent);
  --liquid-front: currentColor;

  background: color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 50%;
  display: inline-block;
  flex: none;
  height: var(--liquid-spinner-size);
  vertical-align: middle;
  width: var(--liquid-spinner-size);

  // The glass's rim, over the liquid.
  &::after {
    border: max(1px, calc(var(--liquid-spinner-size) * 0.06)) solid
      color-mix(in srgb, currentColor 35%, transparent);
    border-radius: inherit;
    content: '';
    inset: 0;
    position: absolute;
  }
}

// As big as Quasar draws its own spinner in a button.
.q-btn .liquid-spinner {
  font-size: 1.715em;
}
</style>
