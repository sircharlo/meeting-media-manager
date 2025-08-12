import { useCurrentStateStore } from 'stores/current-state';

import { errorCatcher } from './error-catcher';

/**
 * Triggers the configured Zoom screen sharing shortcut
 * @param startSharing - If true, starts screen sharing. If false, stops screen sharing.
 */
export const triggerZoomScreenShare = (startSharing: boolean) => {
  try {
    const congSettings = useCurrentStateStore();
    if (!congSettings.currentSettings) return;
    const { zoomEnable, zoomScreenShareShortcut } =
      congSettings.currentSettings;

    // Only proceed if zoom integration is enabled and shortcut is configured
    if (!zoomEnable || !zoomScreenShareShortcut) {
      return;
    }

    console.log(
      `🎥 [Zoom] ${startSharing ? 'Starting' : 'Stopping'} screen sharing with shortcut: ${zoomScreenShareShortcut}`,
    );

    // Use robotjs to send the configured keyboard shortcut
    const { robot } = window.electronApi;

    // Parse the shortcut string (e.g., "ctrl+shift+s" or "cmd+shift+s")
    const keys = zoomScreenShareShortcut.toLowerCase().split('+');

    // Map common key names to robotjs key names
    const keyMap: Record<string, string> = {
      alt: 'alt',
      backspace: 'backspace',
      cmd: 'command',
      ctrl: 'control',
      delete: 'delete',
      down: 'down',
      end: 'end',
      enter: 'enter',
      escape: 'escape',
      home: 'home',
      left: 'left',
      meta: 'command',
      pagedown: 'pagedown',
      pageup: 'pageup',
      right: 'right',
      shift: 'shift',
      space: 'space',
      tab: 'tab',
      up: 'up',
    };

    // Convert keys to robotjs format
    const robotKeys = keys.map((key: number | string) => keyMap[key] || key);

    // Send the key combination
    if (robotKeys.length === 1) {
      robot.keyTap(robotKeys[0]);
    } else if (robotKeys.length === 2) {
      robot.keyTap(robotKeys[1], [robotKeys[0]]);
    } else if (robotKeys.length === 3) {
      robot.keyTap(robotKeys[2], [robotKeys[0], robotKeys[1]]);
    } else if (robotKeys.length === 4) {
      robot.keyTap(robotKeys[3], [robotKeys[0], robotKeys[1], robotKeys[2]]);
    }

    console.log(`✅ [Zoom] Screen sharing shortcut sent successfully`);
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: { name: 'triggerZoomScreenShare', startSharing },
      },
    });
  }
};
