import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { afterEach, describe, expect, it } from 'vitest';

import MediaItem from '../media/MediaItem.vue';

installQuasarPlugin();
installPinia();

afterEach(() => {
  document.body.innerHTML = '';
});

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

  it('uses the music note fallback for audio without thumbnail artwork', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: {
          duration: 120,
          fileUrl: 'file:///C:/media/song.mp3',
          isAudio: true,
          title: 'No Artwork',
          type: 'media',
          uniqueId: 'audio-no-artwork-1',
        },
        repeat: false,
      },
    });

    expect(wrapper.find('.media-audio-thumbnail-fallback').exists()).toBe(true);
    expect(
      wrapper.find('.media-audio-thumbnail-fallback .q-icon').exists(),
    ).toBe(true);
  });

  it('uses thumbnail artwork for audio when available', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: {
          duration: 120,
          fileUrl: 'file:///C:/media/song.mp3',
          isAudio: true,
          thumbnailUrl: 'file:///C:/media/song.jpg',
          title: 'With Artwork',
          type: 'media',
          uniqueId: 'audio-with-artwork-1',
        },
        repeat: false,
      },
    });

    expect(wrapper.find('.media-audio-thumbnail-fallback').exists()).toBe(
      false,
    );
    expect(wrapper.findComponent({ name: 'QImg' }).exists()).toBe(true);
  });

  it('ignores timestamp-only audio thumbnail values', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: {
          duration: 120,
          fileUrl: 'file:///C:/media/song.mp3',
          isAudio: true,
          thumbnailUrl: '?timestamp=1781369385826',
          title: 'Timestamp Only Artwork',
          type: 'media',
          uniqueId: 'audio-timestamp-only-artwork-1',
        },
        repeat: false,
      },
    });

    expect(wrapper.find('.media-audio-thumbnail-fallback').exists()).toBe(true);
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

  it('offers alternate-audio video playback for exactly two compatible selected items', () => {
    const videoMedia = {
      fileUrl: 'file:///C:/media/display.mp4',
      isVideo: true,
      title: 'Display Video',
      type: 'media' as const,
      uniqueId: 'display-video-1',
    };
    const audioMedia = {
      fileUrl: 'file:///C:/media/audio.mp3',
      isAudio: true,
      title: 'Audio Track',
      type: 'media' as const,
      uniqueId: 'audio-track-1',
    };
    const currentState = useCurrentStateStore();
    const jwStore = useJwStore();

    currentState.currentCongregation = 'test-congregation';
    currentState.selectedDate = '2026/06/13';
    jwStore.lookupPeriod = {
      'test-congregation': [
        {
          date: new Date('2026-06-13T12:00:00'),
          mediaSections: [
            {
              config: { uniqueId: 'section-1' },
              items: [videoMedia, audioMedia],
            },
          ],
          status: null,
        },
      ],
    } as typeof jwStore.lookupPeriod;

    const wrapper = mount(MediaItem, {
      global: {
        stubs: {
          QMenu: { template: '<div><slot /></div>' },
        },
      },
      props: {
        media: videoMedia,
        repeat: false,
        selectedMediaItems: [videoMedia.uniqueId, audioMedia.uniqueId],
      },
    });

    expect(wrapper.text()).toContain('Play video with alternate audio');
  });
});
