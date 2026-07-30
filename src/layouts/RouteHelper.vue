<template>
  <p></p>
</template>

<script setup lang="ts">
import { initializeElectronApi } from 'src/helpers/electron-api-manager';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'stores/current-state';
import { onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';

initializeElectronApi('RouteHelper');

const router = useRouter() as ReturnType<typeof useRouter> | undefined;
const currentState = useCurrentStateStore();

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
    if (!param) return;

    // The congregation selector is now a modal over the app chrome, not a
    // route - open it directly and land the router on the default screen
    // underneath it instead of pushing to a route that no longer exists.
    if (param === 'initial-congregation-selector') {
      currentState.openCongregationSwitcher({ isBootstrap: true });
      if (router) {
        router.push({ path: '/media-calendar' });
      } else {
        location.hash = '/media-calendar';
      }
      return;
    }

    const path = `/${param}`;
    if (router) {
      router.push({ path });
    } else {
      location.hash = path;
    }
  } catch (error) {
    errorCatcher(error);
  }
});
</script>
