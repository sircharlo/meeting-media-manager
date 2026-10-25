<template>
  <ActionPopup
    v-model="open"
    :status-color="statusColor"
    :status-icon="statusIcon"
    :status-loading="searchingForWindow || restartingHelper"
    :status-text="statusText"
    :title="t('zoomMeetingManager')"
  >
    <template #status-action>
      <q-btn
        color="primary"
        dense
        flat
        icon="mmm-refresh"
        round
        size="sm"
        @click="syncMainWindow"
      >
        <q-tooltip :delay="500">{{ t('refresh') }}</q-tooltip>
      </q-btn>
    </template>

    <template #banners>
      <div v-if="setupNeeded" class="action-popup__banner">
        <q-icon color="primary" name="mmm-cog-sparkles" size="18px" />
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

      <!-- A Zoom dialog or popup (an invite window, say) may block M³'s actions -->
      <div v-if="meeting?.dialogs?.length" class="action-popup__banner">
        <q-icon color="warning" name="mmm-warning" size="18px" />
        <div class="col text-caption">
          {{ t('zoom-dialog-in-the-way') }}
        </div>
      </div>

      <div v-if="checkRunning" class="action-popup__banner">
        <q-spinner color="primary" size="18px" />
        <div class="col text-caption text-weight-medium">
          {{ t('zoom-check-running') }}
        </div>
      </div>
      <!-- Its explanation is long: the button goes under it, not beside it. -->
      <div
        v-else-if="automationsPaused"
        class="action-popup__banner action-popup__banner--negative zoom-popup__banner--stacked"
      >
        <q-icon color="negative" name="mmm-error" size="18px" />
        <div class="col text-caption">
          <div class="text-weight-medium">
            {{ t('zoom-automations-paused') }}
          </div>
          <div v-if="relearnNeeded">{{ t('zoom-check-names-changed') }}</div>
          <div v-else>
            {{
              t('zoom-automations-paused-failed', { problems: pausedProblems })
            }}
          </div>
          <q-btn
            v-if="relearnNeeded"
            class="zoom-popup__banner-action"
            color="primary"
            dense
            flat
            :label="t('zoom-setup-open')"
            no-caps
            @click="openSetupAssistant"
          />
          <q-btn
            v-else
            class="zoom-popup__banner-action"
            color="primary"
            dense
            flat
            :label="t('zoom-check-test-again')"
            no-caps
            @click="testAgain"
          />
        </div>
      </div>
    </template>

    <template v-if="showMeetingSettingsSection">
      <p class="card-section-title text-dark-grey row q-px-md q-pt-sm">
        {{ t('zoom-meeting-settings') }}
      </p>
      <div class="row q-px-md q-col-gutter-xs">
        <div
          v-if="currentSettings?.zoomMeetingManagerAutomateMeetingAudioSettings"
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
              {{ t('zoomMeetingManagerAutomateMeetingAudioSettings-explain') }}
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
                t('zoomMeetingManagerAutomatePostMeetingAudioSettings-explain')
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
        class="action-popup__banner"
      >
        <q-icon color="primary" name="mmm-cog-sparkles" size="18px" />
        <div class="col text-caption">
          {{ t('zoom-hand-setup-needed') }}
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
      <template v-else>
        <div
          v-if="raisedHands.length === 0"
          class="q-px-md q-pb-sm text-caption text-dark-grey"
        >
          {{ t('zoom-no-raised-hands') }}
        </div>
        <!-- Full width (lists in menus are 300px otherwise), with the
             buttons under the name so that long names and labels fit -->
        <q-list v-else class="full-width" dense>
          <q-item v-for="name in raisedHands" :key="name" class="q-px-md">
            <q-item-section avatar top>
              <q-icon color="warning" name="mmm-groups" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="ellipsis">{{ name }}</q-item-label>
              <div class="row q-gutter-xs">
                <q-btn
                  class="btn-tonal"
                  color="positive"
                  dense
                  :disable="!!busyParticipant"
                  flat
                  icon="mmm-microphone"
                  :label="t('zoom-hand-unmute')"
                  :loading="busyParticipant === `unmute:${name}`"
                  no-caps
                  size="sm"
                  @click="unmute(name)"
                />
                <q-btn
                  class="btn-tonal"
                  color="primary"
                  dense
                  :disable="!!busyParticipant"
                  flat
                  icon="mmm-microphone-off"
                  :label="t('zoom-hand-mute-and-lower')"
                  :loading="busyParticipant === `mute:${name}`"
                  no-caps
                  size="sm"
                  @click="muteAndLower(name)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </template>
      <div v-if="currentSettings?.enableTimerDisplay" class="q-px-md q-pb-sm">
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

    <div v-if="showLogs && zoomHelperLogs.length" class="q-px-md q-pt-md">
      <q-expansion-item
        v-model="logsExpanded"
        class="action-popup__tint rounded-borders"
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

    <!-- One row: the action that fits the meeting's state, then a menu with
         the rarely needed ones (problems that need the setup assistant
         offer it in a banner) -->
    <template #footer>
      <div
        v-if="footerAction === 'settings'"
        class="text-caption text-dark-grey"
      >
        {{ t('zoom-meeting-manager-meeting-id-missing') }}
      </div>
      <div class="action-popup__footer-row">
        <q-btn
          v-if="footerAction === 'arrange'"
          class="col"
          color="primary"
          :disable="arrangingWindows"
          icon="mmm-window"
          :label="t('zoom-layout-arrange')"
          :loading="arrangingWindows"
          unelevated
          @click="arrangeWindows"
        >
          <q-tooltip :delay="500">
            {{ t('zoom-layout-arrange-explain') }}
          </q-tooltip>
        </q-btn>
        <q-btn
          v-else-if="footerAction === 'layout'"
          class="col"
          color="primary"
          icon="mmm-window"
          :label="t('zoom-layout-open')"
          unelevated
          @click="openWindowLayout"
        />
        <q-btn
          v-else-if="footerAction === 'settings'"
          class="col"
          color="primary"
          :disable="mediaIsPlaying"
          icon="mmm-settings"
          :label="t('go-to-settings')"
          unelevated
          @click="goToSettings('zoomMeetingManagerMeetingId')"
        />
        <!-- Not until M³ has looked: it may be open already -->
        <q-btn
          v-else
          class="col"
          color="primary"
          :disable="searchingForWindow"
          icon="mmm-arrow-outward"
          :label="t('launch-zoom-meeting')"
          unelevated
          @click="launchZoomMeeting(meetingId)"
        />
        <q-btn
          :aria-label="t('more-options')"
          class="btn-tonal"
          color="secondary"
          flat
          icon="mmm-dots"
        >
          <q-tooltip v-if="!moreOptionsOpen" :delay="500">
            {{ t('more-options') }}
          </q-tooltip>
          <q-menu
            v-model="moreOptionsOpen"
            anchor="top right"
            self="bottom right"
          >
            <!-- No v-close-popup: in this nested menu it would close the
                 whole popup too, so the items close what they need to -->
            <q-list role="menu">
              <q-item clickable @click="openSetupAssistant">
                <q-item-section avatar>
                  <q-icon name="mmm-cog-sparkles" />
                </q-item-section>
                <q-item-section>
                  {{ t('zoomMeetingManagerSetupAssistant') }}
                </q-item-section>
              </q-item>
              <q-item
                clickable
                :disable="mediaIsPlaying"
                @click="goToSettings('zoomMeetingManagerEnable')"
              >
                <q-item-section avatar>
                  <q-icon name="mmm-settings" />
                </q-item-section>
                <q-item-section>{{ t('go-to-settings') }}</q-item-section>
              </q-item>
              <q-separator />
              <q-item
                clickable
                :disable="restartingHelper"
                @click="restartFromMenu"
              >
                <q-item-section avatar>
                  <q-icon name="mmm-reset" />
                </q-item-section>
                <q-item-section>{{
                  t('zoom-connection-restart')
                }}</q-item-section>
              </q-item>
              <q-item
                clickable
                :disable="!zoomHelperLogs.length"
                @click="toggleLogs"
              >
                <q-item-section avatar>
                  <q-icon name="mmm-file" />
                </q-item-section>
                <q-item-section>{{ t('zoom-helper-logs') }}</q-item-section>
                <q-item-section v-if="showLogs" side>
                  <q-icon color="primary" name="mmm-check" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </template>
  </ActionPopup>
