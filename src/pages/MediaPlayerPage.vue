<template>
  <q-page-container
    class="vertical-middle overflow-hidden"
    padding
    style="
      align-content: center;
      height: 100vh;
      -webkit-app-region: drag;
      background-color: black;
    "
  >
    <!-- Base yeartext layer - always visible with black background -->
    <div
      v-if="fontsSet && !mediaPlayerCustomBackground && !cameraStreamId"
      class="base-layer"
      :class="{ 'blank-screen': isTransitioning }"
    >
      <!-- eslint-disable next-line vue/no-v-html -->
      <div
        id="yeartext"
        class="center"
        :style="yeartextFontStyle"
        v-html="sanitize(yeartext || '')"
      />
      <div
        v-if="!hideMediaLogo && jwIconsFontLoaded"
        id="yeartextLogoContainer"
        class="jw-icon"
      >
        <p id="yeartextLogo">
          {{ getJwIconFromKeyword('tv-logo') }}
        </p>
      </div>
    </div>

    <!-- Custom background layer - always visible when set -->
    <div
      v-if="mediaPlayerCustomBackground && !cameraStreamId"
      class="base-layer"
      :class="{ 'blank-screen': isTransitioning }"
    >
      <q-img
        class="fit-snugly"
        fit="contain"
        no-spinner
        :src="mediaPlayerCustomBackground"
      />
    </div>

    <!-- Camera background layer -->
    <div v-if="cameraStreamId" class="camera-layer">
      <video
        ref="cameraElement"
        autoplay
        class="fit-snugly"
        muted
        playsinline
      />
    </div>

    <!-- Display layer 1 -->
    <div
      class="display-layer"
      :class="{
        'is-live': displayLayer1.isLive,
        'is-audio': isAudio(displayLayer1.url),
      }"
    >
      <q-img
        v-if="isImage(displayLayer1.url)"
        id="mediaImage1"
        class="fit-snugly"
        fit="contain"
        no-spinner
        :src="displayLayer1.url"
        @load="handleImageLoad()"
      />
      <video
        v-else-if="
          isVideo(displayLayer1.url) || (videoStreaming && displayLayer1.isLive)
        "
        :key="displayLayer1.url"
        ref="mediaElement1"
        class="fit-snugly"
        disableRemotePlayback
        :muted="isSlideshowDisplayVideo(displayLayer1.url)"
        preload="metadata"
        :src="displayLayer1.url"
        @canplay="handleVideoCanPlay()"
        @ended="endOrLoop()"
        @loadedmetadata="playMedia()"
        @pause="handleVideoPause()"
      >
        <track
          v-if="mediaPlayerSubtitlesUrl && subtitlesVisible"
          default
          kind="subtitles"
          :src="mediaPlayerSubtitlesUrl"
        />
      </video>
      <audio
        v-else-if="isAudio(displayLayer1.url) && !videoStreaming"
        ref="mediaElement1"
        style="display: none"
        @loadedmetadata="playMedia()"
      >
        <source :src="displayLayer1.url" />
      </audio>
    </div>

    <!-- Display layer 2 -->
    <div
      class="display-layer"
      :class="{
        'is-live': displayLayer2.isLive,
        'is-audio': isAudio(displayLayer2.url),
      }"
    >
      <q-img
        v-if="isImage(displayLayer2.url)"
        id="mediaImage2"
        class="fit-snugly"
        fit="contain"
        no-spinner
        :src="displayLayer2.url"
        @load="handleImageLoad()"
      />
      <video
        v-else-if="isVideo(displayLayer2.url)"
        :key="displayLayer2.url"
        ref="mediaElement2"
        class="fit-snugly"
        disableRemotePlayback
        :muted="isSlideshowDisplayVideo(displayLayer2.url)"
        preload="metadata"
        :src="displayLayer2.url"
        @canplay="handleVideoCanPlay()"
        @ended="endOrLoop()"
        @loadedmetadata="playMedia()"
        @pause="handleVideoPause()"
      >
        <track
          v-if="mediaPlayerSubtitlesUrl && subtitlesVisible"
          default
          kind="subtitles"
          :src="mediaPlayerSubtitlesUrl"
        />
      </video>
      <audio
        v-else-if="isAudio(displayLayer2.url)"
        ref="mediaElement2"
        style="display: none"
        @loadedmetadata="playMedia()"
      >
        <source :src="displayLayer2.url" />
      </audio>
    </div>

    <audio
      v-if="slideshowAudioUrl"
      ref="slideshowAudioElement"
      loop
      :src="slideshowAudioUrl"
      style="display: none"
      @loadedmetadata="playSlideshowAudio()"
    />
  </q-page-container>
</template>

<script setup lang="ts">
import {
  useBroadcastChannel,
  watchDeep,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import DOMPurify from 'dompurify';
import { useQuasar } from 'quasar';
import { MEDIA_STOP_FADE_DURATION_SECONDS } from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  getJwIconFromKeyword,
  loadYeartextFont,
  setElementFont,
} from 'src/helpers/fonts';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { log } from 'src/shared/vanilla';
import { isAudio, isImage, isVideo } from 'src/utils/media';
import { useJwStore } from 'stores/jw';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

