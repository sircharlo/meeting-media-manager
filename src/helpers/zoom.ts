import type {
  SettingsValues,
  ZoomCommand,
  ZoomCommandResult,
  ZoomMeetingState,
} from 'src/types';

import { i18n } from 'boot/i18n';
import { Dialog } from 'quasar';
import { MEDIA_WINDOW_TITLE } from 'src/constants/zoom';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';

import { errorCatcher } from './error-catcher';
import { sendKeyboardShortcut } from './keyboard-shortcuts';
import { createTemporaryNotification } from './notifications';

// The Zoom Meeting Manager drives the Zoom desktop app through a UI
// Automation helper (uia_helper.py), which performs each action below in
// one go. Every action resolves to a ZoomCommandResult rather than throwing,
// so a missing Zoom window or a Zoom update never breaks M³'s own flows.

const t = (key: string, named?: Record<string, unknown>) =>
  (i18n.global.t as (key: string, named?: Record<string, unknown>) => string)(
    key,
    named ?? {},
  );

export interface ZoomTitles {
  /** Name of the Share entry in the user's Zoom language. */
  shareButtonTitle: null | string;
  /** Name of the video button while the host's video is off. */
  videoOffTitle: null | string;
  /** Name of the video button while the host's video is on. */
  videoOnTitle: null | string;
}

const getSettings = () => useCurrentStateStore().currentSettings;

export const getZoomTitlesFromSettings = (): ZoomTitles => {
  const settings = getSettings();
  return {
    shareButtonTitle: settings?.zoomShareButtonTitle ?? null,
    videoOffTitle: settings?.zoomVideoOffTitle ?? null,
    videoOnTitle: settings?.zoomVideoOnTitle ?? null,
  };
};

const runCommand = async (command: ZoomCommand): Promise<ZoomCommandResult> => {
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

const notifyInfo = (group: string, messageKey: string) => {
  createTemporaryNotification({
    group,
    icon: 'mmm-info',
    message: t(messageKey),
    type: 'info',
  });
};

const notifyFailure = (group: string, messageKey: string) => {
  createTemporaryNotification({
    group,
    icon: 'mmm-error',
    message: t(messageKey),
    type: 'negative',
  });
};

export const getZoomMeetingState =
  async (): Promise<null | ZoomMeetingState> => {
    const result = await runCommand({ type: 'meeting' });
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
  }
  return result;
};

export const leaveZoomAudio = async () => {
  const result = await runCommand({ type: 'leave-audio' });
  if (result.ok && result.changed) notifyInfo('zoom-audio', 'zoom-audio-left');
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
  if (result.ok && result.changed) {
    notifyInfo('zoom-host', on ? 'zoom-host-video-on' : 'zoom-host-video-off');
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
  }
  return result;
};

/** Admits participants from the waiting room, by name. */
export const admitZoomParticipants = (names: string[]) =>
  runCommand({ names, type: 'admit' });

export const askAllZoomParticipantsToUnmute = async () => {
  const result = await runCommand({ type: 'ask-all-to-unmute' });
  if (result.ok) {
    notifyInfo('zoom-participants', 'zoom-participants-asked-to-unmute');
  }
  return result;
};

// --- Sequences -------------------------------------------------------------

export interface ZoomSequenceResult {
  failedSteps: string[];
  ok: boolean;
}

const runSequence = async (
  name: string,
  steps: [string, () => Promise<ZoomCommandResult>][],
): Promise<ZoomSequenceResult> => {
  const meeting = await getZoomMeetingState();
  if (!meeting?.found) {
    log(`${name}: no Zoom meeting window found`, 'zoom', 'warn');
    return { failedSteps: ['meeting'], ok: false };
  }

  log(`${name}: starting`, 'zoom', 'info');
  const failedSteps: string[] = [];
  for (const [step, run] of steps) {
    const result = await run();
    // Video needs titles captured in Settings; without them, M³ leaves the
    // video as is rather than counting the whole sequence as failed.
    if (!result.ok && result.error !== 'video-titles-not-captured') {
      failedSteps.push(step);
    }
  }
  if (failedSteps.length) {
    notifyFailure('zoom-automation', 'zoom-automation-failed');
  }
  log(`${name}: finished`, 'zoom', 'info', { failedSteps });
  return { failedSteps, ok: failedSteps.length === 0 };
};

/** Joins computer audio, turns on the host video, and mutes everyone without
 * letting them unmute. */
export const runZoomMeetingSequence = (
  titles: ZoomTitles = getZoomTitlesFromSettings(),
) =>
  runSequence('Zoom meeting settings', [
    ['join-audio', joinZoomAudio],
    ['video-on', () => setZoomHostVideo(true, titles)],
    ['mute-all', () => muteAllZoomParticipants(false)],
  ]);

/** Leaves computer audio, turns off the host video, and lets everyone unmute
 * again, asking them to. */
export const runZoomPostMeetingSequence = (
  titles: ZoomTitles = getZoomTitlesFromSettings(),
) =>
  runSequence('Zoom before/after-meeting settings', [
    ['leave-audio', leaveZoomAudio],
    ['video-off', () => setZoomHostVideo(false, titles)],
    // Zoom only offers "allow participants to unmute themselves" in the
    // mute-everyone dialog, so muting everyone is how it gets turned back on.
    ['mute-all', () => muteAllZoomParticipants(true)],
    ['ask-all-to-unmute', askAllZoomParticipantsToUnmute],
  ]);

/**
 * Applies the in-meeting Zoom settings, if enabled.
 * (Triggered when background music stops just before a meeting.)
 */
export const automateZoomMeetingSettings = async () => {
  if (!getSettings()?.zoomMeetingManagerAutomateMeetingAudioSettings) return;
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

  const meeting = await getZoomMeetingState();
  if (meeting?.found) return;

  log('Auto-launching Zoom meeting before meeting start', 'zoom', 'info', {
    meetingId,
    timeUntilMeetingSeconds,
  });
  globalThis.electronApi.launchZoomMeeting(meetingId);
};

// --- Screen sharing --------------------------------------------------------

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

// --- Capturing Zoom's translated names into Settings -----------------------

const saveSetting = (settingKey: keyof SettingsValues, value: string) => {
  const settings = getSettings();
  if (!settings) return;
  (settings as Record<keyof SettingsValues, unknown>)[settingKey] = value;
};

/**
 * Saves the video button's current name, which Zoom only exposes in the
 * user's Zoom language, as the name for the video state being captured.
 */
export const captureZoomVideoTitle = async (
  settingKey: 'zoomVideoOffTitle' | 'zoomVideoOnTitle',
) => {
  const result = await runCommand({ type: 'video-title' });
  if (result.ok && result.title) {
    saveSetting(settingKey, result.title);
  } else {
    notifyFailure('zoom-settings', 'zoom-capture-failed');
  }
};

/** Lets the user pick which toolbar or "More" entry is Share. */
export const captureZoomShareButtonTitle = async () => {
  const result = await runCommand({ type: 'share-entries' });
  const entries = result.entries ?? [];
  if (!result.ok || entries.length === 0) {
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
