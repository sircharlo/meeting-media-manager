import type {
  ZoomTestParticipantsRequest,
  ZoomTestParticipantsResponse,
} from 'src/types';

import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { IS_DEV } from 'src-electron/constants';
import { getHelperPath } from 'src-electron/main/zoom-helper-manager';
import { log } from 'src/shared/vanilla';

// Development builds only: drives scripts/zoom-live/participants.mjs, which
// joins test participants to the Zoom test meeting from .env.zoom-test, for
// the "Test Zoom integration" developer tool in the Zoom popup.

const START_TIMEOUT_MS = 15_000;

let child: ChildProcessWithoutNullStreams | null = null;
let port: null | number = null;

const readTestMeetingId = (): string | undefined => {
  try {
    const env = readFileSync(getHelperPath('.env.zoom-test'), 'utf8');
    return /^ZOOM_TEST_MEETING_ID=(.*)$/m.exec(env)?.[1]?.trim();
  } catch {
    return undefined;
  }
};

const stop = async () => {
  if (port) {
    await fetch(`http://127.0.0.1:${port}/quit`, { method: 'POST' }).catch(
      () => undefined,
    );
  }
  child?.kill();
  child = null;
  port = null;
};

const start = async (count: number): Promise<ZoomTestParticipantsResponse> => {
  await stop();
  const scriptPath = getHelperPath('scripts/zoom-live/participants.mjs');
  const participantsProcess = spawn(
    'node',
    [scriptPath, String(count), '--exit-with-parent'],
    { cwd: getHelperPath('') },
  );
  child = participantsProcess;

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

export const stopZoomTestParticipants = () => {
  void stop();
};
