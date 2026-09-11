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
        <q-icon name="mmm-clear" size="sm" />
        <q-tooltip :delay="1000">{{ t('close') }}</q-tooltip>
      </span>
      <div class="media-preview-surface">
        <!--
          Capture mode mirrors literally whatever the media window is
          showing, so it applies regardless of content type - takes priority
          over the image/video split below, which only matters for the
          canvas/video fallback modes (each of which does re-decode the
          specific file, so they need to know what kind of file it is).
        -->
        <video
          v-if="isCaptureMode"
          ref="captureVideo"
          autoplay
          class="media-preview-content"
          :class="{ 'media-preview-content--source': showCanvasOverlay }"
          disableRemotePlayback
          draggable="false"
          muted
          playsinline
          @dragstart.prevent.stop
        />
        <template v-else>
          <img
            v-if="imagePreview && !imageLoadError"
            alt=""
            class="media-preview-content"
            draggable="false"
            :src="currentUrl"
            :style="imageStyle"
            @dragstart.prevent.stop
            @error="imageLoadError = true"
          />
          <div
            v-else-if="imagePreview && imageLoadError"
            class="media-preview-content media-preview-broken column items-center justify-center"
          >
            <q-icon color="grey" name="mmm-image-broken" size="2em" />
            <div class="text-caption q-mt-sm">
              {{ t('unable-to-load-image') }}
            </div>
          </div>
          <video
            v-else
            ref="previewVideo"
            class="media-preview-content"
            :class="{ 'media-preview-content--source': showCanvasOverlay }"
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
        </template>
        <!--
          Shared between capture and canvas modes - whichever source video is
          currently active (captureVideo or previewVideo, see
          activeVideoElement) feeds this same canvas. Kept as a single
          sibling element outside both branches above so switching between
          capture and canvas/video doesn't need its own remount logic.
        -->
        <canvas
          v-if="showCanvasOverlay"
          ref="previewCanvas"
          class="media-preview-content"
          draggable="false"
          @dragstart.prevent.stop
        />
        <div v-if="showProgress" class="media-preview-progress">
          <div class="media-preview-progress__rail">
            <div class="media-preview-progress__bar" :style="progressStyle" />
          </div>
        </div>
      </div>
      <button
        v-if="isDev && !modalOpen"
        class="media-preview-mode-toggle"
        type="button"
        @click.stop="toggleRenderMode"
        @dragstart.prevent.stop
        @pointerdown.stop
      >
        {{ previewMode }}
      </button>
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
import { useDebounceFn, useEventListener, useThrottleFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { log } from 'src/shared/vanilla';
import {
  type CaptureSizeBounds,
  getCaptureSizeBounds,
  getContainFitRect,
  isImage,
  isVideo,
  stopMediaStreamTracks,
} from 'src/utils/media';
import { useCurrentStateStore } from 'stores/current-state';
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { currentSettings, mediaPlaying } = storeToRefs(useCurrentStateStore());

const modalOpen = ref(false);
const previewButton = useTemplateRef<HTMLButtonElement>('previewButton');
const previewVideo = useTemplateRef<HTMLVideoElement>('previewVideo');
const previewCanvas = useTemplateRef<HTMLCanvasElement>('previewCanvas');
const captureVideo = useTemplateRef<HTMLVideoElement>('captureVideo');
const isDev = import.meta.env.DEV;
type PreviewMode = 'canvas' | 'capture' | 'video';
const NEXT_PREVIEW_MODE: Record<PreviewMode, PreviewMode> = {
  canvas: 'video',
  capture: 'canvas',
  video: 'capture',
};
const isValidPreviewMode = (value: null | string): value is PreviewMode =>
  value === 'capture' || value === 'canvas' || value === 'video';

// Capture mode mirrors the media window's actual composited output (via
// Electron's getMediaSourceId + getUserMedia) instead of re-decoding the
// same file a second time - since it mirrors whatever's on screen, it
// applies to images as well as video (see the template). It's attempted
// automatically in production builds, falling back to canvas (the default
// fallback) then video (the cheaper second fallback) if it's unavailable -
// those two fallbacks remain video-only (re-decoding the file, so they need
// to know its type), same as before. Dev builds are manual-only (no
// auto-attempt) so the on-screen toggle below can force-compare all three:
// default to video like before, or whatever was last explicitly picked via
// the toggle, persisted in localStorage.
const storedPreviewMode =
  isDev && typeof localStorage !== 'undefined'
    ? localStorage.getItem('mediaPreviewRenderMode')
    : null;
let initialPreviewMode: PreviewMode = 'canvas';
if (isDev) {
  initialPreviewMode = isValidPreviewMode(storedPreviewMode)
    ? storedPreviewMode
    : 'video';
}
const previewMode = ref<PreviewMode>(initialPreviewMode);
const isCaptureMode = computed(() => previewMode.value === 'capture');
const isCanvasMode = computed(() => previewMode.value === 'canvas');
// Capture mode draws through the canvas too (with the same high-quality
// smoothing as canvas mode) rather than showing its raw <video> directly -
// a live capture stream scaled way down by the compositor otherwise looks
// noticeably more aliased than an explicit smoothed downscale. 'video' mode
// stays the one truly raw, unsmoothed path - the cheapest possible fallback
// for a machine where even the smoothing pass is too much.
const showCanvasOverlay = computed(
  () =>
    (isCaptureMode.value && !captureCanvasDisabled.value) || isCanvasMode.value,
);
const activeVideoElement = computed(() =>
  isCaptureMode.value ? captureVideo.value : previewVideo.value,
);
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
const imageLoadError = ref(false);
const mediaAction = computed(() => mediaPlaying.value.action);
// playbackConfirmedToken only catches up to playToken once the media
// window's reported position has actually been observed advancing (see
// MediaCalendarPage.vue). Until then, avoid starting the preview so it
// doesn't play ahead of the real window and need a drift correction/false
// start.
const realPlaybackConfirmed = computed(
  () =>
    mediaPlaying.value.playToken > 0 &&
    mediaPlaying.value.playbackConfirmedToken === mediaPlaying.value.playToken,
);
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

let activeCaptureStream: MediaStream | undefined;
// The size cap the active stream was acquired with - see
// getCaptureSizeBounds and reacquireCaptureForViewport.
let activeCaptureBounds: CaptureSizeBounds | undefined;
let captureAttempted = false;
let captureUnavailable = false;

const stopCaptureStream = () => {
  stopMediaStreamTracks(activeCaptureStream);
  activeCaptureStream = undefined;
  activeCaptureBounds = undefined;
  if (captureVideo.value) captureVideo.value.srcObject = null;
};

// The preview (collapsed or in its zoomed modal) never shows more than the
// main window's own viewport, so that's the most the captured frames ever
// need to be - in device pixels, so a HiDPI preview stays sharp.
const getViewportCaptureSizeBounds = () =>
  getCaptureSizeBounds(
    globalThis.innerWidth,
    globalThis.innerHeight,
    globalThis.devicePixelRatio || 1,
  );

// Electron's window-capture constraint form predates the standard
// MediaStreamConstraints shape (no mandatory/chromeMediaSource* in DOM lib
// types) - this is the exact shape Electron's own docs use for
// getUserMedia({chromeMediaSource: 'tab', ...}). chromeMediaSource must be
// 'tab' specifically here, not 'window'/'desktop' - per
// WebContents.getMediaSourceId's own docs, the id it returns is only valid
// with a 'tab' source and only for 10 seconds, so it must be redeemed
// immediately (never cached/reused across attempts).
const acquireCaptureStream = async (): Promise<boolean> => {
  try {
    const sourceId =
      await globalThis.electronApi.getMediaWindowCaptureSourceId();
    if (!sourceId) return false;

    const bounds = getViewportCaptureSizeBounds();
    const stream = await navigator.mediaDevices.getUserMedia({
      // No audio - the preview is muted regardless (matches the canvas/video
      // fallback modes), and requesting it would just be one more thing
      // that can fail/need permission for no benefit.
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: sourceId,
          // Size bounds do two jobs: cap the captured frames at what the
          // preview can actually show (Chromium scales them down at the
          // source, before they reach this renderer), and keep Chromium off
          // its 'tab'-capture default of a fixed-size frame with the media
          // window letterboxed inside it, black bars and all. Both are
          // explained on getCaptureSizeBounds.
          ...bounds,
        },
      },
    } as unknown as MediaStreamConstraints);

    stopCaptureStream();
    activeCaptureStream = stream;
    activeCaptureBounds = bounds;
    if (captureVideo.value) captureVideo.value.srcObject = stream;
    // Give smoothing a fresh chance on every newly-acquired stream, rather
    // than carrying a disable decision forward from a previous stream/mode.
    captureCanvasDisabled.value = false;
    recentSlowCaptureDraws.value = [];

    const track = stream.getVideoTracks()[0];
    if (track) {
      // Fires if the media window is destroyed and recreated (e.g. macOS
      // "all windows closed, then reactivated") - not a permission problem,
      // so retry rather than permanently falling back.
      track.onended = () => {
        log(
          'Media window capture stream ended, retrying',
          'mediaPreview',
          'warn',
        );
        stopCaptureStream();
        if (previewMode.value === 'capture' && !isDev) {
          previewMode.value = 'canvas';
        }
        captureAttempted = false;
        if (!isDev) maybeAttemptCapture();
      };
    }

    return true;
  } catch (error) {
    log(
      'Media window capture unavailable, falling back',
      'mediaPreview',
      'warn',
    );
    errorCatcher(error, {
      contexts: { fn: { name: 'MediaPreview.acquireCaptureStream' } },
    });
    return false;
  }
};

