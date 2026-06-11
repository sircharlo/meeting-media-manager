import type { MediaSectionWithConfig } from 'src/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const files = new Map<string, string>();
const writes = new Map<string, string>();
const hideFileOnWindowsMock = vi.fn();

const toPath = (fileUrl: string) => fileUrl.replace('file://', '');

describe('watched media layout persistence', () => {
  beforeEach(() => {
    vi.resetModules();
    files.clear();
    writes.clear();
    hideFileOnWindowsMock.mockResolvedValue(undefined);

    vi.stubGlobal('electronApi', {
      basename: (value: string) => value.split('/').pop() ?? value,
      dirname: (value: string) => value.split('/').slice(0, -1).join('/'),
      fileUrlToPath: toPath,
      fs: {
        exists: vi.fn(async (path: string) => files.has(path)),
        readFile: vi.fn(async (path: string) => files.get(path) ?? ''),
        writeFile: vi.fn(async (path: string, content: string) => {
          files.set(path, content);
          writes.set(path, content);
        }),
      },
      hideFileOnWindows: hideFileOnWindowsMock,
      join: (...parts: string[]) => parts.join('/'),
      PLATFORM: 'linux',
    });
  });

  it('saves watched media order relative to dynamic media in the same section', async () => {
    const { saveWatchedMediaLayout } = await import('../media-sections');
    const mediaSections: MediaSectionWithConfig[] = [
      {
        config: { uniqueId: 'tgw' },
        items: [
          {
            sortOrderOriginal: 10,
            source: 'dynamic',
            title: 'Opening dynamic item',
            type: 'media',
            uniqueId: 'dynamic-1',
          },
          {
            fileUrl: 'file:///watched/2026-06-11/local-video.mp4',
            sortOrderOriginal: Number.MAX_SAFE_INTEGER,
            source: 'watched',
            title: 'Local video',
            type: 'media',
            uniqueId: 'watched-1',
          },
          {
            sortOrderOriginal: 20,
            source: 'dynamic',
            title: 'Next dynamic item',
            type: 'media',
            uniqueId: 'dynamic-2',
          },
        ],
      },
      {
        config: { uniqueId: 'lac' },
        items: [
          {
            fileUrl: 'file:///watched/2026-06-11/local-image.jpg',
            sortOrderOriginal: Number.MAX_SAFE_INTEGER,
            source: 'watched',
            title: 'Local image',
            type: 'media',
            uniqueId: 'watched-2',
          },
          {
            sortOrderOriginal: 30,
            source: 'dynamic',
            title: 'Later dynamic item',
            type: 'media',
            uniqueId: 'dynamic-3',
          },
        ],
      },
    ];

    await saveWatchedMediaLayout(mediaSections);

    const saved = JSON.parse(
      writes.get('/watched/2026-06-11/.section-order.json') ?? '{}',
    );

    expect(saved).toEqual({
      'local-image.jpg': { order: 29, section: 'lac' },
      'local-video.mp4': { order: 15, section: 'tgw' },
    });
    expect(hideFileOnWindowsMock).not.toHaveBeenCalled();
  });

  it('hides the section order file on Windows after saving watched media order', async () => {
    vi.stubGlobal('electronApi', {
      ...globalThis.electronApi,
      PLATFORM: 'win32',
    });

    const { saveWatchedMediaLayout } = await import('../media-sections');
    const mediaSections: MediaSectionWithConfig[] = [
      {
        config: { uniqueId: 'tgw' },
        items: [
          {
            fileUrl: 'file:///watched/2026-06-11/local-video.mp4',
            sortOrderOriginal: Number.MAX_SAFE_INTEGER,
            source: 'watched',
            title: 'Local video',
            type: 'media',
            uniqueId: 'watched-1',
          },
        ],
      },
    ];

    await saveWatchedMediaLayout(mediaSections);

    expect(hideFileOnWindowsMock).toHaveBeenCalledWith(
      '/watched/2026-06-11/.section-order.json',
    );
  });
});
