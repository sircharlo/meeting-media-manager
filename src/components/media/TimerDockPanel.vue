<template>
  <q-drawer
    bordered
    :breakpoint="0"
    class="timer-dock"
    model-value
    no-swipe-close
    no-swipe-open
    overlay-behavior="never"
    side="right"
    :width="340"
  >
    <div class="timer-dock__inner column no-wrap">
      <div class="timer-dock__header q-px-md q-pt-md q-pb-sm">
        <div class="row items-center no-wrap">
          <q-icon class="q-mr-sm" name="mmm-time" size="sm" />
          <div class="col text-subtitle1 text-weight-medium ellipsis">
            {{ t('timer') }}
          </div>
          <q-btn
            :aria-label="
              timerWindowVisible
                ? t('hide-timer-display')
                : t('show-timer-display')
            "
            :color="timerWindowVisible ? 'primary' : 'negative'"
            dense
            flat
            :icon="timerWindowVisible ? 'mmm-alarm' : 'mmm-alarm-off'"
            round
            @click="handleTimerWindowVisibility(!timerWindowVisible)"
          >
            <q-tooltip :delay="500">
              {{
                timerWindowVisible
                  ? t('hide-timer-display')
                  : t('show-timer-display')
              }}
            </q-tooltip>
          </q-btn>
        </div>
        <div
          v-if="selectedDateObject?.date"
          class="text-caption text-dark-grey"
        >
          {{ formattedSelectedDate }}
        </div>
      </div>

      <div class="q-px-md q-pb-sm">
        <TimerQuickControls />
        <div
          v-if="timerRunning && aheadBehindText"
          class="text-center text-caption text-dark-grey q-mt-xs"
        >
          {{ aheadBehindText }}
        </div>
      </div>

      <q-separator class="bg-accent-200" />

      <q-scroll-area class="col timer-dock__list">
        <TimerPartsList dense dialog-id="timer-dock" removable-custom-parts />
      </q-scroll-area>

      <q-separator class="bg-accent-200" />
      <div class="row items-center justify-between q-px-sm q-py-xs">
        <q-btn
          color="primary"
          dense
          flat
          icon="mmm-plus"
          :label="t('add-custom-part')"
          no-caps
          size="sm"
          @click="addCustomTimerPart"
        />
        <div class="row no-wrap items-center">
          <q-btn
            :aria-label="t('export-pdf-report')"
            color="primary"
            dense
            flat
            icon="mmm-export"
            :loading="exportingReport"
            no-caps
            round
            size="sm"
            @click="exportReport"
          >
            <q-tooltip :delay="500">{{ t('export-pdf-report') }}</q-tooltip>
            <template #loading>
              <LiquidSpinner />
            </template>
          </q-btn>
          <q-btn
            :aria-label="t('reset-all-timings')"
            color="warning"
            dense
            :disable="!hasAnyPartTimings || timerRunning"
            flat
            icon="mmm-reset"
            no-caps
            round
            size="sm"
            @click="resetAllConfirmOpen = true"
          >
            <q-tooltip :delay="500">{{ t('reset-all-timings') }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </q-drawer>

  <ConfirmDialog
    v-model="resetAllConfirmOpen"
    confirm-color="warning"
    :confirm-label="t('reset')"
    dialog-id="timer-dock-reset-all"
    icon="mmm-reset"
    icon-color="warning"
    :message="t('reset-all-timings-confirmation')"
    persistent
    :title="t('reset-all-timings')"
    @confirm="confirmResetAll"
  />
</template>

<script setup lang="ts">
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import TimerPartsList from 'components/media/TimerPartsList.vue';
import TimerQuickControls from 'components/media/TimerQuickControls.vue';
import LiquidSpinner from 'components/ui/LiquidSpinner.vue';
import { storeToRefs } from 'pinia';
import useTimer from 'src/composables/useTimer';
import { useTimerAheadBehindText } from 'src/composables/useTimerAheadBehindText';
import { useTimerReportExport } from 'src/composables/useTimerReportExport';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();

const currentState = useCurrentStateStore();
const { selectedDateObject, timerWindowVisible } = storeToRefs(currentState);

const {
  addCustomTimerPart,
  handleTimerWindowVisibility,
  hasAnyPartTimings,
  resetAllPartTimings,
  timerRunning,
} = useTimer();

const aheadBehindText = useTimerAheadBehindText();

const { exportingReport, exportReport } = useTimerReportExport();

const resetAllConfirmOpen = ref(false);

const confirmResetAll = () => {
  resetAllPartTimings();
  resetAllConfirmOpen.value = false;
};

const formattedSelectedDate = computed(() => {
  const date = selectedDateObject.value?.date;
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'full' }).format(
      date,
    );
  } catch {
    return date.toLocaleDateString();
  }
});
</script>

<style scoped>
.timer-dock__inner {
  height: 100%;
}

.timer-dock__list {
  min-height: 0;
}
</style>
