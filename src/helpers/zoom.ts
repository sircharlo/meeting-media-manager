import type { SettingsValues, ZoomUIElement } from 'src/types';

import { Dialog } from 'quasar';
import { ZOOM_CONTROL_IDS } from 'src/constants/zoom';
import { delay } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';

import { errorCatcher } from './error-catcher';
import { sendKeyboardShortcut } from './keyboard-shortcuts';

const {
  clickZoomElement,
  getZoomDialogChildren,
  getZoomElementTitle,
  listZoomWindows,
} = globalThis.electronApi;

/**
 * Capture a Zoom button title and save it to settings
 */
export const captureZoomButtonTitle = async (
  settingKey: keyof SettingsValues,
  controlId: string,
) => {
  try {
    const windows = await listZoomWindows();
    if (!windows?.[0]) {
      throw new Error('No Zoom window found');
    }

    const title = await getZoomElementTitle(windows[0].handle, controlId);
    if (title) {
      const currentState = useCurrentStateStore();
      if (currentState.currentSettings) {
        // @ts-expect-error - dynamically setting key
        currentState.currentSettings[settingKey] = title;
        Dialog.create({ message: `Successfully captured title: ${title}` });
      }
    } else {
      Dialog.create({ message: `Failed to capture title for ${controlId}` });
    }
  } catch (error) {
    errorCatcher(error);
  }
};

/**
 * Helper to click a Zoom element by its control ID
 */
const clickById = async (
  handle: number,
  controlId: string,
  options: Partial<ZoomUIElement> = {},
) => {
  await clickZoomElement(handle, { control_id: controlId, ...options });
};

/**
 * Click a button only if its current title matches the expected one
 */
const clickIfTitleMatches = async (
  handle: number,
  controlId: string,
  targetTitle: null | string | undefined,
) => {
  if (!targetTitle) {
    await clickById(handle, controlId);
    return;
  }
  const currentTitle = await getZoomElementTitle(handle, controlId);
  if (currentTitle === targetTitle) {
    await clickById(handle, controlId);
    return true;
  }
  return false;
};

/**
 * Helper to join computer audio
 */
const joinAudio = async (meetingHandle: number) => {
  console.log(' [Zoom Automation] Joining computer audio');
  const currentState = useCurrentStateStore();

  // 1. Click on btn_muteAudio (which doubles as join audio when not joined)
  // Only click if it matches the "Join audio" title (if configured)
  const clicked = await clickIfTitleMatches(
    meetingHandle,
    ZOOM_CONTROL_IDS.BTN_MUTE_AUDIO,
    currentState.currentSettings?.zoomAudioNotJoinedTitle,
  );

  if (!clicked) {
    console.log(' [Zoom Automation] Already joined audio or title mismatch');
    return;
  }

  console.warn('Clicked on btn_muteAudio');

  // 2. Wait for join audio window to appear
  await delay(1000);
  const windows = await listZoomWindows();
  console.warn('Windows found:', windows);
  const joinAudioWnd = windows.find(
    (w) => w.class_name === 'zJoinAudioWndClass',
  );

  if (joinAudioWnd) {
    // 3. Click btn_connectAudio in that window
    await clickById(joinAudioWnd.handle, ZOOM_CONTROL_IDS.BTN_CONNECT_AUDIO);
  }
};

/**
 * Helper to leave computer audio
 */
const leaveAudio = async (meetingHandle: number) => {
  const currentState = useCurrentStateStore();
  const joinAudioTitle = currentState.currentSettings?.zoomAudioNotJoinedTitle;

  if (joinAudioTitle) {
    const currentTitle = await getZoomElementTitle(
      meetingHandle,
      ZOOM_CONTROL_IDS.BTN_MUTE_AUDIO,
    );
    if (currentTitle === joinAudioTitle) {
      console.log(
        ' [Zoom Automation] Skipping leave audio: Not currently joined',
      );
      return;
    }
  }

  console.warn(' [Zoom Automation] Leaving computer audio');
  // 1. Click on btn_audioMenu
  await clickById(meetingHandle, ZOOM_CONTROL_IDS.BTN_AUDIO_MENU);

  // 2. Wait for menu to open
  await delay(1000);

  // 3. Narrow search to descendants of the menu dialog (WCN_ModelessWnd)
  const children = await getZoomDialogChildren(
    'WCN_ModelessWnd',
    meetingHandle,
  );
  console.warn(' [Zoom Automation] Menu children:', children);

  const menuItems = children.filter(
    (c) => c.control_type === 'MenuItem' && c.is_enabled !== false,
  );
  console.warn(' [Zoom Automation] Menu items:', menuItems);

  if (menuItems.length >= 2) {
    // Zoom menu usually has "Leave Computer Audio" as the before-last item when connected
    const leaveBtn = menuItems.at(-2);
    console.warn(leaveBtn);
    if (leaveBtn) {
      // Use meetingHandle as the target window for the click, but specific element handle
      // Also pass the title as a fallback for handle-less elements
      await clickZoomElement(meetingHandle, {
        handle: leaveBtn.handle,
        title: leaveBtn.title,
      });
    }
  }
};

