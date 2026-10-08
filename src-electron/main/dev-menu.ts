import type { DevMenuCommand, DevMenuState } from 'src/types';

import { Menu, type MenuItem, type MenuItemConstructorOptions } from 'electron';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';

// The Demo menu is only built when the app is running in dev (see
// electron-main.ts's createApplicationMenu); updateDevMenuState() no-ops
// when it never existed, so the renderer's state reports are harmless in
// production.
let devMenuCreated = false;

const sendCommand = (command: DevMenuCommand) => {
  sendToWindow(mainWindowInfo.mainWindow, 'dev-menu-command', command);
};

const MEETING_STAGE_LABELS = [
  'Jump to Pre-Meeting',
  'Jump to Last Song',
  'Finish Last Song',
];

const findDevMenu = () => {
  const appMenu = Menu.getApplicationMenu();
  return appMenu?.items.find((item) => item.label === 'Demo') ?? null;
};

const collectAllItems = (items: MenuItem[]): MenuItem[] =>
  items.flatMap((item) => [
    item,
    ...(item.submenu?.items ? collectAllItems(item.submenu.items) : []),
  ]);

/**
 * Reflects the renderer's runtime toggle state onto the Demo menu items:
 * the Demo Mode / Simulate Offline checkboxes and the enabled state of the
 * meeting-stage jumps (useless while demo mode is off).
 */
export const updateDevMenuState = (state: DevMenuState) => {
  if (!devMenuCreated) return;
  const demoMenu = findDevMenu();
  if (!demoMenu?.submenu) return;

  const items = collectAllItems(demoMenu.submenu.items);
  const demoModeItem = items.find((item) => item.label === 'Demo Mode');
  if (demoModeItem) demoModeItem.checked = state.demoEnabled;

  const offlineItem = items.find((item) => item.label === 'Simulate Offline');
  if (offlineItem) offlineItem.checked = state.offline;

  items.forEach((item) => {
    if (MEETING_STAGE_LABELS.includes(item.label)) {
      item.enabled = state.demoEnabled;
    }
  });
};

/**
 * Builds the Demo menu for the application menu. Only ever included in the
 * template when IS_DEV && !IS_TEST (see electron-main.ts), so it never
 * ships in a packaged build. Menu labels are hardcoded English, matching
 * the rest of the application menu — this menu is a developer tool, never
 * user-facing copy.
 */
export const createDevMenu = (): MenuItemConstructorOptions => {
  devMenuCreated = true;
  return {
    label: 'Demo',
    submenu: [
      {
        checked: false,
        click: (item) =>
          sendCommand({ enabled: item.checked, type: 'set-demo-enabled' }),
        label: 'Demo Mode',
        type: 'checkbox',
      },
      { type: 'separator' },
      {
        click: () => sendCommand({ type: 'reseed-demo' }),
        label: 'Reseed Demo Congregation',
      },
      {
        click: () => sendCommand({ type: 'reset-demo' }),
        label: 'Reset Demo State',
      },
      { type: 'separator' },
      {
        label: 'Meeting Stage',
        submenu: [
          {
            click: () => sendCommand({ type: 'jump-pre-meeting' }),
            enabled: false,
            label: 'Jump to Pre-Meeting',
          },
          {
            click: () => sendCommand({ type: 'jump-last-song' }),
            enabled: false,
            label: 'Jump to Last Song',
          },
          {
            click: () => sendCommand({ type: 'finish-last-song' }),
            enabled: false,
            label: 'Finish Last Song',
          },
        ],
      },
      {
        label: 'Quick Actions',
        submenu: [
          {
            click: () => sendCommand({ type: 'reshow-panels' }),
            label: 'Re-show Panels',
          },
          {
            click: () => sendCommand({ type: 'dismiss-before-panel' }),
            label: 'Dismiss Before Panel',
          },
          {
            click: () => sendCommand({ type: 'dismiss-after-panel' }),
            label: 'Dismiss After Panel',
          },
        ],
      },
      {
        label: 'Background Music',
        submenu: [
          {
            click: () => sendCommand({ type: 'play-music' }),
            label: 'Play Music',
          },
          {
            click: () => sendCommand({ type: 'stop-music' }),
            label: 'Stop Music',
          },
        ],
      },
      {
        label: 'Network',
        submenu: [
          {
            checked: false,
            click: (item) =>
              sendCommand({ offline: item.checked, type: 'set-offline' }),
            label: 'Simulate Offline',
            type: 'checkbox',
          },
        ],
      },
      {
        label: 'Windows',
        submenu: [
          {
            click: () => sendCommand({ type: 'toggle-media-window' }),
            label: 'Toggle Media Window',
          },
          {
            click: () => sendCommand({ type: 'toggle-timer-window' }),
            label: 'Toggle Timer Window',
          },
        ],
      },
    ],
  };
};
