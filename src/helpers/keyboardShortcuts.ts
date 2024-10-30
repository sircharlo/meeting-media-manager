import type { SettingsValues } from 'src/types';

import { storeToRefs } from 'pinia';
import { electronApi } from 'src/helpers/electron-api';
import { showMediaWindow } from 'src/helpers/mediaPlayback';
import { useCurrentStateStore } from 'src/stores/current-state';

import { errorCatcher } from './error-catcher';
const { registerShortcut, unregisterShortcut } = electronApi;

const shortcutCallbacks: Partial<Record<keyof SettingsValues, () => void>> = {
  shortcutMediaNext: () => {
    window.dispatchEvent(new CustomEvent('shortcutMediaNext'));
  },
  shortcutMediaPauseResume: () => {
    window.dispatchEvent(new CustomEvent('shortcutMediaPauseResume'));
  },
  shortcutMediaPrevious: () => {
    window.dispatchEvent(new CustomEvent('shortcutMediaPrevious'));
  },
  shortcutMediaStop: () => {
    window.dispatchEvent(new CustomEvent('shortcutMediaStop'));
  },
  shortcutMediaWindow: () => {
    showMediaWindow();
  },
  shortcutMusic: () => {
    window.dispatchEvent(new CustomEvent('toggleMusic'));
  },
};

const executeShortcut = (shortcutName: keyof SettingsValues) => {
  const callback = shortcutCallbacks[shortcutName];
  if (callback) callback();
  else console.warn('Unknown shortcut', shortcutName);
};

const getCurrentShortcuts = () => {
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
const isKeyCode = (key: string) =>
  /^([0-9A-Z)!@#%^&*(:+<_>?~{|}";=,\-./`[\\\]']|F1*[1-9]|F10|F2[0-4]|Plus|Space|Tab|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|Esc|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause|PrintScreen)$/.test(
    key,
  );

const registerCustomShortcut = (
  shortcutName: Partial<keyof SettingsValues>,
  keySequence?: string,
) => {
  try {
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    if (
      !shortcutCallbacks[shortcutName] ||
      !currentSettings.value ||
      !currentSettings.value[shortcutName] ||
      !currentSettings.value?.enableKeyboardShortcuts
    )
      return;
    if (!keySequence)
      keySequence = currentSettings.value[shortcutName] as string;
    registerShortcut(shortcutName, keySequence);
  } catch (error) {
    errorCatcher(error);
  }
};

const registerAllCustomShortcuts = () => {
  try {
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    if (!currentSettings.value) return;
    unregisterAllCustomShortcuts();
    for (const shortcutName of Object.keys(shortcutCallbacks)) {
      registerCustomShortcut(shortcutName as keyof SettingsValues);
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const unregisterAllCustomShortcuts = () => {
  try {
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    if (!currentSettings.value) return;
    for (const shortcutName of Object.keys(
      shortcutCallbacks,
    ) as (keyof SettingsValues)[]) {
      if (!shortcutName || !currentSettings.value[shortcutName]) continue;
      unregisterShortcut(currentSettings.value[shortcutName] as string);
    }
  } catch (error) {
    errorCatcher(error);
  }
};

export {
  executeShortcut,
  getCurrentShortcuts,
  isKeyCode,
  registerAllCustomShortcuts,
  registerCustomShortcut,
  unregisterAllCustomShortcuts,
  unregisterShortcut,
};
