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
    <!-- <pre style="position: absolute; top: 0; left: 0; z-index: 1000">
      displayLayer1: {{ displayLayer1 }}
      displayLayer2: {{ displayLayer2 }}
      isTransitioning: {{ isTransitioning }}
      mediaElement1: {{ mediaElement1 }}
      mediaElement2: {{ mediaElement2 }}
      currentMediaElement: {{ currentMediaElement }}
    </pre> -->
    <q-resize-observer debounce="50" @resize="postMediaWindowSize" />

    <!-- Base yeartext layer - always visible with black background -->
    <div
      v-if="fontsSet && !mediaPlayerCustomBackground"
      class="base-layer"
      :class="{ 'blank-screen': isTransitioning }"
    >
      <!-- eslint-disable next-line vue/no-v-html -->
      <div id="yeartext" class="q-pa-md center" v-html="yeartext" />
      <div v-if="!hideMediaLogo" id="yeartextLogoContainer">
        <p id="yeartextLogo">{{ jwIcons['tv-logo'] }}</p>
      </div>
    </div>

    <!-- Custom background layer - always visible when set -->
    <div
      v-if="mediaPlayerCustomBackground"
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
  </q-page-container>
</template>

<script setup lang="ts">
import {
  useBroadcastChannel,
  watchDeep,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import { useQuasar } from 'quasar';
import { jwIcons } from 'src/constants/jw-icons';
import { errorCatcher } from 'src/helpers/error-catcher';
import { setElementFont } from 'src/helpers/fonts';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { isAudio, isImage, isVideo } from 'src/utils/media';
import { computed, onMounted, ref, type Ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { getScreenAccessStatus } = window.electronApi;

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

const isEnding = ref(false);

// Display layer state management
const displayLayer1 = ref({
  isLive: false,
  url: '',
});

const displayLayer2 = ref({
  isLive: false,
  url: '',
});

const mediaElement1 = useTemplateRef<HTMLAudioElement | HTMLVideoElement>(
  'mediaElement1',
);
const mediaElement2 = useTemplateRef<HTMLAudioElement | HTMLVideoElement>(
  'mediaElement2',
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

whenever(
  () => seekToData.value,
  (newSeekTo) => {
    if (currentMediaElement.value) {
      currentMediaElement.value.currentTime = newSeekTo;
    }
  },
);

const { data: mediaCustomDuration } = useBroadcastChannel<
  string | undefined,
  string | undefined
>({
  name: 'custom-duration',
});

const { data: mediaRepeat } = useBroadcastChannel<string, boolean>({
  name: 'repeat',
});

const { data: mediaPlayingUrl } = useBroadcastChannel<string, string>({
  name: 'media-url',
});

const { post: postCurrentTime } = useBroadcastChannel<number, number>({
  name: 'current-time',
});

const { data: mediaAction } = useBroadcastChannel<string, string>({
  name: 'main-window-media-action',
});

whenever(
  () => mediaAction.value,
  (newMediaAction, oldMediaAction) => {
    if (newMediaAction === 'pause') {
      currentMediaElement.value?.pause();
    } else if (newMediaAction === 'play') {
      playMediaElement(oldMediaAction === 'pause');
      if (cameraStreamId.value) cameraStreamId.value = '';
    }
  },
);

const handleImageLoad = () => {
  // Image loaded - apply current zoom/pan state if available
  if (zoomPanState.value && Object.keys(zoomPanState.value).length > 0) {
    applyZoomPanState(zoomPanState.value);
  }
};

const applyZoomPanState = (zoomPanState: Record<string, number>) => {
  try {
    // Try to find the active image element from either layer
    const imageElem1 = document.getElementById('mediaImage1');
    const imageElem2 = document.getElementById('mediaImage2');
    const imageElem = imageElem1 || imageElem2;

    if (!imageElem) return;

    const width = imageElem.clientWidth || 0;
    const height = imageElem.clientHeight || 0;

    if (width > 0 && height > 0) {
      // Apply zoom and pan using CSS transforms for smooth animation
      const scale = zoomPanState.scale || 1;
      const x = (zoomPanState.x || 0) * width;
      const y = (zoomPanState.y || 0) * height;

      // Use CSS transforms for smooth animation
      imageElem.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`;
      imageElem.style.transition = 'transform 0.3s ease-out';
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

const currentMediaElement: Ref<HTMLAudioElement | HTMLVideoElement | null> =
  computed(() => {
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

  console.log(
    `🎬 [triggerPlay] Attempting to play video: ${mediaPlayingUrl.value}, readyState: ${currentMediaElement.value.readyState}, paused: ${currentMediaElement.value.paused}`,
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
      console.error('❌ [triggerPlay] Video play error:', error);
      errorCatcher(error);
    }
  });
};

const playMediaElement = (wasPaused = false, websiteStream = false) => {
  if (!currentMediaElement.value) {
    return;
  }

  console.log(
    '🎬 [playMediaElement] Setting up video playback',
    wasPaused,
    websiteStream,
    mediaAction.value,
  );

  if (wasPaused || websiteStream) {
    triggerPlay(websiteStream);
  }

  currentMediaElement.value.oncanplaythrough = () => {
    console.log('🎬 [playMediaElement] Video can play through');
    triggerPlay(websiteStream);
  };

  // For videos, add an additional check to ensure playback starts
  if (isVideo(mediaPlayingUrl.value) && mediaAction.value === 'play') {
    // Set up a fallback mechanism to ensure video starts playing
    const checkAndPlay = () => {
      const element = currentMediaElement.value;
      if (element && mediaAction.value === 'play' && element.paused) {
        console.log('🎬 [playMediaElement] Fallback: triggering play');
        triggerPlay();
      }
    };

    // Check after a short delay to allow the video to load
    setTimeout(checkAndPlay, 200);
    // Also check when the video becomes ready
    currentMediaElement.value.oncanplay = checkAndPlay;
  }
};

const endOrLoop = () => {
  console.log('🎬 [endOrLoop] Video ended, repeat:', mediaRepeat.value);
  if (!mediaRepeat.value) {
    console.log('🎬 [endOrLoop] Posting ended state');
    postLastEndTimestamp(Date.now());
    // Don't clear mediaCustomDuration immediately to avoid race condition
    // It will be cleared when the media state is handled by the main window
  } else {
    console.log('🎬 [endOrLoop] Looping video');
    if (currentMediaElement.value) {
      currentMediaElement.value.currentTime = customMin.value;
      playMediaElement();
    }
  }
};

const handleVideoPause = () => {
  console.log('⏸️ [handleVideoPause] Video paused');
  try {
    postCurrentTime(currentMediaElement.value?.currentTime || 0);
  } catch (e) {
    errorCatcher(e);
  }
};

const handleVideoCanPlay = () => {
  console.log(
    '🔄 [handleVideoCanPlay] Video can play',
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
        console.log('🎬 [handleVideoCanPlay] Triggering play after delay');
        triggerPlay();
      }
    }, 50);
  }
};

const fadeOutDurationInSeconds = 0.3;
const fadeOutDurationInMilliseconds = fadeOutDurationInSeconds * 1000;

const playMedia = () => {
  console.log(
    '🔄 [playMedia] Playing media',
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
    playMediaElement();
  } catch (e) {
    errorCatcher(e);
  }
};

const isTransitioning = ref(false);

// Crossfade function to handle layer transitions
const crossfadeToNewMedia = (newUrl: string) => {
  console.log('🎬 [crossfadeToNewMedia] Starting crossfade to:', newUrl);

  // Determine which layer is currently live and which is not
  const currentLiveLayer = displayLayer1.value.isLive
    ? displayLayer1
    : displayLayer2;
  const nextLayer = displayLayer1.value.isLive ? displayLayer2 : displayLayer1;

  // Set the new URL on the non-live layer
  nextLayer.value.url = newUrl;

  // Fade in the new layer
  setTimeout(() => {
    nextLayer.value.isLive = true;
    currentLiveLayer.value.isLive = false;

    // After transition completes, clean up the old layer
    setTimeout(() => {
      currentLiveLayer.value.url = '';
      isTransitioning.value = false;
    }, fadeOutDurationInMilliseconds); // Match the CSS transition duration
  }, 50); // Small delay to ensure the new media starts loading
};

// Handle clearing media (fade out current layer)
const clearCurrentMedia = () => {
  console.log('🎬 [clearCurrentMedia] Clearing current media');

  const currentLiveLayer = displayLayer1.value.isLive
    ? displayLayer1
    : displayLayer2;

  if (currentLiveLayer.value.url) {
    // Fade out the current layer
    currentLiveLayer.value.isLive = false;

    // If the current media element is a video, fade out the volume over the next 300ms
    if (
      currentMediaElement.value &&
      (isVideo(currentLiveLayer.value.url) ||
        isAudio(currentLiveLayer.value.url))
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
      currentLiveLayer.value.url = '';
      if (
        currentMediaElement.value &&
        (isVideo(currentLiveLayer.value.url) ||
          isAudio(currentLiveLayer.value.url))
      ) {
        const videoElement = currentMediaElement.value as HTMLVideoElement;
        videoElement.volume = 1;
      }
    }, fadeOutDurationInMilliseconds); // Match the CSS transition duration
  }
};

// Reset ending flag when new media starts
watch(
  () => mediaPlayingUrl.value,
  (newUrl, oldUrl) => {
    console.log('🔄 [mediaPlayingUrl] URL changed:', oldUrl, '->', newUrl);
    isEnding.value = false;

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
        console.log('🎬 [mediaPlayingUrl] Resetting video element for new URL');
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

const { post: postMediaWindowSize } = useBroadcastChannel({
  name: 'media-window-size',
});

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

const { data: yeartext } = useBroadcastChannel<string, string>({
  name: 'yeartext',
});

watchDeep(
  () => zoomPanState.value,
  (newZoomPanState) => {
    applyZoomPanState(newZoomPanState);
  },
);

watch(
  () => webStreamData.value,
  async (newWebStreamData) => {
    videoStreaming.value = newWebStreamData === 'mirroringWebsite';
    if (newWebStreamData === 'mirroringWebsite') {
      if (cameraStreamId.value) cameraStreamId.value = '';

      // Activate a display layer for streaming
      displayLayer1.value.isLive = true;
      displayLayer1.value.url = ''; // No URL for streaming, just activate the layer

      const screenAccessStatus = await getScreenAccessStatus();
      if (!screenAccessStatus || screenAccessStatus !== 'granted') {
        try {
          await navigator.mediaDevices.getDisplayMedia({
            audio: false,
            video: true,
          });
        } catch (e) {
          console.error(
            '[MediaPlayerPage] First screen access request failed:',
            e,
          );
          errorCatcher(e, {
            contexts: { fn: { name: 'requestDisplayAccess' } },
          });
        }
        const screenAccessStatusSecondTry = await getScreenAccessStatus();
        if (
          !screenAccessStatusSecondTry ||
          screenAccessStatusSecondTry !== 'granted'
        ) {
          console.error(
            '[MediaPlayerPage] Screen access not granted - cannot stream',
          );
          createTemporaryNotification({
            caption: t('screen-access-required-explain'),
            message: t('screen-access-required'),
            noClose: true,
            timeout: 10000,
            type: 'negative',
          });
          videoStreaming.value = false;
          return;
        }
      }
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          audio: false,
          video: true,
        });
        let timeouts = 0;
        while (!currentMediaElement.value) {
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          if (++timeouts > 50) {
            console.error(
              '[MediaPlayerPage] Timed out waiting for media element',
            );
            break;
          }
        }
        if (!currentMediaElement.value || !stream) {
          console.error(
            '[MediaPlayerPage] No media element or stream available',
          );
          videoStreaming.value = false;
          postMediaPlayingAction('');
          currentMediaElement.value?.pause();
          if (currentMediaElement.value?.srcObject) {
            currentMediaElement.value.srcObject = null;
          }
          return;
        }
        currentMediaElement.value.srcObject = stream;
        playMediaElement(false, true);
      } catch (e) {
        errorCatcher(e, { contexts: { fn: { name: 'streamDisplay' } } });
      }
    } else if (newWebStreamData !== 'previewingWebsite') {
      if (currentMediaElement.value) {
        currentMediaElement.value.pause();
        currentMediaElement.value.srcObject = null;
      }
      postMediaPlayingAction('');

      // Deactivate display layer
      displayLayer1.value.isLive = false;
      displayLayer1.value.url = '';
    }
  },
);

watch(
  () => cameraStreamId.value,
  async (deviceId) => {
    videoStreaming.value = !!deviceId;
    if (deviceId) {
      const screenAccessStatus = await getScreenAccessStatus();
      if (!screenAccessStatus || screenAccessStatus !== 'granted') {
        try {
          await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { deviceId },
          });
        } catch (e) {
          errorCatcher(e, {
            contexts: { fn: { name: 'requestCameraAccess' } },
          });
          if (cameraStreamId.value) cameraStreamId.value = '';
          videoStreaming.value = false;
          createTemporaryNotification({
            caption: t('camera-access-required-explain'),
            message: t('camera-access-required'),
            noClose: true,
            timeout: 10000,
            type: 'negative',
          });
          return;
        }
        const screenAccessStatusSecondTry = await getScreenAccessStatus();
        if (
          !screenAccessStatusSecondTry ||
          screenAccessStatusSecondTry !== 'granted'
        ) {
          createTemporaryNotification({
            caption: t('screen-access-required-explain'),
            message: t('screen-access-required'),
            noClose: true,
            timeout: 10000,
            type: 'negative',
          });
          videoStreaming.value = false;
          return;
        }
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { deviceId },
        });
        let timeouts = 0;
        while (!currentMediaElement.value) {
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          if (++timeouts > 10) break;
        }
        if (!currentMediaElement.value || !stream) {
          videoStreaming.value = false;
          postMediaPlayingAction('');
          currentMediaElement.value?.pause();
          if (currentMediaElement.value?.srcObject) {
            currentMediaElement.value.srcObject = null;
          }
          return;
        }
        currentMediaElement.value.srcObject = stream;
        playMediaElement(false, true);
      } catch (e) {
        errorCatcher(e, { contexts: { fn: { name: 'streamCamera' } } });
        if (cameraStreamId.value) cameraStreamId.value = '';
        videoStreaming.value = false;
        createTemporaryNotification({
          caption: t('camera-access-required-explain'),
          message: t('camera-access-required'),
          noClose: true,
          timeout: 10000,
          type: 'negative',
        });
        return;
      }
    } else {
      if (currentMediaElement.value) {
        currentMediaElement.value.pause();
        currentMediaElement.value.srcObject = null;
      }
      postMediaPlayingAction('');
    }
  },
);

// Send request to main layout to get the current state, for when the media player window is first opened
const { post: postGetCurrentState } = useBroadcastChannel<string, string>({
  name: 'get-current-media-window-variables',
});

const fontsSet = ref(false);

// Listen for initial value updates from other components
watchImmediate(
  () => [
    urlVariables.value?.base,
    urlVariables.value?.mediator,
    online.value,
    yeartext.value,
  ],
  (oldValues, newValues) => {
    const urlVariablesChanged =
      oldValues?.[0] !== newValues?.[0] || oldValues?.[1] !== newValues?.[1];
    const onlineChanged = oldValues?.[2] !== newValues?.[2];
    const yeartextChanged = oldValues?.[3] !== newValues?.[3];
    const newYeartextIsEmpty = !newValues?.[3] && oldValues?.[3];
    if (
      urlVariablesChanged ||
      onlineChanged ||
      yeartextChanged ||
      newYeartextIsEmpty
    ) {
      console.log('🔄 [MediaPlayerPage] Setting initial values');
      postGetCurrentState(new Date().getTime().toString());
      setElementFont('Wt-ClearText-Bold');
      setElementFont('JW-Icons');
      fontsSet.value = true;
    }
  },
);

onMounted(() => {
  postGetCurrentState(new Date().getTime().toString());
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
  background-color: black;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  z-index: 2;
}

.display-layer.is-live {
  opacity: 1;
  z-index: 3;
}
</style>
