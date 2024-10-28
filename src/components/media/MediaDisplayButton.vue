<template>
  <q-btn
    v-if="currentSettings?.enableMediaDisplayButton"
    :color="
      localDisplayPopup
        ? 'white'
        : mediaWindowVisible
          ? 'white-transparent'
          : 'negative'
    "
    :icon="
      mediaWindowVisible
        ? 'mmm-media-display-active'
        : 'mmm-media-display-inactive'
    "
    :text-color="
      localDisplayPopup ? (mediaWindowVisible ? 'primary' : 'negative') : ''
    "
    class="super-rounded"
    rounded
    unelevated
    @click="localDisplayPopup = !localDisplayPopup"
  >
    <q-tooltip
      v-if="!localDisplayPopup"
      :delay="1000"
      :offset="[14, 22]"
      anchor="bottom left"
      self="top left"
    >
      {{ $t('media-display') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'src/stores/current-state';
import { ref, watch } from 'vue';

const currentState = useCurrentStateStore();
const { currentSettings, mediaWindowVisible } = storeToRefs(currentState);

const props = defineProps<{
  display: boolean;
}>();

const localDisplayPopup = ref(props.display);

const emit = defineEmits(['update:display']);

watch(localDisplayPopup, (newValue) => {
  emit('update:display', newValue);
});

watch(
  () => props.display,
  (newValue) => {
    localDisplayPopup.value = newValue;
  },
);
</script>
