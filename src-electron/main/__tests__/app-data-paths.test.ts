import { resolve } from 'upath';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const setPathMock = vi.fn();
const constants = {
  APP_STORE: null as null | string,
  IS_TEST: false,
  PRODUCT_NAME: 'Meeting Media Manager',
};

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/home/user/.config'),
    setPath: setPathMock,
  },
}));

vi.mock('src-electron/constants', () => constants);

const getPackageDataDirMock = vi.fn<() => string | undefined>();

vi.mock('src-electron/main/msix', () => ({
  getPackageDataDir: getPackageDataDirMock,
}));

const PACKAGE_DATA_DIR =
  'C:/Users/user/AppData/Local/Packages/CharlesOlivierSavignac.MeetingMediaManager_zrn6pgj3w6nkw';

const { configureAppDataPaths } = await import('../app-data-paths');

describe('configureAppDataPaths', () => {
  beforeEach(() => {
    setPathMock.mockClear();
    constants.APP_STORE = null;
    constants.IS_TEST = false;
    constants.PRODUCT_NAME = 'Meeting Media Manager';
    vi.stubEnv('PORTABLE_EXECUTABLE_DIR', '');
    vi.stubEnv('SNAP_USER_COMMON', '');
    getPackageDataDirMock.mockReset().mockReturnValue(PACKAGE_DATA_DIR);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("leaves Electron's defaults alone for an installed release", () => {
    configureAppDataPaths();

    expect(setPathMock).not.toHaveBeenCalled();
  });

  it('keeps everything next to the portable executable', () => {
    vi.stubEnv('PORTABLE_EXECUTABLE_DIR', 'M3 portable');
    // Made absolute, as on the test machine's own file system.
    const folder = resolve('M3 portable');

    configureAppDataPaths();

    expect(setPathMock.mock.calls).toEqual([
      ['appData', folder],
      ['userData', `${folder}/Meeting Media Manager - User Data`],
      ['temp', `${folder}/Meeting Media Manager - Temporary Files`],
    ]);
  });

  it('keeps a snap’s data in the folder all its revisions share', () => {
    constants.APP_STORE = 'snap-store';
    vi.stubEnv(
      'SNAP_USER_COMMON',
      '/home/user/snap/meeting-media-manager/common',
    );

    configureAppDataPaths();

    expect(setPathMock.mock.calls).toEqual([
      [
        'userData',
        '/home/user/snap/meeting-media-manager/common/Meeting Media Manager',
      ],
    ]);
  });

  it('keeps a test snap’s data apart from the release’s', () => {
    constants.APP_STORE = 'snap-store';
    constants.IS_TEST = true;
    constants.PRODUCT_NAME = 'Meeting Media Manager - Test';
    vi.stubEnv(
      'SNAP_USER_COMMON',
      '/home/user/snap/meeting-media-manager/common',
    );

    configureAppDataPaths();

    expect(setPathMock.mock.calls).toEqual([
      [
        'userData',
        '/home/user/snap/meeting-media-manager/common/Meeting Media Manager - Test',
      ],
    ]);
  });

  it('leaves a snap without its shared folder to the defaults', () => {
    constants.APP_STORE = 'snap-store';

    configureAppDataPaths();

    expect(setPathMock).not.toHaveBeenCalled();
  });

  it("keeps the Microsoft Store build's data in its package's own folder", () => {
    constants.APP_STORE = 'microsoft-store';

    configureAppDataPaths();

    expect(setPathMock.mock.calls).toEqual([
      [
        'userData',
        `${PACKAGE_DATA_DIR}/LocalCache/Roaming/Meeting Media Manager`,
      ],
    ]);
  });

  it('keeps a test MSIX’s data apart from the release’s', () => {
    constants.APP_STORE = 'microsoft-store';
    constants.IS_TEST = true;
    constants.PRODUCT_NAME = 'Meeting Media Manager - Test';
    getPackageDataDirMock.mockReturnValue(`${PACKAGE_DATA_DIR}.Test`);

    configureAppDataPaths();

    expect(setPathMock.mock.calls).toEqual([
      [
        'userData',
        `${PACKAGE_DATA_DIR}.Test/LocalCache/Roaming/Meeting Media Manager - Test`,
      ],
    ]);
  });

  it('leaves a Microsoft Store build without LOCALAPPDATA to the defaults', () => {
    constants.APP_STORE = 'microsoft-store';
    getPackageDataDirMock.mockReturnValue(undefined);

    configureAppDataPaths();

    expect(setPathMock).not.toHaveBeenCalled();
  });

  it("doesn't look for a package's folder outside the Microsoft Store build", () => {
    configureAppDataPaths();

    expect(getPackageDataDirMock).not.toHaveBeenCalled();
  });

  it("gives a test build its own userData, apart from the release's", () => {
    constants.IS_TEST = true;
    constants.PRODUCT_NAME = 'Meeting Media Manager - Test';

    configureAppDataPaths();

    expect(setPathMock.mock.calls).toEqual([
      ['userData', '/home/user/.config/Meeting Media Manager - Test'],
    ]);
  });
});
