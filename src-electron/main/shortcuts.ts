import type { SettingsValues } from 'src/types';

import { globalShortcut } from 'electron';

import { captureError } from '../utils';
import { sendToWindow } from './window/window-base';
import { mainWindow } from './window/window-main';

export const registerShortcut = (
  name: keyof SettingsValues,
  keySequence: string,
) => {
  if (!keySequence) return;
  try {
    unregisterShortcut(keySequence);
    return globalShortcut.register(keySequence, () => {
      sendToWindow(mainWindow, 'shortcut', { shortcut: name });
    });
  } catch (e) {
    captureError(e);
  }
};

export const unregisterShortcut = (keySequence: string) => {
  if (!keySequence) return;
  try {
    if (globalShortcut.isRegistered(keySequence)) {
      globalShortcut.unregister(keySequence);
    }
  } catch (e) {
    captureError(e);
  }
};

export const unregisterAllShortcuts = () => {
  try {
    globalShortcut.unregisterAll();
  } catch (e) {
    captureError(e);
  }
};
