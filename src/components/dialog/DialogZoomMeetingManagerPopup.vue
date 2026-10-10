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
        <q-icon
          class="q-mr-sm"
          color="primary"
          name="mmm-cog-sparkles"
          size="18px"
        />
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

        <template v-if="currentSettings?.zoomMeetingManagerHandAlert">
          <p class="card-section-title text-dark-grey row q-px-md q-pt-sm">
            {{ t('zoom-raised-hands') }}
          </p>
          <div
            v-if="!currentSettings?.zoomHandRaisedPhrase"
            class="zoom-popup__banner row items-center no-wrap q-mx-md q-mb-sm q-pa-sm bg-accent-100"
          >
            <q-icon
              class="q-mr-sm"
              color="primary"
              name="mmm-cog-sparkles"
              size="18px"
            />
            <div class="col text-caption">
              {{ t('zoomHandRaisedPhrase-explain') }}
            </div>
            <q-btn
              color="primary"
              dense
              :disable="!meetingFound"
              flat
              :label="t('zoom-hand-learn')"
              :loading="learningHand"
              no-caps
              @click="learnHand"
            />
          </div>
          <template v-else>
            <div
              v-if="raisedHands.length === 0"
              class="q-px-md q-pb-sm text-caption text-dark-grey"
            >
              {{ t('zoom-no-raised-hands') }}
            </div>
            <q-list v-else dense>
              <q-item v-for="name in raisedHands" :key="name" class="q-px-md">
                <q-item-section avatar>
                  <q-icon color="warning" name="mmm-groups" />
                </q-item-section>
                <q-item-section class="ellipsis">{{ name }}</q-item-section>
                <q-item-section side>
                  <q-btn
                    class="btn-tonal"
                    color="primary"
                    dense
                    :disable="pressingMic === name"
                    flat
                    icon="mmm-microphone"
                    :label="t('zoom-hand-mic')"
                    :loading="pressingMic === name"
                    no-caps
                    size="sm"
                    @click="pressMic(name)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </template>
          <div class="q-px-md q-pb-sm">
            <q-btn
              class="full-width"
              :color="handAlert.active ? 'warning' : 'primary'"
              icon="mmm-groups"
              :label="t('hand-alert')"
              no-caps
              :outline="!handAlert.manual"
              unelevated
              @click="handAlert.toggleManual()"
            >
              <q-tooltip :delay="500">{{ t('hand-alert-explain') }}</q-tooltip>
            </q-btn>
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
        <div class="col-auto">
          <q-btn
            :aria-label="t('zoomMeetingManagerSetupAssistant')"
            class="btn-tonal full-height"
            color="secondary"
            flat
            icon="mmm-cog-sparkles"
            @click="openSetupAssistant"
          >
            <q-tooltip :delay="500">
              {{ t('zoomMeetingManagerSetupAssistant') }}
            </q-tooltip>
          </q-btn>
        </div>
        <div class="col">
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
  learnZoomHandRaisedPhrase,
  pressZoomParticipantMic,
  runZoomMeetingSequence,
  runZoomPostMeetingSequence,
} from 'src/helpers/zoom';
import { runZoomStartupCheck } from 'src/helpers/zoom-startup-check';
import { useCurrentStateStore } from 'stores/current-state';
import { useHandAlertStore } from 'stores/hand-alert';
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

const handAlert = useHandAlertStore();
const { raisedHands } = storeToRefs(handAlert);
const learningHand = ref(false);
const pressingMic = ref<null | string>(null);

const learnHand = async () => {
  learningHand.value = true;
  try {
    await learnZoomHandRaisedPhrase();
  } finally {
    learningHand.value = false;
  }
};

const pressMic = async (name: string) => {
  pressingMic.value = name;
  try {
    await pressZoomParticipantMic(name);
  } finally {
    pressingMic.value = null;
  }
};

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
