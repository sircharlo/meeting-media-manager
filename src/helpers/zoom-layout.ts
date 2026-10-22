import type {
  Display,
  ZoomLayoutPreferences,
  ZoomScreenRect,
  ZoomWindowLayout,
  ZoomWindowState,
} from 'src/types';

import { i18n } from 'boot/i18n';
import { ZOOM_SETUP_ASSISTANT_DIALOG_ID } from 'src/constants/zoom';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getRendererPlatform } from 'src/helpers/fs';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  countZoomMeetingParticipants,
  getZoomWindowLayout,
  isZoomCheckInProgress,
  openZoomParticipantsWhileSharing,
  placeZoomWindows,
} from 'src/helpers/zoom';
import { log } from 'src/shared/vanilla';
import { sameScreenRect } from 'src/shared/zoom-layout';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { useZoomStateStore } from 'stores/zoom-state';

// The Zoom Meeting Manager's window layout: once a Zoom meeting opens, M³
// puts Zoom's meeting window (and its own) where the user chose in the setup
// assistant, then keeps Zoom there. Zoom moves its window by itself: wider or
// narrower as its participants list opens or closes, and back from screen
// sharing or its mini view wherever it likes. A window the user moves or
// resizes themselves stays where they put it, until the next meeting.

const t = (key: string, named?: Record<string, unknown>) =>
  (i18n.global.t as (key: string, named?: Record<string, unknown>) => string)(
    key,
    named ?? {},
  );

/** How often Zoom's windows are looked at while a meeting is open. */
export const LAYOUT_POLL_INTERVAL_MS = 2000;
/** How often to look again while no meeting is open. */
export const LAYOUT_IDLE_INTERVAL_MS = 10_000;
/** How long Zoom takes to open its participants list and widen its window. */
const PARTICIPANTS_SETTLE_MS = 1500;
/** How long to wait before trying again when the windows couldn't be placed. */
const RETRY_AFTER_FAILURE_MS = 30_000;

/** The meeting being kept in place: from when it opens until it closes. */
interface Session {
  /** When M³ last placed Zoom, to tell the user's moves since. */
  placedAt: number;
  /** Where Zoom's windows ended up, to notice them moving. */
  second?: ZoomScreenRect;
  zoom?: ZoomScreenRect;
}

let session: null | Session = null;
let userAdjusted = false;

/** Zoom's participants list while the current share goes on. */
interface ShareList {
  /** Where M³ last put it, and when. */
  frame?: ZoomScreenRect;
  /** Opened once per share: closed by the user, it stays closed. */
  opened: boolean;
  placedAt: number;
  /** Moved by the user: left where they put it. */
  userAdjusted: boolean;
}

let shareList: null | ShareList = null;
let screensChanged = false;
let fallbackNoticed = false;
let retryAt = 0;
// Zoom's window as seen on the previous look, to wait for it to stop moving.
let lastSeen: null | ZoomScreenRect = null;

let pollTimer: ReturnType<typeof setTimeout> | undefined;
let pollInProgress = false;

/**
 * A screen the media window (or the timer) fills, as M³ is set up: never
 * offered for Zoom or M³. A presentation window on a lone screen, or one
 * set to show in a window, takes no screen of its own.
 */
export const isPresentationScreen = (display: Display, screens: Display[]) => {
  if (screens.length < 2 || display.mainWindow) return false;
  const app = useAppSettingsStore();
  if (display.mediaWindow && !app.screenPreferences.preferWindowed) return true;
  return (
    !!display.timerWindow &&
    !app.timerPreferences.preferWindowed &&
    !!useCurrentStateStore().currentSettings?.enableTimerDisplay
  );
};

/**
 * The screen chosen for Zoom among those connected, else M³'s (also when
 * the media window or the timer fills the one chosen now). Undefined with
 * no screen to offer.
 */
export const findZoomScreen = (
  screens: Display[],
  layout: Pick<ZoomLayoutPreferences, 'display'>,
) => {
  const usable = screens.filter((d) => !isPresentationScreen(d, screens));
  const m3Screen = usable.find((d) => d.mainWindow) ?? usable[0];
  const wanted = layout.display;
  if (!wanted) return m3Screen;
  const { bounds } = wanted;
  return (
    usable.find((d) => d.id === wanted.id) ??
    usable.find(
      (d) =>
        d.bounds.x === bounds.x &&
        d.bounds.y === bounds.y &&
        d.bounds.width === bounds.width &&
        d.bounds.height === bounds.height,
    ) ??
    m3Screen
  );
};

