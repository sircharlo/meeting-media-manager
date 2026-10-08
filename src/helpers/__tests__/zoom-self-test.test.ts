import type {
  ZoomCommandResult,
  ZoomTestParticipant,
  ZoomTestParticipantAction,
} from 'src/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  runZoomSelfTest,
  type ZoomSelfTestStep,
  type ZoomTestParticipantsProbe,
} from '../zoom-self-test';

// A small simulated Zoom meeting, so the self-test's own logic (what it
// checks after each action, and when it skips or gives up) can be tested
// without Zoom.
const world = {
  allowSelfUnmute: true,
  audioJoined: true,
  found: true,
  participants: [] as ZoomTestParticipant[],
  sharing: false,
  videoOn: true,
};

const ok = (changed = true): ZoomCommandResult => ({ changed, ok: true });

const muteAll = (allow: boolean) => {
  world.allowSelfUnmute = allow;
  world.participants.forEach((p) => (p.micMuted = true));
  return ok();
};

const askAllToUnmute = () => {
  world.participants.forEach((p) => {
    p.events.push({ at: Date.now(), type: 'unmute-requested' });
    if (p.unmuteRequestPolicy === 'accept') p.micMuted = false;
  });
  return ok();
};

vi.mock('src/helpers/zoom', () => ({
  admitZoomParticipants: vi.fn(async (names: string[]) => {
    world.participants
      .filter((p) => names.includes(p.name))
      .forEach((p) => (p.phase = 'in-meeting'));
    return { admitted: names, ok: true };
  }),
  askAllZoomParticipantsToUnmute: vi.fn(async () => askAllToUnmute()),
  getZoomMeetingState: vi.fn(async () => ({
    audioJoined: world.audioJoined,
    found: world.found,
    sharing: world.sharing,
    title: 'Zoom Meeting',
    videoTitle: world.videoOn ? 'Stop Video' : 'Start Video',
  })),
  joinZoomAudio: vi.fn(async () => {
    world.audioJoined = true;
    return ok();
  }),
  leaveZoomAudio: vi.fn(async () => {
    world.audioJoined = false;
    return ok();
  }),
  muteAllZoomParticipants: vi.fn(async (allow: boolean) => muteAll(allow)),
  runZoomMeetingSequence: vi.fn(async () => {
    world.audioJoined = true;
    world.videoOn = true;
    muteAll(false);
    return { failedSteps: [], ok: true };
  }),
  runZoomPostMeetingSequence: vi.fn(async () => {
    world.audioJoined = false;
    world.videoOn = false;
    muteAll(true);
    askAllToUnmute();
    return { failedSteps: [], ok: true };
  }),
  setZoomHostVideo: vi.fn(async (on: boolean) => {
    world.videoOn = on;
    return ok();
  }),
  startSharingMediaInZoom: vi.fn(async () => {
    world.sharing = true;
    return true;
  }),
  stopSharingMediaInZoom: vi.fn(async () => {
    world.sharing = false;
    return true;
  }),
}));

const probe: ZoomTestParticipantsProbe = {
  act: async (action: ZoomTestParticipantAction) => {
    world.participants.forEach((p) => {
      if (action === 'mute') p.micMuted = true;
      if (action === 'reset-events') p.events = [];
      if (action === 'accept-unmute-requests') p.unmuteRequestPolicy = 'accept';
      if (action === 'try-unmute') {
        if (world.allowSelfUnmute) p.micMuted = false;
        else p.events.push({ at: Date.now(), type: 'unmute-blocked' });
      }
    });
  },
  list: async () => world.participants.map((p) => ({ ...p })),
};

const TITLES = {
  shareButtonTitle: 'Share',
  videoOffTitle: 'Start Video',
  videoOnTitle: 'Stop Video',
};

const FAST = { participantsJoinMs: 200, pollMs: 5, stateChangeMs: 100 };

const statuses = (steps: ZoomSelfTestStep[]) =>
  Object.fromEntries(steps.map((step) => [step.id, step.status]));

beforeEach(() => {
  Object.assign(world, {
    allowSelfUnmute: true,
    audioJoined: true,
    found: true,
    participants: ['M3 Test 1', 'M3 Test 2'].map((name) => ({
      events: [],
      micMuted: false,
      name,
      phase: 'waiting-room' as const,
      unmuteRequestPolicy: 'accept' as const,
    })),
    sharing: false,
    videoOn: true,
  });
});

describe('runZoomSelfTest', () => {
  it('passes every step against a meeting that behaves', async () => {
    const restore = vi.fn();
    const steps = await runZoomSelfTest({
      participants: probe,
      prepareMediaWindow: async () => restore,
      timeouts: FAST,
      titles: TITLES,
    });

    expect(steps.filter((step) => step.status !== 'passed')).toEqual([]);
    expect(restore).toHaveBeenCalledOnce();
    // Put back the way it was found.
    expect(world.audioJoined).toBe(true);
    expect(world.videoOn).toBe(true);
    expect(world.sharing).toBe(false);
  });

  it('fails a step when participants can still unmute themselves after a locked mute', async () => {
    const { muteAllZoomParticipants } = await import('src/helpers/zoom');
    vi.mocked(muteAllZoomParticipants).mockImplementationOnce(async () =>
      muteAll(true),
    );

    const steps = await runZoomSelfTest({
      participants: probe,
      timeouts: FAST,
      titles: TITLES,
    });

    const step = steps.find((s) => s.id === 'mute-all-locked');
    expect(step?.status).toBe('failed');
    expect(step?.detail).toContain('Nobody can unmute themselves');
  });

  it('skips participant and video steps it has no way to check', async () => {
    const steps = await runZoomSelfTest({
      timeouts: FAST,
      titles: {
        shareButtonTitle: null,
        videoOffTitle: null,
        videoOnTitle: null,
      },
    });

    expect(statuses(steps)).toMatchObject({
      'ask-all-to-unmute': 'skipped',
      'join-audio': 'passed',
      'leave-audio': 'passed',
      meeting: 'passed',
      'mute-all-locked': 'skipped',
      'participants-join': 'skipped',
      'share-start': 'skipped',
      'video-off': 'skipped',
    });
  });

  it('stops early when no Zoom meeting is open', async () => {
    world.found = false;
    const progress = vi.fn();

    const steps = await runZoomSelfTest({
      onProgress: progress,
      timeouts: FAST,
      titles: TITLES,
    });

    expect(steps[0]).toMatchObject({ id: 'meeting', status: 'failed' });
    expect(steps.slice(1).every((step) => step.status === 'skipped')).toBe(
      true,
    );
    expect(progress).toHaveBeenCalled();
  });

  it('reports participants that Zoom turned away', async () => {
    world.participants.forEach((p) => (p.phase = 'blocked'));

    const steps = await runZoomSelfTest({
      participants: probe,
      timeouts: FAST,
      titles: TITLES,
    });

    expect(steps.find((s) => s.id === 'participants-join')).toMatchObject({
      detail: 'Zoom turned the test participants away',
      status: 'failed',
    });
    expect(steps.find((s) => s.id === 'mute-all-locked')?.status).toBe(
      'skipped',
    );
  });
});
