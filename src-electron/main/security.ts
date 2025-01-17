import { app, session, shell } from 'electron';
import { isSelf, isTrustedDomain } from 'main/utils';
import { logToWindow } from 'main/window/window-base';
import { mainWindow } from 'main/window/window-main';

app.on('ready', () => {
  // Handle session permission requests from remote content
  // See: https://www.electronjs.org/docs/latest/tutorial/security#5-handle-session-permission-requests-from-remote-content
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const url = webContents.getURL();
      if (!isSelf(url) && !isTrustedDomain(url)) {
        logToWindow(
          mainWindow,
          'Blocked permission request from untrusted domain',
          url,
        );
        return callback(false);
      }

      const allowed: (typeof permission)[] = ['media', 'notifications'];
      if (allowed.includes(permission)) {
        callback(true);
      } else {
        logToWindow(
          mainWindow,
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
    if (!isSelf(params.src) && !isTrustedDomain(params.src)) {
      event.preventDefault();
      logToWindow(
        mainWindow,
        'Blocked webview from loading URL:',
        params.src,
        'warn',
      );
    }
  });

  // Disable or limit navigation
  // See: https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
  contents.on('will-navigate', (event, navigationUrl) => {
    if (!isSelf(navigationUrl) && !isTrustedDomain(navigationUrl)) {
      event.preventDefault();
      logToWindow(mainWindow, 'Blocked navigation to:', navigationUrl, 'warn');
    }
  });

  // Disable or limit creation of new windows
  // See: https://www.electronjs.org/docs/latest/tutorial/security#14-disable-or-limit-creation-of-new-windows
  contents.setWindowOpenHandler(({ url }) => {
    if (isTrustedDomain(url)) {
      setImmediate(() => {
        shell.openExternal(url);
      });
    }

    logToWindow(mainWindow, 'Blocked new window creation to:', url, 'warn');

    return { action: 'deny' };
  });
});
