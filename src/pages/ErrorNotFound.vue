<template>
  <div
    class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center"
  >
    <div>
      <div style="font-size: 30vh">404</div>

      <div class="text-h2" style="opacity: 0.4">
        {{ t('oops-nothing-here') }}
      </div>

      <q-btn
        class="q-mt-xl"
        color="white"
        :label="t('go-home')"
        no-caps
        text-color="blue"
        to="/"
        unelevated
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
defineOptions({
  name: 'ErrorNotFound',
});
</script>
