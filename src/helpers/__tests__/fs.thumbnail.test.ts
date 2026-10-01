import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('getThumbnailUrl', () => {
  beforeEach(() => {
    // helpers/fs destructures electronApi.fs at import time, so spies must
    // be in place before a fresh import.
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
