<template>
  <div class="no-scroll fit-snugly">
    <q-layout class="bg-black text-white" style="align-content: center">
      <!-- This is where pages get injected -->
      <router-view />
    </q-layout>
  </div>
</template>

<script setup lang="ts">
import { useMeta } from 'quasar';
import { initializeElectronApi } from 'src/helpers/electron-api-manager';
import { onMounted } from 'vue';

initializeElectronApi('MediaPlayerLayout');

useMeta({
  title: 'Media Player',
  titleTemplate: (title) => `${title} - M³`,
});

onMounted(() => {
  document.body.style.overflow = 'hidden';
});
</script>
