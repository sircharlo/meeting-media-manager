import type { SettingsValues } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { showMediaWindow } from 'src/helpers/mediaPlayback';
import { useCurrentStateStore } from 'stores/current-state';

const { registerShortcut, unregisterAllShortcuts } = window.electronApi;

const shortcutCallbacks: Partial<Record<keyof SettingsValues, () => void>> = {
  shortcutMediaNext: () => {
    window.dispatchEvent(new CustomEvent<undefined>('shortcutMediaNext'));
  },
  shortcutMediaPauseResume: () => {
    window.dispatchEvent(
      new CustomEvent<undefined>('shortcutMediaPauseResume'),
    );
  },
  shortcutMediaPrevious: () => {
    window.dispatchEvent(new CustomEvent<undefined>('shortcutMediaPrevious'));
  },
  shortcutMediaStop: () => {
    window.dispatchEvent(new CustomEvent<undefined>('shortcutMediaStop'));
  },
  shortcutMediaWindow: () => {
    showMediaWindow();
  },
  shortcutMusic: () => {
    window.dispatchEvent(new CustomEvent<undefined>('toggleMusic'));
  },
};

export const executeShortcut = (shortcutName: keyof SettingsValues) => {
  const callback = shortcutCallbacks[shortcutName];
  if (callback) callback();
  else console.warn('Unknown shortcut', shortcutName);
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
export const isKeyCode = (key: string) =>
  /^([0-9A-Z)!@#%^&*(:+<_>?~{|}";=,\-./`[\\\]']|F1*[1-9]|F10|F2[0-4]|Plus|Space|Tab|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|Esc|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause|PrintScreen)$/.test(
    key,
  );

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
