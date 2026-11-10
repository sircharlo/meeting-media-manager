<template>
  <span
    aria-hidden="true"
    class="done-check"
    :class="`done-check--${variant}`"
    :style="{ '--done-check-size': `${size}px` }"
  >
    <!-- Pops in and draws its tick when it mounts: show it with v-if at
         the moment something finishes. -->
    <svg focusable="false" viewBox="0 0 24 24">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number;
    /** light: a green tick on white, for a green background; solid: white on green. */
    variant?: 'light' | 'solid';
  }>(),
  { size: 28, variant: 'light' },
);
</script>

<style lang="scss" scoped>
.done-check {
  align-items: center;
  animation: done-check-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  border-radius: 50%;
  display: inline-flex;
  flex: none;
  height: var(--done-check-size);
  justify-content: center;
  width: var(--done-check-size);

  svg {
    fill: none;
    height: 64%;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3;
    width: 64%;
  }

  path {
    animation: done-check-draw 0.32s 0.16s ease-out forwards;
    stroke-dasharray: 24;
    stroke-dashoffset: 24;
  }
}

.done-check--light {
  background: white;

  svg {
    stroke: $positive-strong;
  }
}

.done-check--solid {
  background: $positive-strong;

  svg {
    stroke: white;
  }
}

@keyframes done-check-pop {
  from {
    opacity: 0;
    transform: scale(0.2);
  }
}

@keyframes done-check-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .done-check,
  .done-check path {
    animation: none;
  }

  .done-check path {
    stroke-dashoffset: 0;
  }
}
</style>
