<template>
  <transition name="media-preview-backdrop">
    <div
      v-if="modalOpen"
      class="media-preview-backdrop"
      @click="modalOpen = false"
    />
  </transition>

  <transition name="media-preview-fade">
    <button
      v-if="showPreview"
      ref="previewButton"
      :aria-label="t('mediaPreview')"
      class="media-preview"
      :class="{
        'media-preview--moving': dragStart || resizeStart,
        'media-preview--fullscreen': modalOpen,
      }"
      draggable="false"
      :style="previewPositionStyle"
      type="button"
      @click="toggleModal()"
      @dragstart.prevent.stop
      @pointerdown="startDrag"
    >
      <span v-if="modalOpen" class="media-preview-close">
        <q-icon name="close" size="sm" />
        <q-tooltip :delay="1000">{{ t('close') }}</q-tooltip>
      </span>
      <div class="media-preview-surface">
        <img
          v-if="imagePreview"
          alt=""
          class="media-preview-content"
          draggable="false"
          :src="currentUrl"
          :style="imageStyle"
          @dragstart.prevent.stop
        />
        <video
          v-else
          ref="previewVideo"
          class="media-preview-content"
          disableRemotePlayback
          draggable="false"
          muted
          playsinline
          preload="metadata"
          :src="currentUrl"
          @canplay="syncVideos()"
          @dragstart.prevent.stop
          @loadedmetadata="syncVideos()"
        />
        <div v-if="showProgress" class="media-preview-progress">
          <div class="media-preview-progress__rail">
            <div class="media-preview-progress__bar" :style="progressStyle" />
          </div>
        </div>
      </div>
      <template v-if="!modalOpen">
        <span
          v-for="handle in resizeHandles"
          :key="handle"
          class="media-preview-resize-handle"
          :class="`media-preview-resize-handle--${handle}`"
          @click.stop
          @dragstart.prevent.stop
          @pointerdown="startResize($event, handle)"
        />
      </template>
      <q-tooltip v-if="!modalOpen" :delay="1000">
        {{ t('mediaPreview') }}
      </q-tooltip>
    </button>
  </transition>
</template>

