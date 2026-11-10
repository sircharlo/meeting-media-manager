<template>
  <svg
    ref="surface"
    aria-hidden="true"
    class="liquid-fill"
    :class="{ 'liquid-fill--done': done }"
    focusable="false"
  >
    <!-- Purely decorative: whoever shows the liquid also gives assistive
         technology the real number (a visually hidden <progress>, say). Its
         parent needs the liquid-host class (see app.scss), and sets the
         colors through the --liquid-* custom properties. -->
    <defs v-if="clipId">
      <clipPath :id="clipId">
        <path ref="clipWave" />
      </clipPath>
    </defs>
    <path ref="backWave" class="liquid-fill__back" />
    <path ref="frontWave" class="liquid-fill__front" />
    <path ref="bubblesPath" class="liquid-fill__bubbles" />
  </svg>
</template>

<script setup lang="ts">
import { useRafFn, useResizeObserver } from '@vueuse/core';
import { useMotionMode } from 'src/composables/useMotionMode';
import {
  buildBubblesPath,
  buildWaveFillPath,
  buildWaveRisePath,
  nextLiquidSeed,
  ProgressSmoother,
  scatter,
  SLOSH_LEVEL_PERCENT,
  sloshAt,
  Spring,
} from 'src/utils/liquid-motion';
import { useTemplateRef, watch } from 'vue';

interface Bubble {
  age: number;
  life: number;
  radius: number;
  rise: number;
  x: number;
  y: number;
}

const props = withDefaults(
  defineProps<{
    /** 'x' fills from the left, like a bar; 'y' from the bottom, like a glass. */
    axis?: 'x' | 'y';
    /**
     * Also draws the liquid's outline into a <clipPath> with this id, so that
     * content over the liquid can switch color where it's covered.
     */
    clipId?: string;
    /** Finished: fills up, splashes and turns green, then lies still. */
    done?: boolean;
    /** Always calm, as if media were playing. */
    gentle?: boolean;
    /** No bubbles: for a liquid too small to show them. */
    noBubbles?: boolean;
    percent: number;
    /** Shrinks the waves, lean and bubbles for a small liquid. */
    scale?: number;
    /**
     * Progress unknown (no size yet, or nothing to measure): the liquid lies
     * in a pool at the bottom, a little under half full, sloshes from side
     * to side and ignores `percent`. Whatever the axis, so that it can't be
     * read as progress. When it stops, a glass flows on to `percent` from
     * where it is; a bar's pool drains away, and the bar fills from nothing.
     */
    sloshing?: boolean;
    /**
     * For progress that moves in exact steps (or a countdown): shows each
     * value as it is, starting from the first one, instead of easing ahead
     * between download reports.
     */
    steady?: boolean;
  }>(),
  { axis: 'x', clipId: undefined, scale: 1 },
);

const emit = defineEmits<{
  /**
   * Every frame but while sloshing: the eased percentage shown, and whether
   * reports stalled.
   */
  frame: [shown: number, isQuiet: boolean];
  /** Each new report, with how many percent it moved the progress. */
  report: [step: number];
}>();

const MAX_FRAME_SECONDS = 1 / 30;
const REST_AMPLITUDE = 2.4;
const QUIET_AMPLITUDE = 0.7;
const MAX_AMPLITUDE = 20;
const FINISH_AMPLITUDE = 14;
const OVERSCAN_PX = 30;
const MIN_OVERSCAN_PX = 4;
const MAX_LEAN_PX = 26;
const BACK_WAVE_OFFSET_PX = 7;
const BACK_WAVE_SHIFT = 1.7;
const BUBBLE_ACCELERATION = 70;
const SETTLED = 0.01;

// Sloshing: how fast it rocks (radians a second), how far it tips (as a share
// of the length of its surface, at most), how much its level bobs, and how
// the opacity pulses instead with reduced motion (once every two seconds).
const SLOSH_SPEED = { gentle: 1.8, lively: 3.6, still: 0 };
const SLOSH_TILT = { gentle: 0.2, lively: 0.42, still: 0 };
const SLOSH_BOB_PERCENT = 4;
const SLOSH_EASING = 3;
const PULSE_SPEED = Math.PI;
const PULSE_MIN_OPACITY = 0.55;

