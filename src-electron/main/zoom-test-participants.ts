import type {
  ZoomTestParticipant,
  ZoomTestParticipantsRequest,
  ZoomTestParticipantsResponse,
} from 'src/types';

import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { IS_DEV } from 'src-electron/constants';
import { getDevRepoPath } from 'src-electron/main/zoom-helper-manager';
import { log } from 'src/shared/vanilla';
import upath from 'upath';

// Development builds only: drives scripts/zoom-live/participants.mjs, which
// joins test participants to the Zoom test meeting from .env.zoom-test, for
// the "Test Zoom integration" developer tool in the Zoom popup.

const START_TIMEOUT_MS = 15_000;
// Written by participants.mjs while it runs, so participants left running
// on their own (or by the live test) are reused instead of joining again.
const SESSION_FILE = upath.join(
  tmpdir(),
  'm3-zoom-live',
  'participants-session.json',
);

let child: ChildProcessWithoutNullStreams | null = null;
let port: null | number = null;
/** Whether M³ started the participants, and so makes them leave. */
let ownsParticipants = false;

const readTestMeetingId = (): string | undefined => {
  try {
    const env = readFileSync(getDevRepoPath('.env.zoom-test'), 'utf8');
    return /^ZOOM_TEST_MEETING_ID=(.*)$/m
      .exec(env)?.[1]
      ?.trim()
      .replaceAll(/\D/g, '');
  } catch {
    return undefined;
  }
};

const fetchParticipants = async (atPort: number) => {
  const response = await fetch(`http://127.0.0.1:${atPort}/state`);
  return ((await response.json()) as { participants?: ZoomTestParticipant[] })
    .participants;
};

/** A running participants session for the test meeting, if still useful. */
const findRunningSession = async (): Promise<null | number> => {
  try {
    const session = JSON.parse(readFileSync(SESSION_FILE, 'utf8')) as {
      meeting: string;
      port: number;
    };
    const meetingId = readTestMeetingId();
    if (!meetingId) return null;
    const meetingHash = createHash('sha256').update(meetingId).digest('hex');
    if (session.meeting !== meetingHash) return null;
    const list = (await fetchParticipants(session.port)) ?? [];
    return list.some((p) => p.phase !== 'left' && p.phase !== 'blocked')
      ? session.port
      : null;
  } catch {
    return null;
  }
};

const stop = async () => {
  if (port && ownsParticipants) {
    await fetch(`http://127.0.0.1:${port}/quit`, { method: 'POST' }).catch(
      () => undefined,
    );
  }
  if (ownsParticipants) child?.kill();
  child = null;
  port = null;
  ownsParticipants = false;
};

const start = async (count: number): Promise<ZoomTestParticipantsResponse> => {
  await stop();
  const runningPort = await findRunningSession();
  if (runningPort) {
    port = runningPort;
    return { meetingId: readTestMeetingId(), ok: true };
  }

  const participantsProcess = spawn(
    'node',
    [
      getDevRepoPath('scripts/zoom-live/participants.mjs'),
      String(count),
      '--exit-with-parent',
    ],
    { cwd: getDevRepoPath('') },
  );
  child = participantsProcess;
  ownsParticipants = true;

  const ready = new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => resolve(false), START_TIMEOUT_MS);
    participantsProcess.stdout.on('data', (data: Buffer) => {
      const match = /ZOOM_PARTICIPANTS_PORT=(\d+)/.exec(data.toString());
      if (match) {
        port = Number(match[1]);
        clearTimeout(timeout);
        resolve(true);
      }
    });
    participantsProcess.on('close', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
  participantsProcess.stderr.on('data', (data: Buffer) => {
    log(data.toString().trim(), 'zoom', 'debug');
  });
  participantsProcess.on('close', () => {
    if (child === participantsProcess) {
      child = null;
      port = null;
      ownsParticipants = false;
    }
  });

  if (!(await ready)) {
    await stop();
    return { error: 'participants-script-not-started', ok: false };
  }
  return { meetingId: readTestMeetingId(), ok: true };
};

const callScript = async (
  path: string,
  body?: unknown,
): Promise<ZoomTestParticipantsResponse> => {
  if (!port) return { error: 'participants-not-started', ok: false };
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        }),
  });
  const data = (await response.json()) as Omit<
    ZoomTestParticipantsResponse,
    'ok'
  >;
  return { ...data, meetingId: readTestMeetingId(), ok: response.ok };
};

export const handleZoomTestParticipants = async (
  request: ZoomTestParticipantsRequest,
): Promise<ZoomTestParticipantsResponse> => {
  if (!IS_DEV) return { error: 'development-builds-only', ok: false };
  try {
    switch (request.type) {
      case 'action':
        return await callScript('/action', {
          action: request.action,
          index: request.index,
        });
      case 'start':
        return await start(Math.min(Math.max(Math.round(request.count), 1), 5));
      case 'state':
        return await callScript('/state');
      case 'stop':
        await stop();
        return { ok: true };
      default:
        return { error: 'unknown-request', ok: false };
    }
  } catch (error) {
    return { error: String(error), ok: false };
  }
};
