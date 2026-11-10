<template>
  <Transition name="media-download">
    <div
      v-if="isShowing"
      class="liquid-host media-download"
      :class="{ 'media-download--done': isFinishing }"
    >
      <!-- Over a media item's thumbnail while its file downloads: the
           picture goes grey and fills up with liquid, so it's plain which
           items are ready to play and which are close. -->
      <LiquidFill
        axis="y"
        :done="isFinishing"
        :percent="percent"
        :scale="0.6"
        @frame="onFrame"
        @report="digits?.bump($event)"
      />
      <progress
        :aria-label="t('loading')"
        class="mmm-visually-hidden"
        max="100"
        :value="Math.round(percent)"
      />
      <DoneCheck v-if="isFinishing" :size="30" />
      <RollingNumber
        v-else
        ref="digits"
        class="media-download__percent"
        suffix="%"
        :value="shownPercent"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { DownloadProgressItem } from 'src/types';

import { useTimeoutFn } from '@vueuse/core';
import DoneCheck from 'components/ui/DoneCheck.vue';
import LiquidFill from 'components/ui/LiquidFill.vue';
import RollingNumber from 'components/ui/RollingNumber.vue';
import { useMotionMode } from 'src/composables/useMotionMode';
import { isPendingDownload } from 'src/utils/download-progress';
import { LIQUID_DONE_HOLD_MS } from 'src/utils/liquid-motion';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ progress?: DownloadProgressItem }>();

const { t } = useI18n();
const motion = useMotionMode();
const digits = useTemplateRef<InstanceType<typeof RollingNumber>>('digits');

const shownPercent = ref(0);
const isFinishing = ref(false);

const { start: holdFinished } = useTimeoutFn(
  () => {
    isFinishing.value = false;
  },
  LIQUID_DONE_HOLD_MS,
  { immediate: false },
);

const isDownloading = computed(
  () => !!props.progress && isPendingDownload(props.progress),
);
const isShowing = computed(() => isDownloading.value || isFinishing.value);

const percent = computed(() => {
  if (isFinishing.value) return 100;
  const total = props.progress?.total;
  if (!total) return 0;
  return Math.min(100, ((props.progress?.loaded ?? 0) / total) * 100);
});

const onFrame = (shown: number) => {
  shownPercent.value = Math.round(shown);
};

// A file that has just arrived shows it, full and green, for a moment.
watch(isDownloading, (isNowDownloading, wasDownloading) => {
  if (isNowDownloading || !wasDownloading) return;
  if (!props.progress?.complete || motion.value === 'still') return;
  isFinishing.value = true;
  holdFinished();
});
</script>

<style lang="scss" scoped>
.media-download {
  --liquid-back: rgba(48, 117, 242, 0.35);
  --liquid-back-done: rgba(33, 186, 69, 0.45);
  --liquid-bubble: rgba(255, 255, 255, 0.75);
  --liquid-front: rgba(48, 117, 242, 0.6);
  --liquid-front-done: rgba(23, 138, 54, 0.72);

  align-items: center;
  backdrop-filter: grayscale(0.8) brightness(0.9);
  display: flex;
  inset: 0;
  justify-content: center;
  pointer-events: none;
  position: absolute;
  z-index: 1;
}

.media-download__percent {
  --rolling-number-origin: center;

  color: white;
  font-size: 20px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}

.media-download-enter-active {
  transition: opacity 0.2s ease;
}

.media-download-leave-active {
  transition: opacity 0.5s ease;
}

.media-download-enter-from,
.media-download-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .media-download-enter-active,
  .media-download-leave-active {
    transition: none;
  }
}
</style>
