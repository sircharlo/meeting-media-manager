import type { ZoomTestParticipant } from 'src/types';

import { i18n } from 'boot/i18n';
import { type ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runZoomCommand } from 'src-electron/main/zoom-helper-client';
import { getZoomMeetingState } from 'src/helpers/zoom';
import {
  runZoomSelfTest,
  ZOOM_SELF_TEST_STEP_LABELS,
  type ZoomSelfTestStep,
  type ZoomTestParticipantsProbe,
} from 'src/helpers/zoom-self-test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Drives the real Zoom desktop app on this computer: see README.md.

// Vitest runs from the repo root (`yarn test:zoom-live`).
const ROOT = `${process.cwd()}/`;
const MEETING_LAUNCH_TIMEOUT_MS = 90_000;
const STARTUP_TIMEOUT_MS = 30_000;

const readEnv = (): Record<string, string> => {
  try {
    return Object.fromEntries(
      readFileSync(`${ROOT}.env.zoom-test`, 'utf8')
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

const env = { ...readEnv(), ...process.env } as Record<string, string>;
const meetingId = (env.ZOOM_TEST_MEETING_ID ?? '').replaceAll(/\D/g, '');
const passcode = env.ZOOM_TEST_PASSCODE ?? '';
const participantCount = Number(env.ZOOM_TEST_PARTICIPANTS ?? 3);

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Starts a child process and resolves with the port it announces. */
const startWithPort = (
  command: string,
  args: string[],
  pattern: RegExp,
  extraEnv: Record<string, string> = {},
) =>
  new Promise<{ child: ChildProcess; port: number }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        PYTHONUTF8: '1',
        ...extraEnv,
      },
    });
    const timeout = setTimeout(
      () => reject(new Error(`${args[0]} did not start`)),
      STARTUP_TIMEOUT_MS,
    );
    child.stdout?.on('data', (data: Buffer) => {
      const match = pattern.exec(data.toString());
      if (match) {
        clearTimeout(timeout);
        resolve({ child, port: Number(match[1]) });
      }
    });
    child.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(`    ${data.toString().trimEnd()}\n`);
    });
    child.on('error', reject);
  });

const icons: Record<ZoomSelfTestStep['status'], string> = {
  failed: '✗',
  passed: '✓',
  pending: '·',
  running: '…',
  skipped: '-',
};

const label = (step: ZoomSelfTestStep) =>
  i18n.global.t(ZOOM_SELF_TEST_STEP_LABELS[step.id]);

// Written straight to stdout: Vitest only shows the console output it
// captures for failing tests, and this report matters when all pass too.
const print = (line: string) => process.stdout.write(`${line}\n`);

const printed = new Set<string>();
const printProgress = (steps: ZoomSelfTestStep[]) => {
  for (const step of steps) {
    const key = `${step.id}:${step.status}`;
    if (printed.has(key) || step.status === 'pending') continue;
    printed.add(key);
    const detail = step.detail ? ` — ${step.detail}` : '';
    print(`  ${icons[step.status]} ${label(step)}${detail}`);
  }
};

describe.skipIf(!meetingId)('Zoom Meeting Manager, live', () => {
  const children: ChildProcess[] = [];
  let participantsPort = 0;

  const participantsCall = async (path: string, body?: unknown) => {
    const response = await fetch(
      `http://127.0.0.1:${participantsPort}${path}`,
      {
        ...(body === undefined
          ? {}
          : {
              body: JSON.stringify(body),
              headers: { 'Content-Type': 'application/json' },
              method: 'POST',
            }),
      },
    );
    return (await response.json()) as { participants?: ZoomTestParticipant[] };
  };

  const probe: ZoomTestParticipantsProbe = {
    act: async (action) => {
      await participantsCall('/action', { action });
    },
    list: async () => (await participantsCall('/state')).participants ?? [],
  };

  beforeAll(async () => {
    const token = randomUUID();
    const helper = await startWithPort(
      'python',
      ['uia_helper.py'],
      /ZOOM_HELPER_PORT=(\d+)/,
      { ZOOM_HELPER_TOKEN: token },
    );
    children.push(helper.child);
    const connection = {
      baseUrl: `http://127.0.0.1:${helper.port}`,
      token,
    };
    globalThis.electronApi.zoomCommand = (command) =>
      runZoomCommand(connection, command);

    if (!(await getZoomMeetingState())?.found) {
      print(`  Starting Zoom meeting ${meetingId}…`);
      const query = new URLSearchParams({ confno: meetingId });
      if (passcode) query.set('pwd', passcode);
      spawn('rundll32', [
        'url.dll,FileProtocolHandler',
        `zoommtg://zoom.us/join?${query.toString()}`,
      ]);
      const deadline = Date.now() + MEETING_LAUNCH_TIMEOUT_MS;
      while (!(await getZoomMeetingState())?.found && Date.now() < deadline) {
        await sleep(2000);
      }
    }

    children.push(
      spawn('python', ['scripts/zoom-live/fake-media-window.py'], {
        cwd: ROOT,
        env: { ...process.env, PYTHONUTF8: '1' },
      }),
    );

    if (participantCount > 0) {
      const participants = await startWithPort(
        'node',
        [
          'scripts/zoom-live/participants.mjs',
          String(participantCount),
          '--exit-with-parent',
        ],
        /ZOOM_PARTICIPANTS_PORT=(\d+)/,
      );
      children.push(participants.child);
      participantsPort = participants.port;
    }
  });

  afterAll(async () => {
    if (participantsPort) {
      await participantsCall('/quit', {}).catch(() => undefined);
      await sleep(3000);
    }
    children.forEach((child) => child.kill());
  });

  it('performs and verifies every Zoom Meeting Manager action', async () => {
    print(`\n  Zoom Meeting Manager self-test (meeting ${meetingId})`);
    const steps = await runZoomSelfTest({
      onProgress: printProgress,
      participants: participantCount > 0 ? probe : undefined,
      prepareMediaWindow: async () => () => undefined,
      titles: {
        shareButtonTitle: env.ZOOM_TEST_SHARE_BUTTON_TITLE || null,
        videoOffTitle: env.ZOOM_TEST_VIDEO_OFF_TITLE || null,
        videoOnTitle: env.ZOOM_TEST_VIDEO_ON_TITLE || null,
      },
    });

    const failed = steps.filter((step) => step.status === 'failed');
    expect(failed.map((step) => `${label(step)}: ${step.detail}`)).toEqual([]);
  });
});
