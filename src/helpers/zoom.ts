import { useCurrentStateStore } from 'stores/current-state';

import { errorCatcher } from './error-catcher';
import { sendKeyboardShortcut } from './keyboard-shortcuts';

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

    // Send the keyboard shortcut
    sendKeyboardShortcut(zoomScreenShareShortcut, 'Zoom');

    console.log(`✅ [Zoom] Screen sharing shortcut sent successfully`);

    // Helper function to focus the media window with error handling
    function focusMediaWindow(context = '') {
      try {
        const { focusMediaWindow } = window.electronApi;
        focusMediaWindow();
        console.log(`🎯 [Zoom] Media window focus requested${context}`);
      } catch (focusError) {
        console.warn(`⚠️ [Zoom] Failed to focus media window:`, focusError);
      }
    }

    // Focus immediately to counter potential focus steal
    focusMediaWindow(' (immediate)');

    // Schedule additional focus attempts to handle unpredictable timing
    const focusDelays = [50, 250, 500, 1000];
    focusDelays.forEach((delay) => {
      setTimeout(() => {
        focusMediaWindow(` after screen sharing toggle (${delay}ms)`);
      }, delay);
    });
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: { name: 'triggerZoomScreenShare', startSharing },
      },
    });
  }
};
