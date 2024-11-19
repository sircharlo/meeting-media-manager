<template>
  <q-btn
    class="super-rounded position-relative"
    :color="downloadPopup ? 'white' : online ? 'white-transparent' : 'negative'"
    rounded
    :text-color="downloadPopup ? (online ? 'primary' : 'negative') : ''"
    unelevated
    @click="downloadPopup = !downloadPopup"
  >
    <q-icon
      :name="
        Object.values(downloadProgress).filter((item) => item.error).length ===
        0
          ? Object.values(downloadProgress).filter((item) => item.loaded)
              .length > 0
            ? 'mmm-cloud'
            : 'mmm-cloud-done'
          : 'mmm-cloud-error'
      "
    >
    </q-icon>
    <q-spinner
      v-if="
        Object.values(downloadProgress).filter((item) => item.loaded).length > 0
      "
      class="absolute"
      :color="downloadPopup ? 'white' : 'primary'"
      size="8px"
      style="top: 14"
    />
    <q-tooltip
      v-if="!downloadPopup"
      anchor="bottom left"
      :delay="1000"
      :offset="[14, 22]"
      self="top left"
    >
      {{ $t('download-status') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import isOnline from 'is-online';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { onMounted } from 'vue';

const currentState = useCurrentStateStore();
const { downloadProgress, online } = storeToRefs(currentState);

const downloadPopup = defineModel<boolean>({ required: true });

const updateOnline = async () => {
  try {
    online.value = await isOnline();
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'updateOnline' } } });
  }
};

setInterval(() => {
  updateOnline();
}, 10000);

onMounted(() => {
  updateOnline();
});
</script>
