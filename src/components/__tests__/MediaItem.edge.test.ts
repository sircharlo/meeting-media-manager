import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { basePath } from 'app/test/vitest/mocks/electronApi';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { ensureFile, writeFile } from 'fs-extra';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { join } from 'upath';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('MediaItem playback resilience while offline', () => {
  const CONGREGATION_ID = 'offline-test-cong';

  const enableMediaDisplayButton = () => {
    const congregationSettingsStore = useCongregationSettingsStore();
    congregationSettingsStore.congregations = {
      [CONGREGATION_ID]: {
        ...defaultSettings,
        enableMediaDisplayButton: true,
      },
    };
    useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  };

  // mediaPlaying is global store state (one "currently playing" item
  // app-wide) shared across every test in this file via the same testing
  // Pinia instance - reset it so a previous test's resolved url can't leak
  // into the next one's assertions.
  beforeEach(() => {
    useCurrentStateStore().mediaPlaying = {
      action: '',
      currentPosition: 0,
      currentPositionUpdatedAt: 0,
      pan: { x: 0, y: 0 },
      playbackConfirmedToken: 0,
      playbackRate: 1,
      playToken: 0,
      seekTo: 0,
      shouldLoop: false,
      slideshowAudioUrl: '',
      subtitlesUrl: '',
      uniqueId: '',
      url: '',
      zoom: 1,
    } as ReturnType<typeof useCurrentStateStore>['mediaPlaying'];
  });

  it('resolves playback to the local file, not the remote stream, while offline', async () => {
    enableMediaDisplayButton();
    const currentState = useCurrentStateStore();
    currentState.online = false;

    const filePath = join(basePath, 'media-item-edge', 'local-video.mp4');
    const contents = Buffer.from('x'.repeat(2048));
    await ensureFile(filePath);
    await writeFile(filePath, contents);

    const media = {
      filesize: contents.byteLength,
      fileUrl: `file://${filePath.replaceAll('\\', '/')}`,
      isVideo: true,
      streamUrl: 'https://cdn.example.com/should-not-be-used.mp4',
      title: 'Locally cached video',
      type: 'media' as const,
      uniqueId: 'offline-local-video-1',
    };

    const wrapper = mount(MediaItem, { props: { media, repeat: false } });
    // onMounted's updateLocalFile() confirms the file is local before the
    // play button becomes clickable.
    await flushPromises();

    const playButton = wrapper.find('button.bg-primary');
    expect(playButton.exists()).toBe(true);
    await playButton.trigger('click');

    // setMediaPlaying's own updateLocalFile() re-check involves real disk
    // I/O (fs-extra against the test sandbox), which can take more than one
    // flushPromises() tick to settle - poll instead of guessing a fixed
    // number of flushes.
    await vi.waitFor(() => {
      expect(currentState.mediaPlaying.url).toBe(media.fileUrl);
    });
    expect(currentState.mediaPlaying.url).not.toBe(media.streamUrl);

    // Left mounted, this instance's background local-file poll keeps
    // running and can interfere with later tests sharing the same Pinia
    // state (mediaPlaying is global, one "currently playing" item app-wide).
    wrapper.unmount();
  });

  it('does not change the resolved playback url when connectivity flips mid-playback', async () => {
    enableMediaDisplayButton();
    const currentState = useCurrentStateStore();
    currentState.online = true;

    const filePath = join(basePath, 'media-item-edge', 'stable-video.mp4');
    const contents = Buffer.from('y'.repeat(4096));
    await ensureFile(filePath);
    await writeFile(filePath, contents);

    const media = {
      filesize: contents.byteLength,
      fileUrl: `file://${filePath.replaceAll('\\', '/')}`,
      isVideo: true,
      streamUrl: 'https://cdn.example.com/should-not-be-used.mp4',
      title: 'Locally cached video',
      type: 'media' as const,
      uniqueId: 'offline-stable-video-1',
    };

    const wrapper = mount(MediaItem, { props: { media, repeat: false } });
    await flushPromises();

    const playButton = wrapper.find('button.bg-primary');
    await playButton.trigger('click');
    await vi.waitFor(() => {
      expect(currentState.mediaPlaying.url).toBe(media.fileUrl);
    });

    const resolvedUrl = currentState.mediaPlaying.url;

    // No online/navigator.onLine watcher touches the already-resolved
    // playback url - flipping connectivity mid-playback must not change it.
    currentState.online = false;
    await flushPromises();
    currentState.online = true;
    await flushPromises();

    expect(currentState.mediaPlaying.url).toBe(resolvedUrl);
    wrapper.unmount();
  });
});