const { sanitize } = DOMPurify;

const { t } = useI18n();

const { getScreenAccessStatus, PLATFORM } = globalThis.electronApi;

const $q = useQuasar();

$q.iconMapFn = (iconName) => {
  if (iconName.startsWith('chevron_')) {
    iconName = iconName.replace('chevron_', 'mmm-');
  } else if (iconName.startsWith('keyboard_arrow_')) {
    iconName = iconName.replace('keyboard_arrow_', 'mmm-');
  } else if (iconName.startsWith('arrow_drop_')) {
    iconName = 'mmm-dropdown-arrow';
  } else if (iconName === 'cancel' || iconName === 'close') {
    iconName = 'clear';
  }
  if (!iconName.startsWith('mmm-')) {
    iconName = 'mmm-' + iconName;
  }
  return {
    cls: iconName,
  };
};

/**
 * Robustly cleans up a media element to prevent renderer crashes.
 * @param element The HTMLAudioElement or HTMLVideoElement to clean up.
 */
const cleanupMediaElement = (element: HTMLMediaElement | null | undefined) => {
  if (!element) return;

  log(
    '🎬 [cleanupMediaElement] Cleaning up media element',
    'mediaPlayer',
    'log',
  );

  try {
    // Stop playback
    element.pause();

    // Clear sources to free up internal buffers/decoders
    element.src = '';
    element.removeAttribute('src');
    element.srcObject = null;

    // Remove all event listeners
    element.oncanplay = null;
    element.oncanplaythrough = null;
    element.ontimeupdate = null;
    element.onended = null;
    element.onpause = null;
    element.onerror = null;
    element.onloadedmetadata = null;
    element.onloadeddata = null;
    element.onplaying = null;
    element.onwaiting = null;
    element.onstalled = null;
    element.onseeking = null;
    element.onseeked = null;

    // Force a load to finalize clearing the previous source
    element.load();
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'cleanupMediaElement' } },
    });
  }
};

const isEnding = ref(false);

// Display layer state management
const displayLayer1 = ref({
  isLive: false,
  token: 0,
  url: '',
});

const displayLayer2 = ref({
  isLive: false,
  token: 0,
  url: '',
});

const mediaElement1 = useTemplateRef<HTMLAudioElement | HTMLVideoElement>(
  'mediaElement1',
);
const mediaElement2 = useTemplateRef<HTMLAudioElement | HTMLVideoElement>(
  'mediaElement2',
);
const cameraElement = useTemplateRef<HTMLVideoElement>('cameraElement');
const slideshowAudioElement = useTemplateRef<HTMLAudioElement>(
  'slideshowAudioElement',
);

const videoStreaming = ref(false);

const { data: mediaPlayerCustomBackground } = useBroadcastChannel<
  string | undefined,
  string | undefined
>({
  name: 'custom-background',
});

const { data: subtitlesVisible } = useBroadcastChannel<boolean, boolean>({
  name: 'subtitles-visible',
});

const { data: mediaPlayerSubtitlesUrl } = useBroadcastChannel<
  string | undefined,
  string | undefined
>({
  name: 'subtitles-url',
});

const { data: seekToData } = useBroadcastChannel<
  number | undefined,
  number | undefined
>({
  name: 'seek-to',
});

const { data: playbackRateData } = useBroadcastChannel<
  number | undefined,
  number | undefined
>({
  name: 'playback-rate',
});

const { data: mediaCustomDuration } = useBroadcastChannel<
  string | undefined,
  string | undefined
>({
  name: 'custom-duration',
});

const { data: mediaRepeat } = useBroadcastChannel<string, boolean>({
  name: 'repeat',
});

const { data: mediaRepeatNow } = useBroadcastChannel<number, number>({
  name: 'media-repeat-now',
});

const { data: mediaPlayingUrl } = useBroadcastChannel<string, string>({
  name: 'media-url',
});

const { data: slideshowAudioUrl } = useBroadcastChannel<string, string>({
  name: 'slideshow-audio-url',
});

const { post: postCurrentTime } = useBroadcastChannel<number, number>({
  name: 'current-time',
});

const { data: mediaAction } = useBroadcastChannel<string, string>({
  name: 'main-window-media-action',
});

const handleImageLoad = () => {
  // Image loaded - apply current zoom/pan state if available
  if (zoomPanState.value && Object.keys(zoomPanState.value).length > 0) {
    // Skip animation on initial load
    skipZoomPanAnimation.value = true;
    applyZoomPanState(zoomPanState.value);
  }
};

let lastZoomPanTime = 0;
const transitionDurationSeconds = 2.5;
const skipZoomPanAnimation = ref(false);

