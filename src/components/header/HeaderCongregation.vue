<template>
  <q-btn
    color="white-transparent"
    icon="mmm-plus"
    :label="t('new-profile')"
    unelevated
    @click="createNewCongregation"
  />
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const createNewCongregation = () => {
  window.dispatchEvent(new CustomEvent<undefined>('createNewCongregation'));
};
</script>
