<template>
  <div class="update-toast">
    <div
      ref="card"
      class="update-toast__card"
      :class="{
        'update-toast__card--filled': isFilled,
        'update-toast__card--revealed': isRevealed,
      }"
    >
      <svg aria-hidden="true" class="update-toast__liquid">
        <path ref="backWave" class="update-toast__wave--back" />
        <path ref="frontWave" class="update-toast__wave--front" />
        <path ref="bubblesPath" class="update-toast__bubbles" />
      </svg>

      <div class="update-toast__views">
        <div class="update-toast__view update-toast__view--progress">
          <progress
            :aria-label="t('update-downloading')"
            class="update-toast__progress"
            max="100"
            :value="reportedPercent"
          />
          <div class="update-toast__text">
            <div class="update-toast__message">
              {{ t('update-downloading-short') }}
            </div>
            <div class="update-toast__caption">{{ caption }}</div>
          </div>
          <div
            aria-hidden="true"
            class="update-toast__percent"
            :style="{ transform: `scale(${percentScale})` }"
          >
            <span
              v-for="column in DIGIT_COLUMNS"
              :key="column"
              class="update-toast__digit"
              :class="{
                'update-toast__digit--hidden': isColumnHidden(column),
              }"
            >
              <span
                class="update-toast__strip"
                :style="{
                  transform: `translateY(${-digitPositions[column] * DIGIT_CELL_PERCENT}%)`,
                }"
              >
                <span v-for="(digit, index) in DIGIT_STRIP" :key="index">
                  {{ digit }}
                </span>
              </span>
            </span>
            <span class="update-toast__percent-sign">%</span>
          </div>
        </div>

        <div class="update-toast__view update-toast__view--done">
          <span class="update-toast__check">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <output class="update-toast__text update-toast__message">
            {{ downloadedMessage }}
          </output>
          <q-btn
            class="update-toast__install"
            :label="t('quit-and-install')"
            no-caps
            rounded
            unelevated
            @click="emit('install')"
          />
        </div>
      </div>

      <q-btn
        class="update-toast__close"
        color="white"
        dense
        flat
        icon="close"
        round
        @click="emit('dismiss')"
      />
    </div>
    <canvas
      v-if="isCelebrating"
      ref="confettiCanvas"
      class="update-toast__confetti"
    />
  </div>
</template>

<script setup lang="ts">
import type { UpdaterProgressInfo, UpdateVersionInfo } from 'src/types';

import {
  useElementSize,
  usePreferredReducedMotion,
  useRafFn,
  useTimeoutFn,
} from '@vueuse/core';
import prettyBytes from 'pretty-bytes';
import {
  advanceConfetti,
  buildBubblesPath,
  buildWaveFillPath,
  type ConfettiPiece,
  createConfetti,
  ProgressSmoother,
  rollingDigitPositions,
  scatter,
  Spring,
} from 'src/utils/update-toast-motion';
import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

interface Bubble {
  age: number;
  life: number;
  radius: number;
  rise: number;
  x: number;
  y: number;
}

type DigitColumn = (typeof DIGIT_COLUMNS)[number];

const DIGIT_COLUMNS = ['hundreds', 'tens', 'ones'] as const;
const DIGIT_STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const DIGIT_CELL_PERCENT = 100 / DIGIT_STRIP.length;

const MAX_FRAME_SECONDS = 1 / 30;
const REVEAL_DELAY_MS = 460;
const NOTIFICATION_GAP_PX = 10;

const WAVE_REST_AMPLITUDE = 2.4;
const WAVE_QUIET_AMPLITUDE = 0.7;
const WAVE_MAX_AMPLITUDE = 20;
const WAVE_FINISH_AMPLITUDE = 14;
const WAVE_OVERSCAN_PX = 30;
const WAVE_MAX_LEAN_PX = 26;
const BACK_WAVE_OFFSET_PX = 7;
const BACK_WAVE_SHIFT = 1.7;
const BUBBLE_ACCELERATION = 70;

const CALM_SPRING = { damping: 27, stiffness: 170 };

const props = defineProps<{
  phase: 'downloaded' | 'downloading';
  progress?: UpdaterProgressInfo;
  versionInfo?: UpdateVersionInfo;
}>();

const emit = defineEmits<{ dismiss: []; install: [] }>();

const { t } = useI18n();

// Read once: the toast is short-lived, and the springs are built from it.
const isCalm = usePreferredReducedMotion().value === 'reduce';

// An update that was already on disk at launch has nothing to celebrate.
const startsFinished = props.phase === 'downloaded';

