import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useSpecialWeek } from '../useSpecialWeek';

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'test-cong';

// Midweek meeting on Wednesday ('2', Monday being '0'), weekend on Sunday.
// The circuit overseer visits the week of Tuesday 8 December 2026, and the
// Memorial is on Thursday 2 April 2026.
const describeDay = (selectedDate: string) => {
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

  let result: ReturnType<typeof useSpecialWeek> | undefined;
  mount(
    defineComponent({
      setup() {
        result = useSpecialWeek();
        return () => h('div');
      },
    }),
  );
  if (!result) throw new Error('useSpecialWeek did not run');
  return result;
};

describe('useSpecialWeek', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // Between the two weeks below: the Memorial is past, the visit ahead.
    vi.setSystemTime(new Date(2026, 5, 1, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    [
      '2026/12/08',
      [
        "This week, the midweek meeting is on Tuesday. M³ hides the Congregation Bible Study's media and the closing song.",
      ],
    ],
    [
      '2026/12/09',
      ['This week, the midweek meeting is on Tuesday, December 8.'],
    ],
    [
      '2026/12/13',
      [
        "The circuit overseer's talk follows the Watchtower Study. M³ hides the closing song.",
      ],
    ],
    [
      '2026/04/01',
      [
        'No midweek meeting this week',
        'The Memorial on Thursday, April 2 takes its place.',
      ],
    ],
    [
      '2026/04/02',
      [
        "M³ adds the Memorial's welcome video and songs, and shows its image instead of the yeartext.",
      ],
    ],
    [
      '2026/04/05',
      [
        'The Memorial was on Thursday, April 2.',
        'The weekend meeting is as usual.',
      ],
    ],
  ])('explains %s', (selectedDate, lines) => {
    expect(describeDay(selectedDate).messageLines.value).toEqual(lines);
  });

  it('names the week for the header chip', () => {
    const co = describeDay('2026/12/11');
    expect(co.chipLabel.value).toBe('CO visit');
    expect(co.title.value).toBe("Circuit overseer's visit");
    expect(co.range.value).toMatch(/Dec 7.*13/);

    const memorial = describeDay('2026/03/30');
    expect(memorial.chipLabel.value).toBe('Memorial week');
    expect(memorial.title.value).toBe('Memorial week');
  });

  it('says nothing about an ordinary week', () => {
    const ordinary = describeDay('2026/12/16');
    expect(ordinary.specialWeek.value).toBeUndefined();
    expect(ordinary.messageLines.value).toEqual([]);
    expect(ordinary.isMovedDay.value).toBe(false);
  });
});
