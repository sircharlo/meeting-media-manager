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
  // robotjs' native binding dispatches on argument *count*, not on whether
  // the value is defined: calling keyTap(key, undefined) is treated as
  // "modifiers were passed" and throws "Invalid key flag specified." trying
  // to parse them. Only pass a second argument when modifiers actually exist.
  if (modifiers?.length) {
    robot.keyTap(key, modifiers);
  } else {
    robot.keyTap(key);
  }
};
