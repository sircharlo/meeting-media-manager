<template>
  <q-btn
    :color="!online ? 'negative' : 'white-transparent'"
    class="super-rounded position-relative"
    rounded
    unelevated
    @click="localDownloadPopup = true"
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
      color="primary"
      size="8px"
      style="top: 14"
    />
    <q-tooltip
      v-if="!localDownloadPopup"
      :delay="1000"
      :offset="[14, 22]"
      anchor="bottom left"
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
import { onMounted, ref, watch } from 'vue';

const emit = defineEmits(['update:download']);

const currentState = useCurrentStateStore();
const { downloadProgress, online } = storeToRefs(currentState);

const props = defineProps<{
  download: boolean;
}>();

const localDownloadPopup = ref(props.download);

watch(localDownloadPopup, (newValue) => {
  emit('update:download', newValue);
});

watch(
  () => props.download,
  (newValue) => {
    localDownloadPopup.value = newValue;
  },
);

const updateOnline = async () => {
  try {
    online.value = await isOnline();
  } catch (error) {
    errorCatcher(error);
  }
};

setInterval(() => {
  updateOnline();
}, 10000);

onMounted(async () => {
  updateOnline();
});
</script>
