import type { SettingsValues } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { showMediaWindow } from 'src/helpers/mediaPlayback';
import { useCurrentStateStore } from 'src/stores/current-state';

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
    window.electronApi.registerShortcut(shortcutName, keySequence);
  } catch (error) {
    errorCatcher(error);
  }
};

export const registerAllCustomShortcuts = () => {
  try {
    const currentState = useCurrentStateStore();
    if (!currentState.currentSettings) return;
    unregisterAllCustomShortcuts();
    for (const shortcutName of Object.keys(shortcutCallbacks)) {
      registerCustomShortcut(shortcutName as keyof SettingsValues);
    }
  } catch (error) {
    errorCatcher(error);
  }
};

export const unregisterAllCustomShortcuts = () => {
  console.warn('Unregistering all shortcuts');
  try {
    window.electronApi.unregisterAllShortcuts();
  } catch (error) {
    errorCatcher(error);
  }
};
