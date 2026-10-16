<template>
  <ActionPopup
    v-model="open"
    :status-color="statusColor"
    :status-icon="statusIcon"
    :status-text="statusText"
    :title="t('timer')"
  >
    <!-- Window Type Selection -->
    <template v-if="showWindowTypeControls">
      <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
        {{ t('window-type') }}
      </p>
      <div class="row q-px-md q-pb-sm q-col-gutter-sm">
        <div class="col-6">
          <q-btn
            class="full-width full-height"
            color="primary"
            :disable="!canUseFullscreenTimer"
            icon="mmm-fullscreen"
            :label="t('full-screen')"
            :outline="timerPreferences.preferWindowed"
            unelevated
            @click="setTimerFullscreenMode()"
          />
        </div>
        <div class="col-6">
          <q-btn
            class="full-width full-height"
            color="primary"
            icon="mmm-window"
            :label="t('windowed')"
            :outline="!timerPreferences.preferWindowed"
            :text-color="timerPreferences.preferWindowed ? '' : 'primary'"
            unelevated
            @click="setTimerWindowedMode()"
          />
        </div>
      </div>
      <q-separator class="bg-accent-200 q-my-sm" />
    </template>

    <template
      v-if="!timerPreferences.preferWindowed && showFullscreenScreenPicker"
    >
      <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
        {{ t('display') }}
      </p>
      <div class="q-px-md q-pb-sm">
        <div
          class="display-map"
          :style="{
            position: 'relative',
            width: '100%',
            aspectRatio: virtualBounds.width + ' / ' + virtualBounds.height,
            overflow: 'hidden',
            '--screen-gap': '1%',
          }"
        >
          <template v-for="(screen, index) in screenList" :key="screen.id">
            <q-btn
              class="screen-rect column items-center justify-center"
              :class="{
                'border-dashed': screen.mainWindow,
              }"
              :color="
                !screen.mainWindow && !screen.mediaWindow
                  ? 'primary'
                  : 'secondary'
              "
              :disable="screen.mainWindow || screen.mediaWindow"
              :outline="!isTimerScreenSelected(index, screen)"
              :style="{
                position: 'absolute',
                left:
                  'calc(' +
                  (screenRects[index]?.left ?? 0) +
                  '% + var(--screen-gap))',
                top:
                  'calc(' +
                  (screenRects[index]?.top ?? 0) +
                  '% + var(--screen-gap))',
                width:
                  'calc(' +
                  (screenRects[index]?.width ?? 0) +
                  '% - (var(--screen-gap) * 2))',
                height:
                  'calc(' +
                  (screenRects[index]?.height ?? 0) +
                  '% - (var(--screen-gap) * 2))',
                borderRadius: '6px',
              }"
              unelevated
              @click="
                () => {
                  if (screen.mainWindow || screen.mediaWindow) return;
                  timerPreferences.preferredScreenNumber = index;
                  moveTimerWindow(index, !timerPreferences.preferWindowed);
                }
              "
            >
              <q-tooltip
                v-if="screen.mainWindow || screen.mediaWindow"
                :delay="1000"
              >
                {{
                  screen.mainWindow
                    ? t('main-window-is-on-this-screen')
                    : t('media-display') + ' (' + t('projecting') + ')'
                }}
              </q-tooltip>
              <q-icon
                v-if="screen.mainWindow"
                class="absolute-top-left q-ma-xs"
                name="mmm-logo"
                size="xs"
              />
              <q-icon
                v-if="screen.mediaWindow"
                class="absolute-top-right q-ma-xs"
                name="mmm-media-display-active"
                size="xs"
              />
              <q-icon
                v-if="!screen.mainWindow && !screen.mediaWindow"
                class="q-mr-sm"
                name="mmm-time"
                size="xs"
              />
              {{
                !screen.mainWindow && !screen.mediaWindow
                  ? t('display') + ' ' + (index + 1)
                  : ''
              }}
            </q-btn>
          </template>
        </div>
      </div>
      <q-separator class="bg-accent-200 q-my-sm" />
    </template>

    <!-- Meeting structure (midweek): number of parts and study end time -->
    <template v-if="isMwMeetingDay(selectedDateObject?.date)">
      <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
        {{ t('ayfm') }}
      </p>
      <div class="row q-px-md q-py-sm">
        {{ t('number-of-ayfm-parts') }}
      </div>
      <div class="row q-px-md q-pb-sm">
        <q-btn-toggle
          v-model="ayfmPartsCount"
          class="full-width"
          :disable="timerRunning"
          :options="[
            { label: '1', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
            { label: '4', value: 4 },
            { label: '5', value: 5 },
          ]"
          spread
        />
      </div>
      <q-separator class="bg-accent-200 q-my-sm" />
      <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
        {{ t('lac') }}
      </p>
      <div class="row q-px-md q-py-sm">
        {{ t('number-of-lac-parts') }}
      </div>
      <div class="row q-px-md q-pb-sm">
        <q-btn-toggle
          v-model="lacPartsCount"
          class="full-width"
          :disable="timerRunning"
          :options="[
            { label: '1', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
          ]"
          spread
        />
      </div>
      <template
        v-if="timerMode === 'countdown' && !isCoWeek(selectedDateObject?.date)"
      >
        <div class="row q-px-md q-py-sm">
          {{ t('cbs-custom-end-time') }}
        </div>
        <div class="row q-px-md q-pb-sm">
          <TimeInput
            v-model="cbsCustomEndTime"
            :disable="timerRunning"
            :extra-rules="cbsEndTimeRules"
            full-width
            :label="t('end-time')"
            :options="undefined"
          />
        </div>
      </template>
      <q-separator class="bg-accent-200 q-my-sm" />
    </template>
    <template
      v-else-if="
        timerMode === 'countdown' && isWeMeetingDay(selectedDateObject?.date)
      "
    >
      <div class="row q-px-md q-py-sm">
        {{ t('wt-custom-end-time') }}
      </div>
      <div class="row q-px-md q-pb-sm">
        <TimeInput
          v-model="wtCustomEndTime"
          :disable="timerRunning"
          :extra-rules="wtEndTimeRules"
          full-width
          :label="t('end-time')"
          :options="undefined"
        />
      </div>
      <q-separator class="bg-accent-200 q-my-sm" />
    </template>

    <!-- Custom parts: the whole list on days without a meeting, and extra
         parts for special programs on meeting days -->
    <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
      {{ t('custom-timer-parts') }}
    </p>
    <div
      v-if="isMeetingDay(selectedDateObject?.date)"
      class="row q-px-md q-pb-sm text-caption text-dark-grey"
    >
      {{ t('custom-timer-parts-explain') }}
    </div>
    <div class="column q-px-md q-pb-sm q-gutter-sm">
      <div
        v-for="(part, index) in customTimerParts"
        :key="part.id"
        class="row items-center q-col-gutter-sm"
      >
        <div class="col">
          <q-input
            dense
            :disable="timerRunning && currentPart === part.id"
            filled
            :label="t('meeting-part')"
            :model-value="part.label"
            @update:model-value="
              (value) =>
                updateCustomTimerPart(part.id, {
                  label: String(value ?? ''),
                })
            "
          />
        </div>
        <div class="col-4">
          <q-input
            dense
            :disable="timerRunning && currentPart === part.id"
            filled
            :label="t('duration-minutes')"
            min="0"
            :model-value="part.duration"
            type="number"
            @update:model-value="
              (value) =>
                updateCustomTimerPart(part.id, { duration: Number(value) })
            "
          />
        </div>
        <div class="col-auto">
          <div class="row q-gutter-xs">
            <q-btn
              :aria-label="t('move-up')"
              dense
              :disable="timerRunning || index === 0"
              flat
              icon="mmm-up"
              round
              @click="moveCustomTimerPart(index, index - 1)"
            >
              <q-tooltip>{{ t('move-up') }}</q-tooltip>
            </q-btn>
            <q-btn
              :aria-label="t('move-down')"
              dense
              :disable="timerRunning || index === customTimerParts.length - 1"
              flat
              icon="mmm-down"
              round
              @click="moveCustomTimerPart(index, index + 1)"
            >
              <q-tooltip>{{ t('move-down') }}</q-tooltip>
            </q-btn>
            <q-btn
              :aria-label="t('delete')"
              color="negative"
              dense
              :disable="
                (timerRunning && currentPart === part.id) ||
                (!isMeetingDay(selectedDateObject?.date) &&
                  customTimerParts.length <= 1)
              "
              flat
              icon="mmm-delete"
              round
              @click="removeCustomTimerPart(part.id)"
            >
              <q-tooltip>{{ t('delete') }}</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
      <div class="row">
        <q-btn
          color="primary"
          flat
          icon="mmm-plus"
          :label="t('add-custom-part')"
          no-caps
          @click="addCustomTimerPart"
        />
      </div>
    </div>

    <q-separator class="bg-accent-200 q-my-sm" />
    <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
      {{ t('meeting-part') }}
    </p>
    <div class="row q-px-md q-pb-sm">
      <TimerPartsList dialog-id="timer-popup" />
    </div>

    <!-- Timer Controls -->
    <q-separator class="bg-accent-200 q-my-sm" />
    <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
      {{ t('timer-controls') }}
    </p>
    <div class="q-px-md q-pt-sm q-pb-sm">
      <TimerQuickControls class="q-mb-md" />

      <div
        v-if="timerRunning && aheadBehindText"
        class="text-center text-caption text-dark-grey q-mb-sm"
      >
        {{ aheadBehindText }}
      </div>

      <q-btn
        class="full-width q-mb-sm"
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
      <q-btn
        class="full-width q-mb-sm"
        color="primary"
        icon="mmm-export"
        :label="t('export-pdf-report')"
        :loading="exportingReport"
        no-caps
        outline
        @click="exportReport"
      />
      <q-btn
        class="full-width"
        color="negative"
        :disable="!hasAnyPartTimings || timerRunning"
        flat
        icon="mmm-reset"
        :label="t('reset-all-timings')"
        no-caps
        @click="resetAllConfirmOpen = true"
      />
    </div>

    <!-- Timer remote: where to open the read-only page -->
    <template v-if="currentSettings?.timerRemoteEnable">
      <q-separator class="bg-accent-200 q-my-sm" />
      <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
        {{ t('timer-remote') }}
      </p>
      <div class="q-px-md q-pb-sm">
        <div class="text-caption text-dark-grey q-mb-xs">
          {{
            timerRemoteUrls.length
              ? t('timer-remote-open-on-device')
              : t('timer-remote-no-network')
          }}
        </div>
        <div
          v-for="url in timerRemoteUrls"
          :key="url"
          class="row items-center no-wrap q-gutter-x-sm"
        >
          <code class="col ellipsis timer-remote__url">{{ url }}</code>
          <q-btn
            :aria-label="t('timer-remote-copy')"
            dense
            flat
            icon="mmm-link"
            round
            size="sm"
            @click="copyRemoteUrl(url)"
          >
            <q-tooltip :delay="500">{{ t('timer-remote-copy') }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </template>

    <template #footer>
      <q-btn
        v-if="timerWindowVisible"
        class="full-width"
        color="primary"
        icon="mmm-alarm-off"
        :label="t('hide-timer-display')"
        unelevated
        @click="handleTimerWindowVisibility(false)"
      />
      <q-btn
        v-else
        class="full-width"
        color="primary"
        icon="mmm-alarm"
        :label="t('show-timer-display')"
        unelevated
        @click="handleTimerWindowVisibility(true)"
      />
    </template>
  </ActionPopup>

  <ConfirmDialog
    v-model="resetAllConfirmOpen"
    confirm-color="warning"
    :confirm-label="t('reset')"
    dialog-id="timer-reset-all"
    icon="mmm-reset"
    icon-color="warning"
    :message="t('reset-all-timings-confirmation')"
    persistent
    :title="t('reset-all-timings')"
    @confirm="confirmResetAll"
  />
</template>

<script setup lang="ts">
import type { Display } from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import TimeInput from 'components/form-inputs/TimeInput.vue';
import TimerPartsList from 'components/media/TimerPartsList.vue';
import TimerQuickControls from 'components/media/TimerQuickControls.vue';
import ActionPopup from 'components/ui/ActionPopup.vue';
import { storeToRefs } from 'pinia';
import { copyToClipboard } from 'quasar';
import useTimer from 'src/composables/useTimer';
import { useTimerAheadBehindText } from 'src/composables/useTimerAheadBehindText';
import {
  isCoWeek,
  isMeetingDay,
  isMwMeetingDay,
  isWeMeetingDay,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { exportTimerReport } from 'src/helpers/timer-report';
import { useAppSettingsStore } from 'src/stores/app-settings';
import { withTimeout } from 'src/utils/general';
import { useCurrentStateStore } from 'stores/current-state';
import { useHandAlertStore } from 'stores/hand-alert';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const screenList = ref<Display[]>([]);

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  selectedDateObject,
  timerRemoteUrls,
  timerWindowVisible,
} = storeToRefs(currentState);

const copyRemoteUrl = async (url: string) => {
  try {
    await copyToClipboard(url);
    createTemporaryNotification({
      group: 'timer-remote',
      icon: 'mmm-link',
      message: t('timer-remote-copied'),
      type: 'positive',
    });
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'copyRemoteUrl' } } });
  }
};