const applyZoomPanState = (zoomPanState: Record<string, number>) => {
  try {
    // Try to find the active image element matching the current media URL
    let imageElem: HTMLElement | null = null;
    if (displayLayer1.value.url === mediaPlayingUrl.value) {
      imageElem = document.getElementById('mediaImage1');
    } else if (displayLayer2.value.url === mediaPlayingUrl.value) {
      imageElem = document.getElementById('mediaImage2');
    }

    if (!imageElem) return;

    const width = imageElem.clientWidth || 0;
    const height = imageElem.clientHeight || 0;

    if (width > 0 && height > 0) {
      // Apply zoom and pan using CSS transforms for smooth animation
      const scale = zoomPanState.scale || 1;
      const x = (zoomPanState.x || 0) * width;
      const y = (zoomPanState.y || 0) * height;

      if (skipZoomPanAnimation.value) {
        // Apply instantly without animation
        imageElem.style.transition = 'none';
        imageElem.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`;
        skipZoomPanAnimation.value = false;
      } else {
        const now = Date.now();
        // If we are interrupting an active transition (less than 2s since last update),
        // use ease-out to avoid the "slow start" jaggedness.
        // Otherwise use standard ease for a smooth start from rest.
        const isInterrupted =
          now - lastZoomPanTime < transitionDurationSeconds * 1000;
        const easing = isInterrupted ? 'ease-out' : 'ease';

        // Use CSS transforms for smooth animation
        imageElem.style.transition = `transform ${transitionDurationSeconds}s ${easing}`;
        imageElem.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`;

        lastZoomPanTime = now;
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const { data: zoomPanState } = useBroadcastChannel<
  Record<string, number>,
  Record<string, number>
>({
  name: 'zoom-pan',
});

const { data: webStreamData } = useBroadcastChannel<
  'inactive' | 'mirroringWebsite' | 'previewingWebsite',
  'inactive' | 'mirroringWebsite' | 'previewingWebsite'
>({
  name: 'web-stream',
});

const { data: cameraStreamId } = useBroadcastChannel<string, string>({
  name: 'camera-stream',
});

const { post: postLastEndTimestamp } = useBroadcastChannel<number, number>({
  name: 'last-end-timestamp',
});

const customMin = computed(() => {
  return (JSON.parse(mediaCustomDuration.value || '{}') || {})?.min || 0;
});

const customMax = computed(() => {
  return (JSON.parse(mediaCustomDuration.value || '{}') || {})?.max;
});

type DisplayLayerRef = typeof displayLayer1;

const getLayerElement = (
  layer: DisplayLayerRef,
): HTMLAudioElement | HTMLVideoElement | null => {
  return layer.value === displayLayer1.value
    ? mediaElement1.value
    : mediaElement2.value;
};

const getLayerForUrl = (url: string | undefined): DisplayLayerRef | null => {
  if (!url) return null;
  if (displayLayer1.value.url === url) return displayLayer1;
  if (displayLayer2.value.url === url) return displayLayer2;
  return null;
};

const getLiveLayer = (): DisplayLayerRef | null => {
  if (displayLayer1.value.isLive) return displayLayer1;
  if (displayLayer2.value.isLive) return displayLayer2;
  return null;
};

const getOtherLayer = (layer: DisplayLayerRef): DisplayLayerRef => {
  return layer.value === displayLayer1.value ? displayLayer2 : displayLayer1;
};

const getNextLayer = (newUrl: string): DisplayLayerRef => {
  const existingLayer = getLayerForUrl(newUrl);
  if (existingLayer) return existingLayer;

  const liveLayer = getLiveLayer();
  if (liveLayer) return getOtherLayer(liveLayer);

  if (!displayLayer1.value.url) return displayLayer1;
  if (!displayLayer2.value.url) return displayLayer2;

  return displayLayer1;
};

const isSlideshowDisplayVideo = (url: string) => {
  return (
    !!slideshowAudioUrl.value &&
    !!slideshowVideoUrl.value &&
    url === mediaPlayingUrl.value &&
    url === slideshowVideoUrl.value
  );
};

const cleanupLayerIfCurrent = (
  layer: DisplayLayerRef,
  token: number,
  url: string,
) => {
  if (layer.value.token !== token || layer.value.url !== url) {
    return;
  }

  cleanupMediaElement(getLayerElement(layer));
  layer.value.url = '';
};

const triggerSlideshowAudioPlay = () => {
  if (!slideshowAudioElement.value || mediaAction.value !== 'play') {
    return;
  }

  slideshowAudioElement.value.play().catch((error: Error) => {
    const ignoredErrors = [
      'removed from the document',
      'new load request',
      'interrupted by a call to pause',
    ];

    const shouldIgnore = ignoredErrors.some((msg) =>
      error.message.includes(msg),
    );

    if (!shouldIgnore) {
      errorCatcher(error, {
        contexts: { fn: { name: 'triggerSlideshowAudioPlay' } },
      });
    }
  });
};

const currentMediaElement: Ref<HTMLAudioElement | HTMLVideoElement | null> =
  computed(() => {
    const layer = getLayerForUrl(mediaPlayingUrl.value);
    if (layer) return getLayerElement(layer);

    const liveLayer = getLiveLayer();
    if (liveLayer) return getLayerElement(liveLayer);

    return mediaElement1.value || mediaElement2.value || null;
  });

const triggerPlay = (force = false) => {
  if (!force && mediaAction.value !== 'play') {
    return;
  }

  if (!currentMediaElement.value) {
    return;
  }

  // For videos, ensure we're ready to play
  if (
    (isVideo(mediaPlayingUrl.value) || isAudio(mediaPlayingUrl.value)) &&
    currentMediaElement.value.readyState < 2
  ) {
    // Video not ready yet, wait a bit and try again
    setTimeout(() => {
      triggerPlay(force);
    }, 100);
    return;
  }

  log(
    `🎬 [triggerPlay] Attempting to play video: ${mediaPlayingUrl.value}, readyState: ${currentMediaElement.value.readyState}, paused: ${currentMediaElement.value.paused}`,
    'mediaPlayer',
    'log',
  );

  currentMediaElement.value.play().catch((error: Error) => {
    const ignoredErrors = [
      'removed from the document',
      'new load request',
      'interrupted by a call to pause',
    ];

    const shouldIgnore = ignoredErrors.some((msg) =>
      error.message.includes(msg),
    );

    if (!shouldIgnore) {
      errorCatcher(error, {
        contexts: { fn: { name: 'triggerPlay' } },
      });
    }
  });
};

const playMediaElement = (wasPaused = false, websiteStream = false) => {
  if (!currentMediaElement.value) {
    return;
  }

  log(
    '🎬 [playMediaElement] Setting up video playback',
    'mediaPlayer',
    'log',
    wasPaused,
    websiteStream,
    mediaAction.value,
  );

  if (wasPaused || websiteStream) {
    triggerPlay(websiteStream);
    triggerSlideshowAudioPlay();
  }

  currentMediaElement.value.oncanplaythrough = () => {
    log('🎬 [playMediaElement] Video can play through', 'mediaPlayer', 'log');
    triggerPlay(websiteStream);
    triggerSlideshowAudioPlay();
  };

  // For videos, add an additional check to ensure playback starts
  if (isVideo(mediaPlayingUrl.value) && mediaAction.value === 'play') {
    // Set up a fallback mechanism to ensure video starts playing
    const checkAndPlay = () => {
      const element = currentMediaElement.value;
      if (element && mediaAction.value === 'play' && element.paused) {
        log(
          '🎬 [playMediaElement] Fallback: triggering play',
          'mediaPlayer',
          'log',
        );
        triggerPlay();
      }
    };

    // Check after a short delay to allow the video to load
    setTimeout(checkAndPlay, 200);
    // Also check when the video becomes ready
    currentMediaElement.value.oncanplay = checkAndPlay;
  }
};

const playSlideshowAudio = () => {
  if (!slideshowAudioElement.value) {
    return;
  }

  slideshowAudioElement.value.currentTime = 0;
  triggerSlideshowAudioPlay();
};

const slideshowVideoUrl = ref('');

const endOrLoop = () => {
  log(
    '🎬 [endOrLoop] Video ended, repeat:',
    'mediaPlayer',
    'log',
    mediaRepeat.value,
  );
  if (mediaRepeat.value) {
    log('🎬 [endOrLoop] Looping video', 'mediaPlayer', 'log');
    if (currentMediaElement.value) {
      currentMediaElement.value.currentTime = customMin.value;
      playMediaElement();
      triggerSlideshowAudioPlay();
    }
  } else {
    log('🎬 [endOrLoop] Posting ended state', 'mediaPlayer', 'log');
    postLastEndTimestamp(Date.now());
    // Don't clear mediaCustomDuration immediately to avoid race condition
    // It will be cleared when the media state is handled by the main window
  }
};

const handleVideoPause = () => {
  log('⏸️ [handleVideoPause] Video paused', 'mediaPlayer', 'log');
  try {
    postCurrentTime(currentMediaElement.value?.currentTime || 0);
  } catch (e) {
    errorCatcher(e);
  }
};

const handleVideoCanPlay = () => {
  log(
    '🔄 [handleVideoCanPlay] Video can play',
    'mediaPlayer',
    'log',
    mediaAction.value,
    currentMediaElement.value?.paused,
    currentMediaElement.value?.readyState,
  );
  // Ensure video starts playing when it's ready, especially for videos that might not start immediately
  if (mediaAction.value === 'play' && !currentMediaElement.value?.paused) {
    // Video is already playing, no action needed
    return;
  }

  if (mediaAction.value === 'play' && currentMediaElement) {
    // Try to start playing if the action is 'play' but video isn't playing yet
    // Add a small delay to ensure the video is fully ready
    setTimeout(() => {
      if (mediaAction.value === 'play' && currentMediaElement.value?.paused) {
        log(
          '🎬 [handleVideoCanPlay] Triggering play after delay',
          'mediaPlayer',
          'log',
        );
        triggerPlay();
      }
    }, 50);
  }
};

const fadeOutDurationInSeconds = MEDIA_STOP_FADE_DURATION_SECONDS;
const fadeOutDurationInMilliseconds = fadeOutDurationInSeconds * 1000;

const playMedia = () => {
  log(
    '🔄 [playMedia] Playing media',
    'mediaPlayer',
    'log',
    mediaAction.value,
    currentMediaElement.value?.paused,
  );
  try {
    if (!currentMediaElement.value) {
      return;
    }

    let lastUpdate = 0;
    const updateInterval = fadeOutDurationInMilliseconds;
    let rafId = 0;

    const updateTime = () => {
      // Don't continue if we're in the process of ending
      if (isEnding.value) {
        return;
      }

      const currentTime = currentMediaElement.value?.currentTime || 0;

      if (Date.now() - lastUpdate > updateInterval) {
        // Throttle time updates
        try {
          postCurrentTime(currentTime);
          lastUpdate = Date.now();
        } catch (e) {
          errorCatcher(e);
        }
      }

      if (
        mediaCustomDuration.value &&
        customMax.value &&
        currentTime >= customMax.value
      ) {
        isEnding.value = true;
        endOrLoop();
        cancelAnimationFrame(rafId);
        return;
      }

      rafId = requestAnimationFrame(updateTime);
    };

    currentMediaElement.value.ontimeupdate = () => {
      try {
        if (!rafId) {
          rafId = requestAnimationFrame(updateTime);
        }
      } catch (e) {
        errorCatcher(e);
      }
    };

    currentMediaElement.value.currentTime = customMin.value;
    if (playbackRateData.value) {
      currentMediaElement.value.playbackRate = playbackRateData.value;
    }
    if (slideshowAudioElement.value) {
      slideshowAudioElement.value.currentTime = 0;
    }
    playMediaElement();
    triggerSlideshowAudioPlay();
  } catch (e) {
    errorCatcher(e);
  }
};

const isTransitioning = ref(false);

const crossfadeToNewMedia = (newUrl: string) => {
  log(
    '🎬 [crossfadeToNewMedia] Starting crossfade to:',
    'mediaPlayer',
    'log',
    newUrl,
  );

  const currentLiveLayer = getLiveLayer();
  const nextLayer = getNextLayer(newUrl);
  const nextLayerWasReused =
    nextLayer.value.url && nextLayer.value.url !== newUrl;

  // Each assignment invalidates pending fade-out cleanup for this layer. Without
  // this, an image fade-out can later clean up a video that reused the same DOM
  // layer before the timeout fired.
  nextLayer.value.token++;
  if (nextLayerWasReused) {
    cleanupMediaElement(getLayerElement(nextLayer));
  }
  nextLayer.value.url = newUrl;

  // Skip zoom/pan animation when transitioning to new media
  if (isImage(newUrl)) {
    skipZoomPanAnimation.value = true;
  }

  // Fade in the new layer
  setTimeout(() => {
    if (nextLayer.value.url !== newUrl) {
      return;
    }

    nextLayer.value.isLive = true;
    if (currentLiveLayer && currentLiveLayer.value !== nextLayer.value) {
      currentLiveLayer.value.isLive = false;
    }

    if (!currentLiveLayer || currentLiveLayer.value === nextLayer.value) {
      isTransitioning.value = false;
      return;
    }

    const oldUrl = currentLiveLayer.value.url;
    const oldToken = ++currentLiveLayer.value.token;

    // After transition completes, clean up only the layer/url that faded out.
    setTimeout(() => {
      if (oldUrl) {
        cleanupLayerIfCurrent(currentLiveLayer, oldToken, oldUrl);
      }
      isTransitioning.value = false;
    }, fadeOutDurationInMilliseconds); // Match the CSS transition duration
  }, 50); // Small delay to ensure the new media starts loading
};

// Handle clearing media (fade out current layer)
const clearCurrentMedia = () => {
  log('🎬 [clearCurrentMedia] Clearing current media', 'mediaPlayer', 'log');

  const currentLiveLayer = getLiveLayer();

  if (currentLiveLayer?.value.url) {
    const clearingUrl = currentLiveLayer.value.url;
    const clearingToken = ++currentLiveLayer.value.token;

    // Skip zoom/pan animation when clearing media
    if (isImage(clearingUrl)) {
      skipZoomPanAnimation.value = true;
      log(
        '🎬 [clearCurrentMedia] Skipping zoom/pan animation',
        'mediaPlayer',
        'log',
      );
    }

    // Fade out the current layer
    currentLiveLayer.value.isLive = false;

    // If the current media element is a video, fade out the volume over the next 300ms
    if (
      currentMediaElement.value &&
      (isVideo(clearingUrl) || isAudio(clearingUrl))
    ) {
      const videoElement = currentMediaElement.value as HTMLVideoElement;
      const initialVolume = videoElement.volume;
      const volumeStep = initialVolume / (fadeOutDurationInMilliseconds / 16); // 16ms intervals for smooth fade
      let currentVolume = initialVolume;

      const fadeOutInterval = setInterval(() => {
        currentVolume -= volumeStep;
        if (currentVolume <= 0) {
          currentVolume = 0;
          clearInterval(fadeOutInterval);
        }
        videoElement.volume = currentVolume;
      }, 16); // 60fps for smooth fade
    }

    // After transition completes, clear the URL
    setTimeout(() => {
      cleanupLayerIfCurrent(currentLiveLayer, clearingToken, clearingUrl);

      if (
        currentMediaElement.value &&
        (isVideo(clearingUrl) || isAudio(clearingUrl))
      ) {
        const videoElement = currentMediaElement.value as HTMLVideoElement;
        videoElement.volume = 1;
      }
    }, fadeOutDurationInMilliseconds); // Match the CSS transition duration
  }
};

const { data: urlVariables } = useBroadcastChannel<
  {
    base: string | undefined;
    mediator: string | undefined;
  },
  {
    base: string | undefined;
    mediator: string | undefined;
  }
>({
  name: 'url-variables',
});
const { data: online } = useBroadcastChannel<boolean, boolean>({
  name: 'online',
});

const { data: hideMediaLogo } = useBroadcastChannel<boolean, boolean>({
  name: 'hide-media-logo',
});

const { post: postMediaPlayingAction } = useBroadcastChannel<string, string>({
  name: 'media-window-media-action',
});

const { data: yeartext } = useBroadcastChannel<
  null | string | undefined,
  null | string | undefined
>({
  name: 'yeartext',
});

// Receive current writing script and language code for yeartext font selection
const { data: currentScript } = useBroadcastChannel<string, string>({
  name: 'current-script',
});
const { data: currentLang } = useBroadcastChannel<string, string>({
  name: 'current-lang',
});

const jwStore = useJwStore();
const yeartextFontFamily = ref('');

const yeartextFontStyle = computed(() =>
  yeartextFontFamily.value
    ? { fontFamily: yeartextFontFamily.value }
    : undefined,
);

const ensureElementReady = async (
  getter: () => HTMLMediaElement | null | undefined,
  maxRetries = 50,
): Promise<boolean> => {
  let timeouts = 0;
  while (!getter()) {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    if (++timeouts > maxRetries) {
      return false;
    }
  }
  return true;
};

const ensureMediaElementReady = async (maxRetries = 50): Promise<boolean> => {
  return await ensureElementReady(() => currentMediaElement.value, maxRetries);
};

const notifyAccessDenied = (isCamera: boolean) => {
  createTemporaryNotification({
    caption: t(
      isCamera
        ? 'camera-access-required-explain'
        : 'screen-access-required-explain',
    ),
    message: t(isCamera ? 'camera-access-required' : 'screen-access-required'),
    noClose: true,
    timeout: 10000,
    type: 'negative',
  });
};

const requestStream = async (isCamera: boolean, deviceId?: string) => {
  const checkAccess = async () => {
    const status = await getScreenAccessStatus();
    return status === 'granted';
  };

  const getMedia = () => {
    if (isCamera) {
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId },
      });
    }
    return navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: PLATFORM === 'linux' ? { cursor: 'never' } : true,
    });
  };

  try {
    if (!(await checkAccess())) {
      try {
        const temp = await getMedia();
        temp.getTracks().forEach((track) => track.stop());
      } catch (e) {
        errorCatcher(e, {
          contexts: {
            fn: {
              name: isCamera ? 'requestCameraAccess' : 'requestDisplayAccess',
            },
          },
        });
      }

      if (!(await checkAccess())) {
        notifyAccessDenied(isCamera);
        return null;
      }
    }

    return await getMedia();
  } catch (e) {
    errorCatcher(e, {
      contexts: { fn: { name: isCamera ? 'streamCamera' : 'streamDisplay' } },
    });
    if (isCamera) notifyAccessDenied(isCamera);
    return null;
  }
};

