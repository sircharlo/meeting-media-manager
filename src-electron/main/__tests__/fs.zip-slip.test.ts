import { beforeEach, describe, expect, it, vi } from 'vitest';

// Deliberately does NOT mock 'upath' (unlike fs.test.ts), since these tests
// need real path resolution to verify that Zip Slip traversal entries are
// rejected instead of escaping the extraction directory.

const mkdirMock = vi.fn();
const readFileMock = vi.fn();
const rmMock = vi.fn();
const statMock = vi.fn(() => Promise.resolve({ size: 1024 }));
const writeFileMock = vi.fn();
const delayMock = vi.fn(() => Promise.resolve());
const captureElectronErrorMock = vi.fn();
const addElectronBreadcrumbMock = vi.fn();
const getSharedDataPathMock = vi.fn();
const createWriteStreamMock = vi.fn(() => ({ on: vi.fn() }));
const ensureDirMock = vi.fn();
const pipelineMock = vi.fn(() => Promise.resolve());
const yauzlOpenMock = vi.fn();
const yauzlFromBufferPromiseMock = vi.fn();

vi.mock('chokidar', () => ({
  watch: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(),
    once: vi.fn(),
    startAccessingSecurityScopedResource: vi.fn(() => vi.fn()),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
}));

vi.mock('fs-extra', () => ({
  ensureDir: ensureDirMock,
}));

vi.mock('node:fs', () => ({
  createWriteStream: createWriteStreamMock,
}));

vi.mock('node:fs/promises', () => ({
  mkdir: mkdirMock,
  readFile: readFileMock,
  rm: rmMock,
  stat: statMock,
  writeFile: writeFileMock,
}));

vi.mock('node:stream/promises', () => ({
  pipeline: pipelineMock,
}));

vi.mock('node:timers/promises', () => ({
  setTimeout: delayMock,
}));

vi.mock('src-electron/main/utils', () => ({
  addElectronBreadcrumb: addElectronBreadcrumbMock,
  captureElectronError: captureElectronErrorMock,
  getSharedDataPath: getSharedDataPathMock,
}));

vi.mock('@sentry/electron/main', () => ({
  setTag: vi.fn(),
}));

vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: {},
}));

vi.mock('src/constants/media', () => ({
  IMG_EXTENSIONS: [],
  JWPUB_EXTENSIONS: [],
  PDF_EXTENSIONS: [],
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
  uuid: vi.fn(() => 'test-uuid'),
}));

vi.mock('yauzl', () => ({
  default: {
    fromBufferPromise: yauzlFromBufferPromiseMock,
    openPromise: yauzlOpenMock,
  },
  fromBufferPromise: yauzlFromBufferPromiseMock,
  openPromise: yauzlOpenMock,
}));

const createFakeStream = (data: string) => ({
  on: (event: string, cb: (arg?: unknown) => void) => {
    if (event === 'data') cb(Buffer.from(data));
    if (event === 'end') cb();
  },
});

describe('Zip Slip protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    statMock.mockResolvedValue({ size: 1024 });
  });

  it('rejects a top-level zip entry that traverses outside the output directory', async () => {
    const maliciousEntry = {
      compressedSize: 5,
      fileName: '../../evil.txt',
      uncompressedSize: 5,
    };
    const zipfile = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield maliciousEntry;
      },
      openReadStreamPromise: vi
        .fn()
        .mockRejectedValue(new Error('should not be called')),
    };
    yauzlOpenMock.mockResolvedValue(zipfile);

    const { unzipFile } = await import('../fs');

    await expect(unzipFile('/tmp/evil.jwpub', '/tmp/out')).rejects.toThrow(
      /Unsafe zip entry path/,
    );

    expect(createWriteStreamMock).not.toHaveBeenCalled();
    expect(zipfile.openReadStreamPromise).not.toHaveBeenCalled();
  });

  it('allows a top-level zip entry that stays within the output directory', async () => {
    const safeEntry = {
      compressedSize: 5,
      fileName: 'safe.txt',
      uncompressedSize: 5,
    };
    const zipfile = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield safeEntry;
      },
      openReadStreamPromise: vi.fn().mockResolvedValue(createFakeStream('ok')),
    };
    yauzlOpenMock.mockResolvedValue(zipfile);

    const { unzipFile } = await import('../fs');

    await expect(unzipFile('/tmp/safe.jwpub', '/tmp/out')).resolves.toEqual([
      { path: 'safe.txt' },
    ]);
    expect(createWriteStreamMock).toHaveBeenCalledWith('/tmp/out/safe.txt');
  });

  it('rejects a nested zip entry that traverses outside the output directory', async () => {
    const outerEntry = {
      compressedSize: 5,
      fileName: 'contents',
      uncompressedSize: 5,
    };
    const outerZipfile = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield outerEntry;
      },
      openReadStreamPromise: vi
        .fn()
        .mockResolvedValue(createFakeStream('dummy')),
    };

    const maliciousInnerEntry = {
      compressedSize: 5,
      fileName: '../../../evil.txt',
      uncompressedSize: 5,
    };
    const innerZipfile = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield maliciousInnerEntry;
      },
      openReadStreamPromise: vi
        .fn()
        .mockResolvedValue(createFakeStream('dummy')),
    };

    yauzlOpenMock.mockResolvedValue(outerZipfile);
    yauzlFromBufferPromiseMock.mockResolvedValue(innerZipfile);

    const { extractNestedZipEntry } = await import('../fs');

    await expect(
      extractNestedZipEntry('/tmp/evil.jwpub', 'contents', '/tmp/out', {
        innerEntryName: '../../../evil.txt',
      }),
    ).rejects.toThrow(/Unsafe zip entry path/);

    expect(createWriteStreamMock).not.toHaveBeenCalled();
  });
});

