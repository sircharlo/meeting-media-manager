import type { MediaSectionWithConfig } from 'src/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const files = new Map<string, string>();
const writes = new Map<string, string>();
const pathExistsMock = vi.fn();
const hideFileOnWindowsMock = vi.fn();
const readJsonMock = vi.fn();
const renameMock = vi.fn();
const showFileOnWindowsMock = vi.fn();
const writeFileMock = vi.fn();

const toPath = (fileUrl: string) => fileUrl.replace('file://', '');

vi.mock('boot/i18n', () => ({
  i18n: {
    global: {
      t: (key: string) =>
        ({
          ayfm: 'Apply Yourself to the Field Ministry',
          'circuit-overseer': 'Circuit Overseer',
          lac: 'Living as Christians',
          pt: 'Public talk',
          tgw: "Treasures from God's Word",
          wt: 'Watchtower Study',
        })[key] ?? key,
    },
  },
}));

describe('getExportedFilenamePlacement', () => {
  it('parses the section and item number out of an exported filename', async () => {
    const { getExportedFilenamePlacement } = await import('../media-sections');

    expect(
      getExportedFilenamePlacement('01 Public talk - 01 MTG Start.mp4'),
    ).toEqual({ order: 1001, section: 'pt' });

    expect(
      getExportedFilenamePlacement(
        '02 Watchtower Study - 04 In-home conversation.jpg',
      ),
    ).toEqual({ order: 2004, section: 'wt' });
  });

  it('still returns the parsed order when the section name is unrecognized', async () => {
    const { getExportedFilenamePlacement } = await import('../media-sections');

    expect(
      getExportedFilenamePlacement('05 Some Custom Segment - 02 Foo.mp4'),
    ).toEqual({ order: 5002, section: undefined });
  });

  it('returns null for filenames with no export naming convention', async () => {
    const { getExportedFilenamePlacement } = await import('../media-sections');

    expect(getExportedFilenamePlacement('MTG Start.mp4')).toBeNull();
    expect(getExportedFilenamePlacement('Video1.mp4')).toBeNull();
  });
});

describe('watched media layout persistence', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    files.clear();
    writes.clear();
    pathExistsMock.mockImplementation(async (path: string) => files.has(path));
    hideFileOnWindowsMock.mockResolvedValue(undefined);
    readJsonMock.mockImplementation(async (path: string) =>
      JSON.parse(files.get(path) ?? '{}'),
    );
    showFileOnWindowsMock.mockResolvedValue(undefined);
    writeFileMock.mockImplementation(async (path: string, content: string) => {
      files.set(path, content);
    });
    renameMock.mockImplementation(async (from: string, to: string) => {
      const content = files.get(from) ?? '';
      files.delete(from);
      files.set(to, content);
      writes.set(to, content);
    });

    vi.stubGlobal('electronApi', {
      basename: (value: string) => value.split('/').pop() ?? value,
      dirname: (value: string) => value.split('/').slice(0, -1).join('/'),
      fileUrlToPath: toPath,
      fs: {
        pathExists: pathExistsMock,
        readJSON: readJsonMock,
        rename: renameMock,
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
    // Write goes to a temp path first, then gets renamed into place.
    expect(writeFileMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\/watched\/2026-06-11\/\.section-order\.json\.\d+\.tmp$/,
      ),
      expect.any(String),
      'utf-8',
    );
    expect(renameMock).toHaveBeenCalledWith(
      writeFileMock.mock.calls[0]?.[0],
      '/watched/2026-06-11/.section-order.json',
    );
    expect(hideFileOnWindowsMock).toHaveBeenCalledWith(
      '/watched/2026-06-11/.section-order.json',
    );
    expect(writeFileMock.mock.invocationCallOrder[0]).toBeLessThan(
      renameMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(renameMock.mock.invocationCallOrder[0]).toBeLessThan(
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
    // showFileOnWindows only guards the read now; the write goes to a
    // fresh temp path (never hidden) and only hides the final file after
    // the rename.
    expect(showFileOnWindowsMock).toHaveBeenCalledTimes(1);
    expect(hideFileOnWindowsMock).toHaveBeenCalledTimes(2);
    expect(showFileOnWindowsMock).toHaveBeenNthCalledWith(
      1,
      sectionOrderFilePath,
    );
    expect(hideFileOnWindowsMock).toHaveBeenNthCalledWith(
      1,
      sectionOrderFilePath,
    );
    expect(hideFileOnWindowsMock).toHaveBeenNthCalledWith(
      2,
      sectionOrderFilePath,
    );
    expect(readJsonMock).toHaveBeenCalledWith(sectionOrderFilePath);

    const expectedContent = JSON.stringify(
      {
        'existing.png': { order: 2, section: 'pt' },
        'local-video.mp4': { order: 0, section: 'tgw' },
      },
      null,
      2,
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\/watched\/2026-06-11\/\.section-order\.json\.\d+\.tmp$/,
      ),
      expectedContent,
      'utf-8',
    );
    expect(renameMock).toHaveBeenCalledWith(
      writeFileMock.mock.calls[0]?.[0],
      sectionOrderFilePath,
    );

    expect(showFileOnWindowsMock.mock.invocationCallOrder[0]).toBeLessThan(
      readJsonMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(readJsonMock.mock.invocationCallOrder[0]).toBeLessThan(
      hideFileOnWindowsMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(hideFileOnWindowsMock.mock.invocationCallOrder[0]).toBeLessThan(
      writeFileMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(writeFileMock.mock.invocationCallOrder[0]).toBeLessThan(
      renameMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(renameMock.mock.invocationCallOrder[0]).toBeLessThan(
      hideFileOnWindowsMock.mock.invocationCallOrder[1] ?? 0,
    );
  });
});