// Send request to main layout to get the current state, for when the media player window is first opened
const { post: postGetCurrentState } = useBroadcastChannel<string, string>({
  name: 'get-current-media-window-variables',
});

const fontsSet = ref(false);
const jwIconsFontLoaded = ref(false);

const loadFonts = async () => {
  try {
    await setElementFont('Wt-ClearText-Bold');
  } catch (e) {
    errorCatcher(e, {
      contexts: { fn: { fontName: 'Wt-ClearText-Bold', name: 'loadFonts' } },
    });
  }

  try {
    jwIconsFontLoaded.value = await setElementFont('jw-icons-all');
  } catch (e) {
    errorCatcher(e, {
      contexts: { fn: { fontName: 'jw-icons-all', name: 'loadFonts' } },
    });
    jwIconsFontLoaded.value = false;
  }

  fontsSet.value = true;
};

const clearWebsiteStream = () => {
  if (currentMediaElement.value) {
    currentMediaElement.value.pause();
    currentMediaElement.value.srcObject = null;
  }
  postMediaPlayingAction('');
  displayLayer1.value.isLive = false;
  displayLayer1.value.url = '';
};

const resetFailedWebsiteStream = (
  stream: MediaStream | null,
  ready: boolean,
) => {
  if (!ready && stream) {
    errorCatcher(new Error('Timed out waiting for media element'), {
      contexts: { fn: { name: 'streamDisplay' } },
    });
  }
  videoStreaming.value = false;
  postMediaPlayingAction('');
  currentMediaElement.value?.pause();
  if (currentMediaElement.value?.srcObject) {
    currentMediaElement.value.srcObject = null;
  }
};

