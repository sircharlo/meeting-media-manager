import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { flushPromises, mount } from '@vue/test-utils';
import {
  announcements as mixedAnnouncements,
  validAnnouncements,
} from 'app/test/vitest/mocks/github';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import * as api from 'src/utils/api';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AnnouncementBanner from './../AnnouncementBanner.vue';

installQuasarPlugin();
installPinia();

describe('AnnouncementBanner resilience - skeletons', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('ignores malformed announcements', async () => {
    vi.spyOn(api, 'fetchAnnouncements').mockResolvedValueOnce(
      mixedAnnouncements,
    );

    const store = useCurrentStateStore();
    store.currentCongregation = 'test-cong';

    const wrapper = mount(AnnouncementBanner);
    await flushPromises();

    // Malformed inputs from invalidAnnouncements should not render
    const text = wrapper.text();
    expect(text).not.toContain('Message without id');
    // Empty message would be filtered out and not appear
    expect(text).not.toContain('message-without-message');
  });

  it('respects time-bound visibility if applicable', async () => {
    // Current app version is 1.2.3 (see AnnouncementBanner.test.ts)
    // So announcements with maxVersion 1.2.2 or minVersion 1.2.4 should be hidden
    vi.spyOn(api, 'fetchAnnouncements').mockResolvedValueOnce(
      validAnnouncements,
    );

    const store = useCurrentStateStore();
    store.currentCongregation = 'test-cong';

    const wrapper = mount(AnnouncementBanner);
    await flushPromises();

    const text = wrapper.text();
    expect(text).not.toContain('Message for past releases');
    expect(text).not.toContain('Message for future releases');
    // The generic "all" message should still be visible
    expect(text).toContain('Message for all users');
  });
});
