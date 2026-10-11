import type {
  SettingsValues,
  ZoomCommand,
  ZoomCommandResult,
  ZoomCommandType,
  ZoomDiagnosis,
  ZoomMeetingState,
} from 'src/types';

import { i18n } from 'boot/i18n';
import { Dialog } from 'quasar';
import { MEDIA_WINDOW_TITLE } from 'src/constants/zoom';
import { log } from 'src/shared/vanilla';
import { areZoomButtonsLearned } from 'src/utils/zoom';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomStateStore } from 'stores/zoom-state';

import { errorCatcher } from './error-catcher';
import { sendKeyboardShortcut } from './keyboard-shortcuts';
import { toggleMediaWindowVisibility } from './mediaPlayback';
import {
  updateChecklistFromZoom,
  type ZoomChecklistState,
} from './meeting-quick-actions';
import { createTemporaryNotification } from './notifications';

// The Zoom Meeting Manager drives the Zoom desktop app through a UI
// Automation helper (src-electron/zoom-helper), which performs each action
// below in one go. Every action resolves to a ZoomCommandResult rather than
// throwing, so a missing Zoom window or a Zoom update never breaks M³'s own
// flows.

const t = (key: string, named?: Record<string, unknown>) =>
  (i18n.global.t as (key: string, named?: Record<string, unknown>) => string)(
    key,
    named ?? {},
  );

export interface ZoomTitles {
  /** Name of the microphone button while the host is muted. */
  micOffTitle: null | string;
  /** Name of the microphone button while the host is unmuted. */
  micOnTitle: null | string;
  /** Name of the Share entry in the user's Zoom language. */
  shareButtonTitle: null | string;
  /** Name of the video button while the host's video is off. */
  videoOffTitle: null | string;
  /** Name of the video button while the host's video is on. */
  videoOnTitle: null | string;
}

const getSettings = () => useCurrentStateStore().currentSettings;

const saveSetting = (settingKey: keyof SettingsValues, value: string) => {
  const settings = getSettings();
  if (!settings) return;
  (settings as Record<keyof SettingsValues, unknown>)[settingKey] = value;
};

export const getZoomTitlesFromSettings = (): ZoomTitles => {
  const settings = getSettings();
  return {
    micOffTitle: settings?.zoomMicOffTitle ?? null,
    micOnTitle: settings?.zoomMicOnTitle ?? null,
    shareButtonTitle: settings?.zoomShareButtonTitle ?? null,
    videoOffTitle: settings?.zoomVideoOffTitle ?? null,
    videoOnTitle: settings?.zoomVideoOnTitle ?? null,
  };
};

// --- Runs: telling the user, and letting them stop it ------------------------

// Zoom actions that only read (no mouse, no focus): they never show the
// "M³ is operating Zoom" overlay. Everything else may move the mouse (hover-
// only buttons, menus, bringing Zoom's toolbar back) or the focus.
const SILENT_COMMANDS = new Set<ZoomCommandType>([
  'participants',
  'ping',
  'raised-hands',
]);

const isSilentCommand = (command: ZoomCommand) =>
  SILENT_COMMANDS.has(command.type) ||
  (command.type === 'meeting' && !command.reveal);

/** What the overlay says about a single Zoom action, by its type. */
const COMMAND_STEP_KEYS: Partial<Record<ZoomCommandType, string>> = {
  admit: 'zoom-self-test-step-participants-join',
  'ask-all-to-unmute': 'zoom-self-test-step-ask-all-to-unmute',
  diagnose: 'zoom-setup-checks-title',
  'join-audio': 'zoom-self-test-step-join-audio',
  'learn-hand-raised': 'zoom-run-learn-hand',
  'leave-audio': 'zoom-self-test-step-leave-audio',
  'lower-participant-hand': 'zoom-run-lower-hand',
  meeting: 'zoom-self-test-step-meeting',
  'mute-all': 'zoom-self-test-step-mute-all-unlocked',
  'set-mic': 'zoom-run-host-mic',
  'set-participant-mic': 'zoom-run-participant-mic',
  'set-video': 'zoom-run-host-video',
  'share-entries': 'zoom-run-share-entries',
  'start-share': 'zoom-self-test-step-share-start',
  'stop-share': 'zoom-self-test-step-share-stop',
  'test-share-picker': 'zoom-setup-share-checking',
  'toggle-mic': 'zoom-run-host-mic',
  'toggle-video': 'zoom-run-host-video',
};