</template>

<script setup lang="ts">
import type { SettingsValues, ZoomMeetingState } from 'src/types';

import ZoomSelfTestPanel from 'components/dialog/ZoomSelfTestPanel.vue';
import ActionPopup from 'components/ui/ActionPopup.vue';
import { storeToRefs } from 'pinia';
import { getZoomHelperErrorMessageKey } from 'src/constants/zoom';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  getZoomMeetingState,
  isZoomSetupNeeded,
  muteZoomParticipantAndLowerHand,
  runZoomMeetingSequence,
  runZoomPostMeetingSequence,
  unmuteZoomParticipant,
} from 'src/helpers/zoom';
import { arrangeZoomWindows } from 'src/helpers/zoom-layout';
import { runZoomStartupCheck } from 'src/helpers/zoom-startup-check';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useHandAlertStore } from 'stores/hand-alert';
import { useZoomStateStore } from 'stores/zoom-state';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

type FooterAction = 'arrange' | 'launch' | 'layout' | 'settings';
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

// The assistant's window layout steps, as Settings' "Choose the layout" does
const openWindowLayout = () => {
  open.value = false;
  globalThis.dispatchEvent(
    new CustomEvent('openZoomSetupAssistant', { detail: { step: 'layout' } }),
  );
};

const router = useRouter();

