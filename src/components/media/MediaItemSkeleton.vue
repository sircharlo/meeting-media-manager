<template>
  <q-item class="items-center justify-center">
    <div class="row full-width items-center justify-center">
      <div class="col-shrink">
        <q-skeleton
          class="rounded-borders media-thumbnail-frame"
          :height="isTiny ? '56px' : '84px'"
          type="rect"
          :width="isTiny ? '100px' : '150px'"
        />
      </div>
      <div class="col q-px-md">
        <q-skeleton height="16px" type="text" width="70%" />
        <q-skeleton class="q-mt-xs" height="14px" type="text" width="40%" />
      </div>
      <div class="col-shrink">
        <q-skeleton size="40px" type="QBtn" />
      </div>
    </div>
  </q-item>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { TINY_SCREEN_WIDTH } from 'src/constants/general';
import { computed } from 'vue';

const $q = useQuasar();
const isTiny = computed(() => $q.screen.width < TINY_SCREEN_WIDTH);
</script>
