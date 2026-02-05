import type { SettingsValues } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { isAnyDialogOpen } from 'src/utils/dialog-plugin';
import { useCurrentStateStore } from 'stores/current-state';

const { registerShortcut, unregisterAllShortcuts } = globalThis.electronApi;

const shortcutCallbacks: Partial<Record<keyof SettingsValues, () => void>> = {
  shortcutMediaNext: () => {
    globalThis.dispatchEvent(
      new CustomEvent<{ scrollToSelectedMedia: boolean }>('shortcutMediaNext', {
        detail: {
          scrollToSelectedMedia: true,
        },
      }),
    );
  },
  shortcutMediaPauseResume: () => {
    globalThis.dispatchEvent(
      new CustomEvent<undefined>('shortcutMediaPauseResume'),
    );
  },
  shortcutMediaPrevious: () => {
    globalThis.dispatchEvent(
      new CustomEvent<{ scrollToSelectedMedia: boolean }>(
        'shortcutMediaPrevious',
        {
          detail: {
            scrollToSelectedMedia: true,
          },
        },
      ),
    );
  },
  shortcutMediaStop: () => {
    globalThis.dispatchEvent(new CustomEvent<undefined>('shortcutMediaStop'));
  },
  shortcutMediaWindow: () => {
    toggleMediaWindowVisibility();
  },
  shortcutMusic: () => {
    globalThis.dispatchEvent(new CustomEvent<undefined>('toggleMusic'));
  },
};

export const executeShortcut = (shortcutName: keyof SettingsValues) => {
  // Don't execute shortcuts if any dialog is open
  if (isAnyDialogOpen()) {
    console.log('Shortcut blocked: dialog is open');
    return;
  }

  const callback = shortcutCallbacks[shortcutName];
  if (callback) callback();
  else
    errorCatcher(new Error('Unknown shortcut'), {
      contexts: {
        fn: {
          name: 'executeShortcut',
          shortcutName,
        },
      },
    });
};

export const executeLocalShortcut = (shortcutName: keyof SettingsValues) => {
  // Don't execute shortcuts if any dialog is open
  if (isAnyDialogOpen()) {
    console.log('Local shortcut blocked: dialog is open');
    return;
  }

  const callback = shortcutCallbacks[shortcutName];
  if (callback) callback();
  else
    errorCatcher(new Error('Unknown shortcut'), {
      contexts: {
        fn: {
          name: 'executeLocalShortcut',
          shortcutName,
        },
      },
    });
};

export const getCurrentShortcuts = () => {
  try {
    const currentState = useCurrentStateStore();
    if (!currentState.currentSettings) return [];
    const shortcuts = [];
    for (const shortcutName of Object.keys(shortcutCallbacks)) {
      const shortcutVal =
        currentState.currentSettings[shortcutName as keyof SettingsValues];
      if (shortcutVal) shortcuts.push(shortcutVal);
    }
    return shortcuts;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

// See: https://www.electronjs.org/docs/latest/api/accelerator#available-key-codes
const SINGLE_KEY = /^[0-9A-Z)!@#%^&*(:+<_>?~{|}";=,\-./`[\]\\']$/;
const F_KEY = /^F([1-9]|1\d|2[0-4])$/;

const NAMED_KEYS = new Set([
  'Backspace',
  'Delete',
  'Down',
  'End',
  'Enter',
  'Esc',
  'Escape',
  'Home',
  'Insert',
  'Left',
  'MediaNextTrack',
  'MediaPlayPause',
  'MediaPreviousTrack',
  'MediaStop',
  'PageDown',
  'PageUp',
  'Plus',
  'PrintScreen',
  'Return',
  'Right',
  'Space',
  'Tab',
  'Up',
  'VolumeDown',
  'VolumeMute',
  'VolumeUp',
]);

export const isKeyCode = (key: string) =>
  SINGLE_KEY.test(key) || F_KEY.test(key) || NAMED_KEYS.has(key);

export const registerCustomShortcut = (
  shortcutName: Partial<keyof SettingsValues>,
  keySequence?: string,
) => {
  try {
    const currentState = useCurrentStateStore();
    if (
      !shortcutCallbacks[shortcutName] ||
      !currentState.currentSettings ||
      !currentState.currentSettings[shortcutName] ||
      !currentState.currentSettings?.enableKeyboardShortcuts
    ) {
      return;
    }
    if (!keySequence) {
      keySequence = currentState.currentSettings[shortcutName] as string;
    }
    registerShortcut(shortcutName, keySequence);
  } catch (error) {
    errorCatcher(error);
  }
};

export const registerAllCustomShortcuts = () => {
  console.group('⌨️ Keyboard Shortcuts Registration');
  try {
    const currentState = useCurrentStateStore();
    if (!currentState.currentSettings) {
      console.log('⚠️ No settings available for shortcuts');
      console.groupEnd();
      return;
    }
    unregisterAllCustomShortcuts();
    console.log('⌨️ Registering configured keyboard shortcuts');
    for (const shortcutName of Object.keys(shortcutCallbacks)) {
      registerCustomShortcut(shortcutName as keyof SettingsValues);
    }
    console.log('✅ Keyboard shortcuts registered successfully');
  } catch (error) {
    console.log('❌ Error registering keyboard shortcuts:', error);
    errorCatcher(error);
  } finally {
    console.groupEnd();
  }
};

export const unregisterAllCustomShortcuts = () => {
  console.group('⌨️ Keyboard Shortcuts Unregistration');
  console.log('⌨️ Unregistering all currently active keyboard shortcuts');
  try {
    unregisterAllShortcuts();
    console.log('✅ Keyboard shortcuts unregistered successfully');
  } catch (error) {
    console.log('❌ Error unregistering keyboard shortcuts:', error);
    errorCatcher(error);
  } finally {
    console.groupEnd();
  }
};
