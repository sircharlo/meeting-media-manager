import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it, vi } from 'vitest';

import UpdateProgressToast from './../UpdateProgressToast.vue';

installQuasarPlugin();
installPinia();

const progress = {
  bytesPerSecond: 1_000_000,
  delta: 0,
  percent: 42,
  total: 90_000_000,
  transferred: 37_800_000,
};

const buttonWithLabel = (wrapper: ReturnType<typeof mount>, label: RegExp) =>
  wrapper.findAll('button').find((button) => label.test(button.text()));

describe('UpdateProgressToast', () => {
  it('says it is preparing until the first progress report', () => {
    const wrapper = mount(UpdateProgressToast, {
      props: { phase: 'downloading' },
    });

    expect(wrapper.text()).toContain('Downloading update');
    expect(wrapper.text()).toContain('Preparing to download');
  });

  it('says it is waiting when the reports stop arriving, until one lands', async () => {
    vi.useFakeTimers({
      toFake: ['performance', 'requestAnimationFrame', 'setTimeout'],
    });

    try {
      const wrapper = mount(UpdateProgressToast, {
        props: { phase: 'downloading', progress },
      });
      const caption = wrapper.find('.update-toast__caption');

      await vi.advanceTimersByTimeAsync(1000);
      expect(caption.text()).toContain('MB');
      expect(caption.text()).not.toContain('Waiting');

      await vi.advanceTimersByTimeAsync(4000);
      expect(caption.text()).toContain('Waiting on the network');

      await wrapper.setProps({ progress: { ...progress, percent: 60 } });
      await vi.advanceTimersByTimeAsync(100);
      expect(caption.text()).not.toContain('Waiting');
    } finally {
      vi.useRealTimers();
    }
  });

  it('exposes the reported percentage to assistive technology', async () => {
    const wrapper = mount(UpdateProgressToast, {
      props: { phase: 'downloading', progress },
    });

    expect(wrapper.find('progress').attributes('value')).toBe('42');

    await wrapper.setProps({ progress: { ...progress, percent: 77.6 } });

    expect(wrapper.find('progress').attributes('value')).toBe('78');
  });

  it('keeps the finished state short for a normal update', () => {
    const wrapper = mount(UpdateProgressToast, {
      props: {
        phase: 'downloaded',
        versionInfo: { isDowngrade: false, version: '9.8.7' },
      },
    });

    expect(wrapper.text()).toContain('Update ready to install');
    expect(wrapper.text()).not.toContain('downgrade');
  });

  it('warns about a downgrade in the finished state', () => {
    const wrapper = mount(UpdateProgressToast, {
      props: {
        phase: 'downloaded',
        versionInfo: { isDowngrade: true, version: '9.8.7' },
      },
    });

    expect(wrapper.text()).toContain('9.8.7');
    expect(wrapper.text()).toContain('downgrade');
  });

  it('emits install and dismiss from its buttons', async () => {
    const wrapper = mount(UpdateProgressToast, {
      props: { phase: 'downloaded' },
    });

    await buttonWithLabel(wrapper, /quit and install/i)?.trigger('click');
    await wrapper.find('.update-toast__close').trigger('click');

    expect(wrapper.emitted('install')).toHaveLength(1);
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('counts down to installing an update on launch, and can be put off', async () => {
    const wrapper = mount(UpdateProgressToast, {
      props: { installCountdown: 15, phase: 'downloaded' },
    });

    expect(wrapper.text()).toContain('M³ will restart to install it in 15 s');
    expect(buttonWithLabel(wrapper, /quit and install/i)).toBeUndefined();

    await wrapper.setProps({ installCountdown: 3 });
    expect(wrapper.text()).toContain('in 3 s');

    await buttonWithLabel(wrapper, /later/i)?.trigger('click');
    await buttonWithLabel(wrapper, /install now/i)?.trigger('click');

    expect(wrapper.emitted('postpone')).toHaveLength(1);
    expect(wrapper.emitted('install')).toHaveLength(1);
  });

  it('shows no countdown or later button for an ordinary finished download', () => {
    const wrapper = mount(UpdateProgressToast, {
      props: { phase: 'downloaded' },
    });

    expect(wrapper.text()).not.toContain('restart');
    expect(wrapper.text()).not.toContain('permission');
    expect(buttonWithLabel(wrapper, /later/i)).toBeUndefined();
  });

  it('says Windows will ask for permission when installed for all users', () => {
    const wrapper = mount(UpdateProgressToast, {
      props: {
        phase: 'downloaded',
        versionInfo: {
          asksPermission: true,
          isDowngrade: false,
          version: '26.6.2',
        },
      },
    });

    expect(wrapper.text()).toContain(
      'Windows will ask for permission to install it',
    );
    expect(buttonWithLabel(wrapper, /quit and install/i)).toBeDefined();
    expect(buttonWithLabel(wrapper, /later/i)).toBeUndefined();
  });

  it('skips the celebration for an update that was already on disk', async () => {
    const wrapper = mount(UpdateProgressToast, {
      props: { phase: 'downloaded' },
    });
    await flushPromises();

    expect(wrapper.find('.update-toast__confetti').exists()).toBe(false);
    expect(wrapper.find('.update-toast__card--revealed').exists()).toBe(true);
  });

  it('celebrates a download the user watched finish', async () => {
    const wrapper = mount(UpdateProgressToast, {
      props: { phase: 'downloading', progress },
    });

    await wrapper.setProps({ phase: 'downloaded' });

    expect(wrapper.find('.update-toast__confetti').exists()).toBe(true);
  });

  it('does not celebrate when no progress was ever reported', async () => {
    const wrapper = mount(UpdateProgressToast, {
      props: { phase: 'downloading' },
    });

    await wrapper.setProps({ phase: 'downloaded' });

    expect(wrapper.find('.update-toast__confetti').exists()).toBe(false);
  });

  it('stops reserving space above other notifications once it closes', () => {
    const wrapper = mount(UpdateProgressToast, {
      props: { phase: 'downloading' },
    });
    const { style } = document.documentElement;

    expect(style.getPropertyValue('--update-toast-offset')).not.toBe('');

    wrapper.unmount();

    expect(style.getPropertyValue('--update-toast-offset')).toBe('');
  });
});