const CANCELLED: ZoomCommandResult = { error: 'cancelled', ok: false };

/**
 * Runs a Zoom automation made of several actions under one overlay label
 * (nested runs keep the outermost label). The overlay shows for as long as
 * `run` takes, and a cancel request makes every further action a no-op.
 */
export const withZoomRun = async <T>(
  labelKey: string,
  run: () => Promise<T>,
): Promise<T> => {
  const zoomState = useZoomStateStore();
  zoomState.beginRun(labelKey);
  try {
    return await run();
  } finally {
    zoomState.endRun();
  }
};

export const isZoomRunCancelled = () => useZoomStateStore().cancelRequested;

/**
 * Stops the running automation: nothing further is sent to Zoom, and the
 * action in flight is cut short by restarting the helper (which releases
 * the mouse at once). Wired to the overlay's button, Esc, and the global
 * zoomCancelAutomationShortcut.
 */
export const cancelZoomRun = async () => {
  const zoomState = useZoomStateStore();
  if (!zoomState.runActive || zoomState.cancelRequested) return;
  zoomState.requestCancel();
  log('Zoom automation cancelled by the user', 'zoom', 'warn');
  try {
    await globalThis.electronApi.restartZoomHelper();
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'cancelZoomRun' } } });
  }
  createTemporaryNotification({
    group: 'zoom-run',
    icon: 'mmm-info',
    message: t('zoom-run-cancelled'),
    type: 'warning',
  });
};

const runCommand = async (command: ZoomCommand): Promise<ZoomCommandResult> => {
  if (isSilentCommand(command)) return sendCommand(command);

  const zoomState = useZoomStateStore();
  if (zoomState.cancelRequested) return CANCELLED;
  return withZoomRun(
    COMMAND_STEP_KEYS[command.type] ?? 'zoom-run-generic',
    async () => {
      zoomState.setRunStep(COMMAND_STEP_KEYS[command.type] ?? null);
      const result = await sendCommand(command);
      return zoomState.cancelRequested ? CANCELLED : result;
    },
  );
};

const sendCommand = async (
  command: ZoomCommand,
): Promise<ZoomCommandResult> => {
  try {
    const result = await globalThis.electronApi.zoomCommand(command);
    if (!result.ok) {
      log(`Zoom action failed: ${command.type}`, 'zoom', 'warn', result);
    }
    return result;
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { command: command.type, name: 'runZoomCommand' } },
    });
    return { error: 'ipc-failed', ok: false };
  }
};

let feedbackMuted = 0;

/**
 * Runs Zoom actions without their per-action notifications and without
 * ticking the meeting checklist, e.g. for a self-test, which reports its own
 * results and puts Zoom back as it found it.
 */
export const withoutZoomFeedback = async <T>(run: () => Promise<T>) => {
  feedbackMuted++;
  try {
    return await run();
  } finally {
    feedbackMuted--;
  }
};

const notifyInfo = (group: string, messageKey: string) => {
  if (feedbackMuted) return;
  createTemporaryNotification({
    group,
    icon: 'mmm-info',
    message: t(messageKey),
    type: 'info',
  });
};

const notifyFailure = (group: string, messageKey: string) => {
  if (feedbackMuted) return;
  createTemporaryNotification({
    group,
    icon: 'mmm-error',
    message: t(messageKey),
    type: 'negative',
  });
};

/** Ticks (or unticks) the meeting checklist items an action did (or undid). */
const updateChecklist = (state: ZoomChecklistState) => {
  if (feedbackMuted) return;
  updateChecklistFromZoom(state);
};

/**
 * The Zoom meeting's state. With `reveal`, Zoom's auto-hidden toolbar is
 * brought back (moving the mouse over the meeting) so the audio and video
 * states can be read; without it, nothing on screen changes.
 */