const shouldClearWebsiteStream = (
  newWebStreamData: typeof webStreamData.value,
  oldWebStreamData: typeof webStreamData.value,
) =>
  newWebStreamData !== 'previewingWebsite' &&
  (oldWebStreamData === 'mirroringWebsite' ||
    oldWebStreamData === 'previewingWebsite');

const startWebsiteMirrorStream = async () => {
  if (cameraStreamId.value) cameraStreamId.value = '';

  displayLayer1.value.isLive = true;
  displayLayer1.value.url = '';

  const stream = await requestStream(false);
  const ready = stream && (await ensureMediaElementReady(50));

  if (!stream || !ready || !currentMediaElement.value) {
    resetFailedWebsiteStream(stream, !!ready);
    return;
  }

  currentMediaElement.value.srcObject = stream;
  playMediaElement(false, true);
};

whenever(
  () => seekToData.value,
  (newSeekTo) => {
    if (currentMediaElement.value) {
      currentMediaElement.value.currentTime = newSeekTo;
    }
  },
);

whenever(
  () => playbackRateData.value,
  (newRate) => {
    if (currentMediaElement.value && newRate) {
      currentMediaElement.value.playbackRate = newRate;
    }
  },
);

whenever(
  () => mediaRepeatNow.value,
  () => {
    if (currentMediaElement.value) {
      log(
        '🎬 [mediaRepeatNow] Forcing replay of current item',
        'mediaPlayer',
        'log',
      );
      currentMediaElement.value.currentTime = customMin.value;
      playMediaElement();
    }
  },
);

