<template>
  <p></p>
</template>

<script setup lang="ts">
import { initializeElectronApi } from 'src/helpers/electron-api-manager';
import { errorCatcher } from 'src/helpers/error-catcher';
import { onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';

initializeElectronApi('RouteHelper');

const router = useRouter() as ReturnType<typeof useRouter> | undefined;

function getParam(key: string) {
  try {
    return (
      new URLSearchParams(location.search).get(key) ||
      new URLSearchParams(
        location.hash.substring(location.hash.indexOf('?')),
      ).get(key)
    );
  } catch (error) {
    errorCatcher(error);
    return '';
  }
}

onBeforeMount(() => {
  try {
    const param = getParam('page');
    if (param) {
      const path = `/${param}`;
      if (router) {
        router.push({ path });
      } else {
        location.hash = path;
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
});
</script>