<script setup lang="ts">
import { useDebounceFn, useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { isImage, isVideo } from 'src/utils/media';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { currentSettings, mediaPlaying } = storeToRefs(useCurrentStateStore());

const modalOpen = ref(false);
const previewButton = useTemplateRef<HTMLButtonElement>('previewButton');
const previewVideo = useTemplateRef<HTMLVideoElement>('previewVideo');
const collapsedBottom = ref<number | undefined>();
const collapsedRight = ref<number | undefined>();
const collapsedWidth = ref<number | undefined>();
const dragStart = ref<{
  bottom: number;
  pointerX: number;
  pointerY: number;
  right: number;
}>();
const dragMoved = ref(false);
const resizeStart = ref<{
  anchorX: number;
  anchorY: number;
  handle: ResizeHandle;
  pointerX: number;
  pointerY: number;
  width: number;
}>();
const resizeMoved = ref(false);
const suppressNextClick = ref(false);

const currentUrl = computed(() => mediaPlaying.value.url);
const imagePreview = computed(() => isImage(currentUrl.value));
const mediaAction = computed(() => mediaPlaying.value.action);
const videoPreview = computed(() => isVideo(currentUrl.value));
const previewEnabled = computed(
  () =>
    !!currentSettings.value?.enableMediaDisplayButton &&
    !!currentSettings.value?.enableMediaPreview,
);
const showPreview = computed(
  () =>
    previewEnabled.value &&
    !!currentUrl.value &&
    (imagePreview.value || videoPreview.value),
);
const showProgress = computed(() => videoPreview.value && modalOpen.value);
const resizeHandles = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const;
type ResizeHandle = (typeof resizeHandles)[number];
const viewportMargin = 8;
const viewportSnapshot = ref({
  height: globalThis.innerHeight,
  width: globalThis.innerWidth,
});

const reportPreviewError = (error: unknown, name: string) => {
  // Preview playback is best-effort; the media window remains authoritative.
  errorCatcher(error, {
    contexts: {
      fn: {
        mediaAction: mediaAction.value,
        name,
        url: currentUrl.value,
      },
    },
  });
};

const syncVideoElement = async (element: HTMLVideoElement | null) => {
  try {
    if (!element) {
      log('No video element for video preview', 'mediaPreview');
      return;
    }

    if (!isVideo(currentUrl.value)) {
      log('Video not available for video preview', 'mediaPreview');
      return;
    }

    if (mediaAction.value !== 'play') {
      log('Pausing video preview', 'mediaPreview');
      element.pause();
      return;
    }

    if (!element.muted) {
      log('Muting video preview', 'mediaPreview');
      element.muted = true;
    }

    const playbackRate = mediaPlaying.value.playbackRate || 1;
    if (element.playbackRate !== playbackRate) {
      log('Syncing video preview playback speed', 'mediaPreview');
      element.playbackRate = playbackRate;
    }

    if (element.paused) {
      log('Playing video preview', 'mediaPreview');
      await element.play().catch((error: unknown) => {
        reportPreviewError(error, 'MediaPreview.syncVideoElement.play');
      });
    }

    const expectedPosition = mediaPlaying.value.currentPosition || 0;
    const currentDrift = Math.abs(element.currentTime - expectedPosition);
    const acceptableDrift = 0.2 * playbackRate;
    const excessiveDrift = currentDrift - acceptableDrift;
    if (excessiveDrift > 0) {
      log(
        `Syncing video preview (exceeded acceptable drift by ${excessiveDrift.toFixed(2)}s)`,
        'mediaPreview',
      );
      element.currentTime = expectedPosition;
    }
  } catch (error) {
    reportPreviewError(error, 'MediaPreview.syncVideoElement');
  }
};

const syncVideos = async () => {
  try {
    await nextTick();
    await syncVideoElement(previewVideo.value);
  } catch (error) {
    reportPreviewError(error, 'MediaPreview.syncVideos');
  }
};

const closeModalWhenHidden = () => {
  if (!showPreview.value) modalOpen.value = false;
};

const toggleModal = () => {
  if (suppressNextClick.value) {
    suppressNextClick.value = false;
    return;
  }

  modalOpen.value = !modalOpen.value;
  syncVideos();
};

const previewPositionStyle = computed(() => {
  const style: Record<string, string> = {};
  const position = getClampedCollapsedPosition();

  style['--media-preview-bottom'] = `${position.bottom}px`;
  style['--media-preview-right'] = `${position.right}px`;

  if (collapsedWidth.value !== undefined) {
    style['--media-preview-width'] =
      `${clampCollapsedWidth(collapsedWidth.value)}px`;
  }

  return style;
});

const getCollapsedWidth = () => {
  const element = previewButton.value;
  const bounds = element?.getBoundingClientRect();
  return clampCollapsedWidth(collapsedWidth.value ?? bounds?.width ?? 0);
};

const getCollapsedHeight = (width = getCollapsedWidth()) => {
  return width * (9 / 16);
};

const getCurrentCollapsedPosition = () => {
  const element = previewButton.value;
  const bounds = element?.getBoundingClientRect();

  if (!bounds) {
    return {
      bottom: collapsedBottom.value ?? 72,
      right: collapsedRight.value ?? 16,
    };
  }

  return {
    bottom: collapsedBottom.value ?? globalThis.innerHeight - bounds.bottom,
    right: collapsedRight.value ?? globalThis.innerWidth - bounds.right,
  };
};

const getClampedCollapsedPosition = (
  right = getCurrentCollapsedPosition().right,
  bottom = getCurrentCollapsedPosition().bottom,
  width = getCollapsedWidth(),
) => {
  const height = getCollapsedHeight(width);
  const maxRight = Math.max(0, globalThis.innerWidth - width);
  const maxBottom = Math.max(0, globalThis.innerHeight - height);

  return {
    bottom: Math.min(Math.max(0, bottom), maxBottom),
    right: Math.min(Math.max(0, right), maxRight),
  };
};

const clampCollapsedWidth = (
  width: number,
  handle?: ResizeHandle,
  anchorX?: number,
  anchorY?: number,
) => {
  const minimumPreferredWidth = globalThis.innerWidth < 600 ? 132 : 180;
  const viewportMaxWidth = Math.max(
    1,
    globalThis.innerWidth - viewportMargin * 2,
  );
  const viewportMaxHeightWidth = Math.max(
    1,
    (globalThis.innerHeight - viewportMargin * 2) * (16 / 9),
  );
  const minWidth = Math.min(
    minimumPreferredWidth,
    viewportMaxWidth,
    viewportMaxHeightWidth,
  );
  const currentPosition = getCurrentCollapsedPosition();
  const { bottom, right } = currentPosition;
  let maxWidth = Math.min(
    Math.max(minWidth, globalThis.innerWidth - right),
    Math.max(minWidth, (globalThis.innerHeight - bottom) * (16 / 9)),
    globalThis.innerWidth * 0.6,
    520,
    viewportMaxWidth,
    viewportMaxHeightWidth,
  );

  if (handle && anchorX !== undefined && anchorY !== undefined) {
    const maxByAnchor = {
      'bottom-left': Math.min(
        anchorX,
        (globalThis.innerHeight - anchorY) * (16 / 9),
      ),
      'bottom-right': Math.min(
        globalThis.innerWidth - anchorX,
        (globalThis.innerHeight - anchorY) * (16 / 9),
      ),
      'top-left': Math.min(anchorX, anchorY * (16 / 9)),
      'top-right': Math.min(
        globalThis.innerWidth - anchorX,
        anchorY * (16 / 9),
      ),
    }[handle];

    maxWidth = Math.min(maxWidth, Math.max(minWidth, maxByAnchor));
  }

  return Math.min(Math.max(width, minWidth), maxWidth);
};

const normalizeCollapsedPreviewAfterResize = () => {
  if (modalOpen.value) return;

  const previousViewport = viewportSnapshot.value;
  const element = previewButton.value;
  const bounds = element?.getBoundingClientRect();
  const width = getCollapsedWidth();
  const height = getCollapsedHeight(width);
  const position = getCurrentCollapsedPosition();
  const previousLeft =
    bounds?.left ?? previousViewport.width - position.right - width;
  const previousTop =
    bounds?.top ?? previousViewport.height - position.bottom - height;
  const previousRight = position.right;
  const previousBottom = position.bottom;

  if (collapsedWidth.value !== undefined) {
    collapsedWidth.value = clampCollapsedWidth(collapsedWidth.value);
  }

  const nextWidth = getCollapsedWidth();
  const nextHeight = getCollapsedHeight(nextWidth);
  const useLeftAnchor = previousLeft <= previousRight;
  const useTopAnchor = previousTop <= previousBottom;
  const horizontalRatio = useLeftAnchor
    ? previousLeft / Math.max(previousViewport.width, 1)
    : previousRight / Math.max(previousViewport.width, 1);
  const verticalRatio = useTopAnchor
    ? previousTop / Math.max(previousViewport.height, 1)
    : previousBottom / Math.max(previousViewport.height, 1);
  const nextLeft = horizontalRatio * globalThis.innerWidth;
  const nextTop = verticalRatio * globalThis.innerHeight;
  const nextRight = useLeftAnchor
    ? globalThis.innerWidth - nextLeft - nextWidth
    : horizontalRatio * globalThis.innerWidth;
  const nextBottom = useTopAnchor
    ? globalThis.innerHeight - nextTop - nextHeight
    : verticalRatio * globalThis.innerHeight;
  const nextPosition = getClampedCollapsedPosition(
    nextRight,
    nextBottom,
    nextWidth,
  );

  collapsedBottom.value = nextPosition.bottom;
  collapsedRight.value = nextPosition.right;
  viewportSnapshot.value = {
    height: globalThis.innerHeight,
    width: globalThis.innerWidth,
  };
};

const debouncedNormalizeCollapsedPreviewAfterResize = useDebounceFn(
  normalizeCollapsedPreviewAfterResize,
  80,
);

const startDrag = (event: PointerEvent) => {
  if (modalOpen.value) return;

  const element = previewButton.value;
  if (!element) return;

  event.stopPropagation();

  dragMoved.value = false;
  const position = getCurrentCollapsedPosition();
  dragStart.value = {
    bottom: position.bottom,
    pointerX: event.clientX,
    pointerY: event.clientY,
    right: position.right,
  };

  element.setPointerCapture(event.pointerId);
};

const startResize = (event: PointerEvent, handle: ResizeHandle) => {
  if (modalOpen.value) return;

  const element = previewButton.value;
  if (!element) return;

  event.preventDefault();
  event.stopPropagation();

  resizeMoved.value = false;
  const bounds = element.getBoundingClientRect();
  const anchor = {
    'bottom-left': { x: bounds.right, y: bounds.top },
    'bottom-right': { x: bounds.left, y: bounds.top },
    'top-left': { x: bounds.right, y: bounds.bottom },
    'top-right': { x: bounds.left, y: bounds.bottom },
  }[handle];

  resizeStart.value = {
    anchorX: anchor.x,
    anchorY: anchor.y,
    handle,
    pointerX: event.clientX,
    pointerY: event.clientY,
    width: bounds.width,
  };

  element.setPointerCapture(event.pointerId);
};

useEventListener(globalThis, 'pointermove', (event) => {
  const pointerEvent = event as PointerEvent;
  if (resizeStart.value && !modalOpen.value) {
    const { anchorX, anchorY, handle } = resizeStart.value;
    const widthFromPointer = {
      'bottom-left': Math.max(
        anchorX - pointerEvent.clientX,
        (pointerEvent.clientY - anchorY) * (16 / 9),
      ),
      'bottom-right': Math.max(
        pointerEvent.clientX - anchorX,
        (pointerEvent.clientY - anchorY) * (16 / 9),
      ),
      'top-left': Math.max(
        anchorX - pointerEvent.clientX,
        (anchorY - pointerEvent.clientY) * (16 / 9),
      ),
      'top-right': Math.max(
        pointerEvent.clientX - anchorX,
        (anchorY - pointerEvent.clientY) * (16 / 9),
      ),
    }[handle];
    const width = clampCollapsedWidth(
      widthFromPointer,
      handle,
      anchorX,
      anchorY,
    );
    const height = width * (9 / 16);
    const nextBounds = {
      'bottom-left': {
        left: anchorX - width,
        top: anchorY,
      },
      'bottom-right': {
        left: anchorX,
        top: anchorY,
      },
      'top-left': {
        left: anchorX - width,
        top: anchorY - height,
      },
      'top-right': {
        left: anchorX,
        top: anchorY - height,
      },
    }[handle];

    if (
      Math.abs(pointerEvent.clientX - resizeStart.value.pointerX) > 3 ||
      Math.abs(pointerEvent.clientY - resizeStart.value.pointerY) > 3
    ) {
      resizeMoved.value = true;
    }

    collapsedWidth.value = width;
    const nextPosition = getClampedCollapsedPosition(
      globalThis.innerWidth - nextBounds.left - width,
      globalThis.innerHeight - nextBounds.top - height,
      width,
    );
    collapsedBottom.value = nextPosition.bottom;
    collapsedRight.value = nextPosition.right;
    return;
  }

  if (!dragStart.value || modalOpen.value) return;

  const deltaX = pointerEvent.clientX - dragStart.value.pointerX;
  const deltaY = pointerEvent.clientY - dragStart.value.pointerY;

  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    dragMoved.value = true;
  }

  const nextPosition = getClampedCollapsedPosition(
    dragStart.value.right - deltaX,
    dragStart.value.bottom - deltaY,
  );

  collapsedBottom.value = nextPosition.bottom;
  collapsedRight.value = nextPosition.right;
});

