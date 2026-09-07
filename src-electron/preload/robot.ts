import robot from '@jitsi/robotjs';

// SEC-12 (full-audit-2026-09-05.md): sendKeyTap is a direct preload->native
// call (not routed through an ipcMain handler), so unlike the rest of this
// app's IPC surface it never passes through isSelf()-style validation. This
// mirrors the exact value space src/helpers/keyboard-shortcuts.ts's
// sendKeyboardShortcut() can ever legitimately produce (itself constrained
// by src/helpers/keyboardShortcuts.ts's isKeyCode()) - normal app usage is
// unaffected, but a compromised renderer can no longer use this as an
// unrestricted synthetic-keystroke-injection primitive. Keep in sync with
// those two files if either's key vocabulary changes.
const SINGLE_KEY = /^[0-9a-z)!@#%^&*(:+<_>?~{|}";=,\-./`[\]\\']$/;
const F_KEY = /^f([1-9]|1\d|2[0-4])$/;
const NAMED_KEYS = new Set([
  'backspace',
  'delete',
  'down',
  'end',
  'enter',
  'esc',
  'escape',
  'home',
  'insert',
  'left',
  'medianexttrack',
  'mediaplaypause',
  'mediaprevioustrack',
  'mediastop',
  'pagedown',
  'pageup',
  'plus',
  'printscreen',
  'return',
  'right',
  'space',
  'tab',
  'up',
  'volumedown',
  'volumemute',
  'volumeup',
]);
const ALLOWED_MODIFIERS = new Set(['alt', 'command', 'control', 'shift']);

const isAllowedKey = (key: string) =>
  SINGLE_KEY.test(key) || F_KEY.test(key) || NAMED_KEYS.has(key);

/**
 * Taps a key (optionally with modifier keys held down) using robotjs.
 * This is the only robotjs capability exposed to the renderer; the full
 * module (which also allows mouse control and screen pixel reads) is
 * intentionally not exposed across the context bridge.
 * @param key The key to tap
 * @param modifiers Modifier keys to hold while tapping
 */
export const sendKeyTap = (key: string, modifiers?: string[]) => {
  if (!isAllowedKey(key)) return;
  const allowedModifiers = modifiers?.filter((modifier) =>
    ALLOWED_MODIFIERS.has(modifier),
  );

  // robotjs' native binding dispatches on argument *count*, not on whether
  // the value is defined: calling keyTap(key, undefined) is treated as
  // "modifiers were passed" and throws "Invalid key flag specified." trying
  // to parse them. Only pass a second argument when modifiers actually exist.
  if (allowedModifiers?.length) {
    robot.keyTap(key, allowedModifiers);
  } else {
    robot.keyTap(key);
  }
};
