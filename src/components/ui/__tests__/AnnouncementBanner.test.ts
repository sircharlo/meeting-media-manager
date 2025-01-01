import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AnnouncementBanner from './../AnnouncementBanner.vue';

installQuasarPlugin();

describe('Announcement Banner', () => {
  it('should mount correctly', async () => {
    const wrapper = mount(AnnouncementBanner, {});

    // @ts-expect-error clickCount is not in the component
    expect(wrapper.vm.version).toBe('1.2.3');
  });
});