useEventListener(globalThis, 'pointerup', () => {
  if (resizeStart.value) {
    suppressNextClick.value = resizeMoved.value;
    resizeStart.value = undefined;
    return;
  }

  if (!dragStart.value) return;

  suppressNextClick.value = dragMoved.value;
  dragStart.value = undefined;
});

useEventListener(globalThis, 'resize', () => {
  debouncedNormalizeCollapsedPreviewAfterResize();
});

useEventListener(
  globalThis,
  'keydown',
  (event) => {
    if (!modalOpen.value) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    modalOpen.value = false;
  },
  { capture: true },
);

const imageStyle = computed(() => {
  if (!isImage(currentUrl.value)) return undefined;

  const scale = mediaPlaying.value.zoom || 1;
  const pan = mediaPlaying.value.pan || { x: 0, y: 0 };
  const x = pan.x ?? 0;
  const y = pan.y ?? 0;

  return {
    transform: `scale(${scale}) translate(${x * 100}%, ${y * 100}%)`,
  };
});

const progressStyle = computed(() => {
  const currentPosition = mediaPlaying.value.currentPosition || 0;
  const duration = previewVideo.value?.duration;
  const progress = duration ? Math.min(currentPosition / duration, 1) : 0;

  return {
    transform: `scaleX(${progress})`,
  };
});

