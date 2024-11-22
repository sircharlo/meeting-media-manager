import type { Display, ScreenPreferences } from 'src/types';

import { app, type BrowserWindow, screen } from 'electron';

import { errorCatcher } from '../utils';
import { mainWindow } from './window/window-main';
import { mediaWindow, moveMediaWindow } from './window/window-media';

export let screenPreferences: ScreenPreferences = {
  preferredScreenNumber: undefined,
  preferWindowed: undefined,
};

export const setScreenPreferences = (prefs: ScreenPreferences) => {
  screenPreferences = prefs;
};

export const initScreenListeners = () => {
  app.on('ready', () => {
    screen.removeAllListeners('display-added');
    screen.removeAllListeners('display-removed');
    screen.removeAllListeners('display-metrics-changed');

    screen.on('display-added', () => moveMediaWindow());
    screen.on('display-removed', () => moveMediaWindow());
    screen.on('display-metrics-changed', () => moveMediaWindow());
  });
};

export const getAllScreens = (): Display[] => {
  const displays: Display[] = screen
    .getAllDisplays()
    .sort((a, b) => a.bounds.x + a.bounds.y - (b.bounds.x + b.bounds.y));

  if (mainWindow) {
    try {
      const mainWindowScreen = displays.find(
        (display) =>
          mainWindow &&
          display.id === screen.getDisplayMatching(mainWindow.getBounds()).id,
      );
      if (mainWindowScreen) mainWindowScreen.mainWindow = true;
    } catch (e) {
      errorCatcher(e);
    }
  }
  if (mediaWindow) {
    try {
      const mediaWindowScreen = displays.find(
        (display) =>
          mediaWindow &&
          display.id === screen.getDisplayMatching(mediaWindow.getBounds()).id,
      );
      if (mediaWindowScreen) mediaWindowScreen.mediaWindow = true;
    } catch (e) {
      errorCatcher(e);
    }
  }

  return displays;
};

export const getWindowScreen = (window: BrowserWindow | null) => {
  if (!window) return 0;
  const allScreens = getAllScreens();
  const windowDisplay = screen.getDisplayMatching(window.getBounds());
  return allScreens.findIndex((display) => display.id === windowDisplay.id);
};
