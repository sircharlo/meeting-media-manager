import type { TimerData, TimerRemoteStatus } from 'src/types';

import { createServer, type Server, type ServerResponse } from 'node:http';
import { networkInterfaces } from 'node:os';
import { captureElectronError } from 'src-electron/main/utils';
import { log } from 'src/shared/vanilla';

// The timer remote: a small read-only web page, served on the local network,
// that mirrors the meeting timer in real time. Meant for a tablet at the
// lectern, so the speaker sees the remaining time without it being on the
// congregation's screen or in a Zoom share. All the controls stay in M3.
//
// The renderer pushes every timer broadcast here (timerRemoteUpdate); the
// page holds a server-sent events stream open and redraws on each one. It
// computes the clock and the pre-meeting countdown itself, the same way the
// timer window does, so an idle timer costs no traffic.

const MIN_PORT = 1024;
const MAX_PORT = 65_535;
const KEEPALIVE_MS = 20_000;

let server: null | Server = null;
let serverPort = 0;
let latestData: null | TimerData = null;
const clients = new Set<ServerResponse>();
let keepaliveTimer: ReturnType<typeof setInterval> | undefined;

export const isValidTimerRemotePort = (port: unknown): port is number =>
  typeof port === 'number' &&
  Number.isInteger(port) &&
  port >= MIN_PORT &&
  port <= MAX_PORT;

/** The addresses the page can be opened at from other devices. */
export const getTimerRemoteUrls = (port: number): string[] => {
  const urls: string[] = [];
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.internal || address.family !== 'IPv4') continue;
      urls.push(`http://${address.address}:${port}/`);
    }
  }
  return urls;
};

const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Timer - M³</title>
<link rel="stylesheet" href="/app.css">
</head>
<body>
<main id="display" class="display">
  <div id="label" class="label"></div>
  <div id="time" class="time">--:--</div>
  <div id="caption" class="caption"></div>
  <div id="hand" class="hand" hidden>
    <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 58c-5 0-9-3-11-7L4 36c-1-3 1-6 4-6s4 2 5 4l4 8V12c0-2 2-4 4-4s4 2 4 4v18h2V7c0-2 2-4 4-4s4 2 4 4v23h2V10c0-2 2-4 4-4s4 2 4 4v20h2V17c0-2 2-4 4-4s4 2 4 4v27c0 8-6 14-14 14H22z"/></svg>
    <div id="handNames" class="hand-names"></div>
  </div>
  <div id="status" class="status" hidden></div>
