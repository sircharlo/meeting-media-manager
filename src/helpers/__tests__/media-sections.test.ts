import type { MediaSectionWithConfig } from 'src/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const files = new Map<string, string>();
const writes = new Map<string, string>();
const existsMock = vi.fn();
const hideFileOnWindowsMock = vi.fn();
const readJsonMock = vi.fn();
const showFileOnWindowsMock = vi.fn();
const writeFileMock = vi.fn();

const toPath = (fileUrl: string) => fileUrl.replace('file://', '');

describe('watched media layout persistence', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    files.clear();
    writes.clear();
    existsMock.mockImplementation(async (path: string) => files.has(path));
    hideFileOnWindowsMock.mockResolvedValue(undefined);
    readJsonMock.mockImplementation(async (path: string) =>
      JSON.parse(files.get(path) ?? '{}'),
    );
    showFileOnWindowsMock.mockResolvedValue(undefined);
    writeFileMock.mockImplementation(async (path: string, content: string) => {
      files.set(path, content);
      writes.set(path, content);
    });

    vi.stubGlobal('electronApi', {
      basename: (value: string) => value.split('/').pop() ?? value,
      dirname: (value: string) => value.split('/').slice(0, -1).join('/'),
      fileUrlToPath: toPath,
      fs: {
        exists: existsMock,
        readJSON: readJsonMock,
        writeFile: writeFileMock,
      },
      hideFileOnWindows: hideFileOnWindowsMock,
      join: (...parts: string[]) => parts.join('/'),
      PLATFORM: 'linux',
      showFileOnWindows: showFileOnWindowsMock,
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
    expect(showFileOnWindowsMock).toHaveBeenCalledWith(
      '/watched/2026-06-11/.section-order.json',
    );
    expect(hideFileOnWindowsMock).toHaveBeenCalledWith(
      '/watched/2026-06-11/.section-order.json',
    );
    expect(showFileOnWindowsMock.mock.invocationCallOrder[0]).toBeLessThan(
      writeFileMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(writeFileMock.mock.invocationCallOrder[0]).toBeLessThan(
      hideFileOnWindowsMock.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('shows and hides the section order file around reads and writes', async () => {
    files.set(
      '/watched/2026-06-11/.section-order.json',
      JSON.stringify({
        'existing.png': { order: 2, section: 'pt' },
      }),
    );
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

    const sectionOrderFilePath = '/watched/2026-06-11/.section-order.json';
    expect(showFileOnWindowsMock).toHaveBeenCalledTimes(2);
    expect(hideFileOnWindowsMock).toHaveBeenCalledTimes(2);
    expect(showFileOnWindowsMock).toHaveBeenNthCalledWith(
      1,
      sectionOrderFilePath,
    );
    expect(hideFileOnWindowsMock).toHaveBeenNthCalledWith(
      1,
      sectionOrderFilePath,
    );
    expect(showFileOnWindowsMock).toHaveBeenNthCalledWith(
      2,
      sectionOrderFilePath,
    );
    expect(hideFileOnWindowsMock).toHaveBeenNthCalledWith(
      2,
      sectionOrderFilePath,
    );
    expect(readJsonMock).toHaveBeenCalledWith(sectionOrderFilePath);
    expect(writeFileMock).toHaveBeenCalledWith(
      '/watched/2026-06-11/.section-order.json',
      JSON.stringify(
        {
          'existing.png': { order: 2, section: 'pt' },
          'local-video.mp4': { order: 0, section: 'tgw' },
        },
        null,
        2,
      ),
      'utf-8',
    );
    expect(showFileOnWindowsMock.mock.invocationCallOrder[0]).toBeLessThan(
      readJsonMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(readJsonMock.mock.invocationCallOrder[0]).toBeLessThan(
      hideFileOnWindowsMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(hideFileOnWindowsMock.mock.invocationCallOrder[0]).toBeLessThan(
      showFileOnWindowsMock.mock.invocationCallOrder[1] ?? 0,
    );
    expect(showFileOnWindowsMock.mock.invocationCallOrder[1]).toBeLessThan(
      writeFileMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(writeFileMock.mock.invocationCallOrder[0]).toBeLessThan(
      hideFileOnWindowsMock.mock.invocationCallOrder[1] ?? 0,
    );
  });
});
