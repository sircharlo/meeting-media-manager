<template>
  <q-menu
    ref="zoomMeetingManagerPopup"
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div
      ref="popupContent"
      class="action-popup action-popup--scroll-layout q-py-md"
    >
      <div class="card-title col-shrink full-width q-px-md q-mb-none">
        {{ t('zoomMeetingManager') }}
      </div>

      <div class="row items-center no-wrap q-px-md q-mb-sm q-gutter-x-sm">
        <q-spinner v-if="searchingForWindow" color="primary" size="16px" />
        <q-icon v-else :color="statusColor" :name="statusIcon" size="16px" />
        <div class="col text-caption text-weight-medium ellipsis">
          {{ statusText }}
        </div>
        <q-btn
          dense
          flat
          icon="mmm-refresh"
          round
          size="sm"
          @click="syncMainWindow"
        >
          <q-tooltip :delay="500">{{ t('refresh') }}</q-tooltip>
        </q-btn>
      </div>

      <div
        v-if="setupNeeded"
        class="zoom-popup__banner row items-center no-wrap q-mx-md q-mb-sm q-pa-sm bg-accent-100"
      >
        <q-icon class="q-mr-sm" color="primary" name="mmm-guide" size="18px" />
        <div class="col text-caption text-weight-medium">
          {{ t('zoom-setup-banner') }}
        </div>
        <q-btn
          color="primary"
          dense
          flat
          :label="t('zoom-setup-open')"
          no-caps
          @click="openSetupAssistant"
        />
      </div>

      <div
        v-if="checkRunning"
        class="zoom-popup__banner row items-center no-wrap q-mx-md q-mb-sm q-pa-sm bg-accent-100"
      >
        <q-spinner class="q-mr-sm" color="primary" size="18px" />
        <div class="col text-caption text-weight-medium">
          {{ t('zoom-check-running') }}
        </div>
      </div>
      <div
        v-else-if="automationsPaused"
        class="zoom-popup__banner row items-center no-wrap q-mx-md q-mb-sm q-pa-sm bg-accent-100"
      >
        <q-icon class="q-mr-sm" color="negative" name="mmm-error" size="18px" />
        <div class="col text-caption">
          <div class="text-weight-medium">
            {{ t('zoom-automations-paused') }}
          </div>
          <div>{{ pausedProblems }}</div>
        </div>
        <q-btn
          color="primary"
          dense
          flat
          :label="t('zoom-check-test-again')"
          no-caps
          @click="testAgain"
        />
      </div>

      <div class="action-popup__scroll full-width">
        <template v-if="showMeetingSettingsSection">
          <p class="card-section-title text-dark-grey row q-px-md q-pt-sm">
            {{ t('zoom-meeting-settings') }}
          </p>
          <div class="row q-px-md q-col-gutter-xs">
            <div
              v-if="
                currentSettings?.zoomMeetingManagerAutomateMeetingAudioSettings
              "
              class="col-12"
            >
              <q-btn
                class="full-width"
                color="primary"
                :disable="!meetingFound || !!runningAction"
                icon="mmm-volume-off"
                :label="t('zoom-apply-meeting-settings')"
                :loading="runningAction === 'meeting'"
                no-caps
                outline
                @click="runAction('meeting')"
              >
                <q-tooltip :delay="500">
                  {{
                    t('zoomMeetingManagerAutomateMeetingAudioSettings-explain')
                  }}
                </q-tooltip>
              </q-btn>
            </div>
            <div
              v-if="
                currentSettings?.zoomMeetingManagerAutomatePostMeetingAudioSettings
              "
              class="col-12"
            >
              <q-btn
                class="full-width"
                color="primary"
                :disable="!meetingFound || !!runningAction"
                icon="mmm-groups"
                :label="t('zoom-apply-before-after-meeting-settings')"
                :loading="runningAction === 'postMeeting'"
                no-caps
                outline
                @click="runAction('postMeeting')"
              >
                <q-tooltip :delay="500">
                  {{
                    t(
                      'zoomMeetingManagerAutomatePostMeetingAudioSettings-explain',
                    )
                  }}
                </q-tooltip>
              </q-btn>
            </div>
          </div>
        </template>

        <div v-if="zoomHelperLogs.length" class="q-px-md q-pt-md">
          <q-expansion-item
            v-model="logsExpanded"
            class="bg-accent-100 rounded-borders"
            dense
            dense-toggle
            :label="t('zoom-helper-logs')"
          >
            <div class="zoom-helper-logs">
              <div
                v-for="(logLine, index) in zoomHelperLogs"
                :key="index"
                class="zoom-helper-logs__line"
              >
                {{ logLine }}
              </div>
            </div>
          </q-expansion-item>
        </div>

        <ZoomSelfTestPanel v-if="isDev" />
      </div>

      <q-separator class="bg-accent-200 q-mt-sm" />
      <div
        class="action-popup__footer full-width q-px-md q-pt-md row q-col-gutter-xs"
      >
        <div class="col-12 q-mb-sm">
          <q-btn
            class="full-width"
            color="primary"
            :disable="!meetingId"
            icon="mmm-arrow-outward"
            :label="t('launch-zoom-meeting')"
            unelevated
            @click="launchZoomMeeting(meetingId)"
          />
          <q-tooltip v-if="!meetingId" :delay="500">
            {{ t('zoom-meeting-manager-meeting-id-missing') }}
          </q-tooltip>
        </div>
        <div class="col-6">
          <q-btn
            class="full-width"
            color="secondary"
            icon="mmm-guide"
            :label="t('zoomMeetingManagerSetupAssistant')"
            no-caps
            unelevated
            @click="openSetupAssistant"
          />
        </div>
        <div class="col-6">
          <q-btn
            class="full-width btn-tonal"
            color="secondary"
            flat
            icon="mmm-reset"
            :label="t('zoom-helper-restart')"
            :loading="restartingHelper"
            no-caps
            @click="restartHelper"
          />
        </div>
      </div>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import type { QMenu } from 'quasar';
