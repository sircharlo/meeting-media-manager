<template>
  <q-page-container
    class="q-electron-drag vertical-middle overflow-hidden"
    padding
    style="align-content: center; height: 100vh"
  >
    <q-resize-observer debounce="50" @resize="onResize" />
    <transition
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
      mode="out-in"
      name="fade"
    >
      <q-img
        v-if="isImage(mediaPlayingUrl)"
        id="mediaImage"
        ref="mediaImage"
        :src="mediaPlayingUrl"
        class="fitSnugly"
        fit="contain"
        no-spinner
        @load="initiatePanzoom()"
      />
      <video
        v-else-if="isVideo(mediaPlayingUrl) || videoStreaming"
        ref="mediaElement"
        class="fitSnugly"
        preload="metadata"
        @animationstart="playMedia()"
      >
        <source ref="mediaElementSource" :src="mediaPlayingUrl" />
        <track
          v-if="mediaPlayerSubtitlesUrl && subtitlesVisible"
          :src="mediaPlayerSubtitlesUrl"
          default
          kind="subtitles"
        />
      </video>
      <div v-else>
        <audio
          v-if="isAudio(mediaPlayingUrl)"
          ref="mediaElement"
          style="display: none"
          @loadedmetadata="playMedia()"
        >
          <source ref="mediaElementSource" :src="mediaPlayingUrl" />
        </audio>
        <template v-if="mediaPlayerCustomBackground">
          <q-img
            :src="mediaPlayerCustomBackground"
            class="fitSnugly"
            fit="contain"
            no-spinner
          />
        </template>
        <template v-else>
          <!-- eslint-disable next-line vue/no-v-html -->
          <div id="yeartext" class="q-pa-md center" v-html="yeartextHtml" />
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
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  isAudio,
  isImage,
  isVideo,
  showMediaWindow,
} from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { computed, ref, watch } from 'vue';

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  mediaPlayingAction,
  selectedDate,
} = storeToRefs(currentState);

const jwStore = useJwStore();
const { customDurations, yeartexts } = storeToRefs(jwStore);

const yeartextHtml = computed(() => {
  const currentYear = new Date().getFullYear();
  const yearText = yeartexts.value[currentYear]?.[currentSettings.value?.lang];
  return yearText ?? '';
});

const panzoom = ref<PanzoomObject | undefined>();

const initiatePanzoom = () => {
  try {
    const imageElem = document.getElementById('mediaImage');
    if (!imageElem) return;
    panzoom.value = Panzoom(imageElem);
  } catch (error) {
    errorCatcher(error);
  }
};

let mediaElement = ref<HTMLVideoElement | undefined>();
const mediaImage = ref<HTMLImageElement | undefined>();
const panzoomOptions = { animate: true, duration: 1000 };

const bc = new BroadcastChannel('mediaPlayback');
const mediaPlayingUrl = ref('');
const mediaUniqueId = ref('');
const mediaPlayerCustomBackground = ref('');
const mediaPlayerSubtitlesUrl = ref('');
const subtitlesVisible = ref(true);

const videoStreaming = ref(false);

