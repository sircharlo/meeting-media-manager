import type { BrowserWindow } from 'electron';

import { getAllScreens } from 'main/screen';
import { getIconPath } from 'main/utils';
import { createWindow } from 'main/window/window-base';
import { HD_RESOLUTION, PLATFORM } from 'src-electron/constants';

export let timerWindow: BrowserWindow | null = null;

/**
 * Creates the timer window
 */
export function createTimerWindow() {
  // If the window is already open, just focus it
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.show();
    return;
  }

  // Create the browser window
  timerWindow = createWindow('timer', {
    alwaysOnTop: false,
    backgroundColor: 'black',
    frame: false,
    height: HD_RESOLUTION[1],
    icon: getIconPath('media-player'), // TODO: change icon
    minHeight: 110,
    minWidth: 195,
    opacity: 1,
    roundedCorners: PLATFORM === 'darwin',
    thickFrame: false,
    title: 'Timer - M³',
    width: HD_RESOLUTION[0],
  });

  // For timer, maybe no aspect ratio, or 16/9 as well? Let's keep for now.

  // Check if only one screen is available and set to windowed mode with HD resolution
  const screens = getAllScreens();
  if (screens.length === 1 && screens[0]) {
    console.log(
      '🔍 [createTimerWindow] Only one screen available, checking if window needs repositioning',
    );

    // Get current window bounds
    const currentBounds = timerWindow.getBounds();
    const screenBounds = screens[0].bounds;

    // Check if current window is already within screen bounds and smaller than screen
    const isSmallerThanScreen =
      currentBounds.width < screenBounds.width &&
      currentBounds.height < screenBounds.height;

    const isWithinScreenBounds =
      currentBounds.x >= screenBounds.x &&
      currentBounds.y >= screenBounds.y &&
      currentBounds.x + currentBounds.width <=
        screenBounds.x + screenBounds.width &&
      currentBounds.y + currentBounds.height <=
        screenBounds.y + screenBounds.height;

    console.log('🔍 [createTimerWindow] Window position check:', {
      currentBounds,
      isSmallerThanScreen,
      isWithinScreenBounds,
      screenBounds,
    });

    // Only reposition if window is not already properly positioned
    if (!isWithinScreenBounds || !isSmallerThanScreen) {
      console.log(
        '🔍 [createTimerWindow] Window needs repositioning, setting to windowed mode with HD resolution',
      );

      // Set windowed bounds to HD resolution
      const maxWidth = screenBounds.width * 0.5; // 50% of screen width
      const maxHeight = screenBounds.height * 0.5; // 50% of screen height

      // Calculate scale to fit HD resolution within screen bounds
      const scaleX = maxWidth / HD_RESOLUTION[0];
      const scaleY = maxHeight / HD_RESOLUTION[1];
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

      const windowedWidth = Math.floor(HD_RESOLUTION[0] * scale);
      const windowedHeight = Math.floor(HD_RESOLUTION[1] * scale);

      // Center the window on the screen
      const x =
        screenBounds.x + Math.floor((screenBounds.width - windowedWidth) / 2);
      const y =
        screenBounds.y + Math.floor((screenBounds.height - windowedHeight) / 2);

      timerWindow.setFullScreen(false);

      timerWindow.setBounds({
        height: windowedHeight,
        width: windowedWidth,
        x,
        y,
      });

      console.log('🔍 [createTimerWindow] Set windowed bounds:', {
        height: windowedHeight,
        scale,
        width: windowedWidth,
        x,
        y,
      });
    } else {
      console.log(
        '🔍 [createTimerWindow] Window already properly positioned, keeping current bounds',
      );
    }
  }

  timerWindow.on('closed', () => {
    timerWindow = null;
  });
}