watch(
  () => showPreview.value,
  (visible) => {
    closeModalWhenHidden();
    if (visible) {
      syncVideos();
    }
  },
  { immediate: true },
);

watch(
  () => [
    currentUrl.value,
    mediaAction.value,
    mediaPlaying.value.currentPosition,
    modalOpen.value,
  ],
  () => {
    syncVideos();
  },
);
</script>

<style scoped>
.media-preview {
  --media-preview-full-height: min(90dvh, calc(90dvw * 9 / 16));
  --media-preview-full-width: min(90dvw, calc(90dvh * 16 / 9));

  position: fixed;
  right: var(--media-preview-right, 16px);
  bottom: var(--media-preview-bottom, 72px);
  z-index: 3000;
  width: var(--media-preview-width, min(28vw, 320px));
  min-width: min(180px, calc(100dvw - 16px));
  aspect-ratio: 16 / 9;
  padding: 0;
  overflow: hidden;
  cursor: zoom-in;
  touch-action: none;
  background: #000;
  border-width: 0px;
  border-radius: 8px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
  transition:
    right 0.25s ease,
    bottom 0.25s ease,
    width 0.25s ease,
    min-width 0.25s ease;
}

.media-preview--fullscreen {
  right: calc((100dvw - var(--media-preview-full-width)) / 2);
  bottom: calc((100dvh - var(--media-preview-full-height)) / 2);
  z-index: 10001;
  width: var(--media-preview-full-width);
  min-width: 0;
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.45);
  cursor: zoom-out;
}

