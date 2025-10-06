import { errorCatcher } from './error-catcher';

/**
 * Sends a keyboard shortcut using robotjs
 * @param shortcut - The keyboard shortcut string (e.g., "ctrl+shift+s", "cmd+alt+f4")
 * @param context - Optional context for logging purposes
 */
export const sendKeyboardShortcut = (
  shortcut: null | string | undefined,
  context?: string,
) => {
  if (!shortcut) return;

  try {
    console.log(
      `${context ? `[${context}] ` : ''}Sending keyboard shortcut: ${shortcut}`,
    );

    const { robot } = window.electronApi;

    // Parse the shortcut string (e.g., "ctrl+shift+s" or "cmd+shift+s")
    const keys = shortcut.toLowerCase().split('+');

    // Map common key names to robotjs key names
    const keyMap: Record<string, string> = {
      cmd: 'command',
      ctrl: 'control',
      meta: 'command',
    };

    // Convert keys to robotjs format
    const robotKeys = keys.map((key: string) =>
      (keyMap[key] || key).toString(),
    );

    // Send the key combination
    if (robotKeys.length === 1 && robotKeys[0]) {
      robot.keyTap(robotKeys[0]);
    } else if (robotKeys.length === 2 && robotKeys[0] && robotKeys[1]) {
      robot.keyTap(robotKeys[1], [robotKeys[0]]);
    } else if (
      robotKeys.length === 3 &&
      robotKeys[0] &&
      robotKeys[1] &&
      robotKeys[2]
    ) {
      robot.keyTap(robotKeys[2], [robotKeys[0], robotKeys[1]]);
    } else if (
      robotKeys.length === 4 &&
      robotKeys[0] &&
      robotKeys[1] &&
      robotKeys[2] &&
      robotKeys[3]
    ) {
      robot.keyTap(robotKeys[3], [robotKeys[0], robotKeys[1], robotKeys[2]]);
    } else {
      console.warn(
        `${context ? `[${context}] ` : ''}Unsupported keyboard shortcut format: ${shortcut}`,
      );
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: { context, name: 'sendKeyboardShortcut', shortcut },
      },
    });
  }
};
