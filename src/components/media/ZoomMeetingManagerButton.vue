<template>
  <q-btn
    v-if="currentSettings?.zoomMeetingManagerEnable"
    class="super-rounded"
    :color="zoomMeetingManagerPopup ? 'white' : 'white-transparent'"
    icon="mmm-video-meeting"
    rounded
    :text-color="zoomMeetingManagerPopup ? 'primary' : ''"
    unelevated
    @click="zoomMeetingManagerPopup = !zoomMeetingManagerPopup"
  >
    <q-badge v-if="automationsPaused" color="negative" floating rounded />
    <q-tooltip
      v-if="!zoomMeetingManagerPopup"
      anchor="bottom left"
      :delay="1000"
      :offset="[14, 22]"
      self="top left"
    >
      {{
        automationsPaused
          ? t('zoom-automations-paused')
          : t('zoomMeetingManagerControls')
      }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomStateStore } from 'stores/zoom-state';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);
const { automationsPaused } = storeToRefs(useZoomStateStore());

const zoomMeetingManagerPopup = defineModel<boolean>({ required: true });
</script>
