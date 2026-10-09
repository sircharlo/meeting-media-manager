import type { SettingsValues } from 'src/types';

import { globalShortcut } from 'electron';
import { captureElectronError } from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import { log } from 'src/shared/vanilla';

export const registerShortcut = (
  name: keyof SettingsValues,
  keySequence: string,
) => {
  if (!keySequence) return;
  try {
    unregisterShortcut(keySequence);
    const registered = globalShortcut.register(keySequence, () => {
      sendToWindow(mainWindowInfo.mainWindow, 'shortcut', { shortcut: name });
    });
    // globalShortcut.register() returns false (it does not throw) when the
    // accelerator is already claimed by the OS or another app - BE-7 in
    // full-audit-2026-09-04.md. Without this, that fairly common conflict
    // left zero trace in logs/Sentry, making a user's "my shortcut doesn't
    // work" report undiagnosable from this side.
    if (!registered) {
      log(
        'Failed to register global shortcut (likely already claimed by the OS or another app):',
        'electronShortcuts',
        'warn',
        { keySequence, shortcut: name },
      );
    }
    return registered;
  } catch (e) {
    captureElectronError(e, {
      contexts: {
        fn: { keySequence, name: 'registerShortcut', shortcut: name },
      },
    });
  }
};

export const unregisterShortcut = (keySequence: string) => {
  if (!keySequence) return;
  try {
    if (globalShortcut.isRegistered(keySequence)) {
      globalShortcut.unregister(keySequence);
    }
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { keySequence, name: 'unregisterShortcut' } },
    });
  }
};

export const unregisterAllShortcuts = () => {
  try {
    globalShortcut.unregisterAll();
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { name: 'unregisterAllShortcuts' } },
    });
  }
};
