import { app } from 'electron';
import {
  type ChildProcessWithoutNullStreams,
  exec,
  spawn,
} from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { IS_DEV, PLATFORM } from 'src-electron/constants';
import { logToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import { log } from 'src/shared/vanilla';
import upath from 'upath';

const { join, resolve } = upath;

const ZOOM_HELPER_READY_TIMEOUT_MS = 10_000;

let pythonProcess: ChildProcessWithoutNullStreams | null = null;
let zoomHelperPort: null | number = null;
let zoomHelperToken = '';
let zoomHelperReadyWaiters: ((ready: boolean) => void)[] = [];

export async function ensureRequirementsInstalled(): Promise<boolean> {
  const requirementsPath = getHelperPath('requirements.txt');
  return new Promise((resolve) => {
    const child = spawn(getPythonCommand(), [
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

export function getHelperPath(filename: string): string {
  if (IS_DEV) {
    return join(resolve(join(app.getAppPath(), '../../')), filename);
  }
  // Electron puts extraResources here at build time
  return join(process.resourcesPath, filename);
}

export function getZoomHelperConnection(): null | {
  baseUrl: string;
  token: string;
} {
  if (!zoomHelperPort || !zoomHelperToken) return null;
  return {
    baseUrl: `http://127.0.0.1:${zoomHelperPort}`,
    token: zoomHelperToken,
  };
}

export async function isPythonInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    exec(getPythonCommand() + ' --version', (error) => {
      resolve(!error);
    });
  });
}

export async function restartZoomHelper(): Promise<boolean> {
  stopZoomHelper();
  return startZoomHelper();
}

export async function startZoomHelper(): Promise<boolean> {
  if (PLATFORM !== 'win32') return false;
  if (pythonProcess) return waitForZoomHelperReady();

  zoomHelperPort = null;
  // A fresh secret for every run: the helper rejects requests without it,
  // so other local software (or a web page) can't drive Zoom through it.
  zoomHelperToken = randomUUID();

  const helperPath = getHelperPath('uia_helper.py');

  log(`Starting Zoom Helper`, 'zoom', 'info', helperPath);
  try {
    pythonProcess = spawn(getPythonCommand(), [helperPath], {
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        PYTHONUTF8: '1',
        ZOOM_HELPER_TOKEN: zoomHelperToken,
      },
    });
  } catch (error) {
    logToWindow(
      mainWindowInfo.mainWindow,
      `[Zoom Helper] Failed to start: ${String(error)}`,
      {},
      'error',
    );
    resolveZoomHelperReady(false);
    return false;
  }

  pythonProcess.stdout.on('data', (data: Buffer) => {
    const messages = data
      .toString()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const msg of messages) {
      const portMatch = msg.match(/^ZOOM_HELPER_PORT=(\d+)$/);
      if (portMatch) {
        zoomHelperPort = Number(portMatch[1]);
        resolveZoomHelperReady(true);
      }

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
    log(`Zoom Helper process exited`, 'zoom', 'warn', code);
    pythonProcess = null;
    zoomHelperPort = null;
    resolveZoomHelperReady(false);
    logToWindow(
      mainWindowInfo.mainWindow,
      `[Zoom Helper] Process exited with code ${code}`,
      {},
      'warn',
    );
  });

  pythonProcess.on('error', (err) => {
    logToWindow(
      mainWindowInfo.mainWindow,
      `[Zoom Helper] Failed to start: ${err.message}`,
      {},
      'error',
    );
    pythonProcess = null;
    zoomHelperPort = null;
    resolveZoomHelperReady(false);
  });

  return waitForZoomHelperReady();
}

export function stopZoomHelper() {
  if (pythonProcess) {
    log(`Stopping Zoom Helper`, 'zoom', 'info');
    pythonProcess.kill();
    pythonProcess = null;
  }

  zoomHelperPort = null;
  resolveZoomHelperReady(false);
}

function getPythonCommand(): string {
  return PLATFORM === 'win32' ? 'python' : 'python3';
}

function resolveZoomHelperReady(ready: boolean) {
  const waiters = zoomHelperReadyWaiters;
  zoomHelperReadyWaiters = [];
  waiters.forEach((resolve) => resolve(ready));
}

function waitForZoomHelperReady(): Promise<boolean> {
  if (zoomHelperPort) return Promise.resolve(true);
  if (!pythonProcess) return Promise.resolve(false);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      zoomHelperReadyWaiters = zoomHelperReadyWaiters.filter(
        (waiter) => waiter !== resolveOnce,
      );
      resolve(false);
    }, ZOOM_HELPER_READY_TIMEOUT_MS);

    const resolveOnce = (ready: boolean) => {
      clearTimeout(timeout);
      resolve(ready);
    };

    zoomHelperReadyWaiters.push(resolveOnce);
  });
}
