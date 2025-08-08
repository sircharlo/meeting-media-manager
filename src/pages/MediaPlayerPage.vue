<template>
  <q-page-container
    class="vertical-middle overflow-hidden"
    padding
    style="align-content: center; height: 100vh; -webkit-app-region: drag"
  >
    <pre>
      {{ urlVariables }}
      {{ online }}
      {{ hideMediaLogo }}
      {{ yeartext }}
      {{ mediaPlayingUrl }}
      {{ mediaAction }}
    </pre>
    <q-resize-observer debounce="50" @resize="postMediaWindowSize" />
    <transition
      appear
      enter-active-class="animated fadeIn slow"
      leave-active-class="animated fadeOut slow"
      mode="out-in"
      name="fade"
    >
      <q-img
        v-if="isImage(mediaPlayingUrl)"
        id="mediaImage"
        class="fit-snugly"
        fit="contain"
        no-spinner
        :src="mediaPlayingUrl"
        @load="initiatePanzoom()"
      />
      <video
        v-else-if="isVideo(mediaPlayingUrl) || videoStreaming"
        :key="mediaPlayingUrl"
        ref="mediaElement"
        class="fit-snugly"
        disableRemotePlayback
        preload="metadata"
        :src="mediaPlayingUrl"
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
      <div v-else>
        <audio
          v-if="isAudio(mediaPlayingUrl)"
          ref="mediaElement"
          style="display: none"
          @loadedmetadata="playMedia()"
        >
          <source :src="mediaPlayingUrl" />
        </audio>
        <template v-if="mediaPlayerCustomBackground">
          <q-img
            class="fit-snugly"
            fit="contain"
            no-spinner
            :src="mediaPlayerCustomBackground"
          />
        </template>
        <template v-else-if="fontsSet">
          <!-- eslint-disable next-line vue/no-v-html -->
          <div id="yeartext" class="q-pa-md center" v-html="yeartext" />
          <div v-if="!hideMediaLogo" id="yeartextLogoContainer">
            <p id="yeartextLogo"></p>
          </div>
        </template>
      </div>
    </transition>
  </q-page-container>
</template>
<script setup lang="ts">
import Panzoom, { type PanzoomObject } from '@panzoom/panzoom';
import {
  useBroadcastChannel,
  watchDeep,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import { useQuasar } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { setElementFont } from 'src/helpers/fonts';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { isAudio, isImage, isVideo } from 'src/utils/media';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
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

const panzoom = ref<PanzoomObject | undefined>();
const isEnding = ref(false);

const initiatePanzoom = () => {
  try {
    const imageElem = document.getElementById('mediaImage');
    if (!imageElem) return;
    panzoom.value = Panzoom(imageElem, {
      animate: true,
      maxScale: 5,
      minScale: 1,
    });
    setPanzoom(panzoomState.value, false);
  } catch (error) {
    errorCatcher(error);
  }
};

const mediaElement = useTemplateRef<HTMLAudioElement | HTMLVideoElement>(
  'mediaElement',
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
    if (mediaElement.value) {
      mediaElement.value.currentTime = newSeekTo;
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
      mediaElement.value?.pause();
    } else if (newMediaAction === 'play') {
      playMediaElement(oldMediaAction === 'pause');
      if (cameraStreamId.value) cameraStreamId.value = '';
    }
  },
);