describe('EEXIST directory race tolerance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    statMock.mockResolvedValue({ size: 1024 });
  });

  const makeEexistError = (path: string) => {
    const error = new Error(`EEXIST: file already exists, mkdir '${path}'`);
    (error as Error & { code?: string }).code = 'EEXIST';
    return error;
  };

  it('tolerates a spurious EEXIST for a directory entry when the directory already exists', async () => {
    const dirEntry = {
      compressedSize: 0,
      fileName: 'sub/',
      uncompressedSize: 0,
    };
    const zipfile = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield dirEntry;
      },
    };
    yauzlOpenMock.mockResolvedValue(zipfile);

    ensureDirMock.mockRejectedValueOnce(makeEexistError('/tmp/out/sub'));
    statMock.mockImplementation((path: string) =>
      path === '/tmp/out/sub'
        ? Promise.resolve({ isDirectory: () => true })
        : Promise.resolve({ size: 1024 }),
    );

    const { unzipFile } = await import('../fs');

    await expect(unzipFile('/tmp/safe.jwpub', '/tmp/out')).resolves.toEqual([]);

    expect(ensureDirMock).toHaveBeenCalledWith('/tmp/out/sub');
    expect(ensureDirMock).toHaveBeenCalledTimes(1);
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('tolerates a spurious EEXIST for a file entry parent directory (matches the Windows unzip crash)', async () => {
    const fileEntry = {
      compressedSize: 5,
      fileName: 'sub/file.txt',
      uncompressedSize: 5,
    };
    const zipfile = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield fileEntry;
      },
      openReadStreamPromise: vi.fn().mockResolvedValue(createFakeStream('ok')),
    };
    yauzlOpenMock.mockResolvedValue(zipfile);

    ensureDirMock.mockRejectedValueOnce(makeEexistError('/tmp/out/sub'));
    statMock.mockImplementation((path: string) =>
      path === '/tmp/out/sub'
        ? Promise.resolve({ isDirectory: () => true })
        : Promise.resolve({ size: 1024 }),
    );

    const { unzipFile } = await import('../fs');

    await expect(unzipFile('/tmp/race.jwpub', '/tmp/out')).resolves.toEqual([
      { path: 'sub/file.txt' },
    ]);

    expect(createWriteStreamMock).toHaveBeenCalledWith('/tmp/out/sub/file.txt');
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('still throws when EEXIST is caused by a real file blocking directory creation', async () => {
    const dirEntry = {
      compressedSize: 0,
      fileName: 'sub/',
      uncompressedSize: 0,
    };
    const zipfile = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield dirEntry;
      },
    };
    yauzlOpenMock.mockResolvedValue(zipfile);

    const eexistError = makeEexistError('/tmp/out/sub');
    ensureDirMock.mockRejectedValue(eexistError);
    statMock.mockImplementation((path: string) =>
      path === '/tmp/out/sub'
        ? Promise.resolve({ isDirectory: () => false })
        : Promise.resolve({ size: 1024 }),
    );

    const { unzipFile } = await import('../fs');

    await expect(unzipFile('/tmp/blocked.jwpub', '/tmp/out')).rejects.toBe(
      eexistError,
    );

    // createDirectory retries up to 3 attempts regardless of error code
    expect(ensureDirMock).toHaveBeenCalledTimes(3);
    expect(captureElectronErrorMock).toHaveBeenCalledWith(
      eexistError,
      expect.objectContaining({
        contexts: expect.objectContaining({
          fn: expect.objectContaining({
            name: 'unzipFile ensureDir (dir entry)',
          }),
        }),
      }),
    );
  });
});
