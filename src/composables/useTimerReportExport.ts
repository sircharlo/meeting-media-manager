import { storeToRefs } from 'pinia';
import useTimer from 'src/composables/useTimer';
import { exportTimerReport } from 'src/helpers/timer-report';
import { useCurrentStateStore } from 'stores/current-state';
import { ref } from 'vue';

/**
 * Exports the selected day's timing report as a PDF: the same report from
 * the timer popup and from the docked timer panel.
 */
export const useTimerReportExport = () => {
  const { currentSettings, selectedDateObject } = storeToRefs(
    useCurrentStateStore(),
  );
  const {
    getDuration,
    getTimeString,
    meetingPartsOptions,
    partDurations,
    partTimings,
  } = useTimer();

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

  return { exportingReport, exportReport };
};