const setPanzoom = (panzoomState: Record<string, number>, animate = true) => {
  const panzoomOptions = { animate: !!animate, duration: 1000 };
  try {
    if (!mediaElement.value) {
      const imageElem = document.getElementById('mediaImage');
      const width = imageElem?.clientWidth || 0;
      const height = imageElem?.clientHeight || 0;
      panzoom.value?.zoom(panzoomState?.scale ?? 1, panzoomOptions);
      setTimeout(() => {
        if (width > 0 && height > 0)
          panzoom.value?.pan(
            (panzoomState?.x ?? 0) * width,
            (panzoomState?.y ?? 0) * height,
            panzoomOptions,
          );
      });
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const { data: panzoomState } = useBroadcastChannel<
  Record<string, number>,
  Record<string, number>
>({
  name: 'panzoom',
});

const { data: webStreamData } = useBroadcastChannel<boolean, boolean>({
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

const triggerPlay = (force = false) => {
  if (!force && mediaAction.value !== 'play') {
    return;
  }

  if (!mediaElement.value) {
    return;
  }

  // For videos, ensure we're ready to play
  if (isVideo(mediaPlayingUrl.value) && mediaElement.value.readyState < 2) {
    // Video not ready yet, wait a bit and try again
    setTimeout(() => {
      triggerPlay(force);
    }, 100);
    return;
  }

  console.log(
    `🎬 [triggerPlay] Attempting to play video: ${mediaPlayingUrl.value}, readyState: ${mediaElement.value.readyState}, paused: ${mediaElement.value.paused}`,
  );

  mediaElement.value.play().catch((error: Error) => {
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
  if (!mediaElement.value) {
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

  mediaElement.value.oncanplaythrough = () => {
    console.log('🎬 [playMediaElement] Video can play through');
    triggerPlay();
  };

  // For videos, add an additional check to ensure playback starts
  if (isVideo(mediaPlayingUrl.value) && mediaAction.value === 'play') {
    // Set up a fallback mechanism to ensure video starts playing
    const checkAndPlay = () => {
      if (
        mediaElement.value &&
        mediaAction.value === 'play' &&
        mediaElement.value.paused
      ) {
        console.log('🎬 [playMediaElement] Fallback: triggering play');
        triggerPlay();
      }
    };

    // Check after a short delay to allow the video to load
    setTimeout(checkAndPlay, 200);
    // Also check when the video becomes ready
    mediaElement.value.oncanplay = checkAndPlay;
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
    if (mediaElement.value) {
      mediaElement.value.currentTime = customMin.value;
      playMediaElement();
    }
  }
};

const handleVideoPause = () => {
  console.log('⏸️ [handleVideoPause] Video paused');
  postCurrentTime(mediaElement.value?.currentTime || 0);
};

const handleVideoCanPlay = () => {
  console.log(
    '🔄 [handleVideoCanPlay] Video can play',
    mediaAction.value,
    mediaElement.value?.paused,
    mediaElement.value?.readyState,
  );
  // Ensure video starts playing when it's ready, especially for videos that might not start immediately
  if (
    mediaAction.value === 'play' &&
    mediaElement.value &&
    !mediaElement.value.paused
  ) {
    // Video is already playing, no action needed
    return;
  }

  if (mediaAction.value === 'play' && mediaElement.value) {
    // Try to start playing if the action is 'play' but video isn't playing yet
    // Add a small delay to ensure the video is fully ready
    setTimeout(() => {
      if (
        mediaAction.value === 'play' &&
        mediaElement.value &&
        mediaElement.value.paused
      ) {
        console.log('🎬 [handleVideoCanPlay] Triggering play after delay');
        triggerPlay();
      }
    }, 50);
  }
};

const playMedia = () => {
  console.log(
    '🔄 [playMedia] Playing media',
    mediaAction.value,
    mediaElement.value?.paused,
  );
  try {
    if (!mediaElement.value) {
      return;
    }

    let lastUpdate = 0;
    const updateInterval = 300;
    let rafId = 0;

    const updateTime = () => {
      // Don't continue if we're in the process of ending
      if (isEnding.value) {
        return;
      }

      const currentTime = mediaElement.value?.currentTime || 0;

      if (Date.now() - lastUpdate > updateInterval) {
        // Throttle time updates
        postCurrentTime(currentTime);
        lastUpdate = Date.now();
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

    mediaElement.value.ontimeupdate = () => {
      try {
        if (!rafId) {
          rafId = requestAnimationFrame(updateTime);
        }
      } catch (e) {
        errorCatcher(e);
      }
    };

    mediaElement.value.currentTime = customMin.value;
    playMediaElement();
  } catch (e) {
    errorCatcher(e);
  }
};

// Reset ending flag when new media starts
watch(
  () => mediaPlayingUrl.value,
  (newUrl, oldUrl) => {
    console.log('🔄 [mediaPlayingUrl] URL changed:', oldUrl, '->', newUrl);
    isEnding.value = false;

    // Clean up any existing event handlers when media URL changes
    if (mediaElement.value) {
      mediaElement.value.oncanplay = null;
      mediaElement.value.oncanplaythrough = null;

      // For videos, ensure the element is properly reset when URL changes
      if (isVideo(newUrl) && newUrl !== oldUrl) {
        console.log('🎬 [mediaPlayingUrl] Resetting video element for new URL');
        // Pause current playback
        mediaElement.value.pause();
        // Reset current time
        mediaElement.value.currentTime = 0;
        // Force reload of the video
        mediaElement.value.load();
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
  () => panzoomState.value,
  (newPanzoomState) => {
    setPanzoom(newPanzoomState);
  },
);

watch(
  () => webStreamData.value,
  async (newWebStreamData) => {
    videoStreaming.value = newWebStreamData;
    if (newWebStreamData) {
      cameraStreamId.value = '';
      const screenAccessStatus = await getScreenAccessStatus();
      if (!screenAccessStatus || screenAccessStatus !== 'granted') {
        try {
          await navigator.mediaDevices.getDisplayMedia({
            audio: false,
            video: true,
          });
        } catch (e) {
          errorCatcher(e, {
            contexts: { fn: { name: 'requestDisplayAccess' } },
          });
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
        const stream = await navigator.mediaDevices.getDisplayMedia({
          audio: false,
          video: true,
        });
        let timeouts = 0;
        while (!mediaElement.value) {
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          if (++timeouts > 50) break;
        }
        if (!mediaElement.value || !stream) {
          videoStreaming.value = false;
          postMediaPlayingAction('');
          mediaElement.value?.pause();
          if (mediaElement?.value?.srcObject) {
            mediaElement.value.srcObject = null;
          }
          return;
        }
        mediaElement.value.srcObject = stream;
        playMediaElement(false, true);
      } catch (e) {
        errorCatcher(e, { contexts: { fn: { name: 'streamDisplay' } } });
      }
    } else {
      if (mediaElement.value) {
        mediaElement.value.pause();
        mediaElement.value.srcObject = null;
      }
      postMediaPlayingAction('');
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
          cameraStreamId.value = '';
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
        while (!mediaElement.value) {
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          if (++timeouts > 10) break;
        }
        if (!mediaElement.value || !stream) {
          videoStreaming.value = false;
          postMediaPlayingAction('');
          mediaElement.value?.pause();
          if (mediaElement?.value?.srcObject) {
            mediaElement.value.srcObject = null;
          }
          return;
        }
        mediaElement.value.srcObject = stream;
        playMediaElement();
      } catch (e) {
        errorCatcher(e, { contexts: { fn: { name: 'streamCamera' } } });
        cameraStreamId.value = '';
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
      if (mediaElement.value) {
        mediaElement.value.pause();
        mediaElement.value.srcObject = null;
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
    const newYeartextIsEmpty = !newValues?.[3];
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