</main>
<script src="/app.js"></script>
</body>
</html>`;

const PAGE_CSS = `
html, body { height: 100%; margin: 0; }
body { background: #000; color: #fff; font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-user-select: none; user-select: none; overflow: hidden; }
.display { align-items: center; display: flex; flex-direction: column; gap: 2vh; height: 100%; justify-content: center; position: relative; transition: background-color 700ms ease, color 700ms ease; }
.label { font-size: clamp(1rem, 4vw, 3rem); font-weight: 600; letter-spacing: 0.04em; max-width: 94vw; opacity: 0.85; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
.label:empty { display: none; }
.time { font-size: clamp(3rem, 26vw, 40vh); font-variant-numeric: tabular-nums; font-weight: 700; line-height: 1; white-space: nowrap; }
.caption { font-size: clamp(0.9rem, 3vw, 2rem); opacity: 0.7; }
.caption:empty { display: none; }
.blink { animation: blink 2s infinite; }
@keyframes blink { 0%, 60% { opacity: 1; } 61%, 100% { opacity: 0.7; } }
.hand { align-items: center; display: flex; flex-direction: column; gap: 1vh; inset: 0; justify-content: center; pointer-events: none; position: absolute; }
.hand svg { animation: pulse 1.2s ease-in-out infinite; fill: #ffd60a; filter: drop-shadow(0 0 1.5vh rgba(0,0,0,.6)); height: min(45vh, 45vw); width: min(45vh, 45vw); }
.hand-names { background: rgba(0,0,0,.6); border-radius: 999px; color: #ffd60a; font-size: clamp(1rem, 4vh, 3rem); font-weight: bold; max-width: 90vw; overflow: hidden; padding: .3em 1em; text-overflow: ellipsis; white-space: nowrap; }
.hand-names:empty { display: none; }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .75; transform: scale(.94); } }
.status { background: rgba(255,255,255,.12); border-radius: 999px; bottom: 2vh; font-size: clamp(0.8rem, 2.5vw, 1.2rem); left: 50%; padding: .4em 1.2em; position: absolute; transform: translateX(-50%); }
`;

// Plain script (no build step): the same display rules as the timer window.
const PAGE_JS = String.raw`(function () {
  'use strict';
  var data = null;
  var connected = false;
  var el = {
    display: document.getElementById('display'),
    label: document.getElementById('label'),
    time: document.getElementById('time'),
    caption: document.getElementById('caption'),
    hand: document.getElementById('hand'),
    handNames: document.getElementById('handNames'),
    status: document.getElementById('status')
  };
  var text = {};
  try { text = JSON.parse(document.documentElement.getAttribute('data-text') || '{}'); } catch (e) { text = {}; }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function formatCountdown(total) { return pad(Math.floor(total / 60)) + ':' + pad(total % 60); }
  function formatTime(date) {
    var options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !!(data && data.timerHourFormat === '12h') };
    try { return date.toLocaleTimeString((data && data.locale) || [], options); } catch (e) { return date.toLocaleTimeString([], options); }
  }
  function parseTime(str, base) {
    var parts = String(str).split(':');
    var d = new Date(base);
    var h = parseInt(parts[0], 10), m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return d;
    d.setHours(h, m, 0, 0);
    return d;
  }
  function meetingCountdown(now) {
    if (!data || !data.timerEnableMeetingCountdown || !data.timerMeetingCountdownMinutes) return null;
    var today = now.getDay() === 0 ? 6 : now.getDay() - 1;
    var start = null;
    if (parseInt(data.mwDay || '-1', 10) === today && data.mwStartTime) start = data.mwStartTime;
    else if (parseInt(data.weDay || '-1', 10) === today && data.weStartTime) start = data.weStartTime;
    if (!start) return null;
    var meeting = parseTime(start, now);
    var minutesUntil = (meeting.getTime() - now.getTime()) / 60000;
    if (minutesUntil <= 0 || minutesUntil > data.timerMeetingCountdownMinutes) return null;
    return Math.max(0, Math.floor((meeting.getTime() - now.getTime()) / 1000));
  }
  function render() {
    var now = new Date();
    var running = !!(data && data.running);
    var overtime = running && typeof data.time === 'string' && data.time.charAt(0) === '-';
    var useOvertime = overtime && data.timerOvertimeIndicator;
    el.display.style.backgroundColor = (useOvertime ? data.timerOvertimeBackgroundColor : data && data.timerBackgroundColor) || '#000';
    el.display.style.color = (useOvertime ? data.timerOvertimeTextColor : data && data.timerTextColor) || '#fff';
    var blink = running && (data.paused || (overtime && data.timerOvertimeAnimation));
    el.time.className = 'time' + (blink ? ' blink' : '');
    if (running) {
      el.label.textContent = data.timerCurrentPartLabel || '';
      el.time.textContent = data.time || '';
      el.caption.textContent = data.paused ? (text.paused || '') : (data.mode === 'countup' ? (text.elapsed || '') : (text.remaining || ''));
    } else {
      var countdown = meetingCountdown(now);
      if (countdown !== null) {
        el.label.textContent = text.meetingStartsIn || '';
        el.time.textContent = formatCountdown(countdown);
        el.caption.textContent = '';
      } else {
        el.label.textContent = '';
        el.time.textContent = formatTime(now);
        el.caption.textContent = '';
      }
    }
    var hand = !!(data && data.handAlertActive);
    el.hand.hidden = !hand;
    el.handNames.textContent = hand && data.handAlertNames ? data.handAlertNames.join(' \u00B7 ') : '';
    el.status.hidden = connected;
    el.status.textContent = connected ? '' : (text.reconnecting || 'Reconnecting\u2026');
  }
  function connect() {
    var source = new EventSource('/events');
    source.onopen = function () { connected = true; render(); };
    source.onmessage = function (event) {
      try { data = JSON.parse(event.data); } catch (e) { return; }
      render();
    };
    source.onerror = function () {
      connected = false;
      render();
      source.close();
      setTimeout(connect, 2000);
    };
  }
  setInterval(render, 500);
  render();
  connect();
})();`;

const sendJsonEvent = (client: ServerResponse, data: TimerData) => {
  client.write(`data: ${JSON.stringify(data)}\n\n`);
};

const htmlWithText = (text: Record<string, string>) =>
  PAGE_HTML.replace(
    '<html lang="en">',
    `<html lang="${escapeAttribute(text.lang ?? 'en')}" data-text="${escapeAttribute(JSON.stringify(text))}">`,
  );

const escapeAttribute = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

let pageText: Record<string, string> = {};

/** The page's few words, in M3's language (sent by the renderer). */
export const setTimerRemoteText = (text: unknown) => {
  if (!text || typeof text !== 'object') return;
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(text)) {
    if (typeof value === 'string' && value.length <= 200) safe[key] = value;
  }
  pageText = safe;
};

export const updateTimerRemote = (data: unknown) => {
  if (!data || typeof data !== 'object') return;
  latestData = data as TimerData;
  for (const client of clients) {
    try {
      sendJsonEvent(client, latestData);
    } catch {
      clients.delete(client);
    }
  }
};

const handleRequest = (
  url: string,
  method: string,
  res: ServerResponse,
): void => {
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Security-Policy':
      "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'",
    'X-Content-Type-Options': 'nosniff',
  };
  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, headers).end();
    return;
  }
  if (url === '/' || url === '/index.html') {
    res
      .writeHead(200, {
        ...headers,
        'Content-Type': 'text/html; charset=utf-8',
      })
      .end(htmlWithText(pageText));
    return;
  }
  if (url === '/app.css') {
    res
      .writeHead(200, { ...headers, 'Content-Type': 'text/css; charset=utf-8' })
      .end(PAGE_CSS);
    return;
  }
  if (url === '/app.js') {
    res
      .writeHead(200, {
        ...headers,
        'Content-Type': 'text/javascript; charset=utf-8',
      })
      .end(PAGE_JS);
    return;
  }
  if (url === '/events') {
    res.writeHead(200, {
      ...headers,
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
    });
    res.write(': connected\n\n');
    clients.add(res);
    if (latestData) sendJsonEvent(res, latestData);
    res.on('close', () => clients.delete(res));
    return;
  }
  res.writeHead(404, headers).end();
};

export const startTimerRemote = (port: unknown): Promise<TimerRemoteStatus> => {
  if (!isValidTimerRemotePort(port)) {
    return Promise.resolve({ error: 'invalid-port', running: false, urls: [] });
  }
  if (server && serverPort === port) {
    return Promise.resolve({
      running: true,
      urls: getTimerRemoteUrls(port),
    });
  }
  stopTimerRemote();

  return new Promise((resolve) => {
    const httpServer = createServer((req, res) => {
      try {
        handleRequest(req.url ?? '/', req.method ?? 'GET', res);
      } catch (error) {
        captureElectronError(error, {
          contexts: { fn: { name: 'timerRemoteRequest' } },
        });
        if (!res.headersSent) res.writeHead(500);
        res.end();
      }
    });
    httpServer.once('error', (error: NodeJS.ErrnoException) => {
      log('[timerRemote] Could not start', 'timer', 'error', error);
      if (server === httpServer) server = null;
      resolve({
        error: error.code === 'EADDRINUSE' ? 'port-in-use' : 'start-failed',
        running: false,
        urls: [],
      });
    });
    httpServer.listen(port, () => {
      server = httpServer;
      serverPort = port;
      keepaliveTimer = setInterval(() => {
        for (const client of clients) {
          try {
            client.write(': keepalive\n\n');
          } catch {
            clients.delete(client);
          }
        }
      }, KEEPALIVE_MS);
      log('[timerRemote] Listening', 'timer', 'log', { port });
      resolve({ running: true, urls: getTimerRemoteUrls(port) });
    });
  });
};

export const stopTimerRemote = () => {
  if (keepaliveTimer) clearInterval(keepaliveTimer);
  keepaliveTimer = undefined;
  for (const client of clients) {
    try {
      client.end();
    } catch {
      // The client is already gone.
    }
  }
  clients.clear();
  if (server) {
    server.close();
    log('[timerRemote] Stopped', 'timer', 'log');
  }
  server = null;
  serverPort = 0;
  latestData = null;
};

export const __testables = {
  getClientCount: () => clients.size,
  getServerPort: () => serverPort,
};