.media-preview--moving {
  transition: none;
}

.media-preview-fade-enter-active,
.media-preview-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.media-preview-fade-enter-from,
.media-preview-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.media-preview-backdrop-enter-active,
.media-preview-backdrop-leave-active {
  transition:
    opacity 0.25s ease,
    backdrop-filter 0.25s ease;
}

.media-preview-backdrop-enter-from,
.media-preview-backdrop-leave-to {
  opacity: 0;
  backdrop-filter: blur(0);
}

.media-preview-backdrop {
  position: fixed;
  inset: 0;
  width: 100dvw;
  height: 100dvh;
  z-index: 10000;
  cursor: zoom-out;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

.media-preview-surface {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #000;
  border-radius: inherit;
}

.media-preview-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  display: grid;
  width: 40px;
  height: 40px;
  color: white;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 50%;
  place-items: center;
  cursor: pointer;
}

.media-preview-progress {
  position: absolute;
  right: 18px;
  bottom: 18px;
  left: 18px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 18px;
  padding: 0 10px;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 9px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.24);
}

.media-preview-progress__rail {
  width: 100%;
  height: 2px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.38);
  border-radius: 999px;
}

.media-preview-progress__bar {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 999px;
  transform-origin: left center;
  transition: transform 0.2s linear;
}

.media-preview-resize-handle {
  position: absolute;
  z-index: 1;
  width: 22px;
  height: 22px;
  opacity: 0;
  transition: opacity 0.16s ease;
}

.media-preview-resize-handle::before {
  position: absolute;
  width: 10px;
  height: 10px;
  content: '';
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
}

.media-preview:hover .media-preview-resize-handle,
.media-preview:focus-visible .media-preview-resize-handle,
.media-preview--moving .media-preview-resize-handle {
  opacity: 1;
}

.media-preview-resize-handle--bottom-left {
  bottom: 0;
  left: 0;
  cursor: nesw-resize;
}

.media-preview-resize-handle--bottom-left::before {
  bottom: 5px;
  left: 5px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.72);
  border-left: 2px solid rgba(255, 255, 255, 0.72);
}

.media-preview-resize-handle--bottom-right {
  right: 0;
  bottom: 0;
  cursor: nwse-resize;
}

.media-preview-resize-handle--bottom-right::before {
  right: 5px;
  bottom: 5px;
  border-right: 2px solid rgba(255, 255, 255, 0.72);
  border-bottom: 2px solid rgba(255, 255, 255, 0.72);
}

.media-preview-resize-handle--top-left {
  top: 0;
  left: 0;
  cursor: nwse-resize;
}

.media-preview-resize-handle--top-left::before {
  top: 5px;
  left: 5px;
  border-top: 2px solid rgba(255, 255, 255, 0.72);
  border-left: 2px solid rgba(255, 255, 255, 0.72);
}

.media-preview-resize-handle--top-right {
  top: 0;
  right: 0;
  cursor: nesw-resize;
}

.media-preview-resize-handle--top-right::before {
  top: 5px;
  right: 5px;
  border-top: 2px solid rgba(255, 255, 255, 0.72);
  border-right: 2px solid rgba(255, 255, 255, 0.72);
}

.media-preview-content {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform-origin: center;
}

@media (max-width: 599px) {
  .media-preview {
    right: var(--media-preview-right, 8px);
    bottom: var(--media-preview-bottom, 64px);
    width: var(--media-preview-width, min(44vw, 220px));
    min-width: min(132px, calc(100dvw - 16px));
  }
}
</style>
