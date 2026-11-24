import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const execFileMock = vi.fn();

vi.mock('node:child_process', () => ({ execFile: execFileMock }));

vi.mock('src-electron/constants', () => ({
  MSIX_IDENTITY_NAME: 'CharlesOlivierSavignac.MeetingMediaManager',
  MSIX_PUBLISHER: 'CN=EA85FE0C-CB16-4547-83BB-237BB2238CA4',
}));

const { getPackageDataDir, getPublisherId, setStartupTaskEnabled } =
  await import('../msix');

type ExecFileCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void;

/** Makes the startup task helper answer with the given output. */
const answerWith = (error: Error | null, stdout: string, stderr = '') => {
  execFileMock.mockImplementation(
    (_file: string, _args: string[], _options: object, callback) => {
      (callback as ExecFileCallback)(error, stdout, stderr);
    },
  );
};

describe('getPublisherId', () => {
  // Each checked against a package installed on Windows (Get-AppxPackage).
  it.each([
    [
      'CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US',
      '8wekyb3d8bbwe',
    ],
    // A Partner Center publisher, the kind M³ has.
    ['CN=EB51A5DA-0E72-4863-82E4-EA21C1F8DFE3', '8j3eq9eme6ctt'],
    // M³'s own.
    ['CN=EA85FE0C-CB16-4547-83BB-237BB2238CA4', 'zrn6pgj3w6nkw'],
  ])('gives %s the ID Windows gives it', (publisher, id) => {
    expect(getPublisherId(publisher)).toBe(id);
  });
});

describe('getPackageDataDir', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is the package family name's folder in LOCALAPPDATA's Packages", () => {
    vi.stubEnv('LOCALAPPDATA', 'C:/Users/user/AppData/Local');

    expect(getPackageDataDir()).toBe(
      'C:/Users/user/AppData/Local/Packages/CharlesOlivierSavignac.MeetingMediaManager_zrn6pgj3w6nkw',
    );
  });

  it("is undefined when there's no LOCALAPPDATA", () => {
    vi.stubEnv('LOCALAPPDATA', '');

    expect(getPackageDataDir()).toBeUndefined();
  });
});

describe('setStartupTaskEnabled', () => {
  const resourcesPath = String.raw`C:\Program Files\WindowsApps\M3\app\resources`;
  // upath's join writes it with forward slashes.
  const helper =
    'C:/Program Files/WindowsApps/M3/app/resources/startup-task-helper/StartupTaskHelper.exe';

  beforeEach(() => {
    execFileMock.mockReset();
    Object.defineProperty(process, 'resourcesPath', {
      configurable: true,
      value: resourcesPath,
    });
  });

  it('asks the helper inside the package to turn the startup task on', async () => {
    answerWith(null, 'Enabled\r\n');

    await expect(setStartupTaskEnabled(true)).resolves.toBe('Enabled');

    expect(execFileMock).toHaveBeenCalledWith(
      helper,
      ['enable'],
      { timeout: 30_000, windowsHide: true },
      expect.any(Function),
    );
  });

  it('turns it off', async () => {
    answerWith(null, 'Disabled\r\n');

    await expect(setStartupTaskEnabled(false)).resolves.toBe('Disabled');

    expect(execFileMock.mock.calls[0]?.[1]).toEqual(['disable']);
  });

  it("passes on a state other than the one asked for, e.g. the user's", async () => {
    answerWith(null, 'DisabledByUser\r\n');

    await expect(setStartupTaskEnabled(true)).resolves.toBe('DisabledByUser');
  });

  it("fails with what the helper said when it couldn't", async () => {
    answerWith(
      new Error('Command failed: StartupTaskHelper.exe enable'),
      '',
      'Element not found. (Exception from HRESULT: 0x80070490) (0x80070490)\r\n',
    );

    await expect(setStartupTaskEnabled(true)).rejects.toThrow(
      "Couldn't turn the startup task on: Element not found. (Exception from HRESULT: 0x80070490) (0x80070490)",
    );
  });

  it('fails with the error itself when the helper said nothing', async () => {
    answerWith(new Error('spawn StartupTaskHelper.exe ENOENT'), '');

    await expect(setStartupTaskEnabled(false)).rejects.toThrow(
      "Couldn't turn the startup task off: spawn StartupTaskHelper.exe ENOENT",
    );
  });
});
