import type { SettingsValues, ZoomUIElement } from 'src/types';

import { i18n } from 'boot/i18n';
import { Dialog } from 'quasar';
import { MEDIA_WINDOW_TITLE, ZOOM_CONTROL_IDS } from 'src/constants/zoom';
import { delay } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';

import { errorCatcher } from './error-catcher';
import { sendKeyboardShortcut } from './keyboard-shortcuts';
import { createTemporaryNotification } from './notifications';

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
 * Capture a Zoom tab item title from the "More" panel and save it to settings
 */
export const captureZoomTabTitle = async (settingKey: keyof SettingsValues) => {
  try {
    const mainZoomWindow = await getMainZoomWindow();
    const handle = mainZoomWindow?.handle;
    if (!handle) {
      throw new Error('No Zoom window found');
    }

    await clickById(handle, ZOOM_CONTROL_IDS.BTN_MORE_PANEL_OPTIONS);

    const popupWnd = await waitForWindowByClassName(
      'ZGridMultiLevelPopupWndClass',
    );
    if (!popupWnd?.handle) {
      throw new Error('No More panel popup found');
    }

    const children = await getZoomDialogChildren(
      'ZGridMultiLevelPopupWndClass',
      popupWnd.handle,
    );

    const tabItems = filterElementsByControlType(children, 'TabItem');
    const options = tabItems
      .filter((e) => e.title?.trim())
      .map((e) => ({ label: e.title, value: e.title }));

    if (options.length === 0) {
      createTemporaryNotification({
        group: 'zoom-settings',
        icon: 'mmm-error',
        message: 'No tab items found in the More panel',
        type: 'negative',
      });
      return;
    }

    Dialog.create({
      cancel: true,
      message: (i18n.global.t as (key: string) => string)(
        'zoom-select-button-message',
      ),
      options: {
        items: options,
        model: '',
        type: 'radio',
      },
      persistent: true,
      title: (i18n.global.t as (key: string) => string)('zoom-select-button'),
    }).onOk((data: string) => {
      if (data) {
        const currentState = useCurrentStateStore();
        if (currentState.currentSettings) {
          // @ts-expect-error - dynamically setting key
          currentState.currentSettings[settingKey] = data;
        }
      }
    });
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
    createTemporaryNotification({
      group: 'zoom-audio',
      icon: 'mmm-info',
      message: (i18n.global.t as (key: string) => string)(
        'zoom-audio-already-joined',
      ),
      type: 'info',
    });

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

  createTemporaryNotification({
    group: 'zoom-audio',
    icon: 'mmm-info',
    message: (i18n.global.t as (key: string) => string)('zoom-audio-joined'),
    type: 'info',
  });
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

  // 1. Click on btn_audioMenu
  await clickById(meetingHandle, ZOOM_CONTROL_IDS.BTN_AUDIO_MENU);

  // 2. Wait for menu to open
  const children = await waitForDialogChildren(
    'WCN_ModelessWnd',
    meetingHandle,
  );

  const menuItems = filterElementsByControlType(children, 'MenuItem');

  const enabledMenuItems = filterElementsByEnabledState(menuItems, true);

  if (enabledMenuItems.length >= 2) {
    // Zoom menu usually has "Leave Computer Audio" as the before-last item when connected
    const leaveBtn = enabledMenuItems.at(-2);
    if (leaveBtn) {
      // Use meetingHandle as the target window for the click, but specific element handle
      // Also pass the title as a fallback for handle-less elements
      await clickZoomElement(meetingHandle, {
        handle: leaveBtn.handle,
        title: leaveBtn.title,
      });
      createTemporaryNotification({
        group: 'zoom-audio',
        icon: 'mmm-info',
        message: (i18n.global.t as (key: string) => string)('zoom-audio-left'),
        type: 'info',
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
  const clicked = await globalThis.electronApi.clickZoomElement(meetingHandle, {
    control_id: ZOOM_CONTROL_IDS.BTN_PARTICIPANTS,
  });

  if (!clicked) {
    const currentState = useCurrentStateStore();
    const targetTitle =
      currentState.currentSettings?.zoomParticipantsButtonTitle;
    if (targetTitle) {
      console.log(
        ' [Zoom Automation] Participants button not found, checking More panel',
      );
      await clickById(meetingHandle, ZOOM_CONTROL_IDS.BTN_MORE_PANEL_OPTIONS);

      const popupWnd = await waitForWindowByClassName(
        'ZGridMultiLevelPopupWndClass',
      );
      if (popupWnd?.handle) {
        const clickedTab = await globalThis.electronApi.clickZoomElement(
          popupWnd.handle,
          {
            title: targetTitle,
          },
        );
        if (!clickedTab) {
          console.warn(
            ' [Zoom Automation] Participants tab item not found in More panel',
          );
        }
      }
    }
  }
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

    createTemporaryNotification({
      group: 'zoom-participants-permissions',
      icon: 'mmm-info',
      message: (i18n.global.t as (key: string) => string)(
        shouldAllowUnmute
          ? 'zoom-participants-unmute-allowed'
          : 'zoom-participants-unmute-disallowed',
      ),
      type: 'info',
    });

    // In this dialog, the "Yes" button has the controlID 'btn_rename'
    await clickById(muteAllConfirmWnd.handle, ZOOM_CONTROL_IDS.BTN_RENAME);
    console.log(' [Zoom Automation] Confirmed Mute All');

    createTemporaryNotification({
      group: 'zoom-participants',
      icon: 'mmm-info',
      message: (i18n.global.t as (key: string) => string)(
        'zoom-participants-muted',
      ),
      type: 'info',
    });
  }
};

const turnHostVideoOn = async (handle: number) => {
  const currentState = useCurrentStateStore();
  await clickIfTitleMatches(
    handle,
    ZOOM_CONTROL_IDS.BTN_MUTE_VIDEO,
    currentState.currentSettings?.zoomVideoOffTitle,
  );

  createTemporaryNotification({
    group: 'zoom-host',
    icon: 'mmm-info',
    message: (i18n.global.t as (key: string) => string)('zoom-host-video-on'),
    type: 'info',
  });
};

const turnHostVideoOff = async (handle: number) => {
  const currentState = useCurrentStateStore();
  await clickIfTitleMatches(
    handle,
    ZOOM_CONTROL_IDS.BTN_MUTE_VIDEO,
    currentState.currentSettings?.zoomVideoOnTitle,
  );

  createTemporaryNotification({
    group: 'zoom-host',
    icon: 'mmm-info',
    message: (i18n.global.t as (key: string) => string)('zoom-host-video-off'),
    type: 'info',
  });
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

      createTemporaryNotification({
        group: 'zoom-participants',
        icon: 'mmm-info',
        message: (i18n.global.t as (key: string) => string)(
          'zoom-participants-asked-to-unmute',
        ),
        type: 'info',
      });
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

/**
 * Automatically starts sharing the media player window in Zoom
 */
export const startSharingMediaInZoom = async () => {
  try {
    const mainZoomWindow = await getMainZoomWindow();
    const handle = mainZoomWindow?.handle;
    if (!handle) {
      console.warn(' [Zoom Automation] No main Zoom window found for sharing');
      return;
    }

    console.log(' [Zoom Automation] Starting media sharing sequence');

    createTemporaryNotification({
      group: 'zoom-sharing',
      icon: 'mmm-info',
      message: (i18n.global.t as (key: string) => string)(
        'zoom-sharing-started',
      ),
      type: 'info',
    });

    // 1. Click Start Share
    const shareClicked = await globalThis.electronApi.clickZoomElement(handle, {
      control_id: ZOOM_CONTROL_IDS.BTN_SHARE_SCREEN,
    });

    if (!shareClicked) {
      const currentState = useCurrentStateStore();
      const targetTitle = currentState.currentSettings?.zoomShareButtonTitle;
      if (targetTitle) {
        console.log(
          ' [Zoom Automation] Share button not found, checking More panel',
        );
        await clickById(handle, ZOOM_CONTROL_IDS.BTN_MORE_PANEL_OPTIONS);

        const popupWnd = await waitForWindowByClassName(
          'ZGridMultiLevelPopupWndClass',
        );
        if (popupWnd?.handle) {
          const clickedTab = await globalThis.electronApi.clickZoomElement(
            popupWnd.handle,
            {
              title: targetTitle,
            },
          );
          if (!clickedTab) {
            console.warn(
              ' [Zoom Automation] Share tab item not found in More panel',
            );
            throw new Error('Could not find Share button in More panel');
          }
        }
      } else {
        throw new Error(
          'Share screen button not found and fallback title not configured',
        );
      }
    }

    // 2. Wait for share entrance window
    const shareWnd = await waitForWindowByClassName('ZPShareEntranceClass');
    if (!shareWnd?.handle) return;

    // 3. Find and click Media Player window in the list
    // It might take a moment to populate, so retry a few times
    let clickedMedia = false;
    for (let i = 0; i < 15; i++) {
      clickedMedia = await globalThis.electronApi.clickZoomElement(
        shareWnd.handle,
        { title: MEDIA_WINDOW_TITLE },
      );
      if (clickedMedia) break;
      await delay(200);
    }

    if (!clickedMedia) {
      console.warn(
        ' [Zoom Automation] Could not find media player window to share',
      );
      createTemporaryNotification({
        group: 'zoom-sharing',
        icon: 'mmm-error',
        message: (i18n.global.t as (key: string) => string)(
          'zoom-sharing-failed',
        ),
        type: 'negative',
      });
      return;
    }

    // 4. Ensure Share Sound is checked
    const audioState = await getZoomElementState(
      shareWnd.handle,
      ZOOM_CONTROL_IDS.CHK_SHARE_AUDIO,
    );
    if (audioState?.toggle_state !== 1) {
      await clickById(shareWnd.handle, ZOOM_CONTROL_IDS.CHK_SHARE_AUDIO);
      createTemporaryNotification({
        group: 'zoom-sharing',
        icon: 'mmm-info',
        message: (i18n.global.t as (key: string) => string)(
          'zoom-sharing-audio-enabled',
        ),
        type: 'info',
      });
    }

    // 5. Ensure Optimize for Video is checked
    const videoState = await getZoomElementState(
      shareWnd.handle,
      ZOOM_CONTROL_IDS.CHK_SHARE_VIDEO,
    );
    if (videoState?.toggle_state !== 1) {
      await clickById(shareWnd.handle, ZOOM_CONTROL_IDS.CHK_SHARE_VIDEO);
      createTemporaryNotification({
        group: 'zoom-sharing',
        icon: 'mmm-info',
        message: (i18n.global.t as (key: string) => string)(
          'zoom-sharing-video-optimized',
        ),
        type: 'info',
      });
    }

    // 6. Click Share
    await clickById(shareWnd.handle, ZOOM_CONTROL_IDS.BTN_SHARE_CONFIRM);

    createTemporaryNotification({
      group: 'zoom-sharing',
      icon: 'mmm-info',
      message: (i18n.global.t as (key: string) => string)(
        'zoom-sharing-started',
      ),
      type: 'info',
    });

    console.log(' [Zoom Automation] Media sharing sequence completed');
  } catch (error) {
    createTemporaryNotification({
      group: 'zoom-sharing',
      icon: 'mmm-error',
      message: (i18n.global.t as (key: string) => string)(
        'zoom-sharing-failed',
      ),
      type: 'negative',
    });
    errorCatcher(error, {
      contexts: { fn: { name: 'startSharingMediaInZoom' } },
    });
  }
};

/**
 * Automatically stops sharing the screen in Zoom
 */
export const stopSharingMediaInZoom = async () => {
  try {
    console.log(' [Zoom Automation] Stopping media sharing sequence');

    // Look for the float toolbar
    const floatToolbar = await findWindowByClassName('ZPFloatToolbarClass');
    if (!floatToolbar?.handle) {
      console.warn(' [Zoom Automation] No ZPFloatToolbarClass window found');
      return;
    }

    const children = await getZoomDialogChildren(
      'ZPFloatToolbarClass',
      floatToolbar.handle,
    );
    const buttons = filterElementsByControlType(children, 'Button');
    const enabledButtons = filterElementsByEnabledState(buttons, true);

    // The stop share button is always the last enabled button in this toolbar
    const stopShareBtn = enabledButtons.at(-1);

    if (stopShareBtn) {
      await globalThis.electronApi.clickZoomElement(floatToolbar.handle, {
        handle: stopShareBtn.handle,
        title: stopShareBtn.title,
      });
      console.log(' [Zoom Automation] Stopped sharing');
      createTemporaryNotification({
        group: 'zoom-sharing',
        icon: 'mmm-info',
        message: (i18n.global.t as (key: string) => string)(
          'zoom-sharing-stopped',
        ),
        type: 'info',
      });
    } else {
      console.warn(' [Zoom Automation] Could not find stop share button');
      createTemporaryNotification({
        group: 'zoom-sharing',
        icon: 'mmm-error',
        message: (i18n.global.t as (key: string) => string)(
          'zoom-sharing-stop-failed',
        ),
        type: 'negative',
      });
    }
  } catch (error) {
    createTemporaryNotification({
      group: 'zoom-sharing',
      icon: 'mmm-error',
      message: (i18n.global.t as (key: string) => string)(
        'zoom-sharing-stop-failed',
      ),
      type: 'negative',
    });
    errorCatcher(error, {
      contexts: { fn: { name: 'stopSharingMediaInZoom' } },
    });
  }
};
