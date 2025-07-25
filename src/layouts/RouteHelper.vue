<template>
  <p></p>
</template>

<script setup lang="ts">
import { initializeElectronApi } from 'src/helpers/electron-api-manager';
import { errorCatcher } from 'src/helpers/error-catcher';
import { onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';

initializeElectronApi('RouteHelper');

const router = useRouter();

function searchParam(key: string) {
  try {
    return new URLSearchParams(location.search).get(key);
  } catch (error) {
    errorCatcher(error);
    return '';
  }
}

onBeforeMount(() => {
  try {
    const param = searchParam('page');
    if (param) {
      router.push({ path: `/${param}` });
    }
  } catch (error) {
    errorCatcher(error);
  }
});
</script>
