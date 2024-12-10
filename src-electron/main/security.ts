import { app, net, protocol, session, shell } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { isSelf, isTrustedDomain } from './utils';
import { logToWindow } from './window/window-base';
import { mainWindow } from './window/window-main';

// Avoid usage of the file protocol and prefer usage of custom protocols
// See: https://www.electronjs.org/docs/latest/tutorial/security#18-avoid-usage-of-the-file-protocol-and-prefer-usage-of-custom-protocols
protocol.registerSchemesAsPrivileged([
  {
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
    scheme: 'm3',
  },
]);

app.on('ready', () => {
  // Avoid usage of the file protocol and prefer usage of custom protocols
  // See: https://www.electronjs.org/docs/latest/tutorial/security#18-avoid-usage-of-the-file-protocol-and-prefer-usage-of-custom-protocols
  protocol.handle('m3', (req) => {
    const { hash, host, pathname } = new URL(req.url);

    if (host === 'app') {
      const currentDir = fileURLToPath(new URL('.', import.meta.url));
      const pathToServe = path.join(currentDir, pathname);
      const relativePath = path.relative(currentDir, pathToServe);

      const isSafe =
        relativePath &&
        !relativePath.startsWith('..') &&
        !path.isAbsolute(relativePath);

      if (isSafe) {
        return net.fetch(pathToFileURL(pathToServe).toString() + hash);
      }
    }

    return new Response('Error 400: Bad Request', {
      headers: { 'content-type': 'text/html' },
      status: 400,
    });
  });

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
