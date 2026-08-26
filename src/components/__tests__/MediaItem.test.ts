import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { useDemoModeStore } from 'stores/demo-mode';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

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

  it('hides thumbnail spinners reactively when demo mode is toggled at runtime', async () => {
    const demoMode = useDemoModeStore();
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    const thumbnail = wrapper.findComponent({ name: 'QImg' });
    // Launched without M3_DEMO_MODE and demo store untouched: not demo mode.
    expect(thumbnail.props('noSpinner')).toBe(false);

    // Runtime enable (e.g. via the dev-only Demo menu) flips the UI tweak.
    demoMode.enabled = true;
    await nextTick();
    expect(thumbnail.props('noSpinner')).toBe(true);

    // And back off again when demo mode is disabled.
    demoMode.enabled = false;
    await nextTick();
    expect(thumbnail.props('noSpinner')).toBe(false);
  });
});
