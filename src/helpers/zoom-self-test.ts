import type {
  ZoomCommandResult,
  ZoomTestParticipant,
  ZoomTestParticipantAction,
} from 'src/types';

import {
  admitZoomParticipants,
  askAllZoomParticipantsToUnmute,
  getZoomMeetingState,
  joinZoomAudio,
  leaveZoomAudio,
  muteAllZoomParticipants,
  runZoomMeetingSequence,
  runZoomPostMeetingSequence,
  setZoomHostVideo,
  startSharingMediaInZoom,
  stopSharingMediaInZoom,
  type ZoomTitles,
} from 'src/helpers/zoom';

// An end-to-end check of the Zoom Meeting Manager against a real Zoom
// meeting: every step performs one action through the same code M³ uses,
// then verifies the result from the host's Zoom window and, when test
// participants are connected, from the participants' side as well.
// Used by the developer "Test Zoom integration" tool in the Zoom popup and
// by the local live test (yarn test:zoom-live).

export const ZOOM_SELF_TEST_STEPS = [
  'meeting',
  'participants-join',
  'leave-audio',
  'join-audio',
  'video-off',
  'video-on',
  'mute-all-locked',
  'mute-all-unlocked',
  'ask-all-to-unmute',
  'meeting-sequence',
  'post-meeting-sequence',
  'share-start',
  'share-stop',
  'restore',
] as const;

export interface ZoomSelfTestOptions {
  onProgress?: (steps: ZoomSelfTestStep[]) => void;
  participants?: ZoomTestParticipantsProbe;
  /**
   * Makes a window titled MEDIA_WINDOW_TITLE visible for the share steps,
   * returning how to put things back.
   */
  prepareMediaWindow?: () => Promise<() => Promise<void> | void>;
  signal?: AbortSignal;
  timeouts?: Partial<typeof DEFAULT_TIMEOUTS>;
  titles: ZoomTitles;
}

export type ZoomSelfTestStatus =
  'failed' | 'passed' | 'pending' | 'running' | 'skipped';

export interface ZoomSelfTestStep {
  detail?: string;
  id: ZoomSelfTestStepId;
  status: ZoomSelfTestStatus;
}

export type ZoomSelfTestStepId = (typeof ZOOM_SELF_TEST_STEPS)[number];

/** i18n keys for the steps' names in reports. */
export const ZOOM_SELF_TEST_STEP_LABELS: Record<ZoomSelfTestStepId, string> = {
  'ask-all-to-unmute': 'zoom-self-test-step-ask-all-to-unmute',
  'join-audio': 'zoom-self-test-step-join-audio',
  'leave-audio': 'zoom-self-test-step-leave-audio',
  meeting: 'zoom-self-test-step-meeting',
  'meeting-sequence': 'zoom-self-test-step-meeting-sequence',
  'mute-all-locked': 'zoom-self-test-step-mute-all-locked',
  'mute-all-unlocked': 'zoom-self-test-step-mute-all-unlocked',
  'participants-join': 'zoom-self-test-step-participants-join',
  'post-meeting-sequence': 'zoom-self-test-step-post-meeting-sequence',
  restore: 'zoom-self-test-step-restore',
  'share-start': 'zoom-self-test-step-share-start',
  'share-stop': 'zoom-self-test-step-share-stop',
  'video-off': 'zoom-self-test-step-video-off',
  'video-on': 'zoom-self-test-step-video-on',
};

/** Controls the test participants (scripts/zoom-live/participants.mjs). */
export interface ZoomTestParticipantsProbe {
  act: (action: ZoomTestParticipantAction) => Promise<void>;
  list: () => Promise<ZoomTestParticipant[]>;
}

const DEFAULT_TIMEOUTS = {
  participantsJoinMs: 240_000,
  pollMs: 500,
  stateChangeMs: 12_000,
};

class StepFailed extends Error {}
class StepSkipped extends Error {}

