<template>
  <q-menu
    ref="zoomMeetingManagerPopupRef"
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
            @click="launchZoomMeeting(meetingId)"
          >
            <q-icon class="q-mr-sm" name="mmm-open-web" size="xs" />
            {{ t('launch-zoom-meeting') }}
          </q-btn>
          <q-tooltip v-if="!meetingId" :delay="500">
            {{ t('zoom-meeting-manager-meeting-id-missing') }}
          </q-tooltip>
        </div>
        <div class="col-12">
          <q-btn
            class="full-width"
            color="primary"
            outline
            unelevated
            @click="listZoomWindows"
          >
            <q-icon class="q-mr-sm" name="mmm-groups" size="xs" />
            {{ t('list-zoom-windows') }}
          </q-btn>
        </div>
        <div v-if="zoomWindows.length" class="col-12">
          <q-select
            v-model="selectedZoomWindow"
            dense
            :label="t('select-zoom-window')"
            option-label="title"
            :options="zoomWindows"
            outlined
          />
        </div>
        <div v-if="selectedZoomWindow" class="col-12">
          <div class="row q-col-gutter-sm">
            <!-- <div class="col-12">
              <q-btn
                v-if="selectedZoomWindow"
                class="full-width q-mt-md"
                color="primary"
                no-caps
                outline
                @click="listZoomMeetingControlsBoundary"
              >
                <q-icon class="q-mr-sm" name="mmm-groups" size="xs" />
                {{ t('list-zoom-meeting-controls') }}
              </q-btn>
            </div> -->
            <!-- <div class="col-12">
              <q-btn
                class="full-width"
                color="primary"
                outline
                unelevated
                @click="listZoomWindowChildren(selectedZoomWindow.handle)"
              >
                <q-icon class="q-mr-sm" name="mmm-groups" size="xs" />
                {{ t('list-zoom-window-children') }}
              </q-btn>
            </div> -->
          </div>
        </div>
      </div>

      <div
        v-if="
          selectedZoomWindow &&
          currentSettings?.zoomMeetingManagerAutomateMeetingAudioSettings
        "
        class="row q-px-md q-pt-sm q-gutter-x-sm"
      >
        <q-btn
          class="col"
          color="primary"
          no-caps
          outline
          @click="automateZoomMeetingSettings"
        >
          {{ t('zoomMeetingManagerAutomateMeetingAudioSettings') }}
          <q-tooltip>{{
            t('zoomMeetingManagerAutomateMeetingAudioSettings-explain')
          }}</q-tooltip>
        </q-btn>
        <q-btn
          class="col"
          color="primary"
          no-caps
          outline
          @click="automateZoomPostMeetingSettings"
        >
          {{ t('zoomMeetingManagerAutomatePostMeetingAudioSettings') }}
          <q-tooltip>{{
            t('zoomMeetingManagerAutomatePostMeetingAudioSettings-explain')
          }}</q-tooltip>
        </q-btn>
      </div>

      <div v-if="zoomWindowChildren.length" class="row q-px-md q-pt-md">
        <div class="col-12 text-caption text-weight-medium q-mb-xs">
          {{ t('zoom-window-children-found') }}
        </div>
        <q-list dense>
          <q-item
            v-for="(child, index) in zoomWindowChildren"
            :key="index"
            v-ripple
            class="child-item clickable-element"
            clickable
            @click="clickZoomElement(child)"
          >
            <q-item-section>
              <q-item-label>
                [{{ child.control_type }}]
                {{ child.title || t('noDescription') }}
              </q-item-label>
              <q-item-label v-if="child.control_id" caption>
                ID: {{ child.control_id }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="row q-px-md q-pt-md q-gutter-x-sm">
        <q-btn
          class="col"
          color="positive"
          dense
          no-caps
          outline
          @click="startZoomHelper"
        >
          {{ t('start') }}
        </q-btn>
        <q-btn
          class="col"
          color="negative"
          dense
          no-caps
          outline
          @click="stopZoomHelper"
        >
          {{ t('stop') }}
        </q-btn>
      </div>

      <div v-if="zoomHelperLogs.length" class="row q-px-md q-pt-md">
        <div class="col-12 text-caption text-weight-medium q-mb-xs">
          {{ t('logs') }}
        </div>
        <div
          class="col-12 bg-dark text-white q-pa-sm rounded-borders scroll"
          style="max-height: 200px; font-family: monospace; font-size: 10px"
        >
          <div v-for="(log, index) in zoomHelperLogs" :key="index">
            {{ log }}
          </div>
        </div>
      </div>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import type { ZoomUIElement, ZoomWindow } from 'src/types/electron';

import { storeToRefs } from 'pinia';
import { QMenu } from 'quasar';
import {
  automateZoomMeetingSettings,
  automateZoomPostMeetingSettings,
} from 'src/helpers/zoom';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const zoomMeetingManagerPopupRef = useTemplateRef<QMenu>(
  'zoomMeetingManagerPopupRef',
);

const open = defineModel<boolean>({ required: true });

const {
  clickZoomElement: clickZoomElementApi,
  launchZoomMeeting: launchZoomMeetingApi,
  // listZoomMeetingControls: listZoomMeetingControlsApi,
  // listZoomWindowChildren: listZoomWindowChildrenApi,
  listZoomWindows: listZoomWindowsApi,
  startZoomHelper: startZoomHelperApi,
  stopZoomHelper: stopZoomHelperApi,
} = globalThis.electronApi;

const currentState = useCurrentStateStore();
const { currentSettings, zoomHelperLogs } = storeToRefs(currentState);

const startZoomHelper = () => {
  startZoomHelperApi();
};

const stopZoomHelper = () => {
  stopZoomHelperApi();
};

const meetingId = computed(
  () => currentSettings.value?.zoomMeetingManagerMeetingId?.trim() || '',
);

const zoomWindows = ref<ZoomWindow[]>([]);
const selectedZoomWindow = ref<null | ZoomWindow>(null);
const zoomWindowChildren = ref<ZoomUIElement[]>([]);

const clickZoomElement = async (element: ZoomUIElement) => {
  if (!selectedZoomWindow.value) return;
  // const success =
  await clickZoomElementApi(selectedZoomWindow.value.handle, {
    control_id: element.control_id,
    title: element.title,
  });
};

const launchZoomMeeting = (id: string) => {
  launchZoomMeetingApi(id);
};

const listZoomWindows = async () => {
  selectedZoomWindow.value = null;
  zoomWindowChildren.value = [];
  zoomWindows.value = await listZoomWindowsApi();
};

const { t } = useI18n();

// UI update handler
watch(
  () => [
    zoomWindows.value.length,
    zoomWindowChildren.value.length,
    selectedZoomWindow.value,
  ],
  () => {
    setTimeout(() => {
      if (zoomMeetingManagerPopupRef.value) {
        zoomMeetingManagerPopupRef.value.updatePosition();
      }
    }, 10);
  },
);
</script>
