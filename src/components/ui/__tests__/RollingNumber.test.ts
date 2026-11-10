import { mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';

import RollingNumber from '../RollingNumber.vue';

installPinia();

afterEach(() => {
  vi.useRealTimers();
});

const hiddenColumns = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('.rolling-number__digit--hidden').length;

describe('RollingNumber', () => {
  it('hides the leading columns a small number has no use for', () => {
    const wrapper = mount(RollingNumber, { props: { value: 7 } });

    expect(hiddenColumns(wrapper)).toBe(2);
  });

  it('rolls to a new value and opens the columns it needs', async () => {
    vi.useFakeTimers({ toFake: ['performance', 'requestAnimationFrame'] });
    const wrapper = mount(RollingNumber, { props: { value: 7 } });

    await wrapper.setProps({ value: 42 });
    await vi.advanceTimersByTimeAsync(2000);

    expect(hiddenColumns(wrapper)).toBe(1);
  });

  it('shows its suffix', () => {
    const wrapper = mount(RollingNumber, {
      props: { suffix: '%', value: 50 },
    });

    expect(wrapper.find('.rolling-number__suffix').text()).toBe('%');
  });
});