export const getZoomMeetingState = async (
  reveal = false,
): Promise<null | ZoomMeetingState> => {
  const result = await runCommand({ reveal, type: 'meeting' });
  return result.ok ? (result.meeting ?? null) : null;
};

// --- Individual steps ------------------------------------------------------

export const joinZoomAudio = async () => {
  const result = await runCommand({ type: 'join-audio' });
  if (result.ok) {
    notifyInfo(
      'zoom-audio',
      result.changed ? 'zoom-audio-joined' : 'zoom-audio-already-joined',
    );
    updateChecklist({ audioJoined: true });
  }
  return result;
};

export const leaveZoomAudio = async () => {
  const result = await runCommand({ type: 'leave-audio' });
  if (result.ok) {
    if (result.changed) notifyInfo('zoom-audio', 'zoom-audio-left');
    // Out of computer audio, nothing from the hall reaches Zoom either.
    updateChecklist({ audioJoined: false, hostMicOn: false });
  }
  return result;
};

/** Unmutes or mutes the host's microphone (computer audio has to be joined). */
export const setZoomHostMic = async (
  on: boolean,
  titles: Pick<
    ZoomTitles,
    'micOffTitle' | 'micOnTitle'
  > = getZoomTitlesFromSettings(),
) => {
  const result = await runCommand({
    offTitle: titles.micOffTitle,
    on,
    onTitle: titles.micOnTitle,
    type: 'set-mic',
  });
  if (result.ok) {
    if (result.changed) {
      notifyInfo('zoom-host', on ? 'zoom-host-mic-on' : 'zoom-host-mic-off');
    }
    updateChecklist({ hostMicOn: on });
  }
  return result;
};

export const setZoomHostVideo = async (
  on: boolean,
  titles: Pick<
    ZoomTitles,
    'videoOffTitle' | 'videoOnTitle'
  > = getZoomTitlesFromSettings(),
) => {
  const result = await runCommand({
    offTitle: titles.videoOffTitle,
    on,
    onTitle: titles.videoOnTitle,
    type: 'set-video',
  });
  if (result.ok) {
    if (result.changed) {
      notifyInfo(
        'zoom-host',
        on ? 'zoom-host-video-on' : 'zoom-host-video-off',
      );
    }
    updateChecklist({ hostVideoOn: on });
  }
  return result;
};

export const muteAllZoomParticipants = async (allowSelfUnmute: boolean) => {
  const result = await runCommand({ allowSelfUnmute, type: 'mute-all' });
  if (result.ok) {
    notifyInfo(
      'zoom-participants-permissions',
      allowSelfUnmute
        ? 'zoom-participants-unmute-allowed'
        : 'zoom-participants-unmute-disallowed',
    );
    notifyInfo('zoom-participants', 'zoom-participants-muted');
    updateChecklist({
      participantsCanUnmute: allowSelfUnmute,
      participantsMuted: true,
    });
  }
  return result;
};

/** Admits participants from the waiting room, by name. */
export const admitZoomParticipants = (names: string[]) =>
  runCommand({ names, type: 'admit' });

/**
 * How many people are in the meeting, the host included (not counting the
 * waiting room), or null if Zoom's participants list couldn't be read.
 */
export const countZoomMeetingParticipants = async () => {
  const result = await runCommand({ type: 'participants' });
  if (!result.ok || !result.participants) return null;
  return result.participants.filter((row) => row.section === 'meeting').length;
};

export const askAllZoomParticipantsToUnmute = async () => {
  const result = await runCommand({ type: 'ask-all-to-unmute' });
  if (result.ok) {
    notifyInfo('zoom-participants', 'zoom-participants-asked-to-unmute');
    updateChecklist({ participantsMuted: false });
  }
  return result;
};

// --- Raised hands -------------------------------------------------------------

/**
 * Learns how Zoom marks a raised hand in the user's language, by raising
 * and lowering the host's own hand, and saves it to Settings.
 */
