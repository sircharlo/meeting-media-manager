import type { SettingsValues, ZoomUIElement } from 'src/types';

import { ZOOM_CONTROL_IDS } from 'src/constants/zoom';
import { delay } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';

import { errorCatcher } from './error-catcher';
import { sendKeyboardShortcut } from './keyboard-shortcuts';

const {
  clickZoomElement,
  getZoomDialogChildren,
  getZoomElementState,
  getZoomElementTitle,
  listZoomWindows,
} = globalThis.electronApi;

const getMainZoomWindow = async () => {
  const windows = await listZoomWindows(true);
  return windows.at(0);
};

/**
 * Capture a Zoom button title and save it to settings
 */
export const captureZoomButtonTitle = async (
  settingKey: keyof SettingsValues,
  controlId: string,
) => {
  try {
    const mainZoomWindow = await getMainZoomWindow();
    if (!mainZoomWindow?.handle) {
      throw new Error('No Zoom window found');
    }

    const title = await getZoomElementTitle(mainZoomWindow.handle, controlId);
    if (title) {
      const currentState = useCurrentStateStore();
      if (currentState.currentSettings) {
        // @ts-expect-error - dynamically setting key
        currentState.currentSettings[settingKey] = title;
      }
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
  const joinAudioWnd = await waitForWindowByClassName('zJoinAudioWndClass');

  if (joinAudioWnd?.handle) {
    // 3. Click btn_connectAudio in that window
    await clickById(joinAudioWnd.handle, ZOOM_CONTROL_IDS.BTN_CONNECT_AUDIO);
  }
};

const filterElementsByControlType = (
  elements: ZoomUIElement[],
  controlType: string,
) => {
  return elements.filter((e) => e.control_type === controlType);
};

const filterElementsByEnabledState = (
  elements: ZoomUIElement[],
  enabledState: boolean,
) => {
  return elements.filter((e) => e.is_enabled === enabledState);
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
  const children = await waitForDialogChildren(
    'WCN_ModelessWnd',
    meetingHandle,
  );

  console.warn(' [Zoom Automation] Menu children:', children);

  const menuItems = filterElementsByControlType(children, 'MenuItem');
  console.warn(' [Zoom Automation] Menu items:', menuItems);

  const enabledMenuItems = filterElementsByEnabledState(menuItems, true);
  console.warn(' [Zoom Automation] Enabled menu items:', enabledMenuItems);

  if (enabledMenuItems.length >= 2) {
    // Zoom menu usually has "Leave Computer Audio" as the before-last item when connected
    const leaveBtn = enabledMenuItems.at(-2);
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

const participantsListIsOpen = async (meetingHandle: number) => {
  const state = await getZoomElementState(
    meetingHandle,
    ZOOM_CONTROL_IDS.PARTICIPANTS_LIST,
  );
  return state;
};

const openParticipantsList = async (meetingHandle: number) => {
  // check if participants list is already open
  const state = await participantsListIsOpen(meetingHandle);
  console.warn(' [Zoom Automation] Participants list state:', state);
  if (state) {
    console.log(' [Zoom Automation] Participants list is already open');
    return;
  }
  await clickById(meetingHandle, ZOOM_CONTROL_IDS.BTN_PARTICIPANTS);
  // Wait for panel to open by checking if the state changes
  while (!(await participantsListIsOpen(meetingHandle))) {
    await delay(100);
  }
};

const findWindowByClassName = async (className: string) => {
  const windows = await listZoomWindows(false, className);
  return windows[0];
};

const waitForWindowByClassName = async (className: string) => {
  let attempts = 0;
  let window = await findWindowByClassName(className);
  while (!window) {
    await delay(100);
    attempts++;
    if (attempts > 100) {
      throw new Error(`Window ${className} not found`);
    }
    window = await findWindowByClassName(className);
  }
  return window;
};

const waitForDialogChildren = async (
  dialogClassName: string,
  parentHandle: number,
) => {
  let attempts = 0;
  let children = await getZoomDialogChildren(dialogClassName, parentHandle);
  while (children.length === 0) {
    await delay(100);
    attempts++;
    if (attempts > 100) {
      throw new Error(`Dialog children not found`);
    }
    children = await getZoomDialogChildren(dialogClassName, parentHandle);
  }
  return children;
};

const muteAllParticipants = async (
  meetingHandle: number,
  preventSelfUnmute: boolean,
) => {
  await openParticipantsList(meetingHandle);
  await clickById(meetingHandle, ZOOM_CONTROL_IDS.MUTE_ALL_BTN);
  const muteAllConfirmWnd = await waitForWindowByClassName(
    'zChangeNameWndClass',
  );

  if (muteAllConfirmWnd?.handle) {
    console.warn(
      ' [Zoom Automation] Mute All confirmation dialog found',
      muteAllConfirmWnd,
    );
    const state = await getZoomElementState(
      muteAllConfirmWnd.handle,
      ZOOM_CONTROL_IDS.CHK_ALLOW_PARTICIPANTS_TO_UNMUTE,
    );
    console.log(' [Zoom Automation] Checkbox state:', state);

    const unmuteCurrentlyAllowed =
      state?.toggle_state === 1 || state?.legacy_state === 16;

    const shouldAllowUnmute = !preventSelfUnmute;

    if (unmuteCurrentlyAllowed === shouldAllowUnmute) {
      console.log(
        `[Zoom Automation] "Allow participants to unmute" already ${
          shouldAllowUnmute ? 'checked' : 'unchecked'
        }`,
      );
    } else {
      await clickById(
        muteAllConfirmWnd.handle,
        ZOOM_CONTROL_IDS.CHK_ALLOW_PARTICIPANTS_TO_UNMUTE,
      );

      console.log(
        `[Zoom Automation] ${
          shouldAllowUnmute ? 'Checked' : 'Unchecked'
        } "Allow participants to unmute"`,
      );
    }

    // In this dialog, the "Yes" button has the controlID 'btn_rename'
    await clickById(muteAllConfirmWnd.handle, ZOOM_CONTROL_IDS.BTN_RENAME);
    console.log(' [Zoom Automation] Confirmed Mute All');
  }
};

const turnHostVideoOn = async (handle: number) => {
  const currentState = useCurrentStateStore();
  await clickIfTitleMatches(
    handle,
    ZOOM_CONTROL_IDS.BTN_MUTE_VIDEO,
    currentState.currentSettings?.zoomVideoOffTitle,
  );
};

const turnHostVideoOff = async (handle: number) => {
  const currentState = useCurrentStateStore();
  await clickIfTitleMatches(
    handle,
    ZOOM_CONTROL_IDS.BTN_MUTE_VIDEO,
    currentState.currentSettings?.zoomVideoOnTitle,
  );
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

    const mainZoomWindow = await getMainZoomWindow();
    const handle = mainZoomWindow?.handle;
    if (!handle) {
      console.warn(' [Zoom Automation] No main Zoom window found');
      return;
    }

    console.log(' [Zoom Automation] Starting meeting settings sequence');

    // 1. Join computer audio
    await joinAudio(handle);

    // 2. Turn on host video (if currently off)
    await turnHostVideoOn(handle);

    // 3. Mute everyone and prevent self-unmuting
    await muteAllParticipants(handle, true);

    console.log(' [Zoom Automation] Meeting settings sequence completed');
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'automateZoomMeetingSettings' } },
    });
  }
};

