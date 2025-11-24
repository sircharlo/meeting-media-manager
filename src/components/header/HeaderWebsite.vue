<template>
  <template
    v-if="(mediaPlaying.action || '').toLowerCase().includes('website')"
  >
    <q-btn-group unelevated>
      <q-btn color="white-transparent" @click="zoomWebsiteWindow('out')">
        <q-icon name="mmm-minus" size="xs" />
        <q-tooltip :delay="1000">{{ t('zoom-out') }}</q-tooltip>
      </q-btn>
      <q-btn color="white-transparent" @click="zoomWebsiteWindow('in')">
        <q-icon name="mmm-plus" size="xs" />
        <q-tooltip :delay="1000">{{ t('zoom-in') }}</q-tooltip>
      </q-btn>
    </q-btn-group>
    <q-btn-group unelevated>
      <q-btn color="white-transparent" @click="navigateWebsiteWindow('back')">
        <q-icon name="mmm-arrow-back" size="xs" />
        <q-tooltip :delay="1000">{{ t('back') }}</q-tooltip>
      </q-btn>
      <q-btn
        color="white-transparent"
        @click="navigateWebsiteWindow('forward')"
      >
        <q-icon name="mmm-arrow-forward" size="xs" />
        <q-tooltip :delay="1000">{{ t('forward') }}</q-tooltip>
      </q-btn>
      <q-btn
        color="white-transparent"
        @click="navigateWebsiteWindow('refresh')"
      >
        <q-icon name="mmm-refresh" size="xs" />
        <q-tooltip :delay="1000">{{ t('refresh') }}</q-tooltip>
      </q-btn>
    </q-btn-group>
  </template>
  <q-btn
    v-if="mediaPlaying.action === 'mirroringWebsite'"
    color="white-transparent"
    unelevated
    @click="stopStreaming()"
  >
    <q-icon class="q-mr-sm" name="mmm-mirror" size="xs" />
    <template v-if="$q.screen.gt.xs">{{ t('stop-mirroring') }}</template>
    <q-tooltip v-else :delay="1000">{{ t('stop-mirroring') }}</q-tooltip>
  </q-btn>
  <q-btn
    v-else-if="mediaPlaying.action === 'previewingWebsite'"
    color="white-transparent"
    unelevated
    @click="startStreaming()"
  >
    <q-icon class="q-mr-sm" name="mmm-mirror" size="xs" />
    {{ t('start-mirroring') }}
  </q-btn>
  <q-btn
    v-else
    color="white-transparent"
    :disable="mediaIsPlaying"
    unelevated
    @click="previewWebsite()"
  >
    <q-icon class="q-mr-sm" name="mmm-mirror" size="xs" />
    {{ t('open-website') }}
  </q-btn>
</template>
<script setup lang="ts">
import { useBroadcastChannel, watchImmediate } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { showMediaWindow } from 'src/helpers/mediaPlayback';
import { sendObsSceneEvent } from 'src/utils/obs';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const {
  closeWebsiteWindow,
  navigateWebsiteWindow,
  onWebsiteWindowClosed,
  openWebsiteWindow,
  zoomWebsiteWindow,
} = window.electronApi;

const { t } = useI18n();
const currentState = useCurrentStateStore();
const {
  autoReturnFromWebsite,
  currentLangObject,
  mediaWindowVisible,
  websiteSelection,
} = storeToRefs(currentState);

const router = useRouter();
const { mediaIsPlaying, mediaPlaying } = storeToRefs(currentState);

const startStreaming = () => {
  mediaPlaying.value.action = 'mirroringWebsite';
  postWebStream(mediaPlaying.value.action);
  if (!mediaWindowVisible.value) {
    showMediaWindow();
  }
  sendObsSceneEvent('media');
};

const stopStreaming = () => {
  mediaPlaying.value.action = '';
  postWebStream('inactive');
  closeWebsiteWindow();
  sendObsSceneEvent('camera');
  if (currentLangObject.value?.isSignLanguage) {
    const cameraId = useAppSettingsStore().displayCameraId;
    if (cameraId) {
      postCameraStream(cameraId);
    } else {
      showMediaWindow(false);
    }
  }
  if (autoReturnFromWebsite.value) {
    router.push({ name: 'media-calendar' });
  }
};

const previewWebsite = () => {
  mediaPlaying.value.action = 'previewingWebsite';
  postWebStream(mediaPlaying.value.action);

  openWebsiteWindow({
    langCode: currentLangObject.value?.langcode,
    langSymbol: currentLangObject.value?.symbol,
    site: websiteSelection.value,
  });
};

const { post: postCameraStream } = useBroadcastChannel<
  null | string,
  null | string
>({
  name: 'camera-stream',
});

const { post: postWebStream } = useBroadcastChannel<
  'inactive' | 'mirroringWebsite' | 'previewingWebsite' | undefined,
  'inactive' | 'mirroringWebsite' | 'previewingWebsite' | undefined
>({
  name: 'web-stream',
});

// Listen for window close IPC event
onWebsiteWindowClosed(() => {
  stopStreaming();
});

const { data: getCurrentMediaWindowVariables } = useBroadcastChannel<
  string,
  string
>({
  name: 'get-current-media-window-variables',
});

watchImmediate(
  () => getCurrentMediaWindowVariables.value,
  () => {
    postWebStream(
      (mediaPlaying.value.action as
        | ''
        | 'inactive'
        | 'mirroringWebsite'
        | 'previewingWebsite') || 'inactive',
    );
  },
);
</script>