const LIVELY_LEVEL = { damping: 9, stiffness: 50 };
const CALM_SPRING = { damping: 27, stiffness: 170 };

const motion = useMotionMode(() => props.gentle);

const surface = useTemplateRef<SVGSVGElement>('surface');
const backWave = useTemplateRef<SVGPathElement>('backWave');
const frontWave = useTemplateRef<SVGPathElement>('frontWave');
const clipWave = useTemplateRef<SVGPathElement>('clipWave');
const bubblesPath = useTemplateRef<SVGPathElement>('bubblesPath');

const seed = nextLiquidSeed();
const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

// Plain state, not refs: it changes every frame and only ever reaches the
// DOM through setAttribute.
let width = 0;
let height = 0;
let smoother = new ProgressSmoother(performance.now());
let steadyPercent = clampPercent(props.percent);
let amplitude = 0;
let wavePhase = seed;
let bubbles: Bubble[] = [];
let bubblesSpawned = 0;
let sloshTime = seed * 0.37;
let pulseTime = 0;

const isSloshing = () => !!props.sloshing && !props.done;

// A bar's pool draining away, before the bar fills from the left.
let isDraining = false;
const DRAINED_PERCENT = 0.5;

// Which way the liquid fills right now: a pool always rises from the bottom.
const shape = () => (isSloshing() || isDraining ? 'y' : props.axis);

// How much of the sloshing is in the lean, from 0 to 1, so that it eases in
// and out instead of jumping.
let sloshStrength = isSloshing() ? 1 : 0;

const level = new Spring(LIVELY_LEVEL);
if (props.done) {
  smoother.finish();
  level.reset(100);
} else if (props.sloshing) {
  // Poured in; with reduced motion, just there.
  if (motion.value === 'still') level.reset(SLOSH_LEVEL_PERCENT);
} else if (props.steady) {
  level.reset(steadyPercent);
}

const overscan = () => Math.max(MIN_OVERSCAN_PX, OVERSCAN_PX * props.scale);
const bubbleScale = () => Math.min(1, 0.4 + props.scale * 0.6);

// How far into the liquid's box its moving edge has reached.
const edgePosition = () => {
  const span = shape() === 'x' ? width : height;
  return (level.value / 100) * (span + overscan() * 2) - overscan();
};

const restingAmplitude = (isQuiet: boolean) => {
  if (motion.value === 'still' || props.done) return 0;
  if (motion.value === 'gentle' || isQuiet)
    return QUIET_AMPLITUDE * props.scale;
  return REST_AMPLITUDE * props.scale;
};

const spawnBubble = (index: number): Bubble => {
  const life = 0.45 + scatter(index, 0) * 0.4;
  const radius = (1.5 + scatter(index, 1) * 2.1) * bubbleScale();
  const edge = edgePosition();

  if (shape() === 'x') {
    return {
      age: 0,
      life,
      radius,
      rise: 30 + scatter(index, 2) * 50,
      x: edge - scatter(index, 3) * 24 * props.scale,
      y: height * (0.45 + scatter(index, 4) * 0.45),
    };
  }

  // Rising through a glass: from somewhere in the liquid up to its surface.
  const surfaceY = height - edge;
  const depth = Math.max(4, (height - surfaceY) * 0.6);
  return {
    age: 0,
    life,
    radius,
    rise: 20 + scatter(index, 2) * 40,
    x: width * (0.1 + scatter(index, 3) * 0.8),
    y: Math.min(height - 2, surfaceY + 4 + scatter(index, 4) * depth),
  };
};

const spawnBubbles = (step: number) => {
  const count = Math.min(7, 2 + Math.round(step / 4));
  for (let i = 0; i < count; i++) {
    bubblesSpawned++;
    bubbles.push(spawnBubble(seed + bubblesSpawned));
  }
};

// How far a sloshing liquid tips: a share of the length of its surface, but
// never so far that it spills out of (or drains from) a flat box.
const sloshLean = (tilt: number) => {
  const reach = Math.min(width * SLOSH_TILT[motion.value], height * 0.55);
  return reach * tilt * sloshStrength;
};

