import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import * as api from 'src/utils/api';
import { describe, expect, it, vi } from 'vitest';

import AnnouncementBanner from './../AnnouncementBanner.vue';

installQuasarPlugin();
installPinia();

describe('Announcement Banner', () => {
  it('should mount correctly', async () => {
    // Stub the mounted-time network calls so no real request is left
    // in-flight against happy-dom's fetch when this test file tears down.
    vi.spyOn(api, 'fetchAnnouncements').mockResolvedValueOnce([]);
    vi.spyOn(api, 'fetchLatestVersion').mockResolvedValueOnce('1.2.3');

    const wrapper = mount(AnnouncementBanner, {});
    expect(wrapper.vm.version).toBe('1.2.3');
    await flushPromises();
  });
});
