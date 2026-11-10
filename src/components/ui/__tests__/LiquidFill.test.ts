import { mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LiquidFill from '../LiquidFill.vue';

installPinia();

afterEach(() => {
  vi.useRealTimers();
});

describe('LiquidFill', () => {
  it('reports how far each new value moved the progress', async () => {
    const wrapper = mount(LiquidFill, { props: { percent: 0 } });

    await wrapper.setProps({ percent: 30 });
    await wrapper.setProps({ percent: 50 });

    expect(wrapper.emitted('report')).toEqual([[30], [20]]);
  });

  it('never reports a step backwards for a download', async () => {
    const wrapper = mount(LiquidFill, { props: { percent: 40 } });

    await wrapper.setProps({ percent: 39.5 });

    expect(wrapper.emitted('report')).toEqual([[40], [0]]);
  });

  it('starts a steady liquid where it is, then moves in exact steps', async () => {
    const wrapper = mount(LiquidFill, { props: { percent: 20, steady: true } });

    expect(wrapper.emitted('report')).toBeUndefined();

    await wrapper.setProps({ percent: 50 });

    expect(wrapper.emitted('report')).toEqual([[30]]);
  });

  it('shows a steady value as it is, frame after frame', async () => {
    vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] });
    const wrapper = mount(LiquidFill, { props: { percent: 40, steady: true } });

    await vi.advanceTimersByTimeAsync(100);

    expect(wrapper.emitted('frame')?.at(-1)).toEqual([40, false]);
  });

  it('shows a finished liquid full', async () => {
    vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] });
    const wrapper = mount(LiquidFill, { props: { percent: 60 } });

    await wrapper.setProps({ done: true });
    await vi.advanceTimersByTimeAsync(100);

    expect(wrapper.emitted('frame')?.at(-1)).toEqual([100, false]);
    expect(wrapper.classes()).toContain('liquid-fill--done');
  });

  it('draws its outline into a clip path when asked to', () => {
    const wrapper = mount(LiquidFill, {
      props: { clipId: 'ink-test', percent: 10 },
    });

    expect(wrapper.find('clipPath#ink-test path').exists()).toBe(true);
  });

  it('is hidden from assistive technology', () => {
    const wrapper = mount(LiquidFill, { props: { percent: 10 } });

    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });
});
