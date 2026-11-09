import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('getThumbnailUrl', () => {
  beforeEach(() => {
    // helpers/fs destructures electronApi.fs at import time, so spies must
    // be in place before a fresh import.
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // happy-dom's <video> never loads anything, like a cloud placeholder that
  // never finishes downloading: the thumbnail must be given up on, not
  // waited for forever.
  it('gives up on a video that never loads, and reports nothing', async () => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
    const { fs } = globalThis.electronApi;
    vi.spyOn(fs, 'pathExists').mockImplementation(
      async (path) => !String(path).endsWith('.jpg'),
    );
    const { errorCatcher } = await import('src/helpers/error-catcher');
    const { MEDIA_ELEMENT_TIMEOUT_MS } = await import('src/utils/media');
    const { getThumbnailUrl } = await import('../fs');

    const pending = getThumbnailUrl('C:/media/clip.mp4');
    await vi.advanceTimersByTimeAsync(MEDIA_ELEMENT_TIMEOUT_MS);

    await expect(pending).resolves.toBe('');
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  // MMM-V2-3CF: a media element's 'error' event carries no message of its
  // own, so every failure was reported as "Unknown VideoRef Error".
  it("reports Chromium's reason for a video that fails to load", async () => {
    setActivePinia(createPinia());
    const { fs } = globalThis.electronApi;
    vi.spyOn(fs, 'pathExists').mockImplementation(
      async (path) => !String(path).endsWith('.jpg'),
    );
    const videos: HTMLVideoElement[] = [];
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((
      tagName: string,
      options?: ElementCreationOptions,
    ) => {
      const element = createElement(tagName, options);
      if (element instanceof HTMLVideoElement) videos.push(element);
      return element;
    }) as typeof document.createElement);
    const { errorCatcher } = await import('src/helpers/error-catcher');
    const { getThumbnailUrl } = await import('../fs');

    const pending = getThumbnailUrl('C:/media/clip.avi');
    await vi.waitFor(() => expect(videos).toHaveLength(1));
    await vi.waitFor(() => expect(videos[0]?.getAttribute('src')).toBeTruthy());
    Object.defineProperty(videos[0], 'error', {
      value: { code: 4, message: 'FFmpegDemuxer: open context failed' },
    });
    videos[0]?.dispatchEvent(new Event('error'));

    await expect(pending).resolves.toBe('');
    expect(errorCatcher).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'FFmpegDemuxer: open context failed',
      }),
      expect.anything(),
    );
  });

  // MMM-V2-3G1: the sidecar path used to be built with split('.')[0], which
  // cut a path like C:/Users/first.last/... at the username's dot and tried
  // to write C:/Users/first.jpg.
  it('puts a video thumbnail next to the video even when a folder name contains a dot', async () => {
    const { fs } = globalThis.electronApi;
    const pathExists = vi
      .spyOn(fs, 'pathExists')
      .mockImplementation(async () => true);
    const { getThumbnailUrl } = await import('../fs');

    const url = await getThumbnailUrl(
      'C:/Users/first.last/AppData/Roaming/Meeting Media Manager/video.v2.mp4',
    );

    expect(pathExists).toHaveBeenLastCalledWith(
      'C:/Users/first.last/AppData/Roaming/Meeting Media Manager/video.v2.jpg',
    );
    expect(decodeURI(url)).toContain('first.last/AppData');
    expect(decodeURI(url)).toContain('video.v2.jpg');
  });
});