export const learnZoomHandRaisedPhrase = async () => {
  const result = await runCommand({ type: 'learn-hand-raised' });
  if (result.ok && result.phrase) {
    saveSetting('zoomHandRaisedPhrase', result.phrase);
    if (result.lowerHandTitle) {
      saveSetting('zoomLowerHandTitle', result.lowerHandTitle);
    }
    if (!feedbackMuted) {
      createTemporaryNotification({
        group: 'zoom-settings',
        icon: 'mmm-check',
        message: t('zoom-hand-learned', { phrase: result.phrase }),
        type: 'positive',
      });
    }
  } else {
    notifyFailure('zoom-settings', 'zoom-hand-learn-failed');
  }
  return result;
};

/**
 * Who in the meeting has their hand raised, or null if Zoom's participants
 * list couldn't be read (no meeting, or the phrase isn't learned yet).
 */
export const getZoomRaisedHands = async (): Promise<null | string[]> => {
  const result = await runCommand({
    phrase: getSettings()?.zoomHandRaisedPhrase ?? null,
    type: 'raised-hands',
  });
  if (!result.ok || !result.raisedHands) return null;
  return result.raisedHands;
};

/**
 * Unmutes one participant (or asks them to, where Zoom only allows that),
 * going by their exact name in the participants list. Nothing is pressed if
 * the name is missing, shared by two people, or they're already unmuted.
 */
export const unmuteZoomParticipant = async (name: string) => {
  const settings = getSettings();
  const result = await runCommand({
    lowerHandTitle: settings?.zoomLowerHandTitle ?? null,
    micOffTitle: settings?.zoomMicOffTitle ?? null,
    micOnTitle: settings?.zoomMicOnTitle ?? null,
    name,
    on: true,
    type: 'set-participant-mic',
  });
  if (!result.ok) {
    notifyNamedFailure('zoom-hand-unmute-failed', name, result.error);
    return result;
  }
  createTemporaryNotification({
    group: 'zoom-participants',
    icon: 'mmm-microphone',
    message: t(
      result.pressed
        ? 'zoom-hand-unmute-requested'
        : 'zoom-hand-already-unmuted',
      { name },
    ),
    type: 'info',
  });
  return result;
};

/**
 * When a participant is done speaking: mutes them (if they aren't already)
 * and lowers their hand. Each step only touches that participant's own row.
 */
export const muteZoomParticipantAndLowerHand = async (name: string) => {
  const settings = getSettings();
  const muted = await runCommand({
    lowerHandTitle: settings?.zoomLowerHandTitle ?? null,
    micOffTitle: settings?.zoomMicOffTitle ?? null,
    micOnTitle: settings?.zoomMicOnTitle ?? null,
    name,
    on: false,
    type: 'set-participant-mic',
  });
  if (!muted.ok) {
    notifyNamedFailure('zoom-hand-mute-failed', name, muted.error);
    return muted;
  }
  const lowered = await runCommand({
    lowerHandTitle: settings?.zoomLowerHandTitle ?? null,
    name,
    phrase: settings?.zoomHandRaisedPhrase ?? null,
    type: 'lower-participant-hand',
  });
  if (!lowered.ok) {
    notifyNamedFailure('zoom-hand-lower-failed', name, lowered.error);
    return lowered;
  }
  createTemporaryNotification({
    group: 'zoom-participants',
    icon: 'mmm-microphone-off',
    message: t('zoom-hand-muted-and-lowered', { name }),
    type: 'info',
  });
  return lowered;
};

const notifyNamedFailure = (
  messageKey: string,
  name: string,
  error: string | undefined,
) => {
  const reasonKey =
    error === 'participant-name-ambiguous'
      ? 'zoom-hand-name-ambiguous'
      : error === 'participant-not-found'
        ? 'zoom-hand-participant-gone'
        : error === 'mic-titles-not-captured'
          ? 'zoom-hand-mic-not-learned'
          : error === 'lower-hand-not-learned' ||
              error === 'lower-hand-item-not-found'
            ? 'zoom-hand-lower-not-learned'
            : error === 'participant-mic-button-not-found'
              ? 'zoom-hand-mic-ambiguous'
              : null;
  createTemporaryNotification({
    caption: reasonKey ? t(reasonKey) : undefined,
    group: 'zoom-participants',
    icon: 'mmm-error',
    message: t(messageKey, { name }),
    type: 'negative',
  });
};