const drawWaves = (isQuiet: boolean, seconds: number) => {
  level.config =
    motion.value === 'lively' && !isDraining ? LIVELY_LEVEL : CALM_SPRING;
  level.step(seconds);

  const settle = 1 - Math.exp(-seconds * 1.7);
  amplitude += (restingAmplitude(isQuiet) - amplitude) * settle;
  wavePhase += seconds * (2.2 + (amplitude / props.scale) * 0.3);

  const maxLean = MAX_LEAN_PX * props.scale;
  const lean =
    Math.min(maxLean, Math.max(-maxLean, level.velocity * 0.28 * props.scale)) +
    sloshLean(sloshAt(sloshTime).tilt);
  const edge = edgePosition();
  const backOffset = BACK_WAVE_OFFSET_PX * props.scale;
  const wave = { amplitude, height, phase: wavePhase };

  const isBar = shape() === 'x';
  const front = isBar
    ? buildWaveFillPath({ ...wave, edgeX: edge, lean, shift: 0 })
    : buildWaveRisePath({ ...wave, lean, level: edge, shift: 0, width });
  const back = isBar
    ? buildWaveFillPath({
        ...wave,
        edgeX: edge + backOffset,
        lean: lean * 0.7,
        shift: BACK_WAVE_SHIFT,
      })
    : buildWaveRisePath({
        ...wave,
        lean: lean * 0.7,
        level: edge + backOffset,
        shift: BACK_WAVE_SHIFT,
        width,
      });

  frontWave.value?.setAttribute('d', front);
  clipWave.value?.setAttribute('d', front);
  backWave.value?.setAttribute('d', back);
};

const drawBubbles = (seconds: number) => {
  for (const bubble of bubbles) {
    bubble.age += seconds;
    bubble.rise += BUBBLE_ACCELERATION * seconds;
    bubble.y -= bubble.rise * seconds;
  }

  const surfaceY = height - edgePosition();
  bubbles = bubbles.filter(
    (bubble) =>
      bubble.age < bubble.life && (shape() === 'x' || bubble.y > surfaceY),
  );

  bubblesPath.value?.setAttribute(
    'd',
    buildBubblesPath(
      bubbles.map(({ age, life, radius, x, y }) => ({
        radius: radius * (1 - (age / life) ** 3),
        x,
        y,
      })),
    ),
  );
};

// A finished liquid (or a steady one, with reduced motion) lies flat once it
// arrives, and then has nothing left to draw until something changes.
const isSettled = () =>
  !isSloshing() &&
  !isDraining &&
  (props.done || (props.steady && motion.value === 'still')) &&
  Math.abs(level.target - level.value) < SETTLED &&
  Math.abs(level.velocity) < SETTLED &&
  amplitude < SETTLED &&
  bubbles.length === 0;

// With reduced motion a sloshing liquid lies flat, and only its opacity
// slowly pulses, to show that something is still going on.
const pulse = (seconds: number) => {
  const element = surface.value;
  if (!element) return;
  if (isSloshing() && motion.value === 'still') {
    pulseTime += seconds * PULSE_SPEED;
    const strength = 0.5 + 0.5 * Math.cos(pulseTime);
    element.style.opacity = String(
      PULSE_MIN_OPACITY + (1 - PULSE_MIN_OPACITY) * strength,
    );
  } else if (element.style.opacity) {
    element.style.opacity = '';
    pulseTime = 0;
  }
};

const slosh = (seconds: number) => {
  const target = isSloshing() ? 1 : 0;
  sloshStrength +=
    (target - sloshStrength) * (1 - Math.exp(-seconds * SLOSH_EASING));
  sloshTime += seconds * SLOSH_SPEED[motion.value];
  pulse(seconds);
};

