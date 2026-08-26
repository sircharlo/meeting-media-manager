import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { useDemoModeStore } from 'stores/demo-mode';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import HeaderBase from '../header/HeaderBase.vue';

installQuasarPlugin();
installPinia();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ component: { template: '<div />' }, path: '/' }],
});

describe('HeaderBase Component', () => {
  const mountHeader = () =>
    mount(HeaderBase, {
      global: {
        plugins: [router],
        stubs: { DialogAbout: true },
      },
    });

  it('shows the demo-mode badge while demo mode is active and hides it when disabled', async () => {
    const demoMode = useDemoModeStore();
    const wrapper = mountHeader();

    // Launched without M3_DEMO_MODE and demo store untouched: no badge.
    expect(wrapper.text()).not.toContain('Demo mode');

    // Runtime enable (e.g. via the dev-only Demo menu) shows the badge.
    demoMode.enabled = true;
    await nextTick();
    expect(wrapper.text()).toContain('Demo mode');

    // Disabling demo mode hides it again.
    demoMode.enabled = false;
    await nextTick();
    expect(wrapper.text()).not.toContain('Demo mode');
  });

  it('shows the simulated meeting stage and virtual clock in the status chip', async () => {
    const demoMode = useDemoModeStore();
    const wrapper = mountHeader();

    demoMode.enabled = true;
    await nextTick();
    // The chip renders "Demo mode · <stage> · <virtual clock>" — with the
    // stage at 'reset', the label is 'Idle', and the clock as HH:MM
    // (text() collapses the chip's inner spacing, and the locale may add
    // an a.m./p.m. suffix, so assert on the pieces).
    expect(wrapper.text()).toContain('Demo mode');
    expect(wrapper.text()).toContain('Idle');
    expect(wrapper.text()).toMatch(/\d{1,2}:\d{2}/);

    // A dev-menu stage jump updates the label live.
    demoMode.stage = 'pre-meeting';
    await nextTick();
    expect(wrapper.text()).toContain('Pre-meeting');

    wrapper.unmount();
  });
});