whenever(
  () => mediaAction.value,
  (newMediaAction, oldMediaAction) => {
    if (newMediaAction === 'pause') {
      currentMediaElement.value?.pause();
      slideshowAudioElement.value?.pause();
    } else if (newMediaAction === 'play') {
      playMediaElement(oldMediaAction === 'pause');
      triggerSlideshowAudioPlay();
    }
  },
);

watch(
  () => slideshowAudioUrl.value,
  (newUrl, oldUrl) => {
    if (newUrl === oldUrl) return;

    if (!newUrl) {
      slideshowVideoUrl.value = '';
      slideshowAudioElement.value?.pause();
      return;
    }

    slideshowVideoUrl.value = isVideo(mediaPlayingUrl.value)
      ? mediaPlayingUrl.value
      : '';

    setTimeout(() => {
      if (!slideshowVideoUrl.value && isVideo(mediaPlayingUrl.value)) {
        slideshowVideoUrl.value = mediaPlayingUrl.value;
      }

      if (
        slideshowAudioUrl.value === newUrl &&
        mediaPlayingUrl.value === slideshowVideoUrl.value
      ) {
        playSlideshowAudio();
      }
    }, 50);
  },
);

watch(
  () => mediaCustomDuration.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal && currentMediaElement.value) {
      log(
        '🎬 [mediaCustomDuration] Duration changed, seeking to:',
        'mediaPlayer',
        'log',
        customMin.value,
      );
      isEnding.value = false;
      currentMediaElement.value.currentTime = customMin.value;
    }
  },
);

