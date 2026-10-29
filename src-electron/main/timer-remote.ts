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
//
// Two layouts: the classic one (a large time, with a hand overlay when
// someone raises their hand) and, when the profile turns it on, the focus
// layout: a progress ring around the time, and a panel listing the raised
// hands beside it. The words come from the renderer in M3's language.

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

const HAND_PATH =
  'M22 58c-5 0-9-3-11-7L4 36c-1-3 1-6 4-6s4 2 5 4l4 8V12c0-2 2-4 4-4s4 2 4 4v18h2V7c0-2 2-4 4-4s4 2 4 4v23h2V10c0-2 2-4 4-4s4 2 4 4v20h2V17c0-2 2-4 4-4s4 2 4 4v27c0 8-6 14-14 14H22z';

// A two-second, 32x32 silent H.264 clip (1.5 KB), played hidden by the page
// when the Wake Lock API isn't available. Browsers only expose Wake Lock to
// secure pages, and the timer remote is served over plain HTTP on the LAN, so
// on a tablet the video is what holds the screen awake.
const AWAKE_VIDEO = Buffer.from(
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAMxbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAB9AAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAlx0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAB9AAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAACAAAAAgAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAfQAAAAAAABAAAAAAHUbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABAAAAAgABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABf21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAT9zdGJsAAAAt3N0c2QAAAAAAAAAAQAAAKdhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAACAAIABIAAAASAAAAAAAAAABFUxhdmM2MS4xOS4xMDEgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAe/+EAFmdCwB7ZCWwEQAAAAwBAAAADAQPFi5IBAARoy4yyAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAAF3AAAArQAAAAGHN0dHMAAAAAAAAAAQAAAAQAACAAAAAAFHN0c3MAAAAAAAAAAQAAAAEAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAQAAAABAAAAJHN0c3oAAAAAAAAAAAAAAAQAAAKWAAAACgAAAAoAAAAKAAAAFHN0Y28AAAAAAAAAAQAAA2EAAABhdWR0YQAAAFltZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAACxpbHN0AAAAJKl0b28AAAAcZGF0YQAAAAEAAAAATGF2ZjYxLjcuMTAzAAAACGZyZWUAAAK8bWRhdAAAAn4GBf//etxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNjUgcjMyMjNNIDA0ODBjYjAgLSBILjI2NC9NUEVHLTQgQVZDIGNvZGVjIC0gQ29weWxlZnQgMjAwMy0yMDI1IC0gaHR0cDovL3d3dy52aWRlb2xhbi5vcmcveDI2NC5odG1sIC0gb3B0aW9uczogY2FiYWM9MCByZWY9MyBkZWJsb2NrPTE6MDowIGFuYWx5c2U9MHgxOjB4MTExIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0wIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTAgd2VpZ2h0cD0wIGtleWludD0yNTAga2V5aW50X21pbj0yIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9YWJyIG1idHJlZT0xIGJpdHJhdGU9NiByYXRldG9sPTEuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAABBliIQGf///D0UAAU9/J114AAAABkGaOA15YAAAAAZBmlQDXlgAAAAGQZpgGvLA',
  'base64',
);

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
<video id="awake" class="awake" aria-hidden="true" loop muted playsinline preload="none"></video>
<main id="display" class="display">
  <div id="clock" class="clock" hidden></div>
  <div id="label" class="label"></div>
  <div id="dial" class="dial">
    <svg class="dial__ring" aria-hidden="true" focusable="false" viewBox="-10 -10 120 120">
      <circle class="dial__track" cx="50" cy="50" fill="none" r="46"/>
      <circle id="ringProgress" class="dial__progress" cx="50" cy="50" fill="none" pathLength="100" r="46"/>
    </svg>
    <div class="dial__inner">
      <div id="eyebrow" class="eyebrow"></div>
      <div id="time" class="time"><span id="timeSign" class="time__sign"></span><span id="timeValue">--:--</span></div>
    </div>
  </div>
  <div id="caption" class="caption"></div>
  <aside id="hands" class="hands" hidden>
    <div id="handBanner" class="hand-banner" role="status" hidden>
      <svg class="hand-banner__icon" aria-hidden="true" focusable="false" viewBox="0 0 64 64"><path d="${HAND_PATH}"/></svg>
      <span id="handBannerText" class="hand-banner__text"></span>
    </div>
    <div class="hands__header">
      <svg class="hands__icon" aria-hidden="true" focusable="false" viewBox="0 0 64 64"><path d="${HAND_PATH}"/></svg>
      <span id="handsTitle" class="hands__title"></span>
      <span id="handCount" class="hands__count" hidden></span>
    </div>
    <ol id="handList" class="hands__list"></ol>
    <div id="handMore" class="hands__more" hidden></div>
  </aside>
  <div id="hand" class="hand" hidden>
    <svg aria-hidden="true" focusable="false" viewBox="0 0 64 64"><path d="${HAND_PATH}"/></svg>
    <div id="handNames" class="hand-names"></div>
  </div>
  <div id="status" class="status" hidden></div>