// Automatic (production-only) capture attempt. Runs once per session unless
// the capture stream later ends and needs retrying (see acquireCaptureStream's
// track.onended above) - once obtained, the same stream mirrors whatever the
// media window shows next, so there's no need to re-attempt per media item.
const maybeAttemptCapture = () => {
  if (
    isDev ||
    captureAttempted ||
    captureUnavailable ||
    !previewEnabled.value
  ) {
    return;
  }
  captureAttempted = true;
  void acquireCaptureStream().then((ok) => {
    if (ok) {
      previewMode.value = 'capture';
    } else {
      captureUnavailable = true;
    }
  });
};

const toggleRenderMode = () => {
  const nextMode = NEXT_PREVIEW_MODE[previewMode.value];
  previewMode.value = nextMode;
  localStorage?.setItem('mediaPreviewRenderMode', nextMode);

  if (nextMode === 'capture') {
    // Dev-only manual path bypasses the automatic-attempt gating entirely -
    // best-effort; a failure just leaves the capture <video> element black,
    // which is itself useful signal while comparing modes locally.
    void acquireCaptureStream();
  } else {
    stopCaptureStream();
  }
};

let videoFrameCallbackHandle: number | undefined;
let animationFrameHandle: number | undefined;
let canvasResizeObserver: ResizeObserver | undefined;
// The element a scheduled frame loop is actually bound to - tracked
// separately from activeVideoElement (which can change reactively the
// instant previewMode changes) so cancelFrameLoop always cancels against the
// element that actually registered the callback, not whichever element mode
// switching has made "current" by the time cleanup runs.
let frameLoopSourceElement: HTMLVideoElement | undefined;

