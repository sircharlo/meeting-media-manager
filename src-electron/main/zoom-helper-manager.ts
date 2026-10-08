import type {
  ZoomCommand,
  ZoomCommandResult,
  ZoomHelperStartResult,
} from 'src/types';

import { app } from 'electron';
import { existsSync } from 'node:fs';
import { IS_DEV, PLATFORM } from 'src-electron/constants';
import { logToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import { ZoomHelperProcess } from 'src-electron/main/zoom-helper-process';
import upath from 'upath';

const { join, resolve } = upath;

/**
 * A path inside the repository, in development builds. (Packaged builds
 * only ship the Zoom helper, under resources/zoom-helper.)
 */
export function getDevRepoPath(relativePath: string): string {
  return join(resolve(join(app.getAppPath(), '../../')), relativePath);
}

const getZoomHelperScriptPath = () =>
  IS_DEV
    ? getDevRepoPath('src-electron/zoom-helper/zoom-helper.ps1')
    : join(process.resourcesPath, 'zoom-helper', 'zoom-helper.ps1');

let helper: null | ZoomHelperProcess = null;

const getHelper = () => {
  helper ??= new ZoomHelperProcess({
    cacheDir: join(app.getPath('userData'), 'zoom-helper'),
    onExit: (code) => {
      logToWindow(
        mainWindowInfo.mainWindow,
        `[Zoom Helper] Process exited with code ${code}`,
        {},
        'warn',
      );
    },
    onLog: (line) => {
      logToWindow(
        mainWindowInfo.mainWindow,
        `[Zoom Helper] ${line}`,
        {},
        'info',
      );
    },
    scriptPath: getZoomHelperScriptPath(),
  });
  return helper;
};

const WINDOWS_ONLY = { error: 'windows-only', ok: false } as const;
// The helper's files didn't ship with this build (or were removed, e.g. by
// an antivirus), which PowerShell would only report as a failed start.
const HELPER_MISSING = { error: 'helper-missing', ok: false } as const;

const isHelperMissing = () => !existsSync(getZoomHelperScriptPath());

export async function restartZoomHelper(): Promise<ZoomHelperStartResult> {
  stopZoomHelper();
  return startZoomHelper();
}

/** Runs one Zoom action, starting the helper first if needed. */
export function runZoomHelperCommand(
  command: ZoomCommand,
): Promise<ZoomCommandResult> {
  if (PLATFORM !== 'win32') return Promise.resolve(WINDOWS_ONLY);
  if (isHelperMissing()) return Promise.resolve(HELPER_MISSING);
  return getHelper().request(command);
}

export async function startZoomHelper(): Promise<ZoomHelperStartResult> {
  if (PLATFORM !== 'win32') return WINDOWS_ONLY;
  const result: ZoomHelperStartResult = isHelperMissing()
    ? HELPER_MISSING
    : await getHelper().start();
  if (!result.ok) {
    logToWindow(
      mainWindowInfo.mainWindow,
      `[Zoom Helper Error] Could not start: ${result.error}`,
      { detail: result.detail },
      'error',
    );
  }
  return result;
}

export function stopZoomHelper() {
  helper?.stop();
}
