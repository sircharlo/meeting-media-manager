<template>
  <canvas v-if="isBursting" ref="canvas" class="confetti-burst" />
</template>

<script setup lang="ts">
import { useRafFn } from '@vueuse/core';
import { useMotionMode } from 'src/composables/useMotionMode';
import {
  advanceConfetti,
  type ConfettiPiece,
  createConfetti,
} from 'src/utils/liquid-motion';
import { ref, useTemplateRef } from 'vue';

const MAX_FRAME_SECONDS = 1 / 30;

const motion = useMotionMode();
const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
const isBursting = ref(false);

let pieces: ConfettiPiece[] = [];

const draw = (context: CanvasRenderingContext2D) => {
  const ratio = globalThis.devicePixelRatio || 1;
  const { innerHeight, innerWidth } = globalThis;
  const target = context.canvas;

  if (target.width !== Math.round(innerWidth * ratio)) {
    target.width = Math.round(innerWidth * ratio);
    target.height = Math.round(innerHeight * ratio);
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, innerWidth, innerHeight);

  for (const piece of pieces) {
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

const { pause, resume } = useRafFn(
  ({ delta }) => {
    pieces = advanceConfetti(pieces, Math.min(delta / 1000, MAX_FRAME_SECONDS));
    const context = canvas.value?.getContext('2d');

    if (pieces.length === 0) {
      isBursting.value = false;
      pause();
      return;
    }
    if (context) draw(context);
  },
  { immediate: false },
);

/**
 * Throws a fan of confetti up from a point in the window. Only for a real
 * milestone, and never while media is on the audience's screen.
 */
const burst = (x: number, y: number) => {
  if (motion.value !== 'lively') return false;
  pieces = [...pieces, ...createConfetti(x, y)];
  isBursting.value = true;
  resume();
  return true;
};

defineExpose({ burst });
</script>

<style lang="scss" scoped>
.confetti-burst {
  height: 100%;
  inset: 0;
  pointer-events: none;
  position: fixed;
  width: 100%;
  z-index: $z-notify;
}
</style>