const askAllToUnmute = async (handle: number) => {
  await openParticipantsList(handle);
  await clickById(handle, ZOOM_CONTROL_IDS.BTN_MORE_PARTICIPANTS_OPTIONS);
  // Wait for the menu to open
  const menuItems = await waitForDialogChildren('WCN_ModelessWnd', handle);

  if (menuItems) {
    console.warn(' [Zoom Automation] Menu items:', menuItems);

    const enabledMenuItems = filterElementsByEnabledState(menuItems, true);
    console.warn(' [Zoom Automation] Enabled menu items:', enabledMenuItems);

    if (enabledMenuItems?.[0]) {
      // Click on the first enabled menu item, which is "Ask all participants to unmute"
      await clickZoomElement(handle, enabledMenuItems[0]);
      console.log(' [Zoom Automation] Asked all participants to unmute');
    }
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

    const mainZoomWindow = await getMainZoomWindow();
    const handle = mainZoomWindow?.handle;
    if (!handle) {
      console.warn(' [Zoom Automation] No handle found for main Zoom window');
      return;
    }

    console.log(' [Zoom Automation] Starting post-meeting settings sequence');

    // 1. Leave computer audio
    await leaveAudio(handle);

    // 2. Turn off host video (if currently on)
    await turnHostVideoOff(handle);

    // 3. Allow everyone to unmute (by muting first)
    await muteAllParticipants(handle, false);

    // 4. Ask all to unmute
    await askAllToUnmute(handle);

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