bc.onmessage = (event) => {
  try {
    if ('webStream' in event.data) {
      videoStreaming.value = !!event.data.webStream;
      if (event.data.webStream) {
        navigator.mediaDevices
          .getDisplayMedia({
            audio: false,
            video: true,
          })
          .then(async (stream) => {
            let timeouts = 0;
            while (!mediaElement.value) {
              await new Promise((resolve) => {
                setTimeout(resolve, 100);
              });
              if (++timeouts > 10) break;
            }
            if (!mediaElement.value) return;
            mediaElement.value.srcObject = stream;
            mediaElement.value.play().catch((error: Error) => {
              if (
                !error.message.includes('removed from the document') &&
                !error.message.includes('new load request')
              )
                errorCatcher(error);
            });
          })
          .catch((e) => errorCatcher(e));
      } else {
        if (!mediaElement.value) return;
        mediaElement.value.pause();
        // .then(() => {
        mediaElement.value.srcObject = null;
        mediaPlayingAction.value = '';
        // })
      }
    }
    if ('seekTo' in event.data) {
      if (mediaElement.value)
        mediaElement.value.currentTime = event.data.seekTo;
    }
    if ('customBackground' in event.data)
      mediaPlayerCustomBackground.value = event.data.customBackground;
    if ('subtitlesUrl' in event.data)
      mediaPlayerSubtitlesUrl.value = event.data.subtitlesUrl;
    if ('subtitlesVisible' in event.data)
      subtitlesVisible.value = event.data.subtitlesVisible;
    if ('uniqueId' in event.data) mediaUniqueId.value = event.data.uniqueId;
    if ('url' in event.data) mediaPlayingUrl.value = event.data.url;
    if ('action' in event.data) {
      if (!mediaElement.value) return;
      if (event.data.action === 'pause') {
        mediaElement.value.pause();
      } else if (event.data.action === 'play') {
        mediaElement.value.play().catch((error: Error) => {
          if (
            !error.message.includes('removed from the document') &&
            !error.message.includes('new load request')
          )
            errorCatcher(error);
        });
      }
    }
    if ('scale' in event.data || 'x' in event.data || 'y' in event.data) {
      try {
        if (!mediaElement.value) {
          const imageElem = document.getElementById('mediaImage');
          const width = imageElem?.clientWidth || 0;
          const height = imageElem?.clientHeight || 0;
          panzoom.value?.zoom(
            (event.data?.scale ?? 1) as number,
            panzoomOptions,
          );
          if (width > 0 && height > 0)
            panzoom.value?.pan(
              ((event.data?.x ?? 0) as number) * width,
              ((event.data?.y ?? 0) as number) * height,
              panzoomOptions,
            );
        }
      } catch (error) {
        errorCatcher(error);
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

watch(currentCongregation, (newCongregation) => {
  if (!newCongregation) showMediaWindow(false);
});

const playMedia = () => {
  try {
    if (!mediaElement.value) {
      return;
    }

    mediaElement.value.onended = () => {
      bc.postMessage({ state: 'ended' });
    };

    mediaElement.value.onpause = () => {
      const currentTime = mediaElement.value?.currentTime || 0;
      bc.postMessage({ currentPosition: currentTime });
    };

    mediaElement.value.ontimeupdate = () => {
      try {
        const currentTime = mediaElement.value?.currentTime || 0;
        bc.postMessage({ currentPosition: currentTime });
        if (
          customDurations?.value?.[currentCongregation.value]?.[
            selectedDate.value
          ]?.[mediaUniqueId.value]
        ) {
          const customStartStop = customDurations?.value?.[
            currentCongregation.value
          ]?.[selectedDate.value]?.[mediaUniqueId.value] ?? { max: 0 };
          if (currentTime >= customStartStop.max) {
            bc.postMessage({ state: 'ended' });
          }
        }
      } catch (e) {
        errorCatcher(e);
      }
    };
    let customStartStop = { max: 0, min: 0 };
    if (
      customDurations?.value?.[currentCongregation.value]?.[
        selectedDate.value
      ]?.[mediaUniqueId.value]
    ) {
      customStartStop = customDurations?.value?.[currentCongregation.value]?.[
        selectedDate.value
      ]?.[mediaUniqueId.value] ?? { min: 0 };
    }
    mediaElement.value.currentTime = customStartStop.min;
    mediaElement.value.play().catch((error: Error) => {
      if (
        !(
          error.message.includes('removed from the document') ||
          error.message.includes('new load request') ||
          error.message.includes('interrupted by a call to pause')
        )
      )
        errorCatcher(error);
    });
  } catch (e) {
    errorCatcher(e);
  }
};

let initialResize = true;
function onResize(size: { height: number; width: number }) {
  if (!initialResize)
    createTemporaryNotification({
      badgeStyle: 'display: none',
      color: 'accent-400',
      group: 'resize',
      icon: 'mmm-info',
      message: size.width + 'x' + size.height,
      noClose: true,
      position: 'bottom',
    });
  initialResize = false;
}

const $q = useQuasar();

$q.iconMapFn = (iconName) => {
  if (iconName.startsWith('chevron_')) {
    return {
      cls: iconName.replace('chevron_', 'mmm-'),
    };
  }
  if (iconName.startsWith('keyboard_arrow_')) {
    return {
      cls: iconName.replace('keyboard_arrow_', 'mmm-'),
    };
  }
  if (iconName.startsWith('arrow_drop_')) {
    return {
      cls: 'mmm-dropdown-arrow',
    };
  }
  if (iconName.startsWith('mmm-') === true) {
    // we strip the "app:" part
    // const name = iconName.substring(4)

    return {
      cls: iconName,
    };
  }
};
</script>