/**
 * The layout first suggested: with three screens or more, Zoom on one of its
 * own (not M³'s, not the media window's); otherwise on M³'s, next to it.
 */
export const suggestZoomLayout = (
  screens: Display[],
): Pick<ZoomLayoutPreferences, 'alone' | 'display'> => {
  const own =
    screens.length > 2
      ? screens.find((d) => !d.mainWindow && !isPresentationScreen(d, screens))
      : undefined;
  if (!own) return { alone: false, display: null };
  return {
    alone: true,
    display: { bounds: { ...own.bounds }, id: own.id },
  };
};

// "Leave Zoom alone" from a notification: no automatic moves until M³
// restarts (arranging by hand still works).
let leftAloneThisSession = false;

export const isZoomLayoutEnabled = () => {
  const settings = useCurrentStateStore().currentSettings;
  return (
    getRendererPlatform() === 'win32' &&
    !!settings?.zoomMeetingManagerEnable &&
    useAppSettingsStore().zoomLayout.enabled &&
    !leftAloneThisSession
  );
};

/** The layout preferences as a plain object, for the main process. */
const plainPreferences = (): ZoomLayoutPreferences => {
  const prefs = useAppSettingsStore().zoomLayout;
  return {
    ...prefs,
    display: prefs.display
      ? { bounds: { ...prefs.display.bounds }, id: prefs.display.id }
      : null,
  };
};

const noticeFallback = () => {
  if (fallbackNoticed) return;
  fallbackNoticed = true;
  log('Zoom layout: its screen is not available, sharing M³’s', 'zoom', 'warn');
  createTemporaryNotification({
    group: 'zoom-layout',
    icon: 'mmm-info',
    message: t('zoom-layout-screen-missing'),
    type: 'warning',
  });
};

/**
 * Says when M³ moved one of Zoom's windows by itself, with a way to stop it
 * at once should that get in the way during a meeting: until M³ restarts,
 * or for good (the window layout is turned off).
 */
const noticeMove = (messageKey: string) => {
  createTemporaryNotification({
    actions: [
      {
        color: 'white',
        handler: () => {
          leftAloneThisSession = true;
          stopZoomLayoutWatcher();
          log('Zoom layout: left alone until M³ restarts', 'zoom', 'info');
        },
        label: t('zoom-layout-leave-alone'),
        noCaps: true,
      },
      {
        color: 'white',
        handler: () => {
          useAppSettingsStore().zoomLayout.enabled = false;
          stopZoomLayoutWatcher();
          log('Zoom layout: turned off from its notification', 'zoom', 'info');
          createTemporaryNotification({
            group: 'zoom-layout',
            icon: 'mmm-info',
            message: t('zoom-layout-turned-off'),
            type: 'info',
          });
        },
        label: t('zoom-layout-turn-off'),
        noCaps: true,
      },
    ],
    caption: t('zoom-layout-moved-caption'),
    group: 'zoom-layout',
    icon: 'mmm-window',
    message: t(messageKey),
    timeout: 8000,
    type: 'info',
  });
};

/**
 * Puts Zoom's meeting windows where the layout says, and M³'s main window
 * too unless `zoomOnly`. Resolves to whether they could be placed (not with
 * no meeting window, say). `movedFrom` is where Zoom was when M³ moved it by
 * itself: the user is then told, if it really moved.
 */
export const arrangeZoomWindows = async ({
  movedFrom,
  zoomOnly = false,
}: { movedFrom?: ZoomScreenRect; zoomOnly?: boolean } = {}) => {
  const targets =
    await globalThis.electronApi.getZoomLayoutTargets(plainPreferences());
  const placed = targets ? await placeZoomWindows(targets, { zoomOnly }) : null;
  if (!placed) {
    retryAt = Date.now() + RETRY_AFTER_FAILURE_MS;
    return false;
  }
  if (targets?.fallback) noticeFallback();
  retryAt = 0;
  screensChanged = false;
  session = {
    placedAt: Date.now(),
    second: placed.second,
    zoom: placed.zoom,
  };
  userAdjusted = false;
  lastSeen = null;
  log('Zoom layout: windows arranged', 'zoom', 'info', { placed, zoomOnly });
  if (movedFrom && placed.zoom && !sameScreenRect(movedFrom, placed.zoom)) {
    noticeMove('zoom-layout-moved');
  }
  return true;
};