// --- Automations and the startup check ---------------------------------------

let zoomCheckInProgress: null | Promise<unknown> = null;

/**
 * Runs a check of the Zoom Meeting Manager. The automations wait for it to
 * finish, since it uses Zoom too (and may pause them).
 */
export const runWhileHoldingZoomAutomations = async <T>(
  check: () => Promise<T>,
): Promise<T> => {
  const running = check();
  zoomCheckInProgress = running;
  try {
    return await running;
  } finally {
    if (zoomCheckInProgress === running) zoomCheckInProgress = null;
  }
};

/**
 * Whether the automations may act now: once any check in progress is done,
 * unless a failed check paused them.
 */
const zoomAutomationsAllowed = async (what: string) => {
  if (zoomCheckInProgress) await zoomCheckInProgress.catch(() => undefined);
  if (!useZoomStateStore().automationsPaused) return true;
  log(`${what}: skipped, Zoom automations are paused`, 'zoom', 'warn');
  return false;
};

// --- Sequences -------------------------------------------------------------

export interface ZoomSequenceResult {
  failedSteps: string[];
  ok: boolean;
}

// The microphone and the video need their button names learned by the setup
// assistant; without them, M³ leaves those as they are rather than counting
// the whole sequence as failed.
const NOT_LEARNED_ERRORS = new Set([
  'mic-titles-not-captured',
  'video-titles-not-captured',
]);

const runSequence = async (
  name: string,
  labelKey: string,
  steps: [string, () => Promise<ZoomCommandResult>][],
): Promise<ZoomSequenceResult> => {
  const meeting = await getZoomMeetingState();
  if (!meeting?.found) {
    log(`${name}: no Zoom meeting window found`, 'zoom', 'warn');
    return { failedSteps: ['meeting'], ok: false };
  }

  log(`${name}: starting`, 'zoom', 'info');
  return withZoomRun(labelKey, async () => {
    const failedSteps: string[] = [];
    for (const [step, run] of steps) {
      if (isZoomRunCancelled()) {
        failedSteps.push(step);
        continue;
      }
      const result = await run();
      if (!result.ok && !NOT_LEARNED_ERRORS.has(result.error ?? '')) {
        failedSteps.push(step);
      }
    }
    if (failedSteps.length && !isZoomRunCancelled()) {
      notifyFailure('zoom-automation', 'zoom-automation-failed');
    }
    log(`${name}: finished`, 'zoom', 'info', { failedSteps });
    return { failedSteps, ok: failedSteps.length === 0 };
  });
};

/** Joins computer audio, unmutes the host's microphone, turns on the host
 * video, and mutes everyone without letting them unmute. */
export const runZoomMeetingSequence = (
  titles: ZoomTitles = getZoomTitlesFromSettings(),
) =>
  runSequence('Zoom meeting settings', 'zoom-run-meeting-sequence', [
    ['join-audio', joinZoomAudio],
    ['mic-on', () => setZoomHostMic(true, titles)],
    ['video-on', () => setZoomHostVideo(true, titles)],
    ['mute-all', () => muteAllZoomParticipants(false)],
  ]);

/** Leaves computer audio, turns off the host video, and lets everyone unmute
 * again, asking them to. */
export const runZoomPostMeetingSequence = (
  titles: ZoomTitles = getZoomTitlesFromSettings(),
) =>
  runSequence(
    'Zoom before/after-meeting settings',
    'zoom-run-post-meeting-sequence',
    [
      ['leave-audio', leaveZoomAudio],
      ['video-off', () => setZoomHostVideo(false, titles)],
      // Zoom only offers "allow participants to unmute themselves" in the
      // mute-everyone dialog, so muting everyone is how it gets turned back on.
      ['mute-all', () => muteAllZoomParticipants(true)],
      ['ask-all-to-unmute', askAllZoomParticipantsToUnmute],
    ],
  );

/**
 * Applies the in-meeting Zoom settings, if enabled.
 * (Triggered when background music stops just before a meeting.)
 */
