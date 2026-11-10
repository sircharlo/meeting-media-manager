import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { LIQUID_DONE_HOLD_MS } from 'src/utils/liquid-motion';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import DownloadStatus from '../DownloadStatus.vue';

installQuasarPlugin();
installPinia();

const mountButton = async (open = false) => {
  const wrapper = mount(DownloadStatus, { props: { modelValue: open } });
  await flushPromises();
  return wrapper;
};

type Button = Awaited<ReturnType<typeof mountButton>>;

const liquidOf = (wrapper: Button) =>
  wrapper.findComponent({ name: 'LiquidFill' });

// Icons render as their name, as text, in tests.
const iconsNamed = (wrapper: Button, name: string) =>
  wrapper.findAll('.q-icon').filter((icon) => icon.text() === name);

describe('DownloadStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['closed', false],
    ['open', true],
  ])(
    'sloshes, its cloud still showing, while the dates are checked, with its popup %s',
    async (_, open) => {
      useCurrentStateStore().meetingCheckStatus = { 20261113: 'checking' };
      const wrapper = await mountButton(open);

      expect(liquidOf(wrapper).props('sloshing')).toBe(true);
      expect(liquidOf(wrapper).classes('island-liquid--open')).toBe(open);
      expect(iconsNamed(wrapper, 'mmm-cloud')).toHaveLength(2);
      expect(wrapper.find('.liquid-spinner').exists()).toBe(false);
    },
  );

  it('fills up green for a moment when a check finds nothing new, then fades', async () => {
    vi.useFakeTimers();
    const currentState = useCurrentStateStore();
    currentState.meetingCheckStatus = { 20261113: 'checking' };
    const wrapper = await mountButton();

    currentState.meetingCheckStatus = { 20261113: 'complete' };
    await nextTick();

    expect(liquidOf(wrapper).props('done')).toBe(true);
    expect(iconsNamed(wrapper, 'mmm-cloud-done')).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(LIQUID_DONE_HOLD_MS);

    expect(liquidOf(wrapper).exists()).toBe(false);
  });

  it("doesn't celebrate a check that ended with a failed download", async () => {
    const currentState = useCurrentStateStore();
    currentState.meetingCheckStatus = { 20261113: 'checking' };
    const wrapper = await mountButton();

    currentState.downloadProgress = { a: { error: true, filename: 'a.mp4' } };
    currentState.meetingCheckStatus = { 20261113: 'complete' };
    await nextTick();

    expect(liquidOf(wrapper).exists()).toBe(false);
    expect(iconsNamed(wrapper, 'mmm-cloud-error')).toHaveLength(1);
  });
});
