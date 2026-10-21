import { app, session, shell } from 'electron';
import {
  captureElectronError,
  isSelf,
  isTrustedNavigationTarget,
} from 'src-electron/main/utils';
import { logToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';

app.on('ready', () => {
  // Handle session permission requests from remote content
  // See: https://www.electronjs.org/docs/latest/tutorial/security#5-handle-session-permission-requests-from-remote-content
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      // getURL() is empty while a webContents has no committed navigation
      // yet (e.g. a request made during startup), which wrongly blocked our
      // own pages (MMM-V2-3JN). Fall back to the requesting frame's URL -
      // it goes through the same trust checks below.
      const url = webContents.getURL() || details?.requestingUrl || '';
      if (!isSelf(url) && !isTrustedNavigationTarget(url)) {
        logToWindow(
          mainWindowInfo.mainWindow,
          'Blocked permission request from untrusted domain',
          {
            permission,
            requestingUrl: details?.requestingUrl ?? '',
            url,
            webContentsId: webContents.id,
          },
        );
        return callback(false);
      }

      // Electron asks for clipboard-sanitized-write even when the copy follows
      // a click, so denying it made every navigator.clipboard.writeText()
      // fail with "Write permission denied" (MMM-V2-3ME: the timer remote's
      // copy button). Sanitized writes are limited to text, HTML and PNG
      // images, and only our own or trusted pages get this far.
      const allowed: (typeof permission)[] = [
        'clipboard-sanitized-write',
        'media',
        'notifications',
      ];
      if (allowed.includes(permission)) {
        callback(true);
      } else {
        logToWindow(
          mainWindowInfo.mainWindow,
          'Blocked permission request:',
          permission,
          'warn',
        );
        callback(false);
      }
    },
  );
});

app.on('web-contents-created', (_event, contents) => {
  // Verify WebView options before creation
  // See: https://www.electronjs.org/docs/latest/tutorial/security#12-verify-webview-options-before-creation
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload;

    // Disable Node.js integration
    webPreferences.nodeIntegration = false;

    // Verify URL being loaded
    if (!isSelf(params.src) && !isTrustedNavigationTarget(params.src)) {
      event.preventDefault();
      logToWindow(
        mainWindowInfo.mainWindow,
        'Blocked webview from loading URL:',
        params.src,
        'warn',
      );
    }
  });

  // Disable or limit navigation
  // See: https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
  contents.on('will-navigate', (event, navigationUrl) => {
    if (!isSelf(navigationUrl) && !isTrustedNavigationTarget(navigationUrl)) {
      event.preventDefault();
      logToWindow(
        mainWindowInfo.mainWindow,
        'Blocked navigation to:',
        navigationUrl,
        'warn',
      );
    }
  });

  // Disable or limit creation of new windows
  // See: https://www.electronjs.org/docs/latest/tutorial/security#14-disable-or-limit-creation-of-new-windows
  contents.setWindowOpenHandler(({ url }) => {
    if (isTrustedNavigationTarget(url)) {
      setImmediate(() => {
        shell.openExternal(url).catch((error: unknown) => {
          captureElectronError(error, {
            contexts: { fn: { name: 'setWindowOpenHandler' } },
          });
        });
      });
    }

    logToWindow(
      mainWindowInfo.mainWindow,
      'Blocked new window creation to:',
      url,
      'warn',
    );

    return { action: 'deny' };
  });
});
