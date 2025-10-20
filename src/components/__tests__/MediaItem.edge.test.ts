import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it } from 'vitest';

import MediaItem from '../media/MediaItem.vue';

installQuasarPlugin();
installPinia();

describe('MediaItem component resilience - edge cases', () => {
  it('renders visual fallback when file URL is not local (unsupported/remote extension)', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: {
          fileUrl: 'https://example.com/file.xyz',
          isImage: false,
          isVideo: false,
          title: 'Unsupported XYZ',
          type: 'media',
          uniqueId: 'unsupported-1',
        },
        repeat: false,
      },
    });

    // The thumbnail container dims when not a local file URL
    const container = wrapper.find('.bg-black');
    expect(container.exists()).toBe(true);
    expect(container.attributes('style') || '').toContain('opacity: 0.64');
  });

  it('handles missing thumbnail/metadata gracefully (shows missing explain)', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: {
          // missing thumbnailUrl and duration
          fileUrl: '',
          title: 'No Metadata',
          type: 'media',
          uniqueId: 'no-meta-1',
        },
        repeat: false,
      },
    });

    // Not a local file URL -> dimmed preview
    const container = wrapper.find('.bg-black');
    expect(container.exists()).toBe(true);
    expect(container.attributes('style') || '').toContain('opacity: 0.64');

    // Also shows an explanatory caption for missing media
    const caption = wrapper.find('.text-caption');
    expect(caption.exists()).toBe(true);
  });

  it('trims/ellipsizes long filenames without layout overflow', () => {
    const longTitle = Array.from(
      { length: 50 },
      (_, i) => `Very Long Title Part ${i}`,
    ).join(' ');

    const wrapper = mount(MediaItem, {
      props: {
        media: {
          fileUrl: 'file:///C:/media/image.jpg',
          isImage: true,
          title: longTitle,
          type: 'media',
          uniqueId: 'long-title-1',
        },
        repeat: false,
      },
    });

    // Find the title container and verify it applies ellipsis classes
    // On wide screens with spaces, component uses 'ellipsis-3-lines'
    const ellipsisish = wrapper.findAll('div').some((d) => {
      const cls = d.classes();
      return cls.includes('ellipsis') || cls.includes('ellipsis-3-lines');
    });
    expect(ellipsisish).toBe(true);
  });
});
