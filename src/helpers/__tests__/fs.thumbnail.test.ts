import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const noticeUnopenableMedia = vi.fn();
vi.mock('src/helpers/unopenable-media', () => ({
  noticeUnopenableMedia: (...args: unknown[]) =>
    noticeUnopenableMedia(...(args as [])),
}));

/** Fails the thumbnail's hidden <video> of `filepath` with `mediaError`. */
const failThumbnailVideo = async (
  filepath: string,
  mediaError: { code: number; message: string },
) => {
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
  const { getThumbnailUrl } = await import('../fs');

  const pending = getThumbnailUrl(filepath);
  await vi.waitFor(() => expect(videos).toHaveLength(1));
  await vi.waitFor(() => expect(videos[0]?.getAttribute('src')).toBeTruthy());
  Object.defineProperty(videos[0], 'error', { value: mediaError });
  videos[0]?.dispatchEvent(new Event('error'));
  return pending;
};

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
    const { errorCatcher } = await import('src/helpers/error-catcher');
    vi.mocked(errorCatcher).mockClear();
    noticeUnopenableMedia.mockClear();

    const url = await failThumbnailVideo('C:/media/clip.avi', {
      code: 4,
      message: 'MEDIA_ELEMENT_ERROR: Format error',
    });

    expect(url).toBe('');
    expect(errorCatcher).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'MEDIA_ELEMENT_ERROR: Format error',
      }),
      expect.anything(),
    );
    expect(noticeUnopenableMedia).not.toHaveBeenCalled();
  });

  // MMM-V2-3CF: MP4s Chromium can't open at all, most likely cut short by a
  // download or copy that didn't finish. The file's problem, not M³'s.
  it('tells the user, not Sentry, about a video Chromium cannot open', async () => {
    const { errorCatcher } = await import('src/helpers/error-catcher');
    vi.mocked(errorCatcher).mockClear();
    noticeUnopenableMedia.mockClear();
    const message =
      'PipelineStatus::DEMUXER_ERROR_COULD_NOT_OPEN: FFmpegDemuxer: open context failed';

    const url = await failThumbnailVideo('C:/media/2 - Talk.mp4', {
      code: 4,
      message,
    });

    expect(url).toBe('');
    expect(errorCatcher).not.toHaveBeenCalled();
    expect(noticeUnopenableMedia).toHaveBeenCalledWith(
      'C:/media/2 - Talk.mp4',
      message,
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