const card = useTemplateRef<HTMLElement>('card');
const backWave = useTemplateRef<SVGPathElement>('backWave');
const frontWave = useTemplateRef<SVGPathElement>('frontWave');
const bubblesPath = useTemplateRef<SVGPathElement>('bubblesPath');
const confettiCanvas = useTemplateRef<HTMLCanvasElement>('confettiCanvas');

const { height: cardHeight, width: cardWidth } = useElementSize(
  card,
  undefined,
  { box: 'border-box' },
);

const caption = ref(t('update-preparing'));
const isFilled = ref(startsFinished);
const isRevealed = ref(startsFinished);
const isCelebrating = ref(false);
const percentScale = ref(1);
const digitPositions = reactive({ hundreds: 0, ones: 0, tens: 0 });

const smoother = new ProgressSmoother(performance.now());
const level = new Spring(isCalm ? CALM_SPRING : { damping: 9, stiffness: 50 });
const digits = new Spring(
  isCalm ? CALM_SPRING : { damping: 17, stiffness: 170 },
);
const percentPop = new Spring(
  isCalm ? CALM_SPRING : { damping: 14, stiffness: 260 },
);
percentPop.reset(1);

let amplitude = isCalm ? 0 : WAVE_REST_AMPLITUDE;
let wavePhase = 0;
let bubbles: Bubble[] = [];
let bubblesSpawned = 0;
let confetti: ConfettiPiece[] = [];

const reportedPercent = computed(() =>
  Math.round(props.progress?.percent ?? 0),
);

const downloadedMessage = computed(() =>
  props.versionInfo?.isDowngrade
    ? t('update-downloaded-downgrade', { version: props.versionInfo.version })
    : t('update-downloaded-short'),
);

const isColumnHidden = (column: DigitColumn) => {
  if (column === 'hundreds') return digits.value < 99.5;
  return column === 'tens' && digits.value < 9.5;
};

const roundedTo3 = (value: number) => Math.round(value * 1000) / 1000;

const buildCaption = (shownPercent: number, isQuiet: boolean) => {
  const { bytesPerSecond, total } = props.progress ?? {};
  if (!total) return t('update-preparing');
  if (isQuiet) return t('update-waiting-for-network');

  const wholeBytes = { maximumFractionDigits: 0 };
  const shownBytes = (total * shownPercent) / 100;
  const sizes = `${prettyBytes(shownBytes, wholeBytes)} / ${prettyBytes(total, wholeBytes)}`;

  return bytesPerSecond
    ? `${sizes} - (${prettyBytes(bytesPerSecond)}${t('perSecond')})`
    : sizes;
};

const liquidEdgeX = () =>
  (level.value / 100) * (cardWidth.value + WAVE_OVERSCAN_PX * 2) -
  WAVE_OVERSCAN_PX;

const spawnBubbles = (step: number) => {
  const count = Math.min(7, 2 + Math.round(step / 4));

  for (let i = 0; i < count; i++) {
    bubblesSpawned++;
    const seed = bubblesSpawned;
    bubbles.push({
      age: 0,
      life: 0.45 + scatter(seed, 0) * 0.4,
      radius: 1.5 + scatter(seed, 1) * 2.1,
      rise: 30 + scatter(seed, 2) * 50,
      x: liquidEdgeX() - scatter(seed, 3) * 24,
      y: cardHeight.value * (0.45 + scatter(seed, 4) * 0.45),
    });
  }
};

const applyReportedProgress = (percent: number) => {
  const step = smoother.push(percent, performance.now());
  if (isCalm) return;

  percentPop.kick(1.2 + Math.min(step, 30) * 0.16);
  amplitude = Math.min(WAVE_MAX_AMPLITUDE, amplitude + 3 + step * 0.7);
  spawnBubbles(step);
};

const launchConfetti = () => {
  const rect = card.value?.getBoundingClientRect();
  if (isCalm || !rect) return;

  confetti = createConfetti(
    rect.left + rect.width / 2,
    rect.top + rect.height * 0.2,
  );
  isCelebrating.value = true;
};

const { start: revealAfterSplash } = useTimeoutFn(
  () => {
    isRevealed.value = true;
  },
  REVEAL_DELAY_MS,
  { immediate: false },
);

const finish = () => {
  smoother.finish();
  isFilled.value = true;

  if (isCalm) {
    isRevealed.value = true;
    return;
  }

  amplitude = WAVE_FINISH_AMPLITUDE;
  // Without a single progress report the update came from disk, not from a
  // download the user watched.
  if (props.progress) launchConfetti();
  revealAfterSplash();
};

const stepPercent = (shownPercent: number, seconds: number) => {
  digits.target = Math.round(shownPercent);
  digits.step(seconds);
  percentPop.step(seconds);
  percentScale.value = roundedTo3(percentPop.value);

  const positions = rollingDigitPositions(digits.value);
  digitPositions.hundreds = roundedTo3(positions.hundreds);
  digitPositions.ones = roundedTo3(positions.ones);
  digitPositions.tens = roundedTo3(positions.tens);
};

