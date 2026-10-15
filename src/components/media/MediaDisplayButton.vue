<template>
  <q-btn
    v-if="currentSettings?.enableMediaDisplayButton"
    class="super-rounded"
    :class="classes"
    :color="color"
    data-wizard-target="media-display-button"
    :icon="
      mediaWindowVisible
        ? 'mmm-media-display-active'
        : 'mmm-media-display-inactive'
    "
    rounded
    :text-color="textColor"
    unelevated
    @click="displayPopup = !displayPopup"
  >
    <q-tooltip
      v-if="!displayPopup"
      anchor="bottom left"
      :delay="1000"
      :offset="[14, 22]"
      self="top left"
    >
      {{ t('media-display') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  type IslandButtonStatus,
  useIslandButton,
} from 'src/composables/useIslandButton';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings, mediaWindowVisible } = storeToRefs(currentState);

const displayPopup = defineModel<boolean>({ required: true });

const { classes, color, textColor } = useIslandButton(
  computed<IslandButtonStatus>(() =>
    mediaWindowVisible.value ? 'normal' : 'off',
  ),
  displayPopup,
);
</script>
