import type { ZoomTestParticipant } from 'src/types';

import { i18n } from 'boot/i18n';
import { type ChildProcess, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  runZoomSelfTest,
  ZOOM_SELF_TEST_STEP_LABELS,
  type ZoomSelfTestStep,
  type ZoomTestParticipantsProbe,
} from 'src/helpers/zoom-self-test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  callParticipants,
  canRunLive,
  createHelper,
  ensureMeeting,
  env,
  meetingId,
  openFakeMediaWindow,
  print,
  ROOT,
  sleep,
  titles,
} from './support';

// The full self-test against the real Zoom app, with test participants: see
// README.md.

const STARTUP_TIMEOUT_MS = 30_000;
// Written by scripts/zoom-live/participants.mjs while it runs.
const SESSION_FILE = join(
  tmpdir(),
  'm3-zoom-live',
  'participants-session.json',
);
const participantCount = Number(env.ZOOM_TEST_PARTICIPANTS ?? 3);

const icons: Record<ZoomSelfTestStep['status'], string> = {
  failed: '✗',
  passed: '✓',
  pending: '·',
  running: '…',
  skipped: '-',
};

const label = (step: ZoomSelfTestStep) =>
  i18n.global.t(ZOOM_SELF_TEST_STEP_LABELS[step.id]);

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

const participantsApi = (port: number) => {
  const call = (path: string, body?: unknown) =>
    callParticipants<{ participants?: ZoomTestParticipant[] }>(
      port,
      path,
      body,
    );
  const probe: ZoomTestParticipantsProbe = {
    act: async (action) => {
      await call('/action', { action });
    },
    list: async () => (await call('/state')).participants ?? [],
  };
  return { call, probe };
};

/** Participants already running for this meeting, if any are still in it. */
const findRunningSession = async () => {
  try {
    const session = JSON.parse(readFileSync(SESSION_FILE, 'utf8')) as {
      meeting: string;
      port: number;
    };
    const meetingHash = createHash('sha256').update(meetingId).digest('hex');
    if (session.meeting !== meetingHash) return null;
    const api = participantsApi(session.port);
    const list = await api.probe.list();
    return list.some((p) => p.phase !== 'left' && p.phase !== 'blocked')
      ? api
      : null;
  } catch {
    return null;
  }
};

const startParticipants = () =>
  new Promise<{ child: ChildProcess; port: number }>((resolve, reject) => {
    const child = spawn(
      'node',
      [
        'scripts/zoom-live/participants.mjs',
        String(participantCount),
        '--exit-with-parent',
      ],
      { cwd: ROOT },
    );
    const timeout = setTimeout(
      () => reject(new Error('The participants script did not start')),
      STARTUP_TIMEOUT_MS,
    );
    child.stdout.on('data', (data: Buffer) => {
      const match = /ZOOM_PARTICIPANTS_PORT=(\d+)/.exec(data.toString());
      if (match) {
        clearTimeout(timeout);
        resolve({ child, port: Number(match[1]) });
      }
    });
    child.stderr.on('data', (data: Buffer) => {
      process.stderr.write(`    ${data.toString().trimEnd()}\n`);
    });
    child.on('error', reject);
  });

describe.skipIf(!canRunLive)('Zoom Meeting Manager, live', () => {
  const children: ChildProcess[] = [];
  const helper = createHelper();
  let participants: null | ReturnType<typeof participantsApi> = null;
  let ownParticipants = false;

  beforeAll(async () => {
    const started = await helper.start();
    if (!started.ok) {
      throw new Error(`Zoom helper: ${started.error} ${started.detail ?? ''}`);
    }
    globalThis.electronApi.zoomCommand = (command) => helper.request(command);
    await ensureMeeting(helper);
    children.push(openFakeMediaWindow());

    if (participantCount > 0) {
      participants = await findRunningSession();
      if (participants) {
        print('  Reusing the test participants already in the meeting');
      } else {
        const launched = await startParticipants();
        children.push(launched.child);
        participants = participantsApi(launched.port);
        ownParticipants = true;
      }
    }
  });

  afterAll(async () => {
    if (participants && ownParticipants) {
      await participants.call('/quit', {}).catch(() => undefined);
      await sleep(3000);
    }
    children.forEach((child) => child.kill());
    helper.stop();
  });

  it('performs and verifies every Zoom Meeting Manager action', async () => {
    print(`\n  Zoom Meeting Manager self-test (meeting ${meetingId})`);
    const steps = await runZoomSelfTest({
      onProgress: printProgress,
      participants: participants?.probe,
      prepareMediaWindow: async () => () => undefined,
      titles,
    });

    const failed = steps.filter((step) => step.status === 'failed');
    expect(failed.map((step) => `${label(step)}: ${step.detail}`)).toEqual([]);
  });
});