const restingAmplitude = (isQuiet: boolean) => {
  if (isCalm) return 0;
  return isQuiet ? WAVE_QUIET_AMPLITUDE : WAVE_REST_AMPLITUDE;
};

const stepLiquid = (
  shownPercent: number,
  seconds: number,
  isQuiet: boolean,
) => {
  level.target = shownPercent;
  level.step(seconds);

  const settle = 1 - Math.exp(-seconds * 1.7);
  amplitude += (restingAmplitude(isQuiet) - amplitude) * settle;
  wavePhase += seconds * (2.2 + amplitude * 0.3);

  const edgeX = liquidEdgeX();
  const height = cardHeight.value;
  const lean = Math.min(
    WAVE_MAX_LEAN_PX,
    Math.max(-WAVE_MAX_LEAN_PX, level.velocity * 0.28),
  );
  const wave = { amplitude, height, phase: wavePhase };

  frontWave.value?.setAttribute(
    'd',
    buildWaveFillPath({ ...wave, edgeX, lean, shift: 0 }),
  );
  backWave.value?.setAttribute(
    'd',
    buildWaveFillPath({
      ...wave,
      edgeX: edgeX + BACK_WAVE_OFFSET_PX,
      lean: lean * 0.7,
      shift: BACK_WAVE_SHIFT,
    }),
  );
};

