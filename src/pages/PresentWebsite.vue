<template>
  <q-page padding>
    <q-list>
      <div class="media-section website">
        <q-item class="text-website items-center">
          <q-avatar class="text-white bg-website" size="md">
            <q-icon name="mmm-open-web" size="sm" />
          </q-avatar>
          <div class="text-bold text-uppercase text-spaced">
            {{ $t('titles.presentWebsite') }}
          </div>
        </q-item>
        <q-item>
          {{
            $t(
              'when-you-click-the-button-on-the-top-right-corner-of-this-window-a-new-window-will-open-where-the-website-will-be-presented-what-you-see-in-this-window-will-be-mirrored-into-the-media-window',
            )
          }}
        </q-item>
        <q-item>
          {{
            $t(
              'when-you-are-done-presenting-the-website-you-can-either-close-the-website-window-or-click-again-on-the-button-in-the-top-right-corner-of-this-window',
            )
          }}
        </q-item>
      </div>
    </q-list>
    <iframe
      id="website-present-preview"
      :src="websiteSrc"
      style="aspect-ratio: 16 / 9; width: 100%"
    ></iframe>
  </q-page>
</template>
<script setup lang="ts">
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { computed, onMounted } from 'vue';

const jwStore = useJwStore();
const currentState = useCurrentStateStore();

onMounted(() => {
  window.electronApi.askForMediaAccess();
});

const websiteSrc = computed(() => {
  return `https://www.${jwStore.urlVariables?.base || 'jw.org'}/${currentState.currentLangObject?.symbol}`;
});
</script>