// Capture mode's canvas-smoothing safety net. Canvas mode's own drift-based
// downgrade (disablePreviewForPerformance below) doesn't apply here - there's
// no seek/sync concept for a live mirror - so this measures the actual
// drawImage() cost directly instead. Only disables the smoothing pass, not
// capture mode itself: capture without smoothing is still strictly cheaper
// than falling back to canvas/video (both of which re-decode the file), so
// there's never a reason to abandon capture over this specifically.
const CAPTURE_DRAW_BUDGET_MS = 8;
const CAPTURE_SLOW_DRAWS_BEFORE_DISABLE = 5;
const CAPTURE_SLOW_DRAW_WINDOW_SECONDS = 10;
const recentSlowCaptureDraws = ref<number[]>([]);
const captureCanvasDisabled = ref(false);

const registerSlowCaptureDraw = () => {
  const now = Date.now();
  const windowStart = now - CAPTURE_SLOW_DRAW_WINDOW_SECONDS * 1000;
  recentSlowCaptureDraws.value = [
    ...recentSlowCaptureDraws.value.filter(
      (timestamp) => timestamp > windowStart,
    ),
    now,
  ];

  if (
    recentSlowCaptureDraws.value.length >= CAPTURE_SLOW_DRAWS_BEFORE_DISABLE
  ) {
    captureCanvasDisabled.value = true;
    recentSlowCaptureDraws.value = [];

    log(
      `Disabling capture-mode canvas smoothing after ${CAPTURE_SLOW_DRAWS_BEFORE_DISABLE} slow draws within ${CAPTURE_SLOW_DRAW_WINDOW_SECONDS}s`,
      'mediaPreview',
      'warn',
    );
    errorCatcher(
      new Error(
        'Capture-mode canvas smoothing disabled after repeated slow draws',
      ),
      {
        contexts: { fn: { name: 'MediaPreview.registerSlowCaptureDraw' } },
      },
    );
  }
};

