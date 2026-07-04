import robot from '@jitsi/robotjs';

/**
 * Taps a key (optionally with modifier keys held down) using robotjs.
 * This is the only robotjs capability exposed to the renderer; the full
 * module (which also allows mouse control and screen pixel reads) is
 * intentionally not exposed across the context bridge.
 * @param key The key to tap
 * @param modifiers Modifier keys to hold while tapping
 */
export const sendKeyTap = (key: string, modifiers?: string[]) => {
  robot.keyTap(key, modifiers);
};
