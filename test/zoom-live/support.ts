import { type ChildProcess, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { request } from 'node:http';
import { join } from 'node:path';
import { ZoomHelperProcess } from 'src-electron/main/zoom-helper-process';

// Shared setup for the live Zoom tests (see README.md).

// Vitest runs from the repo root (`yarn test:zoom-live`).
export const ROOT = process.cwd();

const MEETING_LAUNCH_TIMEOUT_MS = 90_000;

const readEnv = (): Record<string, string> => {
  try {
    return Object.fromEntries(
      readFileSync(join(ROOT, '.env.zoom-test'), 'utf8')
        .split(/\r?\n/)
        .filter((line) => line.includes('=') && !line.startsWith('#'))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
};

export const env = { ...readEnv(), ...process.env } as Record<string, string>;
export const meetingId = (env.ZOOM_TEST_MEETING_ID ?? '').replaceAll(/\D/g, '');
export const canRunLive = !!meetingId && process.platform === 'win32';

export const titles = {
  micOffTitle: env.ZOOM_TEST_MIC_OFF_TITLE || null,
  micOnTitle: env.ZOOM_TEST_MIC_ON_TITLE || null,
  shareButtonTitle: env.ZOOM_TEST_SHARE_BUTTON_TITLE || null,
  videoOffTitle: env.ZOOM_TEST_VIDEO_OFF_TITLE || null,
  videoOnTitle: env.ZOOM_TEST_VIDEO_ON_TITLE || null,
};

export const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// Written straight to stdout: Vitest only shows the console output it
// captures for failing tests, and these reports matter when all pass too.
export const print = (line: string) => process.stdout.write(`${line}\n`);

export const createHelper = () =>
  new ZoomHelperProcess({
    onLog: (line) => print(`    [helper] ${line}`),
    scriptPath: join(ROOT, 'src-electron/zoom-helper/zoom-helper.ps1'),
  });

/** Starts the test meeting in Zoom unless a meeting is already open. */
export const ensureMeeting = async (helper: ZoomHelperProcess) => {
  const isOpen = async () =>
    !!(await helper.request({ type: 'meeting' })).meeting?.found;
  if (await isOpen()) return;
  print(`  Starting Zoom meeting ${meetingId}…`);
  const query = new URLSearchParams({ confno: meetingId });
  if (env.ZOOM_TEST_PASSCODE) query.set('pwd', env.ZOOM_TEST_PASSCODE);
  spawn('rundll32', [
    'url.dll,FileProtocolHandler',
    `zoommtg://zoom.us/join?${query.toString()}`,
  ]);
  const deadline = Date.now() + MEETING_LAUNCH_TIMEOUT_MS;
  while (!(await isOpen())) {
    if (Date.now() > deadline) throw new Error('The Zoom meeting did not open');
    await sleep(2000);
  }
};

/**
 * Calls the participants script's control server. Through node:http, not
 * fetch: the tests run in happy-dom, whose fetch adds the Origin header the
 * server turns away (so that no web page can drive the participants).
 */
export const callParticipants = <T>(
  port: number,
  path: string,
  body?: unknown,
): Promise<T> =>
  new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = request(
      {
        headers: payload ? { 'Content-Type': 'application/json' } : {},
        host: '127.0.0.1',
        method: payload ? 'POST' : 'GET',
        path,
        port,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => {
          if ((res.statusCode ?? 500) >= 400) {
            reject(new Error(`${path}: HTTP ${res.statusCode} ${data}`));
            return;
          }
          try {
            resolve(JSON.parse(data) as T);
          } catch (error) {
            reject(error as Error);
          }
        });
      },
    );
    req.on('error', reject);
    req.end(payload);
  });

/**
 * Opens the stand-in "Media Player - M³" window for the share steps, or,
 * with a title, a decoy window to crowd Zoom's share picker (or, always on
 * top, to cover it).
 */
export const openFakeMediaWindow = (decoy?: {
  title: string;
  topMost?: boolean;
  x: number;
  y: number;
}): ChildProcess => {
  const decoyArgs = decoy
    ? ['-Title', decoy.title, '-X', String(decoy.x), '-Y', String(decoy.y)]
    : [];
  if (decoy?.topMost) decoyArgs.push('-TopMost');
  return spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      'scripts/zoom-live/fake-media-window.ps1',
      ...decoyArgs,
    ],
    { cwd: ROOT },
  );
};

/** Turns the host's video on or off, using the titles from .env.zoom-test. */
export const videoCommand = (on: boolean) => ({
  offTitle: titles.videoOffTitle,
  on,
  onTitle: titles.videoOnTitle,
  type: 'set-video' as const,
});
