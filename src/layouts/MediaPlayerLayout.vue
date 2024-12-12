<template>
  <div class="no-scroll fit-snugly">
    <q-layout class="bg-black text-white" style="align-content: center">
      <!-- This is where pages get injected -->
      <router-view />
    </q-layout>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  document.body.style.overflow = 'hidden';
  document.title = 'Media Player Window';
});
</script>
