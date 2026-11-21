import { beforeEach, describe, expect, it, vi } from 'vitest';

const getPathMock = vi.fn<(name: string) => string>();

// The real constants, with APP_STORE and PLATFORM changeable per test.
const constants = vi.hoisted(() => ({}) as Record<string, unknown>);

vi.mock('src-electron/constants', async (importOriginal) =>
  Object.assign(constants, await importOriginal<object>()),
);

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => '/mock/app/resources/app'),
    getPath: getPathMock,
    getVersion: vi.fn(),
    once: vi.fn(),
  },
}));

vi.mock('#q-app/electron/main', () => ({
  resolveElectronAssetsPath: vi.fn((...args: string[]) =>
    ['electron-assets', ...args].join('/'),
  ),
}));

vi.mock('@sentry/electron/main', () => ({
  captureException: vi.fn(),
}));

vi.mock('src-electron/main/session', () => ({
  urlVariables: {},
}));

vi.mock('is-online', () => ({
  default: vi.fn(),
}));

vi.mock('app/package.json', () => ({
  version: '1.0.0',
}));

const { isMachineWideInstallation } = await import('../utils');

describe('isMachineWideInstallation', () => {
  beforeEach(() => {
    constants.APP_STORE = null;
    constants.PLATFORM = 'win32';
  });

  it('counts an installer’s copy in Program Files', () => {
    getPathMock.mockReturnValue(
      String.raw`C:\Program Files\Meeting Media Manager\Meeting Media Manager.exe`,
    );

    expect(isMachineWideInstallation()).toBe(true);
  });

  it('never counts the Microsoft Store build, in WindowsApps', () => {
    constants.APP_STORE = 'microsoft-store';
    getPathMock.mockReturnValue(
      String.raw`C:\Program Files\WindowsApps\sircharlo.MeetingMediaManager_26.11.4.0_x64__8j3eq9eme6ctt\app\Meeting Media Manager.exe`,
    );

    expect(isMachineWideInstallation()).toBe(false);
  });

  it('never counts the Mac App Store build, in /Applications', () => {
    constants.APP_STORE = 'mac-app-store';
    constants.PLATFORM = 'darwin';
    getPathMock.mockReturnValue(
      '/Applications/Meeting Media Manager.app/Contents/MacOS/Meeting Media Manager',
    );

    expect(isMachineWideInstallation()).toBe(false);
  });
});