import type { ZoomMeetingState } from 'src/types';

import ZoomSelfTestPanel from 'components/dialog/ZoomSelfTestPanel.vue';
import { storeToRefs } from 'pinia';
import {
  getZoomMeetingState,
  isZoomSetupNeeded,
  runZoomMeetingSequence,
  runZoomPostMeetingSequence,
} from 'src/helpers/zoom';
import { runZoomStartupCheck } from 'src/helpers/zoom-startup-check';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomStateStore } from 'stores/zoom-state';
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type ZoomAction = 'meeting' | 'postMeeting';

const MAIN_WINDOW_POLL_INTERVAL_MS = 5000;

const open = defineModel<boolean>({ default: false });

const { t } = useI18n();

const { launchZoomMeeting, restartZoomHelper } = globalThis.electronApi;

const isDev = import.meta.env.DEV;

const setupNeeded = computed(() => isZoomSetupNeeded());

const openSetupAssistant = () => {
  open.value = false;
  globalThis.dispatchEvent(new CustomEvent('openZoomSetupAssistant'));
};

const currentState = useCurrentStateStore();
const { currentSettings, zoomHelperLogs } = storeToRefs(currentState);

const zoomState = useZoomStateStore();
const { automationsPaused, checkRunning, pause } = storeToRefs(zoomState);

const pausedProblems = computed(() =>
  (pause.value?.problems ?? []).map((key) => t(key)).join(', '),
);

const testAgain = () => {
  void runZoomStartupCheck({ manual: true });
};

const zoomMeetingManagerPopup = useTemplateRef<QMenu>(
  'zoomMeetingManagerPopup',
);
const popupContent = useTemplateRef<HTMLElement>('popupContent');
let popupResizeObserver: ResizeObserver | undefined;
let mainWindowPollingInterval: ReturnType<typeof setInterval> | undefined;

const meeting = ref<null | ZoomMeetingState>(null);
const hasCheckedForWindow = ref(false);
const runningAction = ref<null | ZoomAction>(null);
const restartingHelper = ref(false);
const logsExpanded = ref(false);

const meetingId = computed(
  () => currentSettings.value?.zoomMeetingManagerMeetingId?.trim() || '',
);

const showMeetingSettingsSection = computed(
  () =>
    !!currentSettings.value?.zoomMeetingManagerAutomateMeetingAudioSettings ||
    !!currentSettings.value?.zoomMeetingManagerAutomatePostMeetingAudioSettings,
);

const meetingFound = computed(() => !!meeting.value?.found);

const searchingForWindow = computed(
  () => !hasCheckedForWindow.value && !meetingFound.value,
);

const statusText = computed(() => {
  if (searchingForWindow.value) return t('zoom-meeting-window-searching');
  return meetingFound.value
    ? t('zoom-meeting-window-found')
    : t('zoom-meeting-window-not-found');
});

const statusIcon = computed(() =>
  meetingFound.value ? 'mmm-check' : 'mmm-info',
);

const statusColor = computed(() => (meetingFound.value ? 'positive' : 'grey'));

const syncMainWindow = async () => {
  meeting.value = await getZoomMeetingState();
  hasCheckedForWindow.value = true;
};

const stopPolling = () => {
  clearInterval(mainWindowPollingInterval);
  mainWindowPollingInterval = undefined;
};

const runAction = async (action: ZoomAction) => {
  runningAction.value = action;
  try {
    if (action === 'meeting') {
      await runZoomMeetingSequence();
    } else {
      await runZoomPostMeetingSequence();
    }
  } finally {
    runningAction.value = null;
  }
};

const restartHelper = async () => {
  restartingHelper.value = true;
  try {
    await restartZoomHelper();
    await syncMainWindow();
  } finally {
    restartingHelper.value = false;
  }
};

watch(popupContent, (el) => {
  popupResizeObserver?.disconnect();
  popupResizeObserver = undefined;
  if (!el) return;
  popupResizeObserver = new ResizeObserver(() => {
    zoomMeetingManagerPopup.value?.updatePosition();
  });
  popupResizeObserver.observe(el);
});

watch(
  open,
  (isOpen) => {
    stopPolling();
    if (!isOpen) return;

    void syncMainWindow();
    mainWindowPollingInterval = setInterval(() => {
      void syncMainWindow();
    }, MAIN_WINDOW_POLL_INTERVAL_MS);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopPolling();
  popupResizeObserver?.disconnect();
});
</script>

<style scoped>
.zoom-popup__banner {
  border-radius: 10px;
}

.zoom-helper-logs {
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 0.8em;
  max-height: 200px;
  overflow: auto;
  padding: 0.25em 0.5em 0.5em;
}

.zoom-helper-logs__line {
  overflow-wrap: anywhere;
  padding: 0.1em 0;
}
</style>