export const automateZoomMeetingSettings = async () => {
  if (!getSettings()?.zoomMeetingManagerAutomateMeetingAudioSettings) return;
  if (!(await zoomAutomationsAllowed('Zoom meeting settings'))) return;
  await runZoomMeetingSequence();
};

/**
 * Applies the before/after-meeting Zoom settings, if enabled.
 * (Triggered when background music starts.)
 */
export const automateZoomPostMeetingSettings = async () => {
  if (!getSettings()?.zoomMeetingManagerAutomatePostMeetingAudioSettings) {
    return;
  }
  if (!(await zoomAutomationsAllowed('Zoom before/after-meeting settings'))) {
    return;
  }
  await runZoomPostMeetingSequence();
};

export const autoLaunchZoomMeetingIfNeeded = async (
  timeUntilMeetingSeconds?: number,
) => {
  const settings = getSettings();
  if (!settings?.zoomMeetingManagerEnable) return;
  if (!settings.zoomMeetingManagerAutoLaunchMeeting) return;

  const meetingId = settings.zoomMeetingManagerMeetingId?.trim();
  if (!meetingId) return;

  if (
    typeof timeUntilMeetingSeconds === 'number' &&
    timeUntilMeetingSeconds <= 0
  ) {
    return;
  }

  if (!(await zoomAutomationsAllowed('Zoom meeting auto-launch'))) return;

  const meeting = await getZoomMeetingState();
  if (meeting?.found) return;

  log('Auto-launching Zoom meeting before meeting start', 'zoom', 'info', {
    meetingId,
    timeUntilMeetingSeconds,
  });
  globalThis.electronApi.launchZoomMeeting(meetingId);
};

// --- Screen sharing --------------------------------------------------------

const MEDIA_WINDOW_SETTLE_MS = 1500;

/**
 * Shows M³'s media window, if hidden, so Zoom offers it for sharing in a
 * test; resolves to how to put it back.
 */
export const prepareMediaWindowForZoomTest = async () => {
  const wasVisible = useCurrentStateStore().mediaWindowVisible;
  if (!wasVisible) {
    toggleMediaWindowVisibility(true);
    await new Promise((resolve) => {
      setTimeout(resolve, MEDIA_WINDOW_SETTLE_MS);
    });
  }
  return () => {
    if (!wasVisible) toggleMediaWindowVisibility(false);
  };
};

/**
 * Starts sharing M³'s media window in Zoom, with computer sound and the
 * "optimize for video" option on.
 */
export const startSharingMediaInZoom = async (
  shareButtonTitle: null | string = getZoomTitlesFromSettings()
    .shareButtonTitle,
) => {
  const result = await runCommand({
    shareButtonTitle,
    type: 'start-share',
    windowTitle: MEDIA_WINDOW_TITLE,
  });
  if (result.ok) {
    if (result.changed) notifyInfo('zoom-sharing', 'zoom-sharing-started');
  } else {
    notifyFailure('zoom-sharing', 'zoom-sharing-failed');
  }
  return result.ok;
};

/** Stops sharing in Zoom. */
export const stopSharingMediaInZoom = async () => {
  const result = await runCommand({ type: 'stop-share' });
  if (result.ok) {
    if (result.changed) notifyInfo('zoom-sharing', 'zoom-sharing-stopped');
  } else {
    notifyFailure('zoom-sharing', 'zoom-sharing-stop-failed');
  }
  return result.ok;
};

/**
 * Starts or stops sharing the media window in Zoom as media starts or
 * stops, unless the Zoom automations are paused. Resolves to whether it did.
 */
export const automateZoomMediaSharing = async (start: boolean) => {
  if (!(await zoomAutomationsAllowed('Zoom media sharing'))) return false;
  return withZoomRun(
    start ? 'zoom-run-media-sharing-start' : 'zoom-run-media-sharing-stop',
    () => (start ? startSharingMediaInZoom() : stopSharingMediaInZoom()),
  );
};

// --- Setup assistant -------------------------------------------------------

/**
 * Whether the Zoom Meeting Manager is turned on but hasn't been through the
 * setup assistant (its microphone and camera button names are what the
 * assistant learns).
 */
