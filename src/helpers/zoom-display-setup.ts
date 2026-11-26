import type { ZoomCommandResult, ZoomScreenRect } from 'src/types';

import { AUTO_START_WINDOW_HOURS } from 'src/constants/date';
import { getMeetingStartToday, isMwMeetingDay } from 'src/helpers/date';
import { getRendererPlatform } from 'src/helpers/fs';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { putZoomSecondWindowFullScreen } from 'src/helpers/zoom';
import {
  getMediaScreenForZoom,
  isPresentationScreen,
} from 'src/helpers/zoom-layout';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import {
  useZoomDisplaySetupStore,
  type ZoomDisplaySetupMeeting,
} from 'stores/zoom-display-setup';
import { useZoomStateStore } from 'stores/zoom-state';

// Before each meeting, M³ asks whether anyone on the program will be on Zoom
// (at the midweek meeting, anyone with a part; at the weekend meeting, the
// speaker). They're seen on the TV through Zoom's window behind the media
// display, once that's hidden: so that window has to be on the TV, full
// screen, which is best checked before the meeting starts. The question
// comes once per meeting, from when background music may start until the
// meeting does (DialogZoomDisplaySetup asks it once nothing else is on
// screen). With the Zoom Meeting Manager on, M³ puts Zoom's window there
// itself; otherwise the dialog says what to do.

export interface DueZoomDisplaySetup {
  /** Today's meeting, for the current congregation. */
  key: string;
  meeting: ZoomDisplaySetupMeeting;
}

/**
 * What M³ did with Zoom's second window, for the dialog to say:
 * - `full-screen`: it fills the TV;
 * - `not-full-screen`: it's on the TV, but M³ couldn't put it full screen;
 * - `no-second-window`: Zoom shows its meeting in one window (its "Dual
 *   window" view is off);
 * - `no-meeting`: no Zoom meeting is open;
 * - `failed`: M³ couldn't tell or do anything (an error, or the user
 *   stopped it).
 */
export type ZoomDisplayPlacement =
  | 'failed'
  | 'full-screen'
  | 'no-meeting'
  | 'no-second-window'
  | 'not-full-screen';

/** Meetings already asked about this session, as `<congregation>:<day>`. */
const askedMeetings = new Set<string>();

/**
 * When today's meeting starts (ms), if there's one with a start time (the
 * Memorial has none in M³).
 */
const getStartToday = (now: Date) => getMeetingStartToday(now)?.getTime();

/**
 * Today's meeting, if the question about it is due at `now`: from when
 * background music may start before it until it starts, unless the question
 * is turned off or was asked already. Null otherwise.
 */
export const getDueZoomDisplaySetup = (
  now = new Date(),
): DueZoomDisplaySetup | null => {
  const currentState = useCurrentStateStore();
  const settings = currentState.currentSettings;
  const congregation = currentState.currentCongregation;
  if (!congregation || !settings?.zoomDisplaySetupHelp) return null;
  if (!settings.enableMediaDisplayButton || settings.disableMediaFetching) {
    return null;
  }
  const start = getStartToday(now);
  if (!start) return null;
  const from = start - AUTO_START_WINDOW_HOURS * 3600 * 1000;
  if (now.getTime() < from || now.getTime() >= start) return null;
  const key = `${congregation}:${new Date(start).toDateString()}`;
  if (askedMeetings.has(key)) return null;
  return { key, meeting: isMwMeetingDay(now) ? 'mw' : 'we' };
};

/** Whether today's meeting has started (or there's none to wait for). */
export const hasMeetingStarted = (now = new Date()) => {
  const start = getStartToday(now);
  return !start || now.getTime() >= start;
};

/** Asks about today's meeting: once only, whatever the answer. */
export const askZoomDisplaySetup = (due: DueZoomDisplaySetup) => {
  askedMeetings.add(due.key);
  log('Asking whether anyone on the program is on Zoom', 'zoom', 'info', {
    meeting: due.meeting,
  });
  useZoomDisplaySetupStore().open(due.meeting);
};

/**
 * Whether the media window fills a screen of its own (the TV), for Zoom's
 * window to go behind it: not with a single screen, nor with the media
 * window set to show in a window.
 */
