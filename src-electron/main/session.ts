import { app, session } from 'electron';

import { isJwDomain, isTrustedDomain } from './../utils';

app.on('ready', () => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (isTrustedDomain(details.url) && details.requestHeaders) {
      const url = new URL(details.url);
      const baseUrl = `${url.protocol}//${url.hostname}`;
      details.requestHeaders['Referer'] = baseUrl;
      details.requestHeaders['Origin'] = baseUrl;
      details.requestHeaders['User-Agent'] = details.requestHeaders[
        'User-Agent'
      ].replace('Electron', '');
    }

    callback({ requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!details.responseHeaders || !isTrustedDomain(details.url)) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }

    let alterResponseHeaders = true;

    // Determine wether to alter the response headers
    if (details.referrer) {
      const url = new URL(details.url);
      const referrer = new URL(details.referrer);

      if (
        referrer.hostname === url.hostname ||
        (url.hostname !== 'b.jw-cdn.org' && isJwDomain(details.referrer))
        // TODO: Find a way to implement urlVariables here
        // (url.hostname !== new URL(urlVariables.mediator).hostname && isJwDomain(details.referrer))
      ) {
        alterResponseHeaders = false;
      }
    }

    if (alterResponseHeaders) {
      if (
        !details.responseHeaders['access-control-allow-origin'] ||
        !details.responseHeaders['access-control-allow-origin'].includes('*')
      ) {
        details.responseHeaders['access-control-allow-headers'] = [
          'Content-Type,Authorization,X-Client-ID',
        ];
        details.responseHeaders['access-control-allow-origin'] = ['*'];
        details.responseHeaders['access-control-allow-credentials'] = ['true'];
      }

      if (details.responseHeaders['x-frame-options']) {
        delete details.responseHeaders['x-frame-options'];
      }
    }

    callback({ responseHeaders: details.responseHeaders });
  });
});
