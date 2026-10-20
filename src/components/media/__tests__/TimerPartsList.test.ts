import type { MeetingPartOption } from 'src/types';

import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it, vi } from 'vitest';

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