export const isMediaOnItsOwnScreen = async () => {
  const screens = await globalThis.electronApi.getAllScreens();
  return screens.some(
    (display) => display.mediaWindow && isPresentationScreen(display, screens),
  );
};

/**
 * Whether M³ puts Zoom's window on the TV itself: the Zoom Meeting Manager
 * is on (on Windows), and its automations aren't paused (by a failed check,
 * or the user chose not to have Zoom tested for this meeting).
 */
export const canPlaceZoomForDisplaySetup = () =>
  getRendererPlatform() === 'win32' &&
  !!useCurrentStateStore().currentSettings?.zoomMeetingManagerEnable &&
  !useZoomStateStore().automationsPaused;

// The media window takes a moment to fade out: Zoom's window behind it is
// put full screen once it's gone.
const MEDIA_HIDE_SETTLE_MS = 1000;

// Whether the setup hid the media display (it shows it again at the end).
let hiddenBySetup = false;
// The TV, as worked out while the media window still showed on it.
let setupScreen: null | ZoomScreenRect = null;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const toPlacement = (result: ZoomCommandResult): ZoomDisplayPlacement => {
  if (result.ok) {
    return result.secondWindow?.fullScreen ? 'full-screen' : 'not-full-screen';
  }
  switch (result.error) {
    case 'meeting-not-found':
      return 'no-meeting';
    case 'second-window-not-found':
      return 'no-second-window';
    default:
      return 'failed';
  }
};

const placeZoom = async (): Promise<ZoomDisplayPlacement> => {
  if (!setupScreen) {
    log('Zoom display setup: the TV was not found', 'zoom', 'warn');
    return 'failed';
  }
  const result = await putZoomSecondWindowFullScreen(setupScreen);
  const placement = toPlacement(result);
  log(
    `Zoom display setup: ${placement}`,
    'zoom',
    placement === 'full-screen' ? 'info' : 'warn',
    { error: result.error, secondWindow: result.secondWindow },
  );
  return placement;
};

/**
 * Hides the media display, for the user to see Zoom's window behind it on
 * the TV. When it can (see canPlaceZoomForDisplaySetup), M³ also puts that
 * window there, full screen, and resolves to what it did; null when that's
 * left to the user.
 */
export const revealZoomForDisplaySetup =
  async (): Promise<null | ZoomDisplayPlacement> => {
    const placing = canPlaceZoomForDisplaySetup();
    // Worked out while the media window still shows on it.
    setupScreen = placing ? await getMediaScreenForZoom() : null;
    if (useCurrentStateStore().mediaWindowVisible) {
      hiddenBySetup = true;
      toggleMediaWindowVisibility(false);
    }
    if (!placing) return null;
    await sleep(MEDIA_HIDE_SETTLE_MS);
    return placeZoom();
  };

/**
 * Tries again, once a meeting or a second window that was missing may be
 * there now, or Zoom's window was moved or put out of full screen meanwhile.
 */
export const retryZoomDisplayPlacement = async () => {
  setupScreen ??= await getMediaScreenForZoom();
  return placeZoom();
};

/** Shows the media display again, if the setup hid it. */
export const restoreMediaAfterZoomDisplaySetup = () => {
  setupScreen = null;
  if (!hiddenBySetup) return;
  hiddenBySetup = false;
  toggleMediaWindowVisibility(true);
};

/**
 * Ends the setup: the media display shows again, then (with `tour`) the
 * short tour of how to switch the TV to Zoom and back.
 */
export const finishZoomDisplaySetup = ({ tour }: { tour: boolean }) => {
  restoreMediaAfterZoomDisplaySetup();
  const store = useZoomDisplaySetupStore();
  store.close();
  if (tour) store.startTour();
};

/** "Don't ask again": turns the question off, for this congregation. */
export const turnOffZoomDisplaySetup = () => {
  const settings = useCurrentStateStore().currentSettings;
  if (settings) settings.zoomDisplaySetupHelp = false;
  log('Zoom display setup: turned off by the user', 'zoom', 'info');
  finishZoomDisplaySetup({ tour: false });
};

export const __testables = {
  reset: () => {
    askedMeetings.clear();
    hiddenBySetup = false;
    setupScreen = null;
  },
};