const stepBubbles = (seconds: number) => {
  for (const bubble of bubbles) {
    bubble.age += seconds;
    bubble.rise += BUBBLE_ACCELERATION * seconds;
    bubble.y -= bubble.rise * seconds;
  }
  bubbles = bubbles.filter((bubble) => bubble.age < bubble.life);

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

const drawConfetti = (context: CanvasRenderingContext2D) => {
  const ratio = globalThis.devicePixelRatio || 1;
  const { innerHeight, innerWidth } = globalThis;
  const canvas = context.canvas;

  if (canvas.width !== Math.round(innerWidth * ratio)) {
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, innerWidth, innerHeight);

  for (const piece of confetti) {
    context.save();
    context.globalAlpha = 1 - (piece.age / piece.life) ** 2;
    context.fillStyle = piece.color;
    context.translate(piece.x, piece.y);
    context.rotate(piece.rotation);
    context.fillRect(
      -piece.size / 2,
      -piece.size / 3,
      piece.size,
      piece.size * 0.66,
    );
    context.restore();
  }
};

const stepConfetti = (seconds: number) => {
  if (!isCelebrating.value) return;

  confetti = advanceConfetti(confetti, seconds);
  const context = confettiCanvas.value?.getContext('2d');

  if (!context || confetti.length === 0) {
    isCelebrating.value = false;
    return;
  }
  drawConfetti(context);
};

// This toast can stay open for hours waiting to be installed, so the frame
// loop stops as soon as nothing is left to animate.
const { pause: stopAnimating } = useRafFn(
  ({ delta, timestamp }) => {
    const seconds = Math.min(delta / 1000, MAX_FRAME_SECONDS);
    const shownPercent = smoother.valueAt(timestamp);
    const isQuiet = smoother.isQuietAt(timestamp);

    caption.value = buildCaption(shownPercent, isQuiet);
    stepPercent(shownPercent, seconds);
    stepLiquid(shownPercent, seconds, isQuiet);
    stepBubbles(seconds);
    stepConfetti(seconds);

    if (isRevealed.value && !isCelebrating.value) stopAnimating();
  },
  { immediate: !startsFinished },
);

onBeforeUnmount(() => {
  document.documentElement.style.removeProperty('--update-toast-offset');
});

watch(
  () => props.progress?.percent,
  (percent) => {
    if (percent != null) applyReportedProgress(percent);
  },
  { immediate: true },
);

watch(
  () => props.phase,
  (phase) => {
    if (phase === 'downloaded') finish();
  },
);

// Quasar's notifications share this spot at the top of the window, so they
// stack underneath the toast instead of landing on top of it.
watch(
  cardHeight,
  (height) => {
    document.documentElement.style.setProperty(
      '--update-toast-offset',
      `${height + NOTIFICATION_GAP_PX}px`,
    );
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
$update-toast-done: #178a36;
$update-toast-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

.update-toast {
  left: 0;
  margin-inline: auto;
  position: fixed;
  right: 0;
  top: calc(4em + 10px);
  width: min(520px, calc(100vw - 24px));
  z-index: $z-notify;
}

.update-toast-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.5s $update-toast-bounce;
}

.update-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.update-toast-enter-from,
.update-toast-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(0.96);
}

.update-toast__card {
  align-items: center;
  background: $accent-300-dark;
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(15, 20, 40, 0.28);
  color: white;
  display: flex;
  gap: 4px;
  min-height: 76px;
  overflow: hidden;
  padding: 10px 8px 10px 16px;
  position: relative;
  transition: background 0.3s ease;
  user-select: none;
}

.update-toast__liquid {
  height: 100%;
  inset: 0;
  position: absolute;
  width: 100%;

  path {
    transition: fill 0.3s ease;
  }
}

.update-toast__wave--back {
  fill: rgba(112, 164, 255, 0.42);
}

.update-toast__wave--front {
  fill: $primary;
}

.update-toast__bubbles {
  fill: rgba(255, 255, 255, 0.6);
}

.update-toast__card--filled {
  .update-toast__wave--back {
    fill: rgba(33, 186, 69, 0.5);
  }

  .update-toast__wave--front {
    fill: $update-toast-done;
  }
}

// Both views share one grid cell, so swapping them can't change the height.
.update-toast__views {
  display: grid;
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.update-toast__view {
  align-items: center;
  display: flex;
  gap: 12px;
  grid-area: 1 / 1;
  transition:
    opacity 0.18s ease,
    transform 0.22s ease,
    visibility 0.18s;
}

.update-toast__view--done {
  opacity: 0;
  visibility: hidden;
}

.update-toast__card--revealed {
  background: $update-toast-done;

  .update-toast__view--progress {
    opacity: 0;
    transform: scale(0.95);
    visibility: hidden;
  }

  .update-toast__view--done {
    opacity: 1;
    visibility: visible;
  }

  .update-toast__check {
    animation: update-toast-pop 0.5s $update-toast-bounce both;
  }

  .update-toast__check path {
    animation: update-toast-draw 0.32s 0.16s ease-out forwards;
  }

  .update-toast__view--done .update-toast__message {
    animation: update-toast-slide 0.4s 0.06s $update-toast-bounce both;
  }

  .update-toast__install {
    animation: update-toast-pop 0.5s 0.14s $update-toast-bounce both;
  }
}

// For assistive technology only: on screen, the liquid is the progress bar.
.update-toast__progress {
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  width: 1px;
}

.update-toast__text {
  flex: 1;
  min-width: 0;
}

.update-toast__message {
  font-weight: 600;
  line-height: 1.3;
}

.update-toast__caption {
  color: rgba(255, 255, 255, 0.78);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
  margin-top: 2px;
}

.update-toast__percent {
  display: inline-flex;
  flex: none;
  font-size: 26px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1.2;
  transform-origin: right center;
}

.update-toast__digit {
  display: inline-block;
  height: 1.2em;
  overflow: hidden;
  transition: width 0.25s $update-toast-bounce;
  width: 0.64em;
}

.update-toast__digit--hidden {
  width: 0;
}

.update-toast__strip {
  display: block;
  will-change: transform;

  > span {
    display: block;
    height: 1.2em;
    text-align: center;
  }
}

.update-toast__percent-sign {
  align-self: center;
  font-size: 0.62em;
  margin-inline-start: 0.12em;
  opacity: 0.8;
}

.update-toast__check {
  align-items: center;
  background: white;
  border-radius: 50%;
  display: flex;
  flex: none;
  height: 28px;
  justify-content: center;
  width: 28px;

  svg {
    fill: none;
    height: 18px;
    stroke: $update-toast-done;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3;
    width: 18px;
  }

  path {
    stroke-dasharray: 24;
    stroke-dashoffset: 24;
  }
}

.update-toast__install {
  background: white;
  color: $update-toast-done;
  flex: none;
  font-weight: 700;
  transition: transform 0.2s $update-toast-bounce;

  &:hover {
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.94);
  }
}

.update-toast__close {
  flex: none;
  position: relative;
  z-index: 1;
}

.update-toast__confetti {
  height: 100%;
  inset: 0;
  pointer-events: none;
  position: fixed;
  width: 100%;
}

@keyframes update-toast-pop {
  from {
    opacity: 0;
    transform: scale(0.2);
  }
}

@keyframes update-toast-slide {
  from {
    opacity: 0;
    transform: translateX(-14px);
  }
}

@keyframes update-toast-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .update-toast-enter-active,
  .update-toast-leave-active,
  .update-toast__digit,
  .update-toast__view {
    transition: none;
  }

  .update-toast__card--revealed {
    .update-toast__check,
    .update-toast__check path,
    .update-toast__view--done .update-toast__message,
    .update-toast__install {
      animation: none;
    }

    .update-toast__check path {
      stroke-dashoffset: 0;
    }
  }
}
</style>
