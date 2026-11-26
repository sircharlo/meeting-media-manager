import type { MeetingPartOption } from 'src/types';

import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { isMeetingDay } from 'src/helpers/date';
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
    customTimerParts: ref([]),
    getDuration: vi.fn(),
    getPlannedStartTime: vi.fn(() => null),
    getTimeString: vi.fn(),
    meetingPartsOptions: ref([]),
    partDurations: ref({}),
    partTimings: ref({}),
    removeCustomTimerPart: vi.fn(),
    resetPartTiming: vi.fn(),
    selectPart: vi.fn(),
    setPartDuration: vi.fn(),
    stopTimer: vi.fn(),
    timerRunning: ref(false),
    updateCustomTimerPart: vi.fn(),
  };
  return { default: () => timer };
});

vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  isMeetingDay: vi.fn(() => true),
}));

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

describe('TimerPartsList custom part delete', () => {
  const special: MeetingPartOption = {
    label: 'Special talk (5 min.)',
    name: 'Special talk',
    value: 'custom-1',
  };
  const closing: MeetingPartOption = {
    label: 'Closing (5 min.)',
    name: 'Closing',
    value: 'custom-2',
  };
  const builtIn: MeetingPartOption = {
    label: 'AYFM 1 (4 min.)',
    name: 'AYFM 1',
    value: 'ayfm-1',
  };

  const setParts = async (options: MeetingPartOption[]) => {
    const timer = (await import('src/composables/useTimer')).default();
    const writable = timer as unknown as Record<string, { value: unknown }>;
    Object.assign(writable.meetingPartsOptions ?? {}, { value: options });
    Object.assign(writable.customTimerParts ?? {}, {
      value: options
        .filter((option) => option.value.startsWith('custom-'))
        .map((option) => ({
          duration: 5,
          id: option.value,
          label: option.name,
        })),
    });
    Object.assign(writable.partDurations ?? {}, {
      value: Object.fromEntries(options.map((option) => [option.value, 5])),
    });
    Object.assign(writable.partTimings ?? {}, { value: {} });
    return timer;
  };

  // Each row's delete button, in list order (check .exists() for none).
  const rowDeleteButtons = (wrapper: ReturnType<typeof mount>) =>
    wrapper
      .findAll('.q-item')
      .map((row) => row.find('button[aria-label="Delete"]'));
  const rowsWithDelete = (wrapper: ReturnType<typeof mount>) =>
    rowDeleteButtons(wrapper).map((button) => button.exists());

  beforeEach(async () => {
    const timer = await setParts([builtIn, special, closing]);
    timer.currentPart.value = 'ayfm-1';
    timer.timerRunning.value = false;
    vi.mocked(timer.removeCustomTimerPart).mockClear();
    vi.mocked(isMeetingDay).mockReturnValue(true);
    useCongregationSettingsStore().congregations = {
      'test-cong': { ...defaultSettings },
    };
    useCurrentStateStore().currentCongregation = 'test-cong';
  });

  it('deletes a custom part from its row in the docked panel', async () => {
    const timer = (await import('src/composables/useTimer')).default();
    const wrapper = mount(TimerPartsList, {
      props: { removableCustomParts: true },
    });

    expect(rowsWithDelete(wrapper)).toEqual([false, true, true]);

    await rowDeleteButtons(wrapper)[1]?.trigger('click');

    expect(timer.removeCustomTimerPart).toHaveBeenCalledWith('custom-1');
    // Deleting doesn't also open the part's edit dialog.
    const vm = wrapper.vm as unknown as { editDialogOpen: boolean };
    expect(vm.editDialogOpen).toBe(false);
    wrapper.unmount();
  });

  it('leaves deleting to the setup section where the list has one', () => {
    const wrapper = mount(TimerPartsList);

    expect(rowsWithDelete(wrapper)).toEqual([false, false, false]);
    wrapper.unmount();
  });

  it('keeps the part being timed', async () => {
    const timer = (await import('src/composables/useTimer')).default();
    timer.currentPart.value = 'custom-1';
    timer.timerRunning.value = true;

    const wrapper = mount(TimerPartsList, {
      props: { removableCustomParts: true },
    });

    expect(rowsWithDelete(wrapper)).toEqual([false, false, true]);
    wrapper.unmount();
  });

  it('keeps the last part of a day without a meeting', async () => {
    vi.mocked(isMeetingDay).mockReturnValue(false);
    await setParts([special]);

    const wrapper = mount(TimerPartsList, {
      props: { removableCustomParts: true },
    });

    expect(rowsWithDelete(wrapper)).toEqual([false]);
    wrapper.unmount();
  });

  it('can delete either part when a day without a meeting has two', async () => {
    vi.mocked(isMeetingDay).mockReturnValue(false);
    await setParts([special, closing]);

    const wrapper = mount(TimerPartsList, {
      props: { removableCustomParts: true },
    });

    expect(rowsWithDelete(wrapper)).toEqual([true, true]);
    wrapper.unmount();
  });
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