const appSettingsStore = useAppSettingsStore();
const { timerPreferences } = storeToRefs(appSettingsStore);

const handAlert = useHandAlertStore();

defineProps<{
  dialogId?: string;
}>();

const open = defineModel<boolean>({ required: true });

const {
  addCustomTimerPart,
  ayfmPartsCount,
  cbsCustomEndTime,
  cbsEndTimeRules,
  currentPart,
  customTimerParts,
  getDuration,
  getTimeString,
  handleTimerWindowVisibility,
  hasAnyPartTimings,
  lacPartsCount,
  meetingPartsOptions,
  moveCustomTimerPart,
  partDurations,
  partTimings,
  removeCustomTimerPart,
  resetAllPartTimings,
  timerMode,
  timerRunning,
  updateCustomTimerPart,
  updateTimerWindow,
  wtCustomEndTime,
  wtEndTimeRules,
} = useTimer();

const aheadBehindText = useTimerAheadBehindText();

const resetAllConfirmOpen = ref(false);

const confirmResetAll = () => {
  resetAllPartTimings();
  resetAllConfirmOpen.value = false;
};

const exportingReport = ref(false);

const exportReport = async () => {
  if (exportingReport.value) return;
  exportingReport.value = true;
  try {
    await exportTimerReport(
      {
        date: selectedDateObject.value?.date,
        getDuration,
        getTimeString,
        partDurations: partDurations.value,
        parts: meetingPartsOptions.value,
        partTimings: partTimings.value,
      },
      currentSettings.value?.congregationName ?? '',
    );
  } finally {
    exportingReport.value = false;
  }
};

