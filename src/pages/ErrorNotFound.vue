<template>
  <div class="fullscreen text-center q-pa-md flex flex-center">
    <div>
      <div class="text-h4 q-mt-lg">
        {{ t('oops-nothing-here') }}
      </div>

      <q-btn
        class="q-mt-xl"
        color="primary"
        icon="mmm-media"
        :label="t('titles.meetingMedia')"
        no-caps
        to="/media-calendar"
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