const cancelFrameLoop = () => {
  const element = frameLoopSourceElement;
  if (
    videoFrameCallbackHandle !== undefined &&
    element &&
    'cancelVideoFrameCallback' in element
  ) {
    element.cancelVideoFrameCallback(videoFrameCallbackHandle);
  }
  videoFrameCallbackHandle = undefined;
  frameLoopSourceElement = undefined;

  if (animationFrameHandle !== undefined) {
    cancelAnimationFrame(animationFrameHandle);
    animationFrameHandle = undefined;
  }
};

// Match the canvas' backing-store resolution to how big it's actually
// displayed (in device pixels), so drawImage does the one-and-only
// downscale itself instead of leaving a second, lower-quality resize
// to the compositor when the CSS box is much smaller than the source video.
const resizeCanvasToDisplaySize = () => {
  const canvas = previewCanvas.value;
  if (!canvas) return;

  const dpr = globalThis.devicePixelRatio || 1;
  const targetWidth = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const targetHeight = Math.max(1, Math.round(canvas.clientHeight * dpr));

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }
};

// Fit the frame into the canvas the way object-fit: contain would, rather
// than stretching it over the canvas' full 16:9 box - the source's shape
// isn't guaranteed to match it (a 4:3 video file in canvas mode; in capture
// mode, whatever shape the media window currently has, e.g. fullscreen on a
// 16:10 display). A mismatch then shows up as the same letterboxing the
// media window itself does, not as a squashed picture.
//
// Memoized on its only inputs: the arithmetic is nothing next to drawImage
// itself, but those inputs only change on a resize or a media swap, so
// there's no reason to redo it (or re-clear the bars) 30-60 times a second.
let lastFrameFit:
  | undefined
  | {
      canvasHeight: number;
      canvasWidth: number;
      rect: ReturnType<typeof getContainFitRect>;
      sourceHeight: number;
      sourceWidth: number;
    };

const getFrameFit = (element: HTMLVideoElement, canvas: HTMLCanvasElement) => {
  const { videoHeight: sourceHeight, videoWidth: sourceWidth } = element;
  const { height: canvasHeight, width: canvasWidth } = canvas;

  if (
    lastFrameFit &&
    lastFrameFit.sourceWidth === sourceWidth &&
    lastFrameFit.sourceHeight === sourceHeight &&
    lastFrameFit.canvasWidth === canvasWidth &&
    lastFrameFit.canvasHeight === canvasHeight
  ) {
    return { changed: false, rect: lastFrameFit.rect };
  }

  const rect = getContainFitRect(
    sourceWidth,
    sourceHeight,
    canvasWidth,
    canvasHeight,
  );
  lastFrameFit = { canvasHeight, canvasWidth, rect, sourceHeight, sourceWidth };
  return { changed: true, rect };
};