const { pause, resume } = useRafFn(({ delta, timestamp }) => {
  const seconds = Math.min(delta / 1000, MAX_FRAME_SECONDS);
  slosh(seconds);

  if (isSloshing()) {
    const bob = sloshAt(sloshTime).bob * SLOSH_BOB_PERCENT * sloshStrength;
    level.target = SLOSH_LEVEL_PERCENT + bob;
    drawWaves(false, seconds);
  } else if (isDraining) {
    emit('frame', 0, false);
    level.target = 0;
    drawWaves(false, seconds);
    if (level.value < DRAINED_PERCENT) startFilling();
  } else {
    const shown = props.steady ? steadyPercent : smoother.valueAt(timestamp);
    const isQuiet =
      !props.steady && !props.done && smoother.isQuietAt(timestamp);

    emit('frame', shown, isQuiet);
    level.target = shown;
    drawWaves(isQuiet, seconds);
  }
  drawBubbles(seconds);

  if (isSettled()) pause();
});

const report = (percent: number) => {
  let step: number;
  if (props.steady) {
    const next = clampPercent(percent);
    step = Math.max(0, next - steadyPercent);
    steadyPercent = next;
  } else {
    step = smoother.push(percent, performance.now());
  }

  emit('report', step);
  resume();
  if (motion.value !== 'lively') return;

  amplitude = Math.min(
    MAX_AMPLITUDE * props.scale,
    amplitude + (3 + step * 0.7) * props.scale,
  );
  if (!props.noBubbles) spawnBubbles(step);
};

const finish = () => {
  smoother.finish();
  steadyPercent = 100;
  resume();
  if (motion.value === 'lively') amplitude = FINISH_AMPLITUDE * props.scale;
};

const restart = () => {
  smoother = new ProgressSmoother(performance.now());
  steadyPercent = clampPercent(props.percent);
  resume();
};

// Downloads start from nothing, so a first report already in hand on mount
// is a step like any other; a steady liquid just starts where it is.
const reportFirstPercent = () => {
  if (!props.steady && props.percent > 0) report(props.percent);
};

// Done sloshing (and draining): on to the real number. A bar starts empty,
// and straight, since it has nothing left of the pool.
function startFilling() {
  if (props.axis === 'x') {
    isDraining = false;
    sloshStrength = 0;
    level.reset(0);
  }
  restart();
  reportFirstPercent();
}

if (!props.done && !props.sloshing) reportFirstPercent();

useResizeObserver(surface, ([entry]) => {
  if (!entry) return;
  width = entry.contentRect.width;
  height = entry.contentRect.height;
  resume();
});

const changeSloshing = (sloshing: boolean) => {
  if (props.done) return;
  resume();
  if (sloshing) {
    // A bar's fill doesn't turn into a pool: a new one pours in.
    if (props.axis === 'x' && !isDraining) level.reset(0);
    isDraining = false;
    return;
  }
  if (props.axis === 'x' && motion.value !== 'still') isDraining = true;
  else startFilling();
};

// One watcher for both, since they often change together (the size of a
// download becomes known along with its first bytes): the end of the
// sloshing then takes the new percentage along, instead of it being
// reported twice.
watch(
  () => [props.percent, !!props.sloshing] as const,
  ([percent, sloshing], [, wasSloshing]) => {
    if (sloshing !== wasSloshing) changeSloshing(sloshing);
    else if (!props.done && !sloshing && !isDraining) report(percent);
  },
);

watch(
  () => props.done,
  (isDone) => {
    isDraining = false;
    if (isDone) finish();
    else restart();
  },
);

watch(motion, () => resume());
</script>

<style lang="scss" scoped>
.liquid-fill {
  height: 100%;
  inset: 0;
  pointer-events: none;
  position: absolute;
  width: 100%;
  // Under everything else in its .liquid-host, which isolates it, but still
  // over the host's own background.
  z-index: -1;

  path {
    transition: fill 0.3s ease;
  }
}

.liquid-fill__back {
  fill: var(--liquid-back, rgba(48, 117, 242, 0.12));
}

.liquid-fill__front {
  fill: var(--liquid-front, rgba(48, 117, 242, 0.22));
}

.liquid-fill__bubbles {
  fill: var(--liquid-bubble, rgba(255, 255, 255, 0.6));
}

.liquid-fill--done {
  .liquid-fill__back {
    fill: var(--liquid-back-done, rgba(33, 186, 69, 0.16));
  }

  .liquid-fill__front {
    fill: var(--liquid-front-done, rgba(33, 186, 69, 0.28));
  }
}
</style>