// Reset ending flag when new media starts
watch(
  () => mediaPlayingUrl.value,
  (newUrl, oldUrl) => {
    log(
      '🔄 [mediaPlayingUrl] URL changed:',
      'mediaPlayer',
      'log',
      oldUrl,
      '->',
      newUrl,
    );
    isEnding.value = false;

    if (
      slideshowAudioUrl.value &&
      (!newUrl || newUrl !== slideshowVideoUrl.value)
    ) {
      slideshowAudioElement.value?.pause();
      slideshowVideoUrl.value = '';
    }

    if (oldUrl && newUrl && !isAudio(newUrl)) {
      isTransitioning.value = true;
    }

    // Handle crossfade logic
    if (newUrl && newUrl !== oldUrl) {
      // New media URL - start crossfade
      crossfadeToNewMedia(newUrl);
    } else if (!newUrl && oldUrl) {
      // Media URL cleared - fade out current media
      clearCurrentMedia();
    }

    // Clean up any existing event handlers when media URL changes
    if (currentMediaElement.value) {
      currentMediaElement.value.oncanplay = null;
      currentMediaElement.value.oncanplaythrough = null;

      // For videos, ensure the element is properly reset when URL changes
      if ((isVideo(newUrl) || isAudio(newUrl)) && newUrl !== oldUrl) {
        log(
          '🎬 [mediaPlayingUrl] Resetting video element for new URL',
          'mediaPlayer',
          'log',
        );
        // Pause current playback
        currentMediaElement.value.pause();
        // Reset current time
        currentMediaElement.value.currentTime = 0;
        // Force reload of the video
        currentMediaElement.value.load();
      }
    }
  },
);

