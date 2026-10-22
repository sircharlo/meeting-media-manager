import type {
  ConversionOptions,
  DevMenuState,
  DiscussionCategory,
  ElectronIpcInvokeKey,
  ElectronIpcSendKey,
  ElectronIpcSendSyncKey,
  ExternalWebsite,
  ExtractNestedZipEntryOptions,
  FileDialogFilter,
  JwSiteParams,
  MediaAccessStatus,
  NavigateWebsiteAction,
  SettingsValues,
  UnzipOptions,
  UrlVariables,
  ZoomTestParticipantsRequest,
} from 'src/types';

import { homepage, repository } from 'app/package.json';
import {
  app,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  screen,
  shell,
  systemPreferences,
} from 'electron';
import { PLATFORM } from 'src-electron/constants';
import { updateDevMenuState } from 'src-electron/main/dev-menu';
import {
  getLowDiskSpaceStatus,
  markUserWarnedAboutDiskSpace,
} from 'src-electron/main/disk-space';
import {
  cancelAllDownloads,
  downloadFile,
  isDownloadComplete,
  isDownloadErrorExpected,
  pauseAllDownloads,
  resumeAllDownloads,
} from 'src-electron/main/downloads';
import { createVideoFromNonVideo } from 'src-electron/main/ffmpeg';
import {
  ensureMacosFolderPermission,
  extractNestedZipEntry,
  getAppDataPath,
  getZipEntries,
  isUsablePath,
  openFileDialog,
  openFolderDialog,
  saveFileDialog,
  setExecutable,
  setPathProbeNotificationPaths,
  startSecurityScopedAccess,
  unwatchFolders,
  unzipFile,
  watchFolder,
} from 'src-electron/main/fs';
import { convertHeic } from 'src-electron/main/heic';
import { openFolder } from 'src-electron/main/open-folder';
import { exportHtmlToPdf } from 'src-electron/main/pdf';
import { getAllScreens } from 'src-electron/main/screen';
import {
  decryptSecret,
  encryptSecret,
  isSecretEncryptionAvailable,
} from 'src-electron/main/secrets';
import {
  quitStatus,
  setElectronUrlVariables,
  urlVariables,
} from 'src-electron/main/session';
import {
  registerShortcut,
  unregisterAllShortcuts,
  unregisterShortcut,
} from 'src-electron/main/shortcuts';
import {
  closeAllConnections,
  closeConnection,
  executeQuery,
  isDbCorrupt,
} from 'src-electron/main/sqlite';
import {
  setTimerRemoteText,
  startTimerRemote,
  stopTimerRemote,
  updateTimerRemote,
} from 'src-electron/main/timer-remote';
import {
  getBetaUpdatesPath,
  getUpdaterState,
  getUpdatesDisabledPath,
  quitAndInstallUpdate,
  triggerUpdateCheck,
} from 'src-electron/main/updater';
import {
  captureElectronError,
  capturePreloadErrorReport,
  getSharedDataPath,
  isSelf,
} from 'src-electron/main/utils';
import {
  getChallengeHost,
  passWafChallenge,
} from 'src-electron/main/waf-challenge';
import { logToWindow } from 'src-electron/main/window/window-base';
import {
  mainWindowInfo,
  toggleAuthorizedClose,
} from 'src-electron/main/window/window-main';
import {
  fadeMediaWindow,
  focusMediaWindow,
  mediaWindowInfo,
  moveMediaWindow,
} from 'src-electron/main/window/window-media';
import {
  createTimerWindow,
  moveTimerWindow,
  timerWindowInfo,
} from 'src-electron/main/window/window-timer';
import {
  askForMediaAccess,
  createWebsiteWindow,
  navigateWebsiteWindow,
  websiteWindowInfo,
  zoomWebsiteWindow,
} from 'src-electron/main/window/window-website';
import {
  restartZoomHelper,
  runZoomHelperCommand,
  startZoomHelper,
  stopZoomHelper,
} from 'src-electron/main/zoom-helper-manager';
import { isZoomCommand } from 'src-electron/main/zoom-helper-process';
import { handleZoomTestParticipants } from 'src-electron/main/zoom-test-participants';

const { openExternal } = shell;

// IPC send/on

