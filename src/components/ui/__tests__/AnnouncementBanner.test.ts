import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it } from 'vitest';

import AnnouncementBanner from './../AnnouncementBanner.vue';

installQuasarPlugin();
installPinia();

describe('Announcement Banner', () => {
  it('should mount correctly', async () => {
    const wrapper = mount(AnnouncementBanner, {});
    expect(wrapper.vm.version).toBe('1.2.3');
  });
});
