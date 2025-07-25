<template>
  <q-page-container
    class="vertical-middle overflow-hidden"
    padding
    style="align-content: center; height: 100vh; -webkit-app-region: drag"
  >
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
        ref="mediaElement"
        class="fit-snugly"
        disableRemotePlayback
        preload="metadata"
        @animationstart="playMedia()"
      >
        <source :src="mediaPlayingUrl" />
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
        <template v-else>
          <!-- eslint-disable next-line vue/no-v-html -->
          <div id="yeartext" class="q-pa-md center" v-html="yeartext" />
          <div
            v-if="!currentSettings?.hideMediaLogo"
            id="yeartextLogoContainer"
          >
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
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { setElementFont } from 'src/helpers/fonts';
import { showMediaWindow } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { isAudio, isImage, isVideo } from 'src/utils/media';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { getScreenAccessStatus } = window.electronApi;

const currentState = useCurrentStateStore();
const yeartext = computed(() => currentState.yeartext);
const { currentCongregation, currentSettings, mediaPlayingAction } =
  storeToRefs(currentState);

const jwStore = useJwStore();

const panzoom = ref<PanzoomObject | undefined>();

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
subtitlesVisible.value = true;

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
  name: 'media-action',
});

whenever(
  () => mediaAction.value,
  (newMediaAction, oldMediaAction) => {
    if (newMediaAction === 'pause') {
      mediaElement.value?.pause();
    } else if (newMediaAction === 'play') {
      playMediaElement(oldMediaAction === 'pause');
      cameraStreamId.value = '';
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

watchDeep(
  () => panzoomState.value,
  (newPanzoomState) => {
    setPanzoom(newPanzoomState);
  },
);

const { data: webStreamData } = useBroadcastChannel<boolean, boolean>({
  name: 'web-stream',
});

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
          mediaPlayingAction.value = '';
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
      mediaPlayingAction.value = '';
    }
  },
);

const { data: cameraStreamId } = useBroadcastChannel<string, string>({
  name: 'camera-stream',
});

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
          mediaPlayingAction.value = '';
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
      mediaPlayingAction.value = '';
    }
  },
);

const triggerPlay = (force = false) => {
  if (!force && mediaAction.value !== 'play') {
    return;
  }

  mediaElement.value?.play().catch((error: Error) => {
    const ignoredErrors = [
      'removed from the document',
      'new load request',
      'interrupted by a call to pause',
    ];

    const shouldIgnore = ignoredErrors.some((msg) =>
      error.message.includes(msg),
    );

    if (!shouldIgnore) {
      errorCatcher(error);
    }
  });
};

const playMediaElement = (wasPaused = false, websiteStream = false) => {
  if (!mediaElement.value) {
    return;
  }

  if (wasPaused || websiteStream) {
    triggerPlay(websiteStream);
  }

  mediaElement.value.oncanplaythrough = () => {
    triggerPlay();
  };
};

watch(currentCongregation, (newCongregation) => {
  if (!newCongregation) showMediaWindow(false);
});

const { post: postMediaState } = useBroadcastChannel<'ended', 'ended'>({
  name: 'media-state',
});

const customMin = computed(() => {
  return (JSON.parse(mediaCustomDuration.value || '{}') || {})?.min || 0;
});

const customMax = computed(() => {
  return (JSON.parse(mediaCustomDuration.value || '{}') || {})?.max;
});

const endOrLoop = () => {
  if (!mediaRepeat.value) {
    postMediaState('ended');
    mediaCustomDuration.value = undefined;
  } else {
    if (mediaElement.value) {
      mediaElement.value.currentTime = customMin.value;
      playMediaElement();
    }
  }
};

const playMedia = () => {
  try {
    if (!mediaElement.value) {
      return;
    }

    mediaElement.value.onended = () => {
      endOrLoop();
    };

    mediaElement.value.onpause = () => {
      postCurrentTime(mediaElement.value?.currentTime || 0);
    };

    let lastUpdate = 0;
    const updateInterval = 300;
    let rafId = 0;

    const updateTime = () => {
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

const { post: postMediaWindowSize } = useBroadcastChannel({
  name: 'media-window-size',
});

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

watchImmediate(
  () => [
    jwStore.urlVariables?.base,
    jwStore.urlVariables?.mediator,
    currentState.online,
  ],
  () => {
    if (currentState.online) {
      setElementFont('Wt-ClearText-Bold');
      setElementFont('JW-Icons');
    }
  },
);
</script>