function handleIpcSend(
  channel: ElectronIpcSendKey,
  // An async listener is fine: its rejection is caught and reported below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listener: (event: IpcMainEvent, ...args: any[]) => Promise<void> | void,
) {
  ipcMain.on(channel, (e, ...args) => {
    if (isSelf(e.senderFrame?.url)) {
      logToWindow(mainWindowInfo.mainWindow, 'on', { args, channel }, 'debug');
    } else {
      logToWindow(
        mainWindowInfo.mainWindow,
        `Blocked IPC send from ${e.senderFrame?.url}`,
        {},
        'warn',
      );
      return;
    }
    // `listener` is fire-and-forget from ipcMain.on's perspective: an async
    // listener's rejection (e.g. a window destroyed mid-await) would
    // otherwise be unobserved by anything. Catch both sync throws and async
    // rejections here once, for every handleIpcSend consumer, rather than
    // requiring each listener to guard itself.
    try {
      Promise.resolve(listener(e, ...args)).catch((error: unknown) => {
        captureElectronError(error, {
          contexts: { fn: { channel, name: 'handleIpcSend' } },
        });
      });
    } catch (error) {
      captureElectronError(error, {
        contexts: { fn: { channel, name: 'handleIpcSend' } },
      });
    }
  });
}

// IPC sendSync/on with event.returnValue

function handleIpcSendSync<T>(
  channel: ElectronIpcSendSyncKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listener: (event: IpcMainEvent, ...args: any[]) => Promise<T> | T,
) {
  ipcMain.on(channel, (e, ...args) => {
    if (!isSelf(e.senderFrame?.url)) {
      logToWindow(
        mainWindowInfo.mainWindow,
        `Blocked IPC sendSync from ${e.senderFrame?.url}`,
        {},
        'warn',
      );
      e.returnValue = undefined;
      return;
    }
    // BE-20 (full-audit-2026-09-05.md): mirrors handleIpcSend's guard - a
    // synchronous throw or async rejection here would otherwise leave
    // e.returnValue unset, and the renderer's blocking sendSync() call
    // waiting forever (a worse failure mode than an unobserved async
    // rejection). An async listener is allowed: setting e.returnValue after
    // an await still answers the call, the renderer just stays blocked until
    // then (needed for safeStorage, whose sync API Electron 46 removes).
    try {
      Promise.resolve(listener(e, ...args)).then(
        (value) => {
          e.returnValue = value;
        },
        (error: unknown) => {
          captureElectronError(error, {
            contexts: { fn: { channel, name: 'handleIpcSendSync' } },
          });
          e.returnValue = undefined;
        },
      );
    } catch (error) {
      captureElectronError(error, {
        contexts: { fn: { channel, name: 'handleIpcSendSync' } },
      });
      e.returnValue = undefined;
    }
  });
}

handleIpcSendSync('encryptSecretSync', (_e, plainText: string) =>
  encryptSecret(plainText),
);

handleIpcSendSync('decryptSecretSync', (_e, cipherText: string) =>
  decryptSecret(cipherText),
);

handleIpcSendSync('isSecretEncryptionAvailableSync', () =>
  isSecretEncryptionAvailable(),
);

handleIpcSend(
  'toggleMediaWindow',
  async (_e, show: boolean, enableFadeTransitions = false) => {
    const win = mediaWindowInfo.mediaWindow;
    if (!win) return;

    if (show) {
      await moveMediaWindow();
      if (timerWindowInfo.timerWindow?.isVisible()) {
        await moveTimerWindow();
      }

      return enableFadeTransitions ? fadeMediaWindow('in') : win.show();
    }

    return enableFadeTransitions ? fadeMediaWindow('out') : win.hide();
  },
);

handleIpcSend('focusMediaWindow', () => {
  focusMediaWindow();
});

handleIpcSend('toggleTimerWindow', async (_e, show: boolean) => {
  if (show) {
    createTimerWindow();
    await moveTimerWindow();
  } else {
    timerWindowInfo.timerWindow?.close();
  }
});

handleIpcSend('askForMediaAccess', askForMediaAccess);

handleIpcSend('cancelAllDownloads', () => {
  cancelAllDownloads();
});

handleIpcSend('resumeAllDownloads', () => {
  resumeAllDownloads('renderer-manual');
});

