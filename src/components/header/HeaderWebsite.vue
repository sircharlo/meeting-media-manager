<template>
  <template v-if="mediaPlayingAction === 'website'">
    <q-btn-group unelevated>
      <q-btn color="white-transparent" @click="zoomWebsiteWindow('out')">
        <q-icon name="mmm-minus" size="xs" />
        <q-tooltip :delay="1000">{{ $t('zoom-out') }}</q-tooltip>
      </q-btn>
      <q-btn color="white-transparent" @click="zoomWebsiteWindow('in')">
        <q-icon name="mmm-plus" size="xs" />
        <q-tooltip :delay="1000">{{ $t('zoom-in') }}</q-tooltip>
      </q-btn>
    </q-btn-group>
    <q-btn-group unelevated>
      <q-btn color="white-transparent" @click="navigateWebsiteWindow('back')">
        <q-icon name="mmm-arrow-back" size="xs" />
        <q-tooltip :delay="1000">{{ $t('back') }}</q-tooltip>
      </q-btn>
      <q-btn
        color="white-transparent"
        @click="navigateWebsiteWindow('forward')"
      >
        <q-icon name="mmm-arrow-forward" size="xs" />
        <q-tooltip :delay="1000">{{ $t('forward') }}</q-tooltip>
      </q-btn>
      <q-btn
        color="white-transparent"
        @click="navigateWebsiteWindow('refresh')"
      >
        <q-icon name="mmm-refresh" size="xs" />
        <q-tooltip :delay="1000">{{ $t('refresh') }}</q-tooltip>
      </q-btn>
    </q-btn-group>
    <q-btn
      color="white-transparent"
      unelevated
      @click="
        closeWebsiteWindow();
        mediaPlayingAction = '';
      "
    >
      <q-icon class="q-mr-sm" name="mmm-mirror" size="xs" />
      {{ $t('stop-mirroring') }}
    </q-btn>
  </template>
  <q-btn
    v-else
    color="white-transparent"
    :disable="mediaPlaying"
    unelevated
    @click="
      openWebsiteWindow(locale);
      mediaPlayingAction = 'website';
    "
  >
    <q-icon class="q-mr-sm" name="mmm-mirror" size="xs" />
    {{ $t('start-mirroring') }}
  </q-btn>
</template>
<script setup lang="ts">
// Packages
import { storeToRefs } from 'pinia';
import { camelToKebabCase } from 'src/helpers/general';
import { sendObsSceneEvent } from 'src/helpers/obs';
// Stores
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const {
  closeWebsiteWindow,
  navigateWebsiteWindow,
  openWebsiteWindow,
  zoomWebsiteWindow,
} = window.electronApi;

const i18n = useI18n();

const locale = computed(() => {
  return camelToKebabCase(i18n.locale.value);
});

const currentState = useCurrentStateStore();
const { mediaPlaying, mediaPlayingAction } = storeToRefs(currentState);

watch(mediaPlayingAction, (newValue, oldValue) => {
  if (newValue === 'website') {
    sendObsSceneEvent('media');
  } else if (oldValue === 'website') {
    sendObsSceneEvent('camera');
  }
});
</script>
