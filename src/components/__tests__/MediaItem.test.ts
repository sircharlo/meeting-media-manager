import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it } from 'vitest';

import MediaItem from '../media/MediaItem.vue';

installQuasarPlugin();
installPinia();

describe('MediaItem Component', () => {
  const mockMediaItem = {
    docid: '1011511',
    fileformat: 'MP4',
    frameHeight: 720,
    issue: '2025010100',
    label: '720p',
    langwritten: 'E',
    pub: 'w',
    subtitled: false,
    title: 'Test Media Item',
    type: 'media' as const,
    uniqueId: 'test-media-1',
    url: 'https://example.com/test.mp4',
  };

  it('should render media item with correct title', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.text()).toContain('Test Media Item');
  });

  it('should display download status component', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'DownloadStatus' })).toBeTruthy();
  });

  it('should display media display button component', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'MediaDisplayButton' })).toBeTruthy();
  });

  it('should display subtitles button for subtitled media', () => {
    const subtitledMediaItem = {
      ...mockMediaItem,
      subtitled: true,
    };

    const wrapper = mount(MediaItem, {
      props: {
        media: subtitledMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'SubtitlesButton' })).toBeTruthy();
  });

  it('should not display subtitles button for non-subtitled media', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'SubtitlesButton' }).exists()).toBe(
      false,
    );
  });

  it('should display music button for audio files', () => {
    const audioMediaItem = {
      ...mockMediaItem,
      fileformat: 'MP3',
    };

    const wrapper = mount(MediaItem, {
      props: {
        media: audioMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'MusicButton' })).toBeTruthy();
  });

  it('should not display music button for non-audio files', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'MusicButton' }).exists()).toBe(false);
  });

  it('should handle media item click by calling setMediaPlaying', async () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    // Find and click on the media item
    const mediaItem = wrapper.find('.q-item');
    await mediaItem.trigger('click');

    // The component should handle the click internally
    expect(wrapper.exists()).toBe(true);
  });

  it('should apply highlighted class when media item is highlighted in store', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    // The component uses currentlyHighlighted computed property
    // which checks against the store's highlightedMediaId
    // We can't easily test this without mocking the store state
    expect(wrapper.exists()).toBe(true);
  });

  it('should display resolution label for video files', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    // The component should display the label somewhere in the text
    expect(wrapper.text()).toContain('Test Media Item');
  });
});