/** Opens Zoom's participants list (reading it does), and lets Zoom resize. */
const openParticipantsList = async () => {
  await countZoomMeetingParticipants();
  await new Promise((resolve) => {
    setTimeout(resolve, PARTICIPANTS_SETTLE_MS);
  });
};

/** Whether Zoom's window was already there on the previous look. */
const settled = (frame: ZoomScreenRect) => {
  const still = sameScreenRect(frame, lastSeen, 0);
  lastSeen = frame;
  return still;
};

const forgetMeeting = () => {
  if (session) log('Zoom layout: meeting closed', 'zoom', 'info');
  session = null;
  shareList = null;
  userAdjusted = false;
  lastSeen = null;
};

/** Whether the user moved or resized the share's participants list. */
const listMovedByUser = (layout: ZoomWindowLayout, list: ShareList) => {
  if (list.userAdjusted) return true;
  if (!list.frame || layout.userMovedListMsAgo === null) return false;
  if (Date.now() - layout.userMovedListMsAgo <= list.placedAt) return false;
  list.userAdjusted = true;
  log('Zoom layout: the user moved the participants list', 'zoom', 'info');
  return true;
};

/**
 * While sharing, Zoom hides its meeting window, participants list included:
 * M³ opens the list in a window of its own, once per share, and keeps it at
 * Zoom's spot. Closed or moved by the user, it's left so until the next
 * share. Zoom closes it itself once sharing stops.
 */
const followShare = async (layout: ZoomWindowLayout) => {
  const prefs = useAppSettingsStore().zoomLayout;
  if (!session || !prefs.showParticipantsWhileSharing || layout.userMoving) {
    return;
  }
  shareList ??= { opened: false, placedAt: 0, userAdjusted: false };
  const list = layout.participants;
  if (!list) {
    if (shareList.opened) return;
    shareList.opened = true;
    log(
      'Zoom layout: opening the participants list while sharing',
      'zoom',
      'info',
    );
    await openZoomParticipantsWhileSharing();
    return;
  }
  shareList.opened = true;
  if (listMovedByUser(layout, shareList)) return;
  if (sameScreenRect(list.frame, shareList.frame)) {
    lastSeen = null;
    return;
  }
  if (!settled(list.frame)) return;
  const targets =
    await globalThis.electronApi.getZoomLayoutTargets(plainPreferences());
  const placed = targets
    ? await placeZoomWindows(targets, { participantsOnly: true })
    : null;
  if (!placed?.participants) return;
  shareList.frame = placed.participants;
  shareList.placedAt = Date.now();
  log('Zoom layout: participants list placed for the share', 'zoom', 'info');
  if (!sameScreenRect(list.frame, placed.participants)) {
    noticeMove('zoom-layout-list-moved');
  }
};

/**
 * A new meeting's window: arranged once it stopped moving (Zoom opens it in
 * steps), after opening the participants list if asked, so that doesn't
 * push Zoom off its spot right away.
 */
const arrangeNewMeeting = async (meeting: ZoomWindowState) => {
  if (!settled(meeting.frame)) return;
  if (useAppSettingsStore().zoomLayout.openParticipants) {
    await openParticipantsList();
  }
  await arrangeZoomWindows({ movedFrom: meeting.frame });
};

/** Whether the user moved or resized Zoom since M³ last placed it. */
const movedByUser = (layout: ZoomWindowLayout, placedAt: number) => {
  if (userAdjusted) return true;
  if (layout.userMovedMsAgo === null) return false;
  if (Date.now() - layout.userMovedMsAgo <= placedAt) return false;
  userAdjusted = true;
  log(
    'Zoom layout: the user moved Zoom, left there until the next meeting',
    'zoom',
    'info',
  );
  return true;
};

/**
 * Puts Zoom back where it was placed once it moved on its own and stopped
 * moving (its participants list opening, say). After a change of screens,
 * the whole layout is worked out and placed again.
 */
