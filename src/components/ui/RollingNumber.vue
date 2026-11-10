<template>
  <span
    aria-hidden="true"
    class="rolling-number"
    :style="{ transform: `scale(${popScale})` }"
  >
    <!-- Decorative, like the liquid it usually sits on: the real number
         goes to assistive technology some other way. -->
    <span
      v-for="column in DIGIT_COLUMNS"
      :key="column"
      class="rolling-number__digit"
      :class="{ 'rolling-number__digit--hidden': isColumnHidden(column) }"
    >
      <span
        class="rolling-number__strip"
        :style="{
          transform: `translateY(${-positions[column] * DIGIT_CELL_PERCENT}%)`,
        }"
      >
        <span v-for="(digit, index) in DIGIT_STRIP" :key="index">
          {{ digit }}
        </span>
      </span>
    </span>
    <span v-if="suffix" class="rolling-number__suffix">{{ suffix }}</span>
  </span>
</template>

<script setup lang="ts">
import { useRafFn } from '@vueuse/core';
import { useMotionMode } from 'src/composables/useMotionMode';
import { rollingDigitPositions, Spring } from 'src/utils/liquid-motion';
import { reactive, ref, watch } from 'vue';

type DigitColumn = (typeof DIGIT_COLUMNS)[number];

const props = withDefaults(
  defineProps<{
    /** The highest value it will show (at most 999). */
    max?: number;
    suffix?: string;
    value: number;
  }>(),
  { max: 100, suffix: '' },
);

const DIGIT_COLUMNS = ['hundreds', 'tens', 'ones'] as const;
const DIGIT_STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const DIGIT_CELL_PERCENT = 100 / DIGIT_STRIP.length;
const MAX_FRAME_SECONDS = 1 / 30;
const SETTLED = 0.001;

const LIVELY_DIGITS = { damping: 17, stiffness: 170 };
const LIVELY_POP = { damping: 14, stiffness: 260 };
const CALM_SPRING = { damping: 27, stiffness: 170 };

const motion = useMotionMode();

const digits = new Spring(LIVELY_DIGITS);
digits.reset(Math.round(props.value));
const pop = new Spring(LIVELY_POP);
pop.reset(1);

const positions = reactive(rollingDigitPositions(digits.value, props.max));
const shownValue = ref(digits.value);
const popScale = ref(1);

const roundedTo3 = (value: number) => Math.round(value * 1000) / 1000;

const isColumnHidden = (column: DigitColumn) => {
  if (column === 'hundreds') return shownValue.value < 99.5;
  return column === 'tens' && shownValue.value < 9.5;
};

const isSettled = () =>
  Math.abs(digits.target - digits.value) < SETTLED &&
  Math.abs(digits.velocity) < SETTLED &&
  Math.abs(pop.target - pop.value) < SETTLED &&
  Math.abs(pop.velocity) < SETTLED;

const { pause, resume } = useRafFn(
  ({ delta }) => {
    const seconds = Math.min(delta / 1000, MAX_FRAME_SECONDS);
    const isLively = motion.value === 'lively';
    digits.config = isLively ? LIVELY_DIGITS : CALM_SPRING;
    pop.config = isLively ? LIVELY_POP : CALM_SPRING;
    digits.step(seconds);
    pop.step(seconds);

    shownValue.value = roundedTo3(digits.value);
    popScale.value = roundedTo3(pop.value);
    const next = rollingDigitPositions(digits.value, props.max);
    positions.hundreds = roundedTo3(next.hundreds);
    positions.tens = roundedTo3(next.tens);
    positions.ones = roundedTo3(next.ones);

    if (isSettled()) pause();
  },
  { immediate: false },
);

/** A little bounce, bigger for a bigger jump in what it counts. */
const bump = (step: number) => {
  if (motion.value !== 'lively') return;
  pop.kick(1.2 + Math.min(step, 30) * 0.16);
  resume();
};

defineExpose({ bump });

watch(
  () => props.value,
  (value) => {
    digits.target = Math.round(value);
    resume();
  },
);
</script>

<style lang="scss" scoped>
.rolling-number {
  display: inline-flex;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1.2;
  transform-origin: var(--rolling-number-origin, right center);
}

.rolling-number__digit {
  display: inline-block;
  height: 1.2em;
  overflow: hidden;
  transition: width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 0.64em;
}

.rolling-number__digit--hidden {
  width: 0;
}

.rolling-number__strip {
  display: block;
  will-change: transform;

  > span {
    display: block;
    height: 1.2em;
    text-align: center;
  }
}

.rolling-number__suffix {
  align-self: center;
  font-size: 0.62em;
  margin-inline-start: 0.12em;
  opacity: 0.8;
}

@media (prefers-reduced-motion: reduce) {
  .rolling-number__digit {
    transition: none;
  }
}
</style>
