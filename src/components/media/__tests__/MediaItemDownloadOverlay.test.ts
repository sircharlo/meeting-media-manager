import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { LIQUID_DONE_HOLD_MS } from 'src/utils/liquid-motion';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MediaItemDownloadOverlay from '../MediaItemDownloadOverlay.vue';

installQuasarPlugin();
installPinia();

afterEach(() => {
  vi.useRealTimers();
});

const downloading = { filename: 'song.mp4', loaded: 25, total: 100 };

describe('MediaItemDownloadOverlay', () => {
  it('fills the thumbnail while its file downloads', () => {
    const wrapper = mount(MediaItemDownloadOverlay, {
      props: { progress: downloading },
    });

    expect(wrapper.find('.media-download .liquid-fill').exists()).toBe(true);
    expect(wrapper.find('progress').attributes('value')).toBe('25');
  });

  it.each([
    ['without a download', undefined],
    ['when the size is unknown', { filename: 'song.mp4', loaded: 25 }],
    ['when it failed', { error: true, filename: 'song.mp4', total: 100 }],
    ['when it was already there', { complete: true, filename: 'a', total: 1 }],
  ])('shows nothing %s', (_, progress) => {
    const wrapper = mount(MediaItemDownloadOverlay, { props: { progress } });

    expect(wrapper.find('.media-download').exists()).toBe(false);
  });

  it('shows a file that just arrived, full and green, then gets out of the way', async () => {
    vi.useFakeTimers();
    const wrapper = mount(MediaItemDownloadOverlay, {
      props: { progress: downloading },
    });

    await wrapper.setProps({
      progress: { complete: true, filename: 'song.mp4', total: 100 },
    });

    expect(wrapper.find('.media-download--done').exists()).toBe(true);
    expect(wrapper.find('progress').attributes('value')).toBe('100');
    expect(wrapper.find('.done-check').exists()).toBe(true);

    await vi.advanceTimersByTimeAsync(LIQUID_DONE_HOLD_MS);

    expect(wrapper.find('.media-download--done').exists()).toBe(false);
  });
});