const fail = (detail: string): never => {
  throw new StepFailed(detail);
};
const skip = (detail: string): never => {
  throw new StepSkipped(detail);
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const expectOk = (result: ZoomCommandResult, what: string) => {
  if (!result.ok) fail(`${what}: ${result.error ?? 'failed'}`);
  return result;
};

export const runZoomSelfTest = async (
  options: ZoomSelfTestOptions,
): Promise<ZoomSelfTestStep[]> => {
  const { onProgress, participants, prepareMediaWindow, signal, titles } =
    options;
  const timeouts = { ...DEFAULT_TIMEOUTS, ...options.timeouts };
  const steps: ZoomSelfTestStep[] = ZOOM_SELF_TEST_STEPS.map((id) => ({
    id,
    status: 'pending',
  }));
  const report = () => onProgress?.(steps.map((step) => ({ ...step })));

  const waitFor = async <T>(
    read: () => Promise<T>,
    isDone: (value: T) => boolean,
    timeoutMs = timeouts.stateChangeMs,
  ): Promise<{ done: boolean; value: T }> => {
    const deadline = Date.now() + timeoutMs;
    let value = await read();
    while (!isDone(value) && Date.now() < deadline && !signal?.aborted) {
      await sleep(timeouts.pollMs);
      value = await read();
    }
    return { done: isDone(value), value };
  };

  const meetingState = async () =>
    (await getZoomMeetingState(true)) ?? fail('The Zoom helper did not answer');

  let participantsReady = false;

  const connectedParticipants = (): ZoomTestParticipantsProbe =>
    participants ?? skip('No test participants connected');

  const readyParticipants = (): ZoomTestParticipantsProbe => {
    const probe = connectedParticipants();
    if (!participantsReady) skip('Test participants did not join');
    return probe;
  };

  const inMeeting = async () =>
    (await connectedParticipants().list()).filter(
      (p) => p.phase === 'in-meeting',
    );

  /** Waits until every participant in the meeting matches `check`. */
  const expectParticipants = async (
    description: string,
    check: (participant: ZoomTestParticipant) => boolean,
  ) => {
    const { done, value } = await waitFor(
      inMeeting,
      (list) => list.length > 0 && list.every(check),
    );
    if (!done) {
      const offenders = value.filter((p) => !check(p)).map((p) => p.name);
      fail(`${description}: not true for ${offenders.join(', ') || 'anyone'}`);
    }
    return `${description} (${value.length} participant${value.length === 1 ? '' : 's'})`;
  };

  const hasEvent = (
    participant: ZoomTestParticipant,
    type: ZoomTestParticipant['events'][number]['type'],
  ) => participant.events.some((event) => event.type === type);

  let restoreMediaWindow: (() => Promise<void> | void) | undefined;
  let initialAudioJoined: boolean | null | undefined;
  let initialVideoTitle: null | string | undefined;

  const requireVideoTitles = () => {
    if (!titles.videoOnTitle || !titles.videoOffTitle) {
      skip('Capture both video button titles in Settings first');
    }
  };

  const expectHostAudio = async (joined: boolean) => {
    const { done } = await waitFor(
      meetingState,
      (state) => state.audioJoined === joined,
    );
    if (!done) fail(`Zoom still shows audio ${joined ? 'left' : 'joined'}`);
  };

  const expectHostVideo = async (title: null | string) => {
    const { done, value } = await waitFor(
      meetingState,
      (state) => state.videoTitle === title,
    );
    if (!done) fail(`Video button reads "${value.videoTitle}"`);
  };

  // Each step resolves to an optional detail line for the report.
  const run: Record<ZoomSelfTestStepId, () => Promise<unknown>> = {
    'ask-all-to-unmute': async () => {
      const probe = readyParticipants();
      await probe.act('mute');
      await probe.act('reset-events');
      await probe.act('accept-unmute-requests');
      expectOk(await askAllZoomParticipantsToUnmute(), 'Ask all to unmute');
      return expectParticipants(
        'Everyone was asked to unmute and did',
        (p) => hasEvent(p, 'unmute-requested') && p.micMuted === false,
      );
    },
    'join-audio': async () => {
      expectOk(await joinZoomAudio(), 'Join audio');
      await expectHostAudio(true);
    },
    'leave-audio': async () => {
      expectOk(await leaveZoomAudio(), 'Leave audio');
      await expectHostAudio(false);
    },
    meeting: async () => {
      const state = await meetingState();
      if (!state.found) fail('No Zoom meeting window found');
      initialAudioJoined = state.audioJoined;
      initialVideoTitle = state.videoTitle;
      return state.title;
    },
    'meeting-sequence': async () => {
      const result = await runZoomMeetingSequence(titles);
      if (!result.ok) fail(`Failed steps: ${result.failedSteps.join(', ')}`);
      await expectHostAudio(true);
      if (titles.videoOnTitle) await expectHostVideo(titles.videoOnTitle);
      if (!participants || !participantsReady) return 'Host side only';
      await participants.act('reset-events');
      await expectParticipants('Everyone is muted', (p) => p.micMuted === true);
      await participants.act('try-unmute');
      return expectParticipants(
        'Nobody can unmute themselves',
        (p) => hasEvent(p, 'unmute-blocked') && p.micMuted === true,
      );
    },
    'mute-all-locked': async () => {
      const probe = readyParticipants();
      await probe.act('reset-events');
      expectOk(await muteAllZoomParticipants(false), 'Mute everyone');
      await expectParticipants('Everyone is muted', (p) => p.micMuted === true);
      await probe.act('try-unmute');
      return expectParticipants(
        'Nobody can unmute themselves',
        (p) => hasEvent(p, 'unmute-blocked') && p.micMuted === true,
      );
    },
    'mute-all-unlocked': async () => {
      const probe = readyParticipants();
      await probe.act('reset-events');
      expectOk(await muteAllZoomParticipants(true), 'Mute everyone');
      await expectParticipants('Everyone is muted', (p) => p.micMuted === true);
      await probe.act('try-unmute');
      return expectParticipants(
        'Everyone could unmute themselves',
        (p) => p.micMuted === false,
      );
    },
    'participants-join': async () => {
      const probe = connectedParticipants();
      const admitted = new Set<string>();
      const { value } = await waitFor(
        async () => {
          const list = await probe.list();
          const waiting = list
            .filter((p) => p.phase === 'waiting-room')
            .map((p) => p.name);
          if (waiting.some((name) => !admitted.has(name))) {
            const result = await admitZoomParticipants(waiting);
            result.admitted?.forEach((name) => admitted.add(name));
          }
          return list;
        },
        (list) =>
          list.length > 0 &&
          list.every((p) => p.phase === 'in-meeting' || p.phase === 'blocked'),
        timeouts.participantsJoinMs,
      );
      const joined = value.filter((p) => p.phase === 'in-meeting');
      const blocked = value.filter((p) => p.phase === 'blocked');
      participantsReady = joined.length > 0;
      if (!participantsReady) {
        fail(
          blocked.length
            ? 'Zoom turned the test participants away'
            : 'No test participant reached the meeting',
        );
      }
      return `${joined.length}/${value.length} in the meeting${blocked.length ? ` (${blocked.length} turned away by Zoom)` : ''}`;
    },
    'post-meeting-sequence': async () => {
      if (participants && participantsReady) {
        await participants.act('mute');
        await participants.act('reset-events');
        await participants.act('accept-unmute-requests');
      }
      const result = await runZoomPostMeetingSequence(titles);
      if (!result.ok) fail(`Failed steps: ${result.failedSteps.join(', ')}`);
      await expectHostAudio(false);
      if (titles.videoOffTitle) await expectHostVideo(titles.videoOffTitle);
      if (!participants || !participantsReady) return 'Host side only';
      return expectParticipants(
        'Everyone was asked to unmute and did',
        (p) => hasEvent(p, 'unmute-requested') && p.micMuted === false,
      );
    },
    restore: async () => {
      if (initialAudioJoined) await joinZoomAudio();
      if (initialVideoTitle && titles.videoOnTitle && titles.videoOffTitle) {
        await setZoomHostVideo(
          initialVideoTitle === titles.videoOnTitle,
          titles,
        );
      }
    },
    'share-start': async () => {
      const prepare = prepareMediaWindow ?? skip('No media window to share');
      restoreMediaWindow = await prepare();
      if (!(await startSharingMediaInZoom(titles.shareButtonTitle))) {
        fail('Sharing did not start');
      }
      const { done } = await waitFor(meetingState, (state) => state.sharing);
      if (!done) fail('Zoom does not show a share in progress');
    },
    'share-stop': async () => {
      if (!restoreMediaWindow) skip('Sharing was not started');
      try {
        if (!(await stopSharingMediaInZoom())) fail('Sharing did not stop');
        const { done } = await waitFor(meetingState, (state) => !state.sharing);
        if (!done) fail('Zoom still shows a share in progress');
      } finally {
        await restoreMediaWindow?.();
        restoreMediaWindow = undefined;
      }
    },
    'video-off': async () => {
      requireVideoTitles();
      expectOk(await setZoomHostVideo(false, titles), 'Turn video off');
      await expectHostVideo(titles.videoOffTitle);
    },
    'video-on': async () => {
      requireVideoTitles();
      expectOk(await setZoomHostVideo(true, titles), 'Turn video on');
      await expectHostVideo(titles.videoOnTitle);
    },
  };

  let meetingFound = true;

  for (const step of steps) {
    if (signal?.aborted || !meetingFound) {
      step.status = 'skipped';
      step.detail = signal?.aborted ? 'Stopped' : 'No Zoom meeting';
      continue;
    }
    step.status = 'running';
    report();
    try {
      const detail = await run[step.id]();
      step.status = 'passed';
      step.detail = typeof detail === 'string' && detail ? detail : undefined;
    } catch (error) {
      if (error instanceof StepSkipped) {
        step.status = 'skipped';
        step.detail = error.message;
      } else {
        step.status = 'failed';
        step.detail = error instanceof Error ? error.message : String(error);
      }
      if (step.id === 'meeting' && step.status === 'failed') {
        meetingFound = false;
      }
    }
    report();
  }

  await restoreMediaWindow?.();
  return steps;
};
