<template>
  <q-btn
    :label="$t('new-profile')"
    color="white-transparent"
    icon="mmm-plus"
    unelevated
    @click="createNewCongregation"
  />
</template>
<script setup lang="ts">
const createNewCongregation = () => {
  window.dispatchEvent(new CustomEvent('createNewCongregation'));
};
</script>
