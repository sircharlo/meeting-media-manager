import type { DateInfo } from 'src/types';

import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { exportTimerReport } from 'src/helpers/timer-report';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTimerReportExport } from '../useTimerReportExport';

const { timer } = vi.hoisted(() => ({
  timer: {
    getDuration: () => '',
    getTimeString: () => '',
    meetingPartsOptions: { value: [{ label: 'Gems', value: 'gems' }] },
    partDurations: { value: { gems: 10 } },
    partTimings: { value: { gems: { endTime: 2, startTime: 1 } } },
  },
}));

vi.mock('src/composables/useTimer', () => ({ default: () => timer }));

vi.mock('src/helpers/timer-report', () => ({
  exportTimerReport: vi.fn(),
}));

installPinia();

const DAY = new Date(2026, 9, 13);

beforeEach(() => {
  vi.mocked(exportTimerReport).mockReset();
  useCongregationSettingsStore().congregations = {
    cong: { ...defaultSettings, congregationName: 'Riverside' },
  };
  const day: DateInfo = { date: DAY, mediaSections: [], status: 'complete' };
  useJwStore().lookupPeriod = { cong: [day] };
  const currentState = useCurrentStateStore();
  currentState.currentCongregation = 'cong';
  currentState.selectedDate = '2026/10/13';
});

describe('useTimerReportExport', () => {
  it("exports the selected day's parts and timings, under the congregation's name", async () => {
    const { exportReport } = useTimerReportExport();

    await exportReport();

    expect(exportTimerReport).toHaveBeenCalledWith(
      expect.objectContaining({
        date: DAY,
        partDurations: { gems: 10 },
        parts: [{ label: 'Gems', value: 'gems' }],
        partTimings: { gems: { endTime: 2, startTime: 1 } },
      }),
      'Riverside',
    );
  });

  it('exports once at a time, and can export again after a failure', async () => {
    let fail: ((error: Error) => void) | undefined;
    vi.mocked(exportTimerReport).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        }),
    );
    const { exportingReport, exportReport } = useTimerReportExport();

    const first = exportReport();
    expect(exportingReport.value).toBe(true);
    await exportReport();
    expect(exportTimerReport).toHaveBeenCalledOnce();

    fail?.(new Error('disk full'));
    await expect(first).rejects.toThrow('disk full');
    expect(exportingReport.value).toBe(false);

    await exportReport();
    expect(exportTimerReport).toHaveBeenCalledTimes(2);
  });
});