</main>
<script src="/app.js"></script>
</body>
</html>`;

const PAGE_CSS = `
html, body { height: 100%; margin: 0; }
/* The classes below set display, which would otherwise beat the hidden attribute. */
[hidden] { display: none !important; }
body { background: #000; color: #fff; font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-user-select: none; user-select: none; overflow: hidden; }
/* The silent clip that holds the screen awake where Wake Lock isn't available.
   Chromium only takes its video wake lock for muted videos that are in view,
   so it covers the page at 1% opacity, where it can't be seen. */
.awake { height: 100%; inset: 0; object-fit: cover; opacity: .01; pointer-events: none; position: fixed; width: 100%; z-index: 1; }
.display { align-items: center; box-sizing: border-box; display: flex; flex-direction: column; gap: 2vh; height: 100%; justify-content: center; position: relative; transition: background-color 700ms ease, color 700ms ease, padding 300ms ease; }
.label { font-size: clamp(1rem, 4vw, 3rem); font-weight: 600; letter-spacing: 0.04em; max-width: 94vw; opacity: 0.85; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
.label:empty { display: none; }
.time { font-size: clamp(3rem, 26vw, 40vh); font-variant-numeric: tabular-nums; font-weight: 700; line-height: 1; white-space: nowrap; }
.time__sign { color: var(--ring, #ff453a); }
.time__sign:empty { display: none; }
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

/* ---- Focus layout: a progress ring, and the raised hands beside it ---- */
.clock { display: none; font-size: clamp(0.8rem, 2.4vh, 1.3rem); font-variant-numeric: tabular-nums; opacity: .7; position: absolute; right: 2.4vw; top: 2.2vh; }
.display.focus .clock { display: block; }
.display.focus { padding: 4vh 4vw; }
.dial { display: block; position: relative; }
.dial__inner { align-items: center; display: flex; flex-direction: column; gap: 1.2vh; }
/* The ring fills 92 of the viewBox's 120 units, leaving the glow around it
   room to fade out instead of being cut off square at the SVG's edge. */
.dial__ring { display: none; height: 120%; inset: -10%; position: absolute; transform: rotate(-90deg); width: 120%; }
.dial__track { stroke: rgba(255,255,255,.10); stroke-width: 5; }
.dial__progress { filter: drop-shadow(0 0 1.2vh var(--ring, #2ee6d6)); stroke: var(--ring, #2ee6d6); stroke-linecap: round; stroke-width: 5; transition: stroke 500ms ease, stroke-dasharray 200ms linear; }
.eyebrow { color: var(--ring, #ff453a); display: none; font-size: clamp(0.75rem, 2vh, 1.3rem); font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
.display.focus.is-active .eyebrow { display: block; }
.display.focus.is-active .dial { aspect-ratio: 1; display: grid; place-items: center; width: min(58vh, 100%); }
.display.focus.is-active .dial__ring { display: block; }
.display.focus.is-active .time { font-size: min(11vh, 17vw); }
.display.focus.is-active .caption { display: none; }
.display.focus .label { font-size: clamp(1.1rem, 4.6vh, 2.6rem); font-weight: 800; letter-spacing: 0; opacity: 1; text-transform: none; }
.display.focus.has-hands { padding-right: calc(30vw + 6vw); }
.hands { bottom: 3vh; display: flex; flex-direction: column; gap: 1.6vh; overflow: hidden; position: absolute; right: 2.4vw; top: 7vh; width: 30vw; }
.hand-banner { align-items: center; background: rgba(255,214,10,.08); border: 2px solid #ffd60a; border-radius: 14px; box-shadow: 0 0 3vh rgba(255,214,10,.35), inset 0 0 3vh rgba(255,214,10,.12); color: #ffd60a; display: flex; gap: 1.2vw; justify-content: center; padding: 1.6vh 1vw; }
.hand-banner__icon { fill: currentColor; flex: none; height: 4.4vh; width: 4.4vh; }
.hand-banner__text { font-size: clamp(.9rem, 3vh, 2rem); font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.hand-banner.flash { animation: banner-flash .55s steps(1, end) infinite; }
@keyframes banner-flash { 0%, 45% { opacity: 1; } 46%, 100% { opacity: .3; } }
.hands__header { align-items: center; display: flex; gap: .8vw; }
.hands__icon { fill: currentColor; flex: none; height: 3.4vh; width: 3.4vh; }
.hands__title { flex: 1; font-size: clamp(.9rem, 2.6vh, 1.6rem); font-weight: 700; }
.hands__count { align-items: center; background: #ffd60a; border-radius: 999px; color: #101820; display: flex; font-size: clamp(.8rem, 2vh, 1.2rem); font-weight: 800; height: 3.6vh; justify-content: center; min-width: 3.6vh; padding: 0 .5em; }
.hands__list { display: flex; flex-direction: column; gap: 1.2vh; list-style: none; margin: 0; overflow: hidden; padding: 0; }
.hands__row { align-items: center; background: rgba(255,255,255,.06); border: 1px solid transparent; border-radius: 12px; display: flex; gap: 1.2vw; min-height: 8.4vh; padding: 0 1.2vw; }
.hands__row--first { background: rgba(46,230,214,.10); border-color: #2ee6d6; }
.hands__index { border-right: 1px solid rgba(255,255,255,.14); color: #4fd1c5; flex: none; font-size: clamp(.8rem, 2.2vh, 1.3rem); font-weight: 800; letter-spacing: .08em; min-width: 2.4em; padding-right: 1.2vw; text-align: center; }
.hands__name { font-size: clamp(1rem, 3vh, 2rem); font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hands__more { color: rgba(255,255,255,.55); font-size: clamp(.8rem, 2.2vh, 1.3rem); font-weight: 700; text-align: center; }
@media (orientation: portrait) {
  .display.focus.is-active .dial { width: min(44vh, 100%); }
  .display.focus.has-hands { padding: 4vh 4vw 48vh; }
  .hands { gap: 1.2vh; bottom: 2vh; height: 44vh; left: 2.4vw; right: 2.4vw; top: auto; width: auto; }
  .hand-banner { padding: 1vh 1vw; }
  .hand-banner__icon { height: 3.6vh; width: 3.6vh; }
  .hands__row { min-height: 5.2vh; }
  .hands__name { font-size: clamp(.9rem, 2.2vh, 1.6rem); }
}
`;

// Plain script (no build step): the same display rules as the timer window.
const PAGE_JS = String.raw`(function () {
  'use strict';
  var FLASH_MS = 3000;
  var MAX_HANDS = 4;
  var data = null;
  var connected = false;
  var flashUntil = 0;
  var previousNames = null;
  var renderedNamesKey = null;
  var text = {};
  try { text = JSON.parse(document.documentElement.getAttribute('data-text') || '{}'); } catch (e) { text = {}; }

  var el = {
    caption: document.getElementById('caption'),
    clock: document.getElementById('clock'),
    display: document.getElementById('display'),
    eyebrow: document.getElementById('eyebrow'),
    hand: document.getElementById('hand'),
    handBanner: document.getElementById('handBanner'),
    handBannerText: document.getElementById('handBannerText'),
    handCount: document.getElementById('handCount'),
    handList: document.getElementById('handList'),
    handMore: document.getElementById('handMore'),
    handNames: document.getElementById('handNames'),
    hands: document.getElementById('hands'),
    handsTitle: document.getElementById('handsTitle'),
    label: document.getElementById('label'),
    ring: document.getElementById('ringProgress'),
    sign: document.getElementById('timeSign'),
    status: document.getElementById('status'),
    time: document.getElementById('time'),
    value: document.getElementById('timeValue')
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function formatCountdown(total) {
    var safe = Math.max(0, Math.floor(total));
    return pad(Math.floor(safe / 60)) + ':' + pad(safe % 60);
  }
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
  function partTargetSeconds() {
    return (data && (data.timerCountdownTargetSeconds || data.timerPartTargetSeconds)) || 0;
  }
  function ringColor(overtime, remaining, total) {
    if (overtime) return (data && data.timerOvertimeTextColor) || '#ff453a';
    if (total > 0 && remaining > 0 && remaining <= 60) return '#ffd60a';
    return '#2ee6d6';
  }
  function setClass(node, className) {
    if (node.className !== className) node.className = className;
  }
  function renderHandRows(names) {
    var visible = names.slice(0, MAX_HANDS);
    var html = '';
    for (var i = 0; i < visible.length; i++) {
      html += '<li class="hands__row' + (i === 0 ? ' hands__row--first' : '') + '">' +
        '<span class="hands__index">' + pad(i + 1) + '</span>' +
        '<span class="hands__name"></span></li>';
    }
    el.handList.innerHTML = html;
    var nameEls = el.handList.querySelectorAll('.hands__name');
    for (var j = 0; j < nameEls.length; j++) nameEls[j].textContent = visible[j];
  }
  function renderHands(now, names, handsOn) {
    if (!(data && data.timerRemoteFocusLayout)) {
      el.hands.hidden = true;
      el.hand.hidden = !handsOn;
      el.handNames.textContent = handsOn && names.length ? names.join(' ' + String.fromCharCode(183) + ' ') : '';
      return;
    }

    el.hand.hidden = true;
    var isNewHand = previousNames !== null && names.some(function (name) { return previousNames.indexOf(name) === -1; });
    if (isNewHand) flashUntil = now.getTime() + FLASH_MS;
    previousNames = names.slice();

    el.hands.hidden = !handsOn;
    if (!handsOn) return;

    el.handBannerText.textContent = text.handRaised || 'Hand raised';
    el.handsTitle.textContent = text.raisedHands || 'Raised hands';
    var flashing = names.length === 0 || now.getTime() < flashUntil;
    el.handBanner.hidden = !flashing;
    if (flashing) {
      if (el.handBanner.className.indexOf('flash') === -1) el.handBanner.className = 'hand-banner flash';
    } else if (el.handBanner.className !== 'hand-banner') {
      el.handBanner.className = 'hand-banner';
    }

    var key = names.join('\n');
    if (key !== renderedNamesKey) {
      renderHandRows(names);
      renderedNamesKey = key;
    }
    el.handCount.hidden = names.length === 0;
    el.handCount.textContent = names.length > 0 ? String(names.length) : '';
    el.handMore.hidden = names.length <= MAX_HANDS;
    el.handMore.textContent = names.length > MAX_HANDS ? '+' + (names.length - MAX_HANDS) : '';
  }
  function render() {
    var now = new Date();
    var focus = !!(data && data.timerRemoteFocusLayout);
    var running = !!(data && data.running);
    var countdown = running ? null : meetingCountdown(now);
    var active = running || countdown !== null;
    var names = (data && data.handAlertNames) || [];
    var handsOn = !!(data && data.handAlertActive);
    var showHands = focus && (handsOn || names.length > 0);
    var overtime = running && typeof data.time === 'string' && data.time.charAt(0) === '-';
    var target = partTargetSeconds();
    var remaining = target - ((data && data.timerElapsedSeconds) || 0);
    var ringTotal = running ? target : (data && data.timerMeetingCountdownMinutes ? data.timerMeetingCountdownMinutes * 60 : 0);
    var ringRemaining = running ? remaining : (countdown || 0);
    var useOvertime = overtime && data.timerOvertimeIndicator;

    setClass(el.display, 'display' + (focus ? ' focus' : '') + (active ? ' is-active' : '') + (showHands ? ' has-hands' : ''));
    el.display.style.backgroundColor = (useOvertime ? data.timerOvertimeBackgroundColor : data && data.timerBackgroundColor) || '#000';
    el.display.style.color = (useOvertime ? data.timerOvertimeTextColor : data && data.timerTextColor) || '#fff';
    el.display.style.setProperty('--ring', ringColor(overtime, ringRemaining, ringTotal));

    el.clock.hidden = !(focus && active);
    el.clock.textContent = formatTime(now);

    if (running) {
      var shown = data.time || '';
      var sign = '';
      // The focus layout reads overtime as a positive amount of extra time,
      // with the sign in its own (red) span, as in the design.
      if (overtime && focus) {
        sign = '+';
        shown = target > 0 ? formatCountdown(-remaining) : shown.replace('-', '');
      }
      el.label.textContent = data.timerCurrentPartLabel || '';
      el.sign.textContent = sign;
      el.value.textContent = shown;
      el.caption.textContent = data.paused ? (text.paused || '') : (data.mode === 'countup' ? (text.elapsed || '') : (text.remaining || ''));
      el.eyebrow.textContent = data.paused ? (text.paused || '') : overtime ? (text.overtime || '') : (data.mode === 'countup' ? (text.elapsed || '') : (text.remaining || ''));
    } else if (countdown !== null) {
      el.label.textContent = text.meetingStartsIn || '';
      el.sign.textContent = '';
      el.value.textContent = formatCountdown(countdown);
      el.caption.textContent = '';
      el.eyebrow.textContent = '';
    } else {
      el.label.textContent = '';
      el.sign.textContent = '';
      el.value.textContent = formatTime(now);
      el.caption.textContent = '';
      el.eyebrow.textContent = '';
    }

    var blink = running && (data.paused || (overtime && data.timerOvertimeAnimation));
    setClass(el.time, 'time' + (blink ? ' blink' : ''));

    var progress = 0;
    if (overtime) progress = 1;
    else if (ringTotal > 0) progress = Math.max(0, Math.min(1, ringRemaining / ringTotal));
    el.ring.style.opacity = ringTotal > 0 || overtime ? '1' : '0';
    el.ring.style.strokeDasharray = (progress * 100) + ' 100';

    renderHands(now, names, handsOn);

    el.status.hidden = connected;
    el.status.textContent = connected ? '' : (text.reconnecting || 'Reconnecting...');
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

  // Keep the lectern's screen awake while the page is open. Browsers only
  // expose the Wake Lock API to secure pages, and the tablet opens this page
  // over plain HTTP on the LAN; there, a silent looping video holds the screen
  // on, the technique browsers have long used for exactly this.
  var awakeLock = null;
  var awakeVideo = document.getElementById('awake');
  var awakeVideoStarted = false;

  function playAwakeVideo() {
    if (!awakeVideo || !awakeVideoStarted || !awakeVideo.paused) return;
    var playing = awakeVideo.play();
    if (playing && playing.catch) playing.catch(function () {});
  }

  function startAwakeVideo() {
    if (!awakeVideo || awakeVideoStarted) return;
    awakeVideoStarted = true;
    awakeVideo.src = '/awake.mp4';
    playAwakeVideo();
  }

  function keepAwake() {
    if (document.visibilityState !== 'visible') return;
    if (!navigator.wakeLock) {
      startAwakeVideo();
      return;
    }
    if (awakeLock) return;
    navigator.wakeLock.request('screen').then(function (lock) {
      awakeLock = lock;
      lock.addEventListener('release', function () {
        if (awakeLock === lock) awakeLock = null;
      });
    }).catch(function () {
      startAwakeVideo();
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    keepAwake();
    playAwakeVideo();
  });
  document.addEventListener('pointerdown', playAwakeVideo, { passive: true });
  keepAwake();
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
      "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; media-src 'self'",
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
  if (url === '/awake.mp4') {
    res
      .writeHead(200, {
        ...headers,
        'Content-Length': AWAKE_VIDEO.length,
        'Content-Type': 'video/mp4',
      })
      .end(AWAKE_VIDEO);
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
