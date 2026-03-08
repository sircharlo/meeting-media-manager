<template>
  <q-menu
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div class="flex action-popup q-py-md" style="flex-flow: column">
      <div class="card-title row q-px-md q-mb-none">
        {{ t('zoomMeetingManagerControls') }}
      </div>
      <div class="row q-px-md q-pt-sm q-col-gutter-sm">
        <div class="col-12">
          <q-btn
            class="full-width"
            color="primary"
            :disable="!meetingId"
            unelevated
            @click="openZoomMeetingManagerWindow(zoomMeetingManagerParams)"
          >
            <q-icon class="q-mr-sm" name="mmm-open-web" size="xs" />
            {{ t('open-zoom-meeting-manager') }}
          </q-btn>
          <q-tooltip v-if="!meetingId" :delay="500">
            {{ t('zoom-meeting-manager-meeting-id-missing') }}
          </q-tooltip>
        </div>
        <div class="col-12">
          <q-btn
            class="full-width"
            color="negative"
            outline
            unelevated
            @click="closeZoomMeetingManagerWindow"
          >
            <q-icon class="q-mr-sm" name="mmm-close" size="xs" />
            {{ t('kill-zoom-meeting-manager') }}
          </q-btn>
        </div>
      </div>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const open = defineModel<boolean>({ required: true });

const { closeZoomMeetingManagerWindow, openZoomMeetingManagerWindow } =
  globalThis.electronApi;

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const meetingId = computed(
  () => currentSettings.value?.zoomMeetingManagerMeetingId?.trim() || '',
);

const zoomMeetingManagerParams = computed(() => ({
  meetingId: meetingId.value,
  password:
    currentSettings.value?.zoomMeetingManagerPassword?.trim() || undefined,
  username:
    currentSettings.value?.zoomMeetingManagerUsername?.trim() || undefined,
}));

const { t } = useI18n();
</script>