export const isZoomSetupNeeded = () => {
  const settings = getSettings();
  return (
    !!settings?.zoomMeetingManagerEnable && !areZoomButtonsLearned(settings)
  );
};

/** Everything the Zoom Meeting Manager relies on, as found in Zoom now. */
export const diagnoseZoom = async (): Promise<null | ZoomDiagnosis> => {
  const result = await runCommand({ type: 'diagnose' });
  return result.ok ? (result.diagnosis ?? null) : null;
};

/**
 * Learns a two-state button's name in both states (Zoom only shows them in
 * the user's language): switches it once, then back, and saves both names
 * to Settings.
 * @param isOn What the user says the button's state is right now.
 */
const learnButtonTitles = async (
  what: 'mic' | 'video',
  isOn: boolean,
  settingKeys: { off: keyof SettingsValues; on: keyof SettingsValues },
): Promise<{ error?: string; ok: boolean }> => {
  const toggle = what === 'mic' ? 'toggle-mic' : 'toggle-video';
  const switched = await runCommand({ type: toggle });
  if (!switched.ok || !switched.before || !switched.after) {
    return { error: switched.error ?? `${what}-not-changed`, ok: false };
  }
  const back = await runCommand({ type: toggle });
  if (!back.ok || back.after !== switched.before) {
    return { error: back.error ?? `${what}-not-restored`, ok: false };
  }
  saveSetting(settingKeys.on, isOn ? switched.before : switched.after);
  saveSetting(settingKeys.off, isOn ? switched.after : switched.before);
  return { ok: true };
};

/**
 * Learns the camera button's names: switches the camera once, then back.
 * @param cameraIsOn What the user says their camera is doing right now.
 */
export const learnZoomVideoTitles = (cameraIsOn: boolean) =>
  learnButtonTitles('video', cameraIsOn, {
    off: 'zoomVideoOffTitle',
    on: 'zoomVideoOnTitle',
  });

/**
 * Learns the microphone button's names: mutes or unmutes once, then back.
 * Computer audio has to be joined first (see joinZoomAudioForSetup).
 * @param micIsOn What the user says their microphone is doing right now.
 */
export const learnZoomMicTitles = (micIsOn: boolean) =>
  learnButtonTitles('mic', micIsOn, {
    off: 'zoomMicOffTitle',
    on: 'zoomMicOnTitle',
  });

/**
 * Joins computer audio for the setup assistant, without a notification or
 * the meeting checklist: Zoom only has a microphone button once joined.
 * Resolves to whether computer audio is joined.
 */
export const joinZoomAudioForSetup = async () =>
  (await runCommand({ type: 'join-audio' })).ok;

/**
 * Checks that Zoom's share picker opens through the given Share entry (or
 * Zoom's default shortcut, if none) and offers M³'s media window, without
 * sharing anything.
 */
export const testZoomShareEntry = async (shareButtonTitle: null | string) => {
  const result = await runCommand({
    shareButtonTitle,
    type: 'test-share-picker',
    windowTitle: MEDIA_WINDOW_TITLE,
  });
  return {
    error: result.error,
    opened: !!result.opened,
    windowListed: !!result.windowListed,
    windowSelected: !!result.windowSelected,
  };
};

/** Toolbar and "More" menu entries, to pick the Share entry from. */
export const getZoomShareEntries = async (): Promise<{
  more: string[];
  toolbar: string[];
}> => {
  const result = await runCommand({ type: 'share-entries' });
  if (!result.ok) return { more: [], toolbar: [] };
  return { more: result.moreEntries ?? [], toolbar: result.entries ?? [] };
};

// --- Capturing Zoom's translated names into Settings -----------------------

/**
 * Saves a button's current name, which Zoom only exposes in the user's Zoom
 * language, as its name for the state being captured.
 */
const captureButtonTitle = async (
  command: 'mic-title' | 'video-title',
  settingKey: keyof SettingsValues,
) => {
  const result = await runCommand({ type: command });
  if (result.ok && result.title) {
    saveSetting(settingKey, result.title);
  } else {
    notifyFailure('zoom-settings', 'zoom-capture-failed');
  }
};