const drawCurrentFrame = () => {
  const element = frameLoopSourceElement ?? activeVideoElement.value;
  const canvas = previewCanvas.value;
  if (!element || !canvas || !element.videoWidth || !element.videoHeight) {
    return;
  }

  resizeCanvasToDisplaySize();

  const context = canvas.getContext('2d');
  if (!context) return;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const { changed, rect } = getFrameFit(element, canvas);
  if (changed && (rect.width < canvas.width || rect.height < canvas.height)) {
    // The bars around a newly-fitted frame aren't overdrawn, so clear
    // whatever the previous, differently-shaped fit left there. Once
    // cleared they stay clear - nothing else draws into them - so this
    // doesn't need repeating per frame. The canvas is transparent and the
    // surface behind it is black, which is all the bars need to be.
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  const drawStart = performance.now();
  context.drawImage(element, rect.x, rect.y, rect.width, rect.height);
  if (
    isCaptureMode.value &&
    performance.now() - drawStart > CAPTURE_DRAW_BUDGET_MS
  ) {
    registerSlowCaptureDraw();
  }
};

const scheduleFrameLoop = () => {
  const element = activeVideoElement.value;
  if (!showCanvasOverlay.value || !element) return;

  frameLoopSourceElement = element;
  if ('requestVideoFrameCallback' in element) {
    videoFrameCallbackHandle = element.requestVideoFrameCallback(() => {
      drawCurrentFrame();
      scheduleFrameLoop();
    });
  } else {
    animationFrameHandle = requestAnimationFrame(() => {
      drawCurrentFrame();
      scheduleFrameLoop();
    });
  }
};

onUnmounted(() => {
  cancelFrameLoop();
  canvasResizeObserver?.disconnect();
  stopCaptureStream();
});

// mediaPlaying.currentPosition is only as fresh as the last throttled
// current-time report from the media window. Extrapolate forward by however
// long has elapsed since that report so the preview targets where real
// playback actually is *now*, not where it was ~0.3s (report interval) plus
// IPC round-trip ago - that gap is exactly what showed up as small,
// consistent "exceeded acceptable drift" corrections right after starting.
const getExpectedPosition = () => {
  const base = mediaPlaying.value.currentPosition || 0;
  if (mediaAction.value !== 'play') return base;

  const updatedAt = mediaPlaying.value.currentPositionUpdatedAt;
  if (!updatedAt) return base;

  const elapsedSeconds = Math.max(0, (Date.now() - updatedAt) / 1000);
  const playbackRate = mediaPlaying.value.playbackRate || 1;
  return base + elapsedSeconds * playbackRate;
};

// The expected position is extrapolated from the last current-time report
// (base + elapsed * rate), assuming the media window advanced at exactly
// `rate` the whole time since that report. The extrapolation error is
// bounded by the report's age times the playback rate: at 10x speed a
// single stale 300ms report represents ~3s of media time, so a preview
// that is perfectly in sync would read as seconds of drift on every check
// if the tolerance only had the flat allowance (MMM-V2-3EY: playbackRate
// 10.5 events). The tolerance therefore grows with the report's age -
// fresh reports stay tight, stale ones stay forgiving - plus the flat
// 0.2s allowance scaled by rate.
const getAcceptableDrift = () => {
  const playbackRate = mediaPlaying.value.playbackRate || 1;
  const updatedAt = mediaPlaying.value.currentPositionUpdatedAt;
  const reportAgeSeconds = updatedAt
    ? Math.max(0, (Date.now() - updatedAt) / 1000)
    : 0;
  return 0.2 * playbackRate + reportAgeSeconds * playbackRate;
};

const syncVideoTime = (element: HTMLVideoElement, acceptableDrift: number) => {
  const expectedPosition = getExpectedPosition();
  const currentDrift = Math.abs(element.currentTime - expectedPosition);
  const excessiveDrift = currentDrift - acceptableDrift;
  if (excessiveDrift > 0) {
    log(
      `Syncing video preview (exceeded acceptable drift by ${excessiveDrift.toFixed(2)}s)`,
      'mediaPreview',
    );
    element.currentTime = expectedPosition;
    return true;
  }
  return false;
};

// A machine that genuinely can't keep up corrects often and repeatedly, not
// just once in a while - an isolated correction or two over a long video
// (a brief hiccup, a GC pause) isn't evidence of that. Only auto-disable
// once this many corrections land within this rolling window, i.e. a
// sustained inability to keep up rather than a raw lifetime count (which a
// long enough video would eventually trip even with correction attempts
// spread harmlessly far apart).
//
// syncVideos (and thus each drift check) is throttled to roughly once every
// 5s during steady live playback (see throttledSyncVideos below), so a
// window needs to be long enough to accumulate several check opportunities
// - otherwise "5 corrections" would require nearly every single check to
// fail. At 60s, that's ~12 checks, so 5 corrections is a real sustained
// pattern (~40% of checks) without demanding near-constant failure.
const DRIFT_CORRECTIONS_BEFORE_AUTO_DISABLE = 5;
const DRIFT_CORRECTION_WINDOW_SECONDS = 60;
const recentDriftCorrections = ref<number[]>([]);

// Canvas mode draws every video frame to a downscaled canvas with
// high-quality smoothing, which is expensive enough on mid-range machines
// to make the preview fall behind and pile up drift corrections
// (MMM-V2-3EY). The first time that happens, drop back to the plain video
// element - the cheap path used before canvas mode - and keep the preview
// on. Only disable it entirely if drift keeps piling up even in video
// mode.
const fallBackPreviewToVideoMode = () => {
  previewMode.value = 'video';

  log(
    `Falling back to video-element preview after ${recentDriftCorrections.value.length} drift corrections within ${DRIFT_CORRECTION_WINDOW_SECONDS}s`,
    'mediaPreview',
    'warn',
  );

  createTemporaryNotification({
    caption: t('media-preview-fallback-explain'),
    group: 'media-preview-fallback',
    message: t('media-preview-fallback'),
    timeout: 15000,
    type: 'warning',
  });
};

const disablePreviewForPerformance = () => {
  if (currentSettings.value?.enableMediaPreview === false) return;

  if (isCanvasMode.value) {
    fallBackPreviewToVideoMode();
    return;
  }

  log(
    `Disabling media preview after ${recentDriftCorrections.value.length} drift corrections within ${DRIFT_CORRECTION_WINDOW_SECONDS}s`,
    'mediaPreview',
    'warn',
  );

  if (currentSettings.value) currentSettings.value.enableMediaPreview = false;

  createTemporaryNotification({
    actions: [
      {
        color: 'dark',
        handler: () => {
          if (currentSettings.value) {
            currentSettings.value.enableMediaPreview = true;
          }
        },
        label: t('turn-back-on'),
      },
    ],
    caption: t('media-preview-auto-disabled-explain'),
    group: 'media-preview-auto-disabled',
    message: t('media-preview-auto-disabled'),
    timeout: 15000,
    type: 'warning',
  });

  errorCatcher(
    new Error('Media preview auto-disabled after repeated drift corrections'),
    {
      contexts: {
        fn: {
          driftCorrectionCount: recentDriftCorrections.value.length,
          driftCorrectionWindowSeconds: DRIFT_CORRECTION_WINDOW_SECONDS,
          name: 'MediaPreview.disablePreviewForPerformance',
        },
      },
    },
  );
};

const registerDriftCorrection = () => {
  const now = Date.now();
  const windowStart = now - DRIFT_CORRECTION_WINDOW_SECONDS * 1000;

  recentDriftCorrections.value = [
    ...recentDriftCorrections.value.filter(
      (timestamp) => timestamp > windowStart,
    ),
    now,
  ];

  if (
    recentDriftCorrections.value.length >= DRIFT_CORRECTIONS_BEFORE_AUTO_DISABLE
  ) {
    disablePreviewForPerformance();
    recentDriftCorrections.value = [];
  }
};

const syncVideos = async () => {
  try {
    if (isCaptureMode.value) return;

    await nextTick();

    const element = previewVideo.value;
    if (!element) {
      log('No video element for video preview', 'mediaPreview');
      return;
    }

    if (!isVideo(currentUrl.value)) {
      log('Video not available for video preview', 'mediaPreview');
      return;
    }

    if (mediaAction.value !== 'play') {
      if (!element.paused) {
        // Only pause if the video preview is playing. If it is already paused,
        // do nothing. This prevents the video from being paused unnecessarily.
        log('Pausing video preview', 'mediaPreview');
        element.pause();
      }

      // Sync the video time to the media window position. Uses the same
      // rate- and report-age-aware tolerance as live playback: the media
      // window reports a frame-quantized position, and at high playback
      // speeds the preview's own seek rounding alone would otherwise
      // re-trigger a visible jump on every report even when the scrub
      // position hasn't meaningfully moved. (The return value is ignored
      // here, so this never feeds the drift auto-disable counter.)
      syncVideoTime(element, getAcceptableDrift());
      if (isCanvasMode.value) drawCurrentFrame();
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

    if (element.paused && !realPlaybackConfirmed.value) {
      log(
        'Holding video preview until media window position is confirmed moving',
        'mediaPreview',
      );
      // Deliberately don't touch currentTime here. Seeking a
      // preload="metadata" source can require re-buffering, which can
      // re-fire canplay and loop straight back into this branch - producing
      // rapid, needless seeks that look like choppy playback and compete
      // for bandwidth with the real media window. The single seed-seek
      // right before play() below is all that's needed to start in sync.
      return;
    }

    if (element.paused) {
      // Seed the starting position before playing (rather than playing
      // then correcting afterwards) so the preview starts already in sync
      // instead of visibly jumping right after it begins.
      syncVideoTime(element, 0);

      log('Playing video preview', 'mediaPreview');
      await element.play().catch((error: unknown) => {
        // Same benign play()-interruption cases already filtered out in
        // MediaPlayerPage.vue: swapping sources/pausing quickly triggers
        // these routinely and they carry no diagnostic value.
        const ignoredErrors = [
          'removed from the document',
          'new load request',
          'interrupted by a call to pause',
        ];
        const message = error instanceof Error ? error.message : '';
        if (!ignoredErrors.some((msg) => message.includes(msg))) {
          reportPreviewError(error, 'MediaPreview.syncVideoElement.play');
        }
      });
    }

    if (syncVideoTime(element, getAcceptableDrift())) registerDriftCorrection();
    if (isCanvasMode.value) drawCurrentFrame();
  } catch (error) {
    reportPreviewError(error, 'MediaPreview.syncVideos');
  }
};

// mediaPlaying.currentPosition ticks roughly every 300ms while media is
// actually playing (see the currentTimeData watcher in
// MediaCalendarPage.vue), which is far more often than a drift check needs
// to run. Throttle those routine ticks so steady, live playback only
// re-syncs a few times a minute; real transitions (source swap, play/pause,
// modal toggle, playback confirmation) bypass this and still resync
// immediately via the watcher below. A paused scrub also bypasses this - see
// that watcher for why.
const throttledSyncVideos = useThrottleFn(syncVideos, 5000);

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

// The capture size cap is derived from the main window's viewport at
// acquisition time (see getViewportCaptureSizeBounds). A window that has
// since grown a lot would show a soft, upscaled preview - and one that
// shrank keeps paying for pixels it can't show - so re-acquire after a
// substantial change. Not on every resize tick: a new stream isn't free, and
// the current one keeps running until its replacement is in hand, so nothing
// goes black in between.
const CAPTURE_REACQUIRE_RATIO = 1.25;
const reacquireCaptureForViewport = () => {
  if (!activeCaptureStream || !activeCaptureBounds || !isCaptureMode.value) {
    return;
  }

  const next = getViewportCaptureSizeBounds();
  const ratio = (a: number, b: number) => Math.max(a, b) / Math.min(a, b);
  if (
    ratio(next.maxWidth, activeCaptureBounds.maxWidth) <
      CAPTURE_REACQUIRE_RATIO &&
    ratio(next.maxHeight, activeCaptureBounds.maxHeight) <
      CAPTURE_REACQUIRE_RATIO
  ) {
    return;
  }

  void acquireCaptureStream();
};
const debouncedReacquireCaptureForViewport = useDebounceFn(
  reacquireCaptureForViewport,
  500,
);

useEventListener(globalThis, 'resize', () => {
  debouncedNormalizeCollapsedPreviewAfterResize();
  debouncedReacquireCaptureForViewport();
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

// mediaPlaying.duration comes from the media window's own decoded element
// (broadcast over 'media-duration'), not a locally-decoded element - unlike
// currentPosition's local previewVideo/previewCanvas machinery, capture mode
// has no local decode to read a duration from (and a live capture stream's
// own .duration isn't the file's actual length), so this is the one value
// every preview mode needs the same external source for.
const progressStyle = computed(() => {
  const currentPosition = mediaPlaying.value.currentPosition || 0;
  const duration = mediaPlaying.value.duration || 0;
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
    modalOpen.value,
    realPlaybackConfirmed.value,
  ],
  () => {
    syncVideos();
  },
);

watch(
  () => mediaPlaying.value.currentPosition,
  () => {
    // Throttling only makes sense for the steady stream of ticks during
    // live playback. While paused, a currentPosition change is a deliberate
    // scrub and should be reflected right away, not sit unapplied for up to
    // 5s. (syncVideos itself doesn't register a drift correction in this
    // case anyway - see the mediaAction.value !== 'play' branch above - so
    // calling it directly here doesn't affect the auto-disable count either.)
    if (mediaAction.value !== 'play') {
      syncVideos();
    } else {
      throttledSyncVideos();
    }
  },
);

watch(currentUrl, () => {
  recentDriftCorrections.value = [];
  imageLoadError.value = false;
});

watch(
  () =>
    [
      showCanvasOverlay.value,
      activeVideoElement.value,
      previewCanvas.value,
    ] as const,
  ([overlayActive, element, canvas]) => {
    cancelFrameLoop();
    canvasResizeObserver?.disconnect();
    canvasResizeObserver = undefined;

    if (overlayActive && element && canvas) {
      canvasResizeObserver = new ResizeObserver(() => drawCurrentFrame());
      canvasResizeObserver.observe(canvas);
      scheduleFrameLoop();
    }
  },
  { immediate: true },
);

// Re-attach the already-live capture stream whenever its <video> element
// (re)mounts - it unmounts/remounts when previewMode leaves 'capture' and
// comes back (e.g. the dev toggle cycling through canvas/video and back),
// but the underlying MediaStream itself stays alive and doesn't need
// re-acquiring.
watch(captureVideo, (element) => {
  if (element && activeCaptureStream) {
    element.srcObject = activeCaptureStream;
  }
});

// Production builds only - dev builds are manual-only via the on-screen
// toggle (see toggleRenderMode/onMounted below).
watch(
  () => previewEnabled.value,
  (enabled) => {
    if (enabled) maybeAttemptCapture();
  },
  { immediate: true },
);

onMounted(() => {
  // Covers a dev session that starts already opted into capture mode from a
  // previous run's localStorage value - the automatic-attempt watch above
  // deliberately skips dev entirely, so this is the only path that acquires
  // the stream in that case.
  if (isDev && previewMode.value === 'capture') {
    void acquireCaptureStream();
  }
});
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

.media-preview-broken {
  align-items: center;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
}

.media-preview-content--source {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.media-preview-mode-toggle {
  position: absolute;
  bottom: 4px;
  left: 4px;
  z-index: 1;
  padding: 2px 6px;
  font-size: 10px;
  line-height: 1.4;
  color: white;
  text-transform: uppercase;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.45);
  border: none;
  border-radius: 4px;
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
