import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TimerDockPanel from '../TimerDockPanel.vue';

const { exportReportMock } = vi.hoisted(() => ({
  exportReportMock: vi.fn(),
}));

// The panel only lays out what useTimer holds; the timer itself is tested in
// src/composables/__tests__.
vi.mock('src/composables/useTimer', async () => {
  const { ref } = await import('vue');
  const timer = {
    addCustomTimerPart: vi.fn(),
    handleTimerWindowVisibility: vi.fn(),
    hasAnyPartTimings: ref(true),
    resetAllPartTimings: vi.fn(),
    timerRunning: ref(false),
  };
  return { default: () => timer };
});

vi.mock('src/composables/useTimerAheadBehindText', async () => {
  const { computed } = await import('vue');
  return { useTimerAheadBehindText: () => computed(() => '') };
});

vi.mock('src/composables/useTimerReportExport', async () => {
  const { ref } = await import('vue');
  return {
    useTimerReportExport: () => ({
      exportingReport: ref(false),
      exportReport: exportReportMock,
    }),
  };
});

installQuasarPlugin();
installPinia();

const mountPanel = () =>
  mount(TimerDockPanel, {
    global: {
      stubs: {
        ConfirmDialog: true,
        // A drawer needs a layout around it; the panel's content is what's
        // under test.
        QDrawer: { template: '<div class="q-drawer-stub"><slot /></div>' },
        TimerPartsList: true,
        TimerQuickControls: true,
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  useCongregationSettingsStore().congregations = {
    'test-cong': { ...defaultSettings },
  };
  useCurrentStateStore().currentCongregation = 'test-cong';
});

describe('TimerDockPanel', () => {
  it('exports the timing report from the panel, as the timer popup does', async () => {
    const wrapper = mountPanel();

    const exportButton = wrapper.find('button[aria-label="Export PDF report"]');
    expect(exportButton.exists()).toBe(true);
    await exportButton.trigger('click');

    expect(exportReportMock).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it('keeps resetting all timings beside it', () => {
    const wrapper = mountPanel();

    expect(
      wrapper.find('button[aria-label="Reset all timings for this day"]').exists(),
    ).toBe(true);
    wrapper.unmount();
  });
});