export const captureZoomVideoTitle = (
  settingKey: 'zoomVideoOffTitle' | 'zoomVideoOnTitle',
) => captureButtonTitle('video-title', settingKey);

export const captureZoomMicTitle = (
  settingKey: 'zoomMicOffTitle' | 'zoomMicOnTitle',
) => captureButtonTitle('mic-title', settingKey);

/** Lets the user pick which toolbar or "More" entry is Share. */
export const captureZoomShareButtonTitle = async () => {
  const { more, toolbar } = await getZoomShareEntries();
  const entries = [...toolbar, ...more];
  if (entries.length === 0) {
    notifyFailure('zoom-settings', 'zoom-capture-failed');
    return;
  }

  Dialog.create({
    cancel: true,
    message: t('zoom-select-button-message'),
    options: {
      items: entries.map((entry) => ({ label: entry, value: entry })),
      model: '',
      type: 'radio',
    },
    persistent: true,
    title: t('zoom-select-button'),
  }).onOk((entry: string) => {
    if (entry) saveSetting('zoomShareButtonTitle', entry);
  });
};

/**
 * Stops Zoom screen sharing after media, whichever Zoom integration is in
 * use: the Zoom Meeting Manager's own sharing, or else the keyboard shortcut
 * of the older integration. Called both when the user stops media and when
 * a video ends on its own.
 */
export const stopZoomSharingAfterMedia = () => {
  const settings = getSettings();
  if (
    settings?.zoomMeetingManagerEnable &&
    settings.zoomMeetingManagerAutomateMediaSharing
  ) {
    void automateZoomMediaSharing(false);
  } else {
    triggerZoomScreenShare(false);
  }
};

// --- Keyboard-shortcut screen sharing (the older Zoom integration) ---------

/**
 * Triggers the configured Zoom screen sharing shortcut
 * @param startSharing - If true, starts screen sharing. If false, stops screen sharing.
 */
export const triggerZoomScreenShare = (startSharing: boolean) => {
  try {
    const congSettings = useCurrentStateStore();
    if (!congSettings.currentSettings) return;
    const { zoomAutoFocusMediaWindow, zoomEnable, zoomScreenShareShortcut } =
      congSettings.currentSettings;

    // Only proceed if zoom integration is enabled and shortcut is configured
    if (!zoomEnable || !zoomScreenShareShortcut) {
      return;
    }

    const performTrigger = () => {
      log(
        ` [Zoom] ${startSharing ? 'Starting' : 'Stopping'} screen sharing with shortcut: ${zoomScreenShareShortcut}`,
        'zoom',
        'log',
      );

      // Send the keyboard shortcut
      sendKeyboardShortcut(zoomScreenShareShortcut, 'Zoom');

      log(` [Zoom] Screen sharing shortcut sent successfully`, 'zoom', 'log');

      // Only attempt to focus media window if the setting is enabled
      if (zoomAutoFocusMediaWindow) {
        // Helper function to focus the media window with error handling
        const { focusMediaWindow } = globalThis.electronApi;
        function triggerFocusMediaWindow(context = '') {
          try {
            focusMediaWindow();
            log(
              ` [Zoom] Media window focus requested${context}`,
              'zoom',
              'log',
            );
          } catch (focusError) {
            errorCatcher(focusError, {
              contexts: {
                fn: {
                  context,
                  name: 'triggerFocusMediaWindow',
                },
              },
            });
          }
        }

        // Focus immediately to counter potential focus steal
        triggerFocusMediaWindow(' (immediate)');

        // Schedule additional focus attempts to handle unpredictable timing
        const focusDelays = [500, 1000];
        focusDelays.forEach((delay) => {
          setTimeout(() => {
            triggerFocusMediaWindow(
              ` after screen sharing toggle (${delay}ms)`,
            );
          }, delay);
        });
      }
    };

    if (startSharing) {
      setTimeout(performTrigger, 500);
    } else {
      performTrigger();
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: { name: 'triggerZoomScreenShare', startSharing },
      },
    });
  }
};