const keepInPlace = async (
  layout: ZoomWindowLayout,
  meeting: ZoomWindowState,
  placed: Session,
) => {
  if (screensChanged) {
    screensChanged = false;
    log('Zoom layout: screens changed, arranging again', 'zoom', 'info');
    await arrangeZoomWindows({ movedFrom: meeting.frame });
    return;
  }
  if (!useAppSettingsStore().zoomLayout.keepInPlace) return;
  const secondMoved =
    !!placed.second &&
    !!layout.second &&
    !sameScreenRect(layout.second.frame, placed.second);
  if (sameScreenRect(meeting.frame, placed.zoom) && !secondMoved) {
    lastSeen = null;
    return;
  }
  if (!settled(meeting.frame)) return;
  log('Zoom layout: Zoom moved on its own, putting it back', 'zoom', 'info');
  await arrangeZoomWindows({ movedFrom: meeting.frame, zoomOnly: true });
};

/**
 * Follows Zoom's windows on each look: arranges them once a new meeting's
 * window has settled, and puts Zoom back when it moved by itself. Resolves to
 * whether a meeting is open (looked at more often then).
 */
const follow = async (layout: ZoomWindowLayout) => {
  const { meeting } = layout;
  if (!meeting) {
    // Hidden behind its sharing toolbar or mini view: still the same meeting.
    if (layout.sharing) await followShare(layout);
    if (layout.sharing || layout.miniView) return true;
    forgetMeeting();
    return false;
  }
  shareList = null;
  // Left alone: the user is moving it, hid it, or put it full screen (which
  // M³ does too, on a screen without a taskbar), or placing it just failed.
  const zoomFullScreen =
    meeting.fullScreen && !sameScreenRect(meeting.frame, session?.zoom);
  const leftAlone =
    layout.userMoving ||
    meeting.minimized ||
    zoomFullScreen ||
    Date.now() < retryAt;
  if (leftAlone) return true;

  if (!session) await arrangeNewMeeting(meeting);
  else if (!movedByUser(layout, session.placedAt)) {
    await keepInPlace(layout, meeting, session);
  }
  return true;
};

const schedulePoll = (delayMs: number) => {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(() => {
    void pollZoomLayout();
  }, delayMs);
};

const pollZoomLayout = async () => {
  if (!isZoomLayoutEnabled()) {
    stopZoomLayoutWatcher();
    return;
  }
  // Something else is using Zoom (an automation, a check, the setup
  // assistant): look again once it's done.
  if (
    pollInProgress ||
    useZoomStateStore().runActive ||
    isZoomCheckInProgress() ||
    useDialogStateStore().isDialogOpen(ZOOM_SETUP_ASSISTANT_DIALOG_ID)
  ) {
    schedulePoll(LAYOUT_POLL_INTERVAL_MS);
    return;
  }
  pollInProgress = true;
  try {
    const layout = await getZoomWindowLayout();
    const meetingOpen = layout ? await follow(layout) : false;
    schedulePoll(
      meetingOpen ? LAYOUT_POLL_INTERVAL_MS : LAYOUT_IDLE_INTERVAL_MS,
    );
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'pollZoomLayout' } } });
    schedulePoll(LAYOUT_IDLE_INTERVAL_MS);
  } finally {
    pollInProgress = false;
  }
};

// Screens connected, removed or rearranged: the layout is worked out again.
const onScreensChanged = () => {
  screensChanged = true;
};

export const startZoomLayoutWatcher = () => {
  if (pollTimer !== undefined) return;
  if (!isZoomLayoutEnabled()) return;
  log('Watching Zoom’s windows for the window layout', 'zoom', 'info');
  globalThis.addEventListener('screen-trigger-update', onScreensChanged);
  schedulePoll(0);
};

export const stopZoomLayoutWatcher = () => {
  if (pollTimer === undefined) return;
  clearTimeout(pollTimer);
  pollTimer = undefined;
  globalThis.removeEventListener('screen-trigger-update', onScreensChanged);
  forgetMeeting();
  log('Stopped watching Zoom’s windows', 'zoom', 'info');
};

/** Starts or stops the watcher to match the settings. */
export const syncZoomLayoutWatcher = () => {
  if (isZoomLayoutEnabled()) {
    startZoomLayoutWatcher();
  } else {
    stopZoomLayoutWatcher();
  }
};

export const __testables = {
  follow,
  pollZoomLayout,
  reset: () => {
    clearTimeout(pollTimer);
    pollTimer = undefined;
    pollInProgress = false;
    session = null;
    shareList = null;
    userAdjusted = false;
    screensChanged = false;
    fallbackNoticed = false;
    retryAt = 0;
    leftAloneThisSession = false;
    lastSeen = null;
  },
};
