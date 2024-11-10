<template>
  <q-page-container
    class="q-electron-drag vertical-middle overflow-hidden"
    padding
    style="align-content: center; height: 100vh"
  >
    <q-resize-observer debounce="50" @resize="onResize" />
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
import type { FontName } from 'src/types';

import Panzoom, { type PanzoomObject } from '@panzoom/panzoom';
import { useBroadcastChannel, watchDeep, whenever } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { FONT_URLS } from 'src/constants/fonts';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getLocalFontPath } from 'src/helpers/fonts';
import {
  isAudio,
  isImage,
  isVideo,
  showMediaWindow,
} from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { computed, onMounted, ref, watch } from 'vue';

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  mediaPlayingAction,
  selectedDate,
} = storeToRefs(currentState);

const jwStore = useJwStore();
const { customDurations } = storeToRefs(jwStore);

const yeartext = computed(() => jwStore.yeartext);

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

let mediaElement = ref<HTMLVideoElement | undefined>();
const mediaImage = ref<HTMLImageElement | undefined>();

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

const { data: mediaUniqueId } = useBroadcastChannel<string, string>({
  name: 'unique-id',
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
  (newMediaAction) => {
    if (newMediaAction === 'pause') {
      mediaElement.value?.pause();
    } else if (newMediaAction === 'play') {
      mediaElement.value?.play().catch((error: Error) => {
        if (
          !(
            error.message.includes('removed from the document') ||
            error.message.includes('new load request') ||
            error.message.includes('interrupted by a call to pause')
          )
        )
          errorCatcher(error);
      });
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
  (newWebStreamData) => {
    videoStreaming.value = newWebStreamData;
    if (newWebStreamData) {
      navigator.mediaDevices
        .getDisplayMedia({ audio: false, video: true })
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
              !(
                error.message.includes('removed from the document') ||
                error.message.includes('new load request') ||
                error.message.includes('interrupted by a call to pause')
              )
            )
              errorCatcher(error);
          });
        })
        .catch((e) => errorCatcher(e));
    } else {
      if (!mediaElement.value) return;
      mediaElement.value.pause();
      mediaElement.value.srcObject = null;
      mediaPlayingAction.value = '';
    }
  },
);

watch(currentCongregation, (newCongregation) => {
  if (!newCongregation) showMediaWindow(false);
});

const { post: postMediaState } = useBroadcastChannel<'ended', 'ended'>({
  name: 'media-state',
});

const playMedia = () => {
  try {
    if (!mediaElement.value) {
      return;
    }

    mediaElement.value.onended = () => {
      postMediaState('ended');
    };

    mediaElement.value.onpause = () => {
      postCurrentTime(mediaElement.value?.currentTime || 0);
    };

    mediaElement.value.ontimeupdate = () => {
      try {
        const currentTime = mediaElement.value?.currentTime || 0;
        postCurrentTime(currentTime);
        if (
          customDurations?.value?.[currentCongregation.value]?.[
            selectedDate.value
          ]?.[mediaUniqueId.value]
        ) {
          const customStop =
            customDurations?.value?.[currentCongregation.value]?.[
              selectedDate.value
            ]?.[mediaUniqueId.value]?.max;
          if (customStop && currentTime >= customStop) {
            postMediaState('ended');
          }
        }
      } catch (e) {
        errorCatcher(e);
      }
    };
    const customStart =
      customDurations?.value?.[currentCongregation.value]?.[
        selectedDate.value
      ]?.[mediaUniqueId.value]?.min ?? 0;
    mediaElement.value.currentTime = customStart;
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

const setElementFont = async (fontName: FontName) => {
  if (!fontName) return;
  try {
    const fontFace = new FontFace(
      fontName,
      'url("' + (await getLocalFontPath(fontName)) + '")',
    );
    await fontFace.load();
    document.fonts.add(fontFace);
  } catch (error) {
    const fontFace = new FontFace(
      fontName,
      'url("' + FONT_URLS[fontName] + '")',
    );
    await fontFace.load();
    document.fonts.add(fontFace);
    errorCatcher(error);
  }
};

onMounted(() => {
  setElementFont('WT-ClearText-Bold');
  setElementFont('JW-Icons');
});
</script>