const { getAllScreens, moveTimerWindow } = globalThis.electronApi;

// Listen for timer page ready
const { data: timerPageReady } = useBroadcastChannel<string, string>({
  name: 'timer-page-ready',
});

const SCREEN_FETCH_TIMEOUT_MS = 5000;

// Guards against piling up overlapping getAllScreens() IPC round-trips -
// this listener stays mounted for the component's whole lifetime (not just
// while the popup is open), so a burst of 'screen-trigger-update' events
// must not stack up concurrent calls or wait forever on a slow reply.
let fetchingScreens = false;

const fetchScreens = async () => {
  if (fetchingScreens) return;
  fetchingScreens = true;
  try {
    screenList.value = await withTimeout(
      getAllScreens(),
      SCREEN_FETCH_TIMEOUT_MS,
      'getAllScreens timed out',
    );
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'fetchScreens' } },
    });
  } finally {
    fetchingScreens = false;
  }
};

useEventListener(globalThis, 'screen-trigger-update', fetchScreens, {
  passive: true,
});

// Virtual desktop extents across all displays (in physical pixels as provided by Electron)
const virtualBounds = computed(() => {
  const list = screenList.value;
  if (!list || list.length === 0) {
    return { height: 9, width: 16, x: 0, y: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const d of list) {
    const b = d.bounds;
    if (!b) continue;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return { height, width, x: minX, y: minY };
});

// Percentage-based rectangles for each screen relative to the virtual desktop
const screenRects = computed(() => {
  const vb = virtualBounds.value;
  const list = screenList.value ?? [];
  return list.map((d) => {
    const b = d.bounds;
    const left = ((b.x - vb.x) / vb.width) * 100;
    const top = ((b.y - vb.y) / vb.height) * 100;
    const width = (b.width / vb.width) * 100;
    const height = (b.height / vb.height) * 100;
    return {
      height: Number.isFinite(height) ? height : 0,
      left: Number.isFinite(left) ? left : 0,
      top: Number.isFinite(top) ? top : 0,
      width: Number.isFinite(width) ? width : 0,
    };
  });
});

const canUseFullscreenTimer = computed(
  () => (screenList.value?.length ?? 0) > 2,
);
const showWindowTypeControls = computed(
  () => (screenList.value?.length ?? 0) > 2,
);
const showFullscreenScreenPicker = computed(
  () => (screenList.value?.length ?? 0) > 3,
);

const getPreferredFullscreenTimerScreen = () => {
  const screens = screenList.value ?? [];
  const preferredNonMainNonMedia = screens.findIndex(
    (screen) => !screen.mainWindow && !screen.mediaWindow,
  );
  if (preferredNonMainNonMedia !== -1) return preferredNonMainNonMedia;

  return screens.findIndex((screen) => !screen.mainWindow);
};

const setTimerFullscreenMode = () => {
  if (!canUseFullscreenTimer.value) return;

  const preferredScreenNumber = getPreferredFullscreenTimerScreen();
  if (preferredScreenNumber < 0) return;

  timerPreferences.value.preferredScreenNumber = preferredScreenNumber;
  timerPreferences.value.preferWindowed = false;
  moveTimerWindow(preferredScreenNumber, true);
};

const setTimerWindowedMode = () => {
  timerPreferences.value.preferWindowed = true;
  moveTimerWindow(timerPreferences.value.preferredScreenNumber, false);
};

// "Projecting · External screen": whether the timer display is shown, and
// where.
const statusText = computed(() => {
  const visibility = timerWindowVisible.value ? t('projecting') : t('inactive');
  const windowed =
    (screenList.value?.length ?? 0) < 2 ||
    timerPreferences.value.preferWindowed;
  const placement = windowed ? t('windowed') : t('external-screen');
  return [visibility, placement].join(' · ');
});

const statusIcon = computed(() =>
  timerWindowVisible.value ? 'mmm-alarm' : 'mmm-alarm-off',
);

const statusColor = computed(() =>
  timerWindowVisible.value ? 'positive' : 'grey',
);

// Selected when timer window is on this screen and it's not the app's main window
const isTimerScreenSelected = (index: number, screen: Display) => {
  return (
    (!!screen.timerWindow && !screen.mainWindow) ||
    (!timerWindowVisible.value &&
      timerPreferences.value.preferredScreenNumber === index &&
      !screen.mainWindow)
  );
};

whenever(
  () => open.value,
  () => {
    void fetchScreens();
  },
);

watch(
  screenList,
  (screens) => {
    if ((screens?.length ?? 0) <= 2 && !timerPreferences.value.preferWindowed) {
      setTimerWindowedMode();
    }
  },
  { immediate: true },
);

// Watch for timer settings changes and broadcast to timer window
watchImmediate(
  () => [
    currentSettings.value?.timerBackgroundColor,
    currentSettings.value?.timerCountdownDisplay,
    currentSettings.value?.timerCountdownWarningIndicator,
    currentSettings.value?.timerHourFormat,
    currentSettings.value?.timerTextColor,
    currentSettings.value?.timerTextSize,
    currentSettings.value?.timerTimeOfDayDisplay,
    currentSettings.value?.timerEnableMeetingAheadBehind,
    currentSettings.value?.timerEnableMeetingCountdown,
    currentSettings.value?.timerMeetingCountdownMinutes,
    currentSettings.value?.timerOvertimeIndicator,
    currentSettings.value?.timerOvertimeAnimation,
    currentSettings.value?.timerOvertimeShowAmountOnly,
    currentSettings.value?.timerOvertimeBackgroundColor,
    currentSettings.value?.timerOvertimeTextColor,
    currentSettings.value?.mwDay,
    currentSettings.value?.weDay,
    currentSettings.value?.mwStartTime,
    currentSettings.value?.weStartTime,
    currentCongregation.value,
  ],
  () => {
    updateTimerWindow();
  },
);

// Watch for timer page ready
watch(timerPageReady, (timestamp) => {
  if (timestamp) {
    handleTimerWindowVisibility(true);
  }
});

// Initialize timer when window becomes visible
watch(timerWindowVisible, (visible) => {
  if (visible) {
    // Initialize timer with current settings
    updateTimerWindow();
  }
});
</script>

<style scoped>
.border-dashed::before {
  border-style: dashed;
}

.timer-remote__url {
  font-size: 0.85em;
  min-width: 0;
}
</style>