watch(
  () =>
    [
      currentScript.value,
      currentLang.value,
      urlVariables.value?.mediator,
    ] as const,
  async ([script, lang]) => {
    if (script && urlVariables.value?.mediator) {
      // Sync urlVariables to jw store for CDN font URL resolution
      if (urlVariables.value.base) {
        jwStore.$patch({
          urlVariables: {
            base: urlVariables.value.base,
            mediator: urlVariables.value.mediator,
            pubMedia: jwStore.urlVariables?.pubMedia ?? '',
          },
        });
      }
      yeartextFontFamily.value = await loadYeartextFont(script, lang);
    }
  },
);

watchDeep(
  () => zoomPanState.value,
  (newZoomPanState) => {
    log(
      '🎬 [zoomPanState] New zoom/pan state:',
      'mediaPlayer',
      'log',
      newZoomPanState,
    );
    applyZoomPanState(newZoomPanState);
  },
);

watch(
  () => webStreamData.value,
  async (newWebStreamData, oldWebStreamData) => {
    videoStreaming.value = newWebStreamData === 'mirroringWebsite';
    if (newWebStreamData !== 'mirroringWebsite') {
      if (shouldClearWebsiteStream(newWebStreamData, oldWebStreamData)) {
        clearWebsiteStream();
      }
      return;
    }

    await startWebsiteMirrorStream();
  },
);

watchImmediate(
  () => cameraStreamId.value,
  async (deviceId) => {
    log(
      `🎬 [cameraStreamId] Watcher triggered. DeviceId: ${deviceId}`,
      'mediaPlayer',
      'log',
    );
    if (!deviceId) {
      if (cameraElement.value) {
        cameraElement.value.pause();
        cameraElement.value.srcObject = null;
      }
      return;
    }

    // Wait for the camera element to be available in the DOM (v-if)
    let retries = 0;
    while (!cameraElement.value && retries < 60) {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
      retries++;
    }

    log(
      `🎬 [cameraStreamId] Element ready check. Element: ${!!cameraElement.value}, Retries: ${retries}`,
      'mediaPlayer',
      'log',
    );

    const stream = await requestStream(true, deviceId);
    const ready =
      !!stream && (await ensureElementReady(() => cameraElement.value, 40));

    if (!stream || !ready || !cameraElement.value) {
      log(
        `🎬 [cameraStreamId] Failed to initialize. Stream: ${!!stream}, Ready: ${ready}, Element: ${!!cameraElement.value}`,
        'mediaPlayer',
        'warn',
      );
      cameraElement.value?.pause();
      if (cameraElement.value?.srcObject) {
        cameraElement.value.srcObject = null;
      }
      return;
    }

    log('🎬 [cameraStreamId] Setting stream to element', 'mediaPlayer', 'log');
    cameraElement.value.srcObject = stream;
    try {
      await cameraElement.value.play();
      log('🎬 [cameraStreamId] Camera stream started', 'mediaPlayer', 'log');
    } catch (e) {
      errorCatcher(e);
    }
  },
);

// Ensure display layers are not live if no media is playing on startup
watchImmediate(
  () => mediaPlayingUrl.value,
  (url) => {
    if (!url && !videoStreaming.value) {
      log(
        '🎬 [mediaPlayingUrl] No media playing, ensuring layers are not live',
        'mediaPlayer',
        'log',
      );
      displayLayer1.value.isLive = false;
      displayLayer2.value.isLive = false;
    }
  },
);

// Listen for initial value updates from other components
watchImmediate(
  () => [
    urlVariables.value?.base,
    urlVariables.value?.mediator,
    online.value,
    yeartext.value,
  ],
  (oldValues, newValues) => {
    const somethingChanged = {
      onlineStatusChanged: oldValues?.[2] !== newValues?.[2],
      urlVariablesChanged:
        oldValues?.[0] !== newValues?.[0] || oldValues?.[1] !== newValues?.[1],
      yeartextChanged: oldValues?.[3] !== newValues?.[3],
      yeartextIsNowEmpty: !newValues?.[3] && !!oldValues?.[3],
    };
    if (
      somethingChanged.yeartextIsNowEmpty ||
      somethingChanged.onlineStatusChanged ||
      somethingChanged.urlVariablesChanged ||
      somethingChanged.yeartextChanged
    ) {
      log(
        '🔄 [MediaPlayerPage] Setting initial values',
        'mediaPlayer',
        'log',
        somethingChanged,
        oldValues,
        newValues,
      );
      postGetCurrentState(Date.now().toString());
      loadFonts();
    }
  },
);

onMounted(() => {
  postGetCurrentState(Date.now().toString());
});

onBeforeUnmount(() => {
  log(
    '🎬 [MediaPlayerPage] onBeforeUnmount - cleaning up all media',
    'mediaPlayer',
    'log',
  );
  cleanupMediaElement(mediaElement1.value);
  cleanupMediaElement(mediaElement2.value);
  cleanupMediaElement(cameraElement.value);
});
</script>

<style scoped>
.base-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: black;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.base-layer.blank-screen {
  display: none;
}

.camera-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: black;
  z-index: 1.5;
}

.display-layer.is-audio {
  background-color: green;
  opacity: 0 !important;
}

.display-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  z-index: 2;
}

.display-layer.is-live {
  background-color: black;
  opacity: 1;
  z-index: 3;
}
</style>
