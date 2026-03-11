import { app } from 'electron';
import {
  type ChildProcessWithoutNullStreams,
  exec,
  spawn,
} from 'node:child_process';
import { IS_DEV, PLATFORM } from 'src-electron/constants';
import { logToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import upath from 'upath';

const { join } = upath;

function getAppRoot() {
  const appPath = app.getAppPath();
  // In dev, appPath is .quasar/dev-electron/, so we need to go up two levels to get the project root
  return IS_DEV ? join(appPath, '../../') : appPath;
}

let pythonProcess: ChildProcessWithoutNullStreams | null = null;

export async function ensureRequirementsInstalled(): Promise<boolean> {
  const requirementsPath = join(getAppRoot(), 'requirements.txt');
  return new Promise((resolve) => {
    const child = spawn('python', [
      '-m',
      'pip',
      'install',
      '-r',
      requirementsPath,
    ]);

    child.stdout.on('data', (data) => {
      logToWindow(mainWindowInfo.mainWindow, `[Pip] ${data}`, {}, 'debug');
    });

    child.stderr.on('data', (data) => {
      logToWindow(mainWindowInfo.mainWindow, `[Pip Error] ${data}`, {}, 'warn');
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

export async function isPythonInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('python --version', (error) => {
      resolve(!error);
    });
  });
}

export function startZoomHelper() {
  if (pythonProcess || PLATFORM !== 'win32') return;

  const helperPath = join(getAppRoot(), 'uia_helper.py');

  console.log(`[Zoom Helper] Starting ${helperPath}`);
  pythonProcess = spawn('python', [helperPath]);

  pythonProcess.stdout.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) {
      logToWindow(
        mainWindowInfo.mainWindow,
        `[Zoom Helper] ${msg}`,
        {},
        'info',
      );
    }
  });

  pythonProcess.stderr.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) {
      logToWindow(
        mainWindowInfo.mainWindow,
        `[Zoom Helper Error] ${msg}`,
        {},
        'error',
      );
    }
  });

  pythonProcess.on('close', (code: number) => {
    console.log(`[Zoom Helper] Process exited with code ${code}`);
    pythonProcess = null;
    logToWindow(
      mainWindowInfo.mainWindow,
      `[Zoom Helper] Process exited with code ${code}`,
      {},
      'warn',
    );
  });
}

export function stopZoomHelper() {
  if (pythonProcess) {
    console.log('[Zoom Helper] Stopping process');
    pythonProcess.kill();
    pythonProcess = null;
  }
}