handleIpcSend('pauseAllDownloads', () => {
  pauseAllDownloads('renderer-manual');
});

handleIpcSend('markUserWarnedAboutDiskSpace', () => {
  markUserWarnedAboutDiskSpace();
});

handleIpcSend('checkForUpdates', () => triggerUpdateCheck());

// The preload's isolated world has no Sentry client, so it forwards its
// errors here to be reported (see capturePreloadError in preload/log.ts).
handleIpcSend('capturePreloadError', (_e, report: unknown) => {
  capturePreloadErrorReport(report);
});

// Renderer → main state sync for the dev-only Demo menu (checkboxes and
// enabled/disabled states). updateDevMenuState() no-ops unless the dev menu
// was actually built, so this is harmless in production.
handleIpcSend('dev-menu-state', (_e, state: DevMenuState) => {
  updateDevMenuState(state);
});

handleIpcSend('setElectronUrlVariables', (_e, variables: string) => {
  try {
    setElectronUrlVariables(JSON.parse(variables) as UrlVariables);
  } catch (error) {
    captureElectronError(error, {
      contexts: { fn: { name: 'setElectronUrlVariables', variables } },
    });
  }
});

handleIpcSend('setPathProbeNotificationPaths', (_e, paths: string[]) => {
  setPathProbeNotificationPaths(paths);
});

handleIpcSend('authorizedClose', () => {
  toggleAuthorizedClose(true);
  if (quitStatus.shouldQuit) app.quit();
  else if (
    mainWindowInfo.mainWindow &&
    !mainWindowInfo.mainWindow.isDestroyed()
  )
    mainWindowInfo.mainWindow.close();
});

handleIpcSend('toggleOpenAtLogin', (_e, openAtLogin: boolean) => {
  app.setLoginItemSettings({ openAtLogin });
});

handleIpcSend(
  'toggleWebsiteWindow',
  (_e, show: boolean, websiteParams?: JwSiteParams) => {
    if (show) {
      createWebsiteWindow(websiteParams);
    } else {
      websiteWindowInfo.websiteWindow?.close();
    }
  },
);

handleIpcSend('zoomWebsiteWindow', (_e, direction: 'in' | 'out') => {
  zoomWebsiteWindow(direction);
});

handleIpcSend('launchZoomMeeting', (_e, meetingId: string) => {
  if (!meetingId) return;
  openExternal(
    `zoommtg://zoom.us/join?confno=${encodeURIComponent(meetingId)}`,
  ).catch((error: unknown) => {
    captureElectronError(error, {
      contexts: { fn: { name: 'launchZoomMeeting' } },
    });
  });
});

handleIpcSend('navigateWebsiteWindow', (_e, action: NavigateWebsiteAction) => {
  navigateWebsiteWindow(action);
});

handleIpcSend('unregisterShortcut', (_e, keySequence: string) => {
  unregisterShortcut(keySequence);
});

handleIpcSend('unregisterAllShortcuts', () => {
  unregisterAllShortcuts();
});

handleIpcSend('moveMediaWindow', async (_e, displayNr, fullscreen) => {
  await moveMediaWindow(displayNr, fullscreen);
  if (timerWindowInfo.timerWindow?.isVisible()) {
    await moveTimerWindow();
  }
});

handleIpcSend('moveTimerWindow', async (_e, displayNr, fullscreen) => {
  await moveTimerWindow(displayNr, fullscreen);
});

handleIpcInvoke('startTimerRemote', async (_e, port: unknown) =>
  startTimerRemote(port),
);

handleIpcSend('stopTimerRemote', () => {
  stopTimerRemote();
});

handleIpcSend('timerRemoteText', (_e, text: unknown) => {
  setTimerRemoteText(text);
});

handleIpcSend('timerRemoteUpdate', (_e, data: unknown) => {
  updateTimerRemote(data);
});

handleIpcSend('openExternal', (_e, website: ExternalWebsite) => {
  let url: string | undefined;

  switch (website) {
    case 'docs':
      url = homepage;
      break;
    case 'latestRelease':
      url = repository.url.replace('.git', '/releases/latest');
      break;
    case 'repo':
      url = repository.url.replace('.git', '');
      break;
  }

  if (!url) return;
  openExternal(url).catch((error: unknown) => {
    captureElectronError(error, {
      contexts: { fn: { name: 'openExternal', website } },
    });
  });
});