/**
 * Automates Zoom settings for when a meeting is about to start
 * (Triggered when background music stops)
 */
export const automateZoomMeetingSettings = async () => {
  try {
    const currentState = useCurrentStateStore();
    if (
      !currentState.currentSettings
        ?.zoomMeetingManagerAutomateMeetingAudioSettings
    ) {
      return;
    }

    const zoomWindows = await listZoomWindows();
    if (!zoomWindows?.[0]) return;

    const handle = zoomWindows[0].handle;
    console.log(' [Zoom Automation] Starting meeting settings sequence');

    // 1. Join computer audio
    await joinAudio(handle);

    // 2. Turn on host video (if currently off)
    await clickIfTitleMatches(
      handle,
      ZOOM_CONTROL_IDS.BTN_MUTE_VIDEO,
      currentState.currentSettings?.zoomVideoOffTitle,
    );

    // // 3. Mute everyone & disable unmute
    // await clickById(handle, ZOOM_CONTROL_IDS.BTN_PARTICIPANTS);
    // // Wait for panel to open
    // await new Promise((resolve) => {
    //   setTimeout(resolve, 500);
    // });
    // await clickById(handle, ZOOM_CONTROL_IDS.MUTE_ALL_BTN);

    // // The "Mute All" button usually shows a dialog.
    // // We might need to send "Enter" to confirm or click a specific button in that dialog.
    // // Assuming the dialog has the focus or we can target it.
    // await new Promise((resolve) => {
    //   setTimeout(resolve, 500);
    // });
    // sendKeyboardShortcut('Enter', 'Zoom');

    console.log(' [Zoom Automation] Meeting settings sequence completed');
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'automateZoomMeetingSettings' } },
    });
  }
};

/**
 * Automates Zoom settings for before or after a meeting
 * (Triggered when background music starts)
 */
export const automateZoomPostMeetingSettings = async () => {
  try {
    const currentState = useCurrentStateStore();
    if (
      !currentState.currentSettings
        ?.zoomMeetingManagerAutomateMeetingAudioSettings
    ) {
      return;
    }

    const zoomWindows = await listZoomWindows();
    if (!zoomWindows?.[0]) return;

    const handle = zoomWindows[0].handle;
    console.log(' [Zoom Automation] Starting post-meeting settings sequence');

    // 1. Leave computer audio
    await leaveAudio(handle);

    // 2. Turn off host video (if currently on)
    await clickIfTitleMatches(
      handle,
      ZOOM_CONTROL_IDS.BTN_MUTE_VIDEO,
      currentState.currentSettings?.zoomVideoOnTitle,
    );

    // // 3. Allow everyone to unmute & Ask all to unmute
    // await clickById(handle, ZOOM_CONTROL_IDS.BTN_PARTICIPANTS);
    // await delay(500);

    // // "Ask All to Unmute" often appears in the same place as "Mute All" but with different state.
    // await clickById(handle, ZOOM_CONTROL_IDS.MUTE_ALL_BTN);

    console.log(' [Zoom Automation] Post-meeting settings sequence completed');
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'automateZoomPostMeetingSettings' } },
    });
  }
};

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
      console.log(
        ` [Zoom] ${startSharing ? 'Starting' : 'Stopping'} screen sharing with shortcut: ${zoomScreenShareShortcut}`,
      );

      // Send the keyboard shortcut
      sendKeyboardShortcut(zoomScreenShareShortcut, 'Zoom');

      console.log(` [Zoom] Screen sharing shortcut sent successfully`);

      // Only attempt to focus media window if the setting is enabled
      if (zoomAutoFocusMediaWindow) {
        // Helper function to focus the media window with error handling
        const { focusMediaWindow } = globalThis.electronApi;
        function triggerFocusMediaWindow(context = '') {
          try {
            focusMediaWindow();
            console.log(` [Zoom] Media window focus requested${context}`);
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
