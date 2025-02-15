<template>
  <template v-if="mediaPlayingAction === 'website'">
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
    v-if="streaming"
    color="white-transparent"
    unelevated
    @click="
      closeWebsiteWindow();
      mediaPlayingAction = '';
    "
  >
    <q-icon class="q-mr-sm" name="mmm-mirror" size="xs" />
    <template v-if="$q.screen.gt.xs">{{ t('stop-mirroring') }}</template>
    <q-tooltip v-else :delay="1000">{{ t('stop-mirroring') }}</q-tooltip>
  </q-btn>
  <q-btn
    v-else-if="mediaPlayingAction === 'website'"
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
    :disable="mediaPlaying"
    unelevated
    @click="
      openWebsiteWindow(currentState.currentLangObject?.symbol);
      mediaPlayingAction = 'website';
    "
  >
    <q-icon class="q-mr-sm" name="mmm-mirror" size="xs" />
    {{ t('open-website') }}
  </q-btn>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { showMediaWindow } from 'src/helpers/mediaPlayback';
import { sendObsSceneEvent } from 'src/utils/obs';
import { useCurrentStateStore } from 'stores/current-state';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const {
  closeWebsiteWindow,
  navigateWebsiteWindow,
  openWebsiteWindow,
  startWebsiteStream,
  zoomWebsiteWindow,
} = window.electronApi;

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { mediaPlaying, mediaPlayingAction } = storeToRefs(currentState);

const streaming = ref(false);

const startStreaming = () => {
  startWebsiteStream();
  streaming.value = true;
  if (!currentState.mediaWindowVisible) {
    showMediaWindow();
  }
};

watch(streaming, (val) => {
  if (val) {
    sendObsSceneEvent('media');
  } else {
    sendObsSceneEvent('camera');
    if (currentState.currentLangObject?.isSignLanguage) {
      showMediaWindow(false);
    }
  }
});

watch(mediaPlayingAction, (newValue, oldValue) => {
  if (oldValue === 'website') {
    streaming.value = false;
  }
});
</script>
