import type { MeetingPartOption } from 'src/types';

import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TimerPartsList from '../TimerPartsList.vue';

// The list only lays out what useTimer holds; the timer itself is tested in
// src/composables/__tests__.
vi.mock('src/composables/useTimer', async () => {
  const { ref } = await import('vue');
  const timer = {
    adjustPartDuration: vi.fn(),
    currentPart: ref(null),
    getDuration: vi.fn(),
    getPlannedStartTime: vi.fn(() => null),
    getTimeString: vi.fn(),
    meetingPartsOptions: ref([]),
    partDurations: ref({}),
    partTimings: ref({}),
    resetPartTiming: vi.fn(),
    selectPart: vi.fn(),
    setPartDuration: vi.fn(),
    stopTimer: vi.fn(),
    timerRunning: ref(false),
    updateCustomTimerPart: vi.fn(),
  };
  return { default: () => timer };
});

installQuasarPlugin();
installPinia();

const getEditLabel = (part: MeetingPartOption) => {
  const wrapper = mount(TimerPartsList);
  const vm = wrapper.vm as unknown as {
    editLabel: string;
    openEditDialog: (part: MeetingPartOption) => void;
  };
  vm.openEditDialog(part);
  const { editLabel } = vm;
  wrapper.unmount();
  return editLabel;
};

describe('TimerPartsList rows', () => {
  const part: MeetingPartOption = {
    label: 'AYFM 1 (4 min.)',
    name: 'AYFM 1',
    value: 'ayfm-1',
  };
  const buttonLabels = (wrapper: ReturnType<typeof mount>) =>
    wrapper.findAll('button').map((button) => button.attributes('aria-label'));

  beforeEach(async () => {
    const timer = (await import('src/composables/useTimer')).default();
    // Computed in useTimer, plain refs in this test's mock of it.
    const writable = timer as unknown as Record<string, { value: unknown }>;
    Object.assign(writable.meetingPartsOptions ?? {}, { value: [part] });
    Object.assign(writable.partDurations ?? {}, { value: { 'ayfm-1': 4 } });
    Object.assign(writable.partTimings ?? {}, { value: {} });
    timer.currentPart.value = 'ayfm-1';
    timer.timerRunning.value = false;
    vi.mocked(timer.getPlannedStartTime).mockReturnValue(null);
    vi.mocked(timer.getTimeString).mockReturnValue('19:05');
    useCongregationSettingsStore().congregations = {
      'test-cong': { ...defaultSettings },
    };
    useCurrentStateStore().currentCongregation = 'test-cong';
  });

  it('shows the name and duration once, and only a start button', () => {
    const wrapper = mount(TimerPartsList);

    expect(wrapper.text()).toContain('AYFM 1');
    expect(wrapper.text()).toContain('4 min.');
    expect(wrapper.text()).not.toContain('AYFM 1 (4 min.)');
    expect(buttonLabels(wrapper)).toContain('Start timer');
    expect(buttonLabels(wrapper)).not.toContain('Increase duration');
    wrapper.unmount();
  });

  it('offers quick duration changes on the running part', async () => {
    const timer = (await import('src/composables/useTimer')).default();
    timer.timerRunning.value = true;

    const wrapper = mount(TimerPartsList);

    expect(buttonLabels(wrapper)).toContain('Increase duration');
    expect(buttonLabels(wrapper)).toContain('Decrease duration');
    wrapper.unmount();
  });

  it('opens the edit dialog from the duration', async () => {
    const wrapper = mount(TimerPartsList);
    const vm = wrapper.vm as unknown as { editDialogOpen: boolean };

    const duration = wrapper
      .findAll('button')
      .find((button) => button.text() === '4 min.');
    await duration?.trigger('click');

    expect(vm.editDialogOpen).toBe(true);
    wrapper.unmount();
  });

  it.each([
    [true, true],
    [false, false],
  ])(
    'with planned start times set to %s, shows them: %s',
    async (setting, shown) => {
      const timer = (await import('src/composables/useTimer')).default();
      vi.mocked(timer.getPlannedStartTime).mockReturnValue(1000);
      useCongregationSettingsStore().congregations = {
        'test-cong': {
          ...defaultSettings,
          timerShowPlannedStartTimes: setting,
        },
      };

      const wrapper = mount(TimerPartsList);

      expect(wrapper.text().includes('Planned start time')).toBe(shown);
      wrapper.unmount();
    },
  );
});

describe('TimerPartsList edit dialog label', () => {
  it.each([
    ['Opening comments (5 min.)', 'Opening comments'],
    ['Spaced \t  (12 min.)', 'Spaced'],
    ['(5 min.)', ''],
    ['Only the last (3 min.) (5 min.)', 'Only the last (3 min.)'],
    ['No duration suffix', 'No duration suffix'],
    ['Not at the end (5 min.) ', 'Not at the end (5 min.) '],
    ['Other unit (5 mins.)', 'Other unit (5 mins.)'],
  ])('edits %j as %j', (label, expected) => {
    expect(getEditLabel({ label, value: 'custom-1' })).toBe(expected);
  });

  it('has no label to edit for a built-in part', () => {
    expect(getEditLabel({ label: 'Song (5 min.)', value: 'lac-1' })).toBe('');
  });
});
