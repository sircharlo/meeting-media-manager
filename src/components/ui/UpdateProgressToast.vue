<template>
  <div class="update-toast">
    <div
      ref="card"
      class="liquid-host update-toast__card"
      :class="{ 'update-toast__card--revealed': isRevealed }"
    >
      <LiquidFill
        :done="isFilled"
        :percent="progress?.percent ?? 0"
        @frame="onFrame"
        @report="digits?.bump($event)"
      />

      <div class="update-toast__views">
        <div class="update-toast__view update-toast__view--progress">
          <progress
            :aria-label="t('update-downloading')"
            class="mmm-visually-hidden"
            max="100"
            :value="reportedPercent"
          />
          <div class="update-toast__text">
            <div class="update-toast__message">
              {{ t('update-downloading-short') }}
            </div>
            <div class="update-toast__caption">{{ caption }}</div>
          </div>
          <RollingNumber
            ref="digits"
            class="update-toast__percent"
            suffix="%"
            :value="shownPercent"
          />
        </div>

        <div class="update-toast__view update-toast__view--done">
          <DoneCheck v-if="isRevealed" />
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
    <ConfettiBurst ref="confetti" class="update-toast__confetti" />
  </div>
</template>

<script setup lang="ts">
import type { UpdaterProgressInfo, UpdateVersionInfo } from 'src/types';

import { useElementSize, useTimeoutFn } from '@vueuse/core';
import ConfettiBurst from 'components/ui/ConfettiBurst.vue';
import DoneCheck from 'components/ui/DoneCheck.vue';
import LiquidFill from 'components/ui/LiquidFill.vue';
import RollingNumber from 'components/ui/RollingNumber.vue';
import prettyBytes from 'pretty-bytes';
import { useMotionMode } from 'src/composables/useMotionMode';
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const REVEAL_DELAY_MS = 460;
const NOTIFICATION_GAP_PX = 10;

const props = defineProps<{
  phase: 'downloaded' | 'downloading';
  progress?: UpdaterProgressInfo;
  versionInfo?: UpdateVersionInfo;
}>();

const emit = defineEmits<{ dismiss: []; install: [] }>();

const { t } = useI18n();
const motion = useMotionMode();

// An update that was already on disk at launch has nothing to celebrate.
const startsFinished = props.phase === 'downloaded';

const card = useTemplateRef<HTMLElement>('card');
const digits = useTemplateRef<InstanceType<typeof RollingNumber>>('digits');
const confetti = useTemplateRef<InstanceType<typeof ConfettiBurst>>('confetti');

const { height: cardHeight } = useElementSize(card, undefined, {
  box: 'border-box',
});

const caption = ref(t('update-preparing'));
const isFilled = ref(startsFinished);
const isRevealed = ref(startsFinished);
const shownPercent = ref(0);

const reportedPercent = computed(() =>
  Math.round(props.progress?.percent ?? 0),
);

const downloadedMessage = computed(() =>
  props.versionInfo?.isDowngrade
    ? t('update-downloaded-downgrade', { version: props.versionInfo.version })
    : t('update-downloaded-short'),
);

const buildCaption = (shown: number, isQuiet: boolean) => {
  const { bytesPerSecond, total } = props.progress ?? {};
  if (!total) return t('update-preparing');
  if (isQuiet) return t('update-waiting-for-network');

  const wholeBytes = { maximumFractionDigits: 0 };
  const shownBytes = (total * shown) / 100;
  const sizes = `${prettyBytes(shownBytes, wholeBytes)} / ${prettyBytes(total, wholeBytes)}`;

  return bytesPerSecond
    ? `${sizes} - (${prettyBytes(bytesPerSecond)}${t('perSecond')})`
    : sizes;
};

// The liquid eases between electron-updater's sporadic reports, and the
// caption and digits follow what it shows rather than the last report.
const onFrame = (shown: number, isQuiet: boolean) => {
  shownPercent.value = Math.round(shown);
  caption.value = buildCaption(shown, isQuiet);
};

const launchConfetti = () => {
  const rect = card.value?.getBoundingClientRect();
  if (!rect) return;
  confetti.value?.burst(
    rect.left + rect.width / 2,
    rect.top + rect.height * 0.2,
  );
};

const { start: revealAfterSplash } = useTimeoutFn(
  () => {
    isRevealed.value = true;
  },
  REVEAL_DELAY_MS,
  { immediate: false },
);

const finish = () => {
  isFilled.value = true;

  if (motion.value === 'still') {
    isRevealed.value = true;
    return;
  }

  // Without a single progress report the update came from disk, not from a
  // download the user watched.
  if (props.progress) launchConfetti();
  revealAfterSplash();
};

onBeforeUnmount(() => {
  document.documentElement.style.removeProperty('--update-toast-offset');
});

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
  --liquid-back: rgba(112, 164, 255, 0.42);
  --liquid-back-done: rgba(33, 186, 69, 0.5);
  --liquid-bubble: rgba(255, 255, 255, 0.6);
  --liquid-front: #{$primary};
  --liquid-front-done: #{$positive-strong};

  align-items: center;
  background: $accent-300-dark;
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(15, 20, 40, 0.28);
  color: white;
  display: flex;
  gap: 4px;
  min-height: 76px;
  padding: 10px 8px 10px 16px;
  transition: background 0.3s ease;
  user-select: none;
}

// Both views share one grid cell, so swapping them can't change the height.
.update-toast__views {
  display: grid;
  flex: 1;
  min-width: 0;
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
  background: $positive-strong;

  .update-toast__view--progress {
    opacity: 0;
    transform: scale(0.95);
    visibility: hidden;
  }

  .update-toast__view--done {
    opacity: 1;
    visibility: visible;
  }

  .update-toast__view--done .update-toast__message {
    animation: update-toast-slide 0.4s 0.06s $update-toast-bounce both;
  }

  .update-toast__install {
    animation: update-toast-pop 0.5s 0.14s $update-toast-bounce both;
  }
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
  flex: none;
  font-size: 26px;
}

.update-toast__install {
  background: white;
  color: $positive-strong;
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

@media (prefers-reduced-motion: reduce) {
  .update-toast-enter-active,
  .update-toast-leave-active,
  .update-toast__view {
    transition: none;
  }

  .update-toast__card--revealed {
    .update-toast__view--done .update-toast__message,
    .update-toast__install {
      animation: none;
    }
  }
}
</style>
