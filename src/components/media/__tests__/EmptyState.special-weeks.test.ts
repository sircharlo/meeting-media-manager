import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import EmptyState from '../EmptyState.vue';

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'test-cong';

// Midweek meeting on Wednesday ('2', Monday being '0'), weekend on Sunday.
// The circuit overseer visits the week of Tuesday 8 December 2026, and the
// Memorial is on Thursday 2 April 2026.
const selectDay = (selectedDate: string) => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      coWeek: '2026/12/08',
      memorialDate: '2026/04/02',
      mwDay: '2',
      weDay: '6',
    },
  };
  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;
  currentState.selectedDate = selectedDate;
  return currentState;
};

describe('EmptyState on a day whose meeting moved or was replaced', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 2, 1, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    {
      button: 'Go to Tuesday',
      explanation:
        'The circuit overseer is visiting this week, so the midweek meeting is on Tuesday, December 8.',
      goesTo: '2026/12/08',
      selected: '2026/12/09',
      title: 'No midweek meeting today',
    },
    {
      button: 'Go to the Memorial',
      explanation: 'The Memorial on Thursday, April 2 takes its place.',
      goesTo: '2026/04/02',
      selected: '2026/04/01',
      title: 'No midweek meeting this week',
    },
  ])(
    'says why on $selected and offers $button',
    async ({ button, explanation, goesTo, selected, title }) => {
      const currentState = selectDay(selected);
      const goToNextDayWithMedia = vi.fn();
      const wrapper = mount(EmptyState, { props: { goToNextDayWithMedia } });

      expect(wrapper.text()).toContain(title);
      expect(wrapper.text()).toContain(explanation);
      expect(wrapper.text()).not.toContain(
        'There are no media items for the selected date.',
      );

      const goTo = wrapper
        .findAll('button')
        .find((candidate) => candidate.text().includes(button));
      expect(goTo).toBeDefined();
      await goTo?.trigger('click');

      expect(currentState.selectedDate).toBe(goesTo);
      expect(goToNextDayWithMedia).not.toHaveBeenCalled();
    },
  );

  it('keeps the usual empty state on an ordinary day without a meeting', () => {
    selectDay('2026/12/17');
    const wrapper = mount(EmptyState, { props: {} });

    expect(wrapper.text()).toContain(
      'There are no media items for the selected date.',
    );
    expect(wrapper.text()).not.toContain('No midweek meeting');
    expect(wrapper.text()).not.toContain('Go to Tuesday');
  });
});
