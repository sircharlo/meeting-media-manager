import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { LIQUID_DONE_HOLD_MS } from 'src/utils/liquid-motion';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import DialogDownloadProgress from '../DialogDownloadProgress.vue';

installQuasarPlugin();
installPinia();

const mountCard = (loading = false) =>
  mount(DialogDownloadProgress, {
    global: {
      // Shows and hides at once, without Quasar's height animation.
      stubs: { QSlideTransition: { template: '<div><slot /></div>' } },
    },
    props: { loading, progressCategory: 'study-bible' },
  });

beforeEach(() => {
  useCurrentStateStore().downloadProgress = {};
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DialogDownloadProgress', () => {
  it("fills with its own category's downloads, by size", () => {
    useCurrentStateStore().downloadProgress = {
      a: {
        filename: 'a.mp4',
        loaded: 25,
        progressCategory: 'study-bible',
        total: 100,
      },
      b: {
        filename: 'b.mp4',
        loaded: 0,
        progressCategory: 'publication-media',
        total: 100,
      },
    };

    const wrapper = mountCard();

    expect(wrapper.find('.liquid-fill').exists()).toBe(true);
    expect(wrapper.find('progress').attributes('value')).toBe('25');
    expect(wrapper.find('.q-spinner').exists()).toBe(false);
  });

  it('keeps a spinner while the size of what loads is unknown', () => {
    const wrapper = mountCard(true);

    expect(wrapper.find('.q-spinner').exists()).toBe(true);
    expect(wrapper.find('.liquid-fill').exists()).toBe(false);
  });

  it('stays up, full and green, for a moment once everything is in', async () => {
    vi.useFakeTimers();
    const currentState = useCurrentStateStore();
    currentState.downloadProgress = {
      a: {
        filename: 'a.mp4',
        loaded: 90,
        progressCategory: 'study-bible',
        total: 100,
      },
    };
    const wrapper = mountCard();

    currentState.downloadProgress.a = {
      complete: true,
      filename: 'a.mp4',
      progressCategory: 'study-bible',
      total: 100,
    };
    await nextTick();

    expect(wrapper.find('.done-check').exists()).toBe(true);
    expect(wrapper.find('progress').attributes('value')).toBe('100');

    await vi.advanceTimersByTimeAsync(LIQUID_DONE_HOLD_MS);

    expect(wrapper.find('.download-progress').exists()).toBe(false);
  });
});
