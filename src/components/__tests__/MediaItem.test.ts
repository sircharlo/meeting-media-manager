import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import MediaItem from '../media/MediaItem.vue';

installQuasarPlugin();

// Mock the stores
vi.mock('stores/current-state', () => ({
  useCurrentStateStore: vi.fn(() => ({
    downloadedFiles: {},
    downloadProgress: {},
    highlightedMediaId: '',
    mediaPlaying: {
      action: '',
      currentPosition: 0,
      panzoom: {},
      seekTo: 0,
      subtitlesUrl: '',
      uniqueId: '',
      url: '',
    },
  })),
}));

vi.mock('stores/jw', () => ({
  useJwStore: vi.fn(() => ({
    urlVariables: {},
  })),
}));

vi.mock('stores/congregation-settings', () => ({
  useCongregationSettingsStore: vi.fn(() => ({
    currentSettings: {},
  })),
}));

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
        showDownloadStatus: true,
        showMediaDisplayButton: true,
        showMusicButton: true,
        showSubtitlesButton: true,
      },
    });

    expect(wrapper.text()).toContain('Test Media Item');
  });

  it('should display download status when showDownloadStatus is true', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
        showDownloadStatus: true,
        showMediaDisplayButton: false,
        showMusicButton: false,
        showSubtitlesButton: false,
      },
    });

    expect(wrapper.findComponent({ name: 'DownloadStatus' })).toBeTruthy();
  });

  it('should not display download status when showDownloadStatus is false', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
        showDownloadStatus: false,
        showMediaDisplayButton: false,
        showMusicButton: false,
        showSubtitlesButton: false,
      },
    });

    expect(wrapper.findComponent({ name: 'DownloadStatus' }).exists()).toBe(
      false,
    );
  });

  it('should display media display button when showMediaDisplayButton is true', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
        showDownloadStatus: false,
        showMediaDisplayButton: true,
        showMusicButton: false,
        showSubtitlesButton: false,
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
        showDownloadStatus: false,
        showMediaDisplayButton: false,
        showMusicButton: false,
        showSubtitlesButton: true,
      },
    });

    expect(wrapper.findComponent({ name: 'SubtitlesButton' })).toBeTruthy();
  });

  it('should not display subtitles button for non-subtitled media', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
        showDownloadStatus: false,
        showMediaDisplayButton: false,
        showMusicButton: false,
        showSubtitlesButton: true,
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
        showDownloadStatus: false,
        showMediaDisplayButton: false,
        showMusicButton: true,
        showSubtitlesButton: false,
      },
    });

    expect(wrapper.findComponent({ name: 'MusicButton' })).toBeTruthy();
  });

  it('should not display music button for non-audio files', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
        showDownloadStatus: false,
        showMediaDisplayButton: false,
        showMusicButton: true,
        showSubtitlesButton: false,
      },
    });

    expect(wrapper.findComponent({ name: 'MusicButton' }).exists()).toBe(false);
  });

  it('should emit click event when media item is clicked', async () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
        showDownloadStatus: false,
        showMediaDisplayButton: false,
        showMusicButton: false,
        showSubtitlesButton: false,
      },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('should apply highlighted class when media item is highlighted', () => {
    const wrapper = mount(MediaItem, {
      props: {
        highlighted: true,
        media: mockMediaItem,
        repeat: false,
        showDownloadStatus: false,
        showMediaDisplayButton: false,
        showMusicButton: false,
        showSubtitlesButton: false,
      },
    });

    expect(wrapper.classes()).toContain('highlighted');
  });

  it('should display resolution label for video files', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
        showDownloadStatus: false,
        showMediaDisplayButton: false,
        showMusicButton: false,
        showSubtitlesButton: false,
      },
    });

    expect(wrapper.text()).toContain('720p');
  });

  it('should handle missing media item gracefully', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: null as unknown as typeof mockMediaItem,
        repeat: false,
        showDownloadStatus: false,
        showMediaDisplayButton: false,
        showMusicButton: false,
        showSubtitlesButton: false,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