const goToSettings = (setting: keyof SettingsValues) => {
  open.value = false;
  void router.push(`/settings/${setting}`);
};

const currentState = useCurrentStateStore();
const { currentSettings, mediaIsPlaying, zoomHelperLogs } =
  storeToRefs(currentState);

const zoomState = useZoomStateStore();
const { automationsPaused, checkRunning, pause, relearnNeeded } =
  storeToRefs(zoomState);

const handAlert = useHandAlertStore();
const { raisedHands } = storeToRefs(handAlert);
const busyParticipant = ref<null | string>(null);

const unmute = async (name: string) => {
  busyParticipant.value = `unmute:${name}`;
  try {
    await unmuteZoomParticipant(name);
  } finally {
    busyParticipant.value = null;
  }
};

const muteAndLower = async (name: string) => {
  busyParticipant.value = `mute:${name}`;
  try {
    await muteZoomParticipantAndLowerHand(name);
  } finally {
    busyParticipant.value = null;
  }
};

const pausedProblems = computed(() =>
  (pause.value?.problems ?? []).map((key) => t(key)).join(', '),
);

const testAgain = () => {
  void runZoomStartupCheck({ manual: true });
};

const zoomLayout = useAppSettingsStore().zoomLayout;
const arrangingWindows = ref(false);

const arrangeWindows = async () => {
  arrangingWindows.value = true;
  try {
    if (!(await arrangeZoomWindows())) {
      createTemporaryNotification({
        group: 'zoom-layout',
        icon: 'mmm-warning',
        message: t('zoom-layout-arrange-failed'),
        type: 'warning',
      });
    }
  } finally {
    arrangingWindows.value = false;
  }
};

let mainWindowPollingInterval: ReturnType<typeof setInterval> | undefined;

const meeting = ref<null | ZoomMeetingState>(null);
const hasCheckedForWindow = ref(false);
const runningAction = ref<null | ZoomAction>(null);
const restartingHelper = ref(false);
const moreOptionsOpen = ref(false);
const showLogs = ref(false);
const logsExpanded = ref(false);

const toggleLogs = () => {
  moreOptionsOpen.value = false;
  showLogs.value = !showLogs.value;
  logsExpanded.value = showLogs.value;
};

const meetingId = computed(
  () => currentSettings.value?.zoomMeetingManagerMeetingId?.trim() ?? '',
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

const footerAction = computed<FooterAction>(() => {
  if (meetingFound.value) return zoomLayout.enabled ? 'arrange' : 'layout';
  return meetingId.value ? 'launch' : 'settings';
});

const statusText = computed(() => {
  if (restartingHelper.value) return t('zoom-setup-helper-checking');
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
    const result = await restartZoomHelper();
    if (!result.ok) {
      createTemporaryNotification({
        caption: t(getZoomHelperErrorMessageKey(result.error)),
        message: t('zoom-helper-start-failed'),
        type: 'negative',
      });
    }
    await syncMainWindow();
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'restartZoomHelper' } } });
  } finally {
    restartingHelper.value = false;
  }
};

const restartFromMenu = () => {
  moreOptionsOpen.value = false;
  void restartHelper();
};

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
});
</script>

<style scoped>
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

/* A banner whose button goes under its text: the icon stays by the first line. */
.zoom-popup__banner--stacked {
  align-items: flex-start;
}

/* Under the banner's text, its label lined up with it. */
.zoom-popup__banner-action {
  margin: 4px 0 0 -6px;
}
</style>
