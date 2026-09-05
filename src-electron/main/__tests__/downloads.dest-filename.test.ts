import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  captureElectronError: vi.fn(),
  download: vi.fn(async () => 'download-id'),
  mkdir: vi.fn(),
  sendToWindow: vi.fn(),
  stat: vi.fn(),
}));

interface TestWindowState {
  mainWindow: null | {
    id: number;
    isDestroyed: () => boolean;
    webContents: { isDestroyed: () => boolean };
  };
}

const windowState = vi.hoisted((): TestWindowState => ({
  mainWindow: null,
}));

vi.mock('node:fs/promises', () => ({
  mkdir: mocks.mkdir,
  stat: mocks.stat,
}));

vi.mock('electron-dl-manager', () => ({
  // A real `function` (not an arrow function) is required: downloads.ts
  // calls `new ElectronDownloadManager()`, and an arrow-function mock
  // implementation throws "is not a constructor" if actually invoked via
  // `new` (see downloads.cancel-race.test.ts, which hit this).
  ElectronDownloadManager: vi.fn(function () {
    return {
      cancelDownload: vi.fn(),
      download: mocks.download,
      getDownloadData: vi.fn(),
      pauseDownload: vi.fn(),
      resumeDownload: vi.fn(),
    };
  }),
}));

vi.mock('src-electron/main/session', () => ({
  quitStatus: { isAppQuitting: false },
}));

vi.mock('src-electron/main/utils', () => ({
  addElectronBreadcrumb: mocks.addElectronBreadcrumb,
  captureElectronError: mocks.captureElectronError,
  fetchJsonFromMainProcess: vi.fn(),
}));

vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: mocks.sendToWindow,
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: windowState,
}));

vi.mock('countries-and-timezones', () => ({
  getCountriesForTimezone: vi.fn(() => []),
}));

vi.mock('electron', () => ({
  app: { getLocaleCountryCode: vi.fn(() => 'US') },
}));

vi.mock('src-electron/main/disk-space', () => ({
  getLowDiskSpaceStatus: vi.fn(async () => false),
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
  throttleWithTrailing: (fn: (...args: unknown[]) => unknown) => fn,
}));

const waitUntil = async (
  condition: () => boolean,
  maxAttempts = 50,
): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (condition()) return;
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  }
  throw new Error('waitUntil: condition was never met');
};

// SEC-7 (full-audit-2026-09-04.md): destFilename previously flowed straight
// through to the download manager with no containment - a crafted value
// (path separators, ../) could aim the actual write outside saveDir. Not
// reachable today (gated by isSelf(), and every current renderer call site
// only ever passes a plain filename), but hardened as a defense-in-depth
// backstop.
describe('downloadFile destFilename sanitization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue({ isDirectory: () => true });
    windowState.mainWindow = {
      id: 1,
      isDestroyed: () => false,
      webContents: { isDestroyed: () => false },
    };
  });

  it('strips a path-traversal destFilename down to its basename', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(
      'https://example.test/file.mp4',
      '/tmp/media',
      '../../etc/passwd',
    );
    await waitUntil(() => mocks.download.mock.calls.length > 0);

    expect(mocks.download).toHaveBeenCalledWith(
      expect.objectContaining({ saveAsFilename: 'passwd' }),
    );
  });

  it('strips an absolute-path destFilename down to its basename', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(
      'https://example.test/file.mp4',
      '/tmp/media',
      'C:\\Windows\\System32\\evil.dll',
    );
    await waitUntil(() => mocks.download.mock.calls.length > 0);

    expect(mocks.download).toHaveBeenCalledWith(
      expect.objectContaining({ saveAsFilename: 'evil.dll' }),
    );
  });

  it('leaves a plain filename untouched', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(
      'https://example.test/file.mp4',
      '/tmp/media',
      'song.mp3',
    );
    await waitUntil(() => mocks.download.mock.calls.length > 0);

    expect(mocks.download).toHaveBeenCalledWith(
      expect.objectContaining({ saveAsFilename: 'song.mp3' }),
    );
  });
});
