import type * as VueUse from '@vueuse/core';
import type { TimerData } from 'src/types';

import { mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

const timerData = ref<TimerData | undefined>();

// The page gets everything it shows from the timer dialog over a
// BroadcastChannel - feed it directly instead.
vi.mock('@vueuse/core', async (importOriginal) => ({
  ...(await importOriginal<typeof VueUse>()),
  useBroadcastChannel: ({ name }: { name: string }) =>
    name === 'timer-display-data'
      ? { data: timerData }
      : { data: ref(), post: vi.fn() },
}));

installQuasarPlugin();

const GREEN = 'rgb(53, 199, 89)';
const ORANGE = 'rgb(255, 149, 10)';

const runningPart = (overrides: Partial<TimerData>): TimerData => ({
  mode: 'countup',
  paused: false,
  running: true,
  time: '00:30',
  timerCountdownDisplay: 'analog-clock',
  timerCountdownTargetSeconds: 0,
  timerCountdownWarningIndicator: true,
  timerElapsedSeconds: 30,
  timerPartTargetSeconds: 300,
  ...overrides,
});

let wrapper: undefined | VueWrapper;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  timerData.value = undefined;
});

const arcRemainingColor = async (data: TimerData) => {
  const { default: TimerPage } = await import('../TimerPage.vue');
  wrapper = mount(TimerPage);
  timerData.value = data;
  await nextTick();
  await nextTick();
  return wrapper.find('.analog-clock__arc-remaining').attributes('fill');
};

describe('TimerPage - clock-face arc warning colour', () => {
  it('stays green early in a part when counting up', async () => {
    expect(await arcRemainingColor(runningPart({}))).toBe(GREEN);
  });

  it('turns orange in the last minute of the part when counting up', async () => {
    expect(
      await arcRemainingColor(
        runningPart({ time: '04:50', timerElapsedSeconds: 290 }),
      ),
    ).not.toBe(GREEN);
  });

  it('still uses the countdown target when counting down', async () => {
    expect(
      await arcRemainingColor(
        runningPart({
          mode: 'countdown',
          time: '04:30',
          timerCountdownTargetSeconds: 300,
          timerPartTargetSeconds: 300,
        }),
      ),
    ).toBe(GREEN);
    wrapper?.unmount();
    expect(
      await arcRemainingColor(
        runningPart({
          mode: 'countdown',
          time: '00:00',
          timerCountdownTargetSeconds: 300,
          timerElapsedSeconds: 300,
          timerPartTargetSeconds: 300,
        }),
      ),
    ).toBe(ORANGE);
  });
});

describe('TimerPage - analog countdown', () => {
  const mountCountdown = async (
    timerCountdownDisplay: TimerData['timerCountdownDisplay'],
  ) => {
    const { default: TimerPage } = await import('../TimerPage.vue');
    wrapper = mount(TimerPage);
    timerData.value = runningPart({
      mode: 'countdown',
      time: '04:30',
      timerCountdownDisplay,
      timerCountdownTargetSeconds: 300,
    });
    await nextTick();
    await nextTick();
    return wrapper;
  };

  it('shows the time inside the ring on its own', async () => {
    const page = await mountCountdown('analog');
    expect(page.find('.analog-countdown__inner').text()).toBe('04:30');
    expect(page.find('.digital-display').exists()).toBe(false);
  });

  it('shows the time once, beside the ring, with the digital display', async () => {
    const page = await mountCountdown('analog-digital');
    expect(page.find('.analog-countdown').exists()).toBe(true);
    expect(page.find('.analog-countdown__inner').exists()).toBe(false);
    expect(page.find('.digital-display').text()).toBe('04:30');
  });
});

describe('TimerPage - hand alert', () => {
  it('announces a raised hand in an <output> status region, with the names', async () => {
    const { default: TimerPage } = await import('../TimerPage.vue');
    wrapper = mount(TimerPage);
    timerData.value = runningPart({
      handAlertActive: true,
      handAlertNames: ['Ann', 'Bob'],
    });
    await nextTick();
    await nextTick();

    const alert = wrapper.find('output.hand-alert');
    expect(alert.exists()).toBe(true);
    expect(alert.attributes('aria-live')).toBe('polite');
    expect(alert.find('.hand-alert__names').text()).toBe('Ann · Bob');
  });
});