handleIpcSend(
  'openDiscussion',
  (_e, category: DiscussionCategory, title: string, params = '{}') => {
    let parsedParams: Record<string, string> = {};
    try {
      parsedParams = JSON.parse(params) as Record<string, string>;
    } catch (error) {
      captureElectronError(error, {
        contexts: { fn: { name: 'openDiscussion', params } },
      });
    }

    const search = new URLSearchParams({
      category,
      title,
      ...parsedParams,
    }).toString();
    openExternal(
      `${repository.url.replace('.git', '/discussions/new')}?${search}`,
    ).catch((error: unknown) => {
      captureElectronError(error, {
        contexts: { fn: { category, name: 'openDiscussion' } },
      });
    });
  },
);

// IPC invoke/handle

function handleIpcInvoke<T = unknown>(
  channel: ElectronIpcInvokeKey,
  listener: (
    event: IpcMainInvokeEvent,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<T> | T,
) {
  ipcMain.handle(channel, (e, ...args) => {
    if (isSelf(e.senderFrame?.url)) {
      logToWindow(
        mainWindowInfo.mainWindow,
        'handle',
        { args, channel },
        'debug',
      );
    } else {
      logToWindow(
        mainWindowInfo.mainWindow,
        `Blocked IPC invoke from ${e.senderFrame?.url}`,
        {},
        'warn',
      );
      return null;
    }
    return listener(e, ...args);
  });
}

handleIpcInvoke('getAppDataPath', async () => getAppDataPath());
handleIpcInvoke('getBetaUpdatesPath', async () => getBetaUpdatesPath());
handleIpcInvoke('getLowDiskSpaceStatus', async () => getLowDiskSpaceStatus());
handleIpcInvoke('getUpdatesDisabledPath', async () => getUpdatesDisabledPath());
handleIpcInvoke('getUpdaterState', () => getUpdaterState());
handleIpcInvoke('getSharedDataPath', async () => getSharedDataPath());
handleIpcInvoke('getUserDataPath', () => app.getPath('userData'));
handleIpcInvoke('getLocales', () => app.getPreferredSystemLanguages());
handleIpcInvoke('isUsablePath', async (_e, p: string) => isUsablePath(p));
handleIpcInvoke('startZoomHelper', async () => startZoomHelper());
handleIpcSend('stopZoomHelper', () => stopZoomHelper());
handleIpcInvoke('restartZoomHelper', async () => restartZoomHelper());

handleIpcInvoke('isOnline', async () => {
  const { default: isOnline } = await import('is-online');
  return isOnline();
});

handleIpcInvoke('getScreenAccessStatus', (): MediaAccessStatus =>
  PLATFORM === 'linux'
    ? 'granted'
    : systemPreferences.getMediaAccessStatus('screen'),
);

handleIpcInvoke('getAllScreens', () => getAllScreens());

// Media-preview capture mode: lets MediaPreview.vue mirror the media
// window's actual composited pixels via getUserMedia({chromeMediaSource})
// instead of re-decoding the same file a second time. Deliberately not
// reusing window-website.ts's setDisplayMediaRequestHandler pattern - that's
// registered once per session, and since all windows share the default
// session, a second registration here would silently replace the existing
// website-mirror handler and break OBS/Zoom screen-share.
handleIpcInvoke('getMediaWindowCaptureSourceId', (e) => {
  const media = mediaWindowInfo.mediaWindow;
  if (!media || media.isDestroyed()) return null;
  return media.webContents.getMediaSourceId(e.sender);
});
// The media window's size in device pixels: the most a capture of it should
// ask for. A capture asking for more makes Chromium render the media window
// itself at up to twice its size for as long as the capture runs.
handleIpcInvoke('getMediaWindowCaptureSize', () => {
  const media = mediaWindowInfo.mediaWindow;
  if (!media || media.isDestroyed()) return null;
  const [width = 0, height = 0] = media.getContentSize();
  const { scaleFactor } = screen.getDisplayMatching(media.getBounds());
  return {
    height: Math.round(height * scaleFactor),
    width: Math.round(width * scaleFactor),
  };
});
handleIpcInvoke('closeSqliteConnection', async (_e, dbPath: string) =>
  closeConnection(dbPath),
);
handleIpcInvoke('closeSqliteConnections', async () => closeAllConnections());
handleIpcInvoke('isSqliteDbCorrupt', async (_e, dbPath: string) =>
  isDbCorrupt(dbPath),
);
handleIpcInvoke(
  'executeQuery',
  async (
    _e,
    dbPath: string,
    query: string,
    params?: (null | number | string)[],
  ) => executeQuery(dbPath, query, params),
);
handleIpcInvoke('isDownloadComplete', (_e, downloadId: string) =>
  isDownloadComplete(downloadId),
);
handleIpcInvoke('isDownloadErrorExpected', async () =>
  isDownloadErrorExpected(),
);

handleIpcInvoke('passWafChallenge', async (_e, url: string) => {
  const host = getChallengeHost(url, urlVariables.base);
  return host ? passWafChallenge(host) : false;
});

handleIpcInvoke(
  'registerShortcut',
  (_e, name: keyof SettingsValues, keySequence: string) =>
    registerShortcut(name, keySequence),
);

handleIpcInvoke('convertHeic', async (_e, image: ConversionOptions) =>
  convertHeic(image),
);

handleIpcInvoke(
  'createVideoFromNonVideo',
  async (_e, path: string, ffmpegPath: string, outputDir?: string) =>
    createVideoFromNonVideo(path, ffmpegPath, outputDir),
);

handleIpcInvoke('setExecutable', async (_e, path: string) =>
  setExecutable(path),
);

handleIpcInvoke(
  'downloadFile',
  async (
    _e,
    url: string,
    saveDir: string,
    destFilename?: string,
    lowPriority = false,
  ) => downloadFile(url, saveDir, destFilename, lowPriority),
);

handleIpcInvoke(
  'openFileDialog',
  async (_e, single: boolean, filter: FileDialogFilter, defaultPath?: string) =>
    openFileDialog(single, filter, defaultPath),
);

handleIpcInvoke('openFolderDialog', async () => openFolderDialog());

handleIpcInvoke(
  'ensureMacosFolderPermission',
  async (_e, folderPath: string, prompt?: boolean) =>
    ensureMacosFolderPermission(folderPath, prompt),
);

handleIpcInvoke('startSecurityScopedAccess', async (_e, filePath: string) =>
  startSecurityScopedAccess(filePath),
);

handleIpcInvoke(
  'saveFileDialog',
  async (_e, defaultPath: string, filter?: FileDialogFilter) =>
    saveFileDialog(defaultPath, filter),
);

handleIpcInvoke(
  'exportHtmlToPdf',
  async (_e, html: unknown, defaultFileName: unknown) =>
    exportHtmlToPdf(html, defaultFileName),
);

handleIpcInvoke('openFolder', async (_e, path: unknown) => openFolder(path));

handleIpcInvoke(
  'unzip',
  async (_e, input: string, output: string, opts?: UnzipOptions) =>
    unzipFile(input, output, opts),
);

handleIpcInvoke('unwatchFolders', async () => unwatchFolders());
handleIpcInvoke('watchFolder', (_e, folderPath: string) =>
  watchFolder(folderPath),
);

handleIpcInvoke('zoomCommand', async (_e, command: unknown) => {
  if (!isZoomCommand(command)) {
    return { error: 'invalid-command', ok: false };
  }
  return runZoomHelperCommand(command);
});

handleIpcInvoke(
  'zoomTestParticipants',
  async (_e, request: ZoomTestParticipantsRequest) =>
    handleZoomTestParticipants(request),
);

handleIpcInvoke('getZipEntries', async (_e, zipPath: string) =>
  getZipEntries(zipPath),
);

handleIpcInvoke(
  'extractNestedZipEntry',
  async (
    _e,
    input: string,
    outerEntryName: string,
    output: string,
    opts: ExtractNestedZipEntryOptions,
  ) => extractNestedZipEntry(input, outerEntryName, output, opts),
);

handleIpcSend('quitAndInstall', () => {
  quitAndInstallUpdate();
});

handleIpcSend('relaunchApp', () => {
  toggleAuthorizedClose(true);
  app.relaunch();
  app.quit();
});
