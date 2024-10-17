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
    :disable="mediaPlaying"
    color="white-transparent"
    unelevated
    @click="
      openWebsiteWindow();
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

// Helpers
import { electronApi } from 'src/helpers/electron-api';

// Stores
import { useCurrentStateStore } from 'src/stores/current-state';

const {
  closeWebsiteWindow,
  navigateWebsiteWindow,
  openWebsiteWindow,
  zoomWebsiteWindow,
} = electronApi;

const currentState = useCurrentStateStore();
const { mediaPlaying, mediaPlayingAction } = storeToRefs(currentState);
</script>
