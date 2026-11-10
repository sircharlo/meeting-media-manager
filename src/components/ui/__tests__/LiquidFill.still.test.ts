import { mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';

import LiquidFill from '../LiquidFill.vue';

// The user asked for reduced motion.
vi.mock('src/composables/useMotionMode', () => ({
  useMotionMode: () => computed(() => 'still'),
}));

installPinia();

afterEach(() => {
  vi.useRealTimers();
});

describe('LiquidFill with reduced motion', () => {
  it('lies flat while it sloshes, with only its opacity pulsing', async () => {
    vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] });
    const wrapper = mount(LiquidFill, {
      props: { percent: 0, sloshing: true },
    });

    await vi.advanceTimersByTimeAsync(400);

    const opacity = Number(wrapper.element.style.opacity);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it('stops pulsing, and fills a bar straight away, once it knows', async () => {
    vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] });
    const wrapper = mount(LiquidFill, {
      props: { percent: 0, sloshing: true },
    });
    await vi.advanceTimersByTimeAsync(400);

    await wrapper.setProps({ percent: 25, sloshing: false });
    await vi.advanceTimersByTimeAsync(50);

    expect(wrapper.element.style.opacity).toBe('');
    expect(wrapper.emitted('report')).toEqual([[25]]);
  });
});
