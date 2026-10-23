/**
 * One complete Zoom action, performed by the UI Automation helper
 * (uia_helper.py) that the Zoom Meeting Manager runs alongside M³.
 */
export type ZoomCommand = ZoomCommandBody & {
  /** Names learned so far (see ZoomKnownTitles); added to every command. */
  titles?: ZoomKnownTitles;
};

export interface ZoomCommandResult {
  admitted?: string[];
  /** `toggle-mic`/`toggle-video`: the button's name after switching. */
  after?: string;
  /** `set-participant-mic`: the "Ask to unmute" button's name, when first seen. */
  askToUnmuteTitle?: null | string;
  /**
   * `join-audio`: M³ couldn't tell "Join audio" from a microphone button
   * without a shortcut, and pressed nothing for good: the user is asked.
   */
  audioStateUnknown?: boolean;
  /** `toggle-mic`/`toggle-video`: the button's name before switching. */
  before?: string;
  /** `set-participant-mic`: what the row's microphone button said. */
  buttonTitle?: string;
  /** Whether the action changed anything (false: already in that state). */
  changed?: boolean;
  diagnosis?: ZoomDiagnosis;
  /** The `ping` command's echo, to check the helper's text encoding. */
  echo?: null | string;
  /** `share-entries`, `panel-entries`, `share-toolbar-entries`: the buttons to pick from. */
  entries?: string[];
  /** A short machine-readable reason, e.g. `meeting-not-found`. */
  error?: string;
  /** `test-mute-all-entry`: whether the entry picked asked to confirm muting everyone. */
  isMuteAll?: boolean;
  /** `window-layout`: where Zoom's meeting windows are. */
  layout?: ZoomWindowLayout;
  /** Names of Zoom's controls the action saw for the first time. */
  learned?: ZoomKnownTitles;
  /** `set-participant-mic`/`lower-participant-hand`: the "Lower hand" button's name, seen on that row. */
  lowerHandTitle?: null | string;
  meeting?: ZoomMeetingState;
  /** `share-entries`: Share candidates from the toolbar's "More" menu. */
  moreEntries?: string[];
  ok: boolean;
  /** `test-share-picker`: whether Zoom's share picker opened. */
  opened?: boolean;
  participants?: ZoomParticipantRow[];
  /** `learn-hand-raised`: how Zoom marks a raised hand, in its language. */
  phrase?: null | string;
  /** `place-windows`: where each window ended up. */
  placed?: ZoomPlacedWindows;
  /** `set-participant-mic`: whether the button was pressed at all. */
  pressed?: boolean;
  /** `raised-hands`: who in the meeting has their hand raised. */
  raisedHands?: string[];
  /** `learn-hand-raised`: the Reactions button's name, when seen. */
  reactButtonTitle?: null | string;
  /** On failure: what Zoom showed, for error reports (nothing personal). */
  snapshot?: ZoomFailureSnapshot;
  /** `test-stop-share-entry`: whether the entry picked stopped sharing. */
  stopped?: boolean;
  title?: null | string;
  version?: number;
  /** `test-share-picker`: whether M³'s media window was offered. */
  windowListed?: boolean;
  /** `test-share-picker`: whether sharing would select M³'s media window. */
  windowSelected?: boolean;
}

export type ZoomCommandType = ZoomCommand['type'];

/** What the setup assistant checks in Zoom (the `diagnose` command). */
export interface ZoomDiagnosis {
  audioJoined?: boolean;
  /** The mute-everyone button: only for the meeting's host and co-hosts. */
  hostControls?: boolean;
  meeting: boolean;
  /** The panel is open but "Mute all" wasn't found: the user can point M³ to it (if host). */
  muteAllButtonMissing?: boolean;
  /** Whether the Participants button couldn't be found: the user can point M³ to it. */
  participantsButtonMissing?: boolean;
  participantsPanel?: boolean;
  toolbar?: boolean;
  videoButton?: boolean;
  videoTitle?: null | string;
}

/**
 * What the helper saw in Zoom when an action failed, attached to error
 * reports so breakage in any Zoom version or language can be understood.
 * Zoom's own labels only: no window titles, no participant names.
 */
export interface ZoomFailureSnapshot {
  /**
   * Zoom's other windows (dialogs in the way), keyed by class and size, with
   * the names of their buttons, menu entries, checkboxes and tabs.
   */
  dialogs?: Record<string, string[]>;
  error?: string;
  meeting?: boolean;
  /** Names of the buttons under the participants list. */
  panelRow?: string[];
  participantsPanelOpen?: boolean;
  /** While sharing: names of the share toolbar's controls. */
  shareToolbar?: string[];
  sharing?: boolean;
  titles?: ZoomKnownTitles;
  /** Names of the meeting toolbar's buttons. */
  toolbar?: string[];
  toolbarMenus?: string[];
  toolbarVisible?: boolean;
  /** Classes of Zoom's visible windows. */
  windows?: string[];
  zoomVersion?: null | string;
}

export interface ZoomHelperStartResult {
  /** Technical detail for logs, e.g. a compiler error. */
  detail?: string;
  /**
   * Why the helper couldn't start: `windows-only`, `powershell-not-found`,
   * `powershell-restricted`, `helper-not-compiled`, `helper-start-timeout`,
   * `helper-exited`.
   */
  error?: string;
  ok: boolean;
}

/**
 * Names of Zoom's controls in the user's Zoom language, as learned so far.
 * Sent with every command, so the helper finds controls by name rather than
 * by Zoom's keyboard shortcuts (which the user may have changed); what a
 * command learns anew comes back in its result's `learned`.
 */
export interface ZoomKnownTitles {
  /** The first toolbar button while not joined to computer audio. */
  joinAudio?: null | string;
  micOff?: null | string;
  micOn?: null | string;
  /** The participants panel's "Mute all" button. */
  muteAll?: null | string;
  /** The Participants button, in the toolbar or Zoom's "More" menu. */
  participants?: null | string;
  /** The share toolbar's "Stop share" button. */
  stopShare?: null | string;
}

export interface ZoomLayoutDisplay {
  bounds: { height: number; width: number; x: number; y: number };
  id: number;
}

/**
 * How M³ arranges its main window and Zoom's meeting window (set in the
 * Zoom setup assistant; kept per computer, since it's about its screens).
 */
export interface ZoomLayoutPreferences {
  /** Zoom on a screen of its own (when it's not M³'s). */
  alone: boolean;
  /**
   * Zoom's screen: Electron's display id, and its bounds (in DIPs) to find
   * it again should the id change. Null: M³'s screen.
   */
  display: null | ZoomLayoutDisplay;
  /** Whether M³ arranges the windows at all. */
  enabled: boolean;
  /** Put Zoom back when it moves or changes size on its own. */
  keepInPlace: boolean;
  /** With Zoom on its own screen: M³ fills its own (else it stays put). */
  m3Fills: boolean;
  /** M³ on the left (on top, on a portrait screen). */
  m3First: boolean;
  /** M³'s share of the screen when they share one, from 0 to 1. */
  m3Share: number;
  /** Open Zoom's participants list when the meeting starts, then arrange. */
  openParticipants: boolean;
  /** Snap them side by side with Windows' own snapping, as a user would. */
  /**
   * While sharing (Zoom then hides its meeting window), open Zoom's
   * participants list in a window of its own, at Zoom's spot.
   */
  showParticipantsWhileSharing: boolean;
  snapWithWindows: boolean;
}

/**
 * The screens M³'s presentation windows take, as M³ is set up (by Electron
 * display id): never Zoom's nor M³'s; Zoom's second window goes over the
 * media window's.
 */
export interface ZoomLayoutScreens {
  media: null | number;
  presentation: number[];
}

/**
 * Where the windows go, worked out by the main process from the layout
 * preferences and the screens connected now (physical pixels).
 */
export interface ZoomLayoutTargets {
  /** The screen Zoom goes on, after any fallback. */
  displayId: number;
  /**
   * The screen chosen for Zoom isn't usable now (not connected, or the media
   * window fills it): Zoom shares M³'s screen instead.
   */
  fallback: boolean;
  m3?: ZoomScreenRect;
  m3Handle?: number;
  /** Zoom's second window: over the media window's screen, full screen. */
  second?: ZoomScreenRect;
  /** Side by side, for Windows' own snapping (null: not asked, or top/bottom). */
  snap: 'zoom-left' | 'zoom-right' | null;
  zoom: ZoomScreenRect;
}

export interface ZoomMeetingState {
  /** Unknown (null) when Zoom's toolbar can't be read (in its mini view). */
  audioJoined?: boolean | null;
  /** Classes of Zoom's other open windows: dialogs that may be in the way. */
  dialogs?: string[];
  found: boolean;
  handle?: number;
  /**
   * The microphone button's name, in the user's Zoom language (null until
   * computer audio is joined, or when Zoom's toolbar can't be read).
   */
  micTitle?: null | string;
  /** Zoom's mini view: a thumbnail in place of the meeting window (actions bring it back). */
  miniView?: boolean;
  participantsPanelOpen?: boolean;
  sharing: boolean;
  title?: string;
  /**
   * Whether Zoom shows its toolbar, which it hides a few seconds after the
   * mouse leaves it (M³ reads it either way).
   */
  toolbarVisible?: boolean;
  /** The video button's name, in the user's Zoom language. */
  videoTitle?: null | string;
  /** Zoom's version: a change means Zoom was updated since the names were learned. */
  zoomVersion?: null | string;
}

export interface ZoomParticipantRow {
  /** Everything Zoom says about the row, in the user's Zoom language. */
  details: string;
  name: string;
  section: 'meeting' | 'waiting';
}

/**
 * Where `place-windows` put each window (what's visible of it, in physical
 * pixels): it may differ from what was asked, as Zoom keeps a minimum size.
 */
export interface ZoomPlacedWindows {
  m3?: ZoomScreenRect;
  participants?: ZoomScreenRect;
  second?: ZoomScreenRect;
  /** Whether Windows' own snapping put Zoom and M³ side by side. */
  snapped: boolean;
  zoom?: ZoomScreenRect;
}

/** A rectangle on screen, in physical pixels (not Electron's DIPs). */
export interface ZoomScreenRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

/** Test participants joined by scripts/zoom-live/participants.mjs. */
export interface ZoomTestParticipant {
  audioConnected?: boolean;
  error?: string;
  events: ZoomTestParticipantEvent[];
  micMuted?: boolean | null;
  name: string;
  phase:
    'blocked' | 'error' | 'in-meeting' | 'joining' | 'left' | 'waiting-room';
  unmuteRequestPolicy?: 'accept' | 'ignore';
}

export type ZoomTestParticipantAction =
  | 'accept-unmute-requests'
  | 'ignore-unmute-requests'
  | 'leave'
  | 'mute'
  | 'reset-events'
  | 'try-unmute';

export interface ZoomTestParticipantEvent {
  at: number;
  type:
    | 'audio-rejoined'
    | 'unmute-blocked'
    | 'unmute-request-accepted'
    | 'unmute-requested';
}

export type ZoomTestParticipantsRequest =
  | { action: ZoomTestParticipantAction; index?: number; type: 'action' }
  | { count: number; type: 'start' }
  | { type: 'state' }
  | { type: 'stop' };

export interface ZoomTestParticipantsResponse {
  error?: string;
  /** The meeting the participants join (from .env.zoom-test). */
  meetingId?: string;
  ok: boolean;
  participants?: ZoomTestParticipant[];
}

/** Where Zoom's meeting windows are, from the `window-layout` command. */
export interface ZoomWindowLayout {
  /** The meeting window (with the toolbar); null when hidden or closed. */
  meeting: null | ZoomWindowState;
  miniView: boolean;
  /**
   * Zoom's participants list in a window of its own: opened by M³ while
   * sharing (`share-participants`), or popped out by the user for good.
   */
  participants: null | ZoomWindowState;
  /** Zoom's second window, with its "Use dual monitors" setting on. */
  second: null | ZoomWindowState;
  sharing: boolean;
  /** How long ago the user last moved or resized that participants list. */
  userMovedListMsAgo: null | number;
  /** How long ago the user last moved or resized a meeting window themselves. */
  userMovedMsAgo: null | number;
  /** Whether the user is moving or resizing a meeting window right now. */
  userMoving: boolean;
}

export interface ZoomWindowState {
  /** Whether Windows counts it as snapped. */
  arranged: boolean;
  /** What's visible of the window, without its invisible resize border. */
  frame: ZoomScreenRect;
  /** Whether it covers its whole screen, taskbar included. */
  fullScreen: boolean;
  handle: number;
  maximized: boolean;
  minimized: boolean;
}

type ZoomCommandBody =
  | {
      /** The "Ask to unmute" button name once learned. */
      askToUnmuteTitle: null | string;
      /** The "Lower hand" button name once learned. */
      lowerHandTitle: null | string;
      micOffTitle: null | string;
      micOnTitle: null | string;
      name: string;
      /** How Zoom marks a raised hand (learned); skips rows without one. */
      phrase: null | string;
      type: 'lower-participant-hand';
    }
  | {
      /** The "Ask to unmute" button name once learned. */
      askToUnmuteTitle: null | string;
      /** The learned "Lower hand" button name, never to be pressed here. */
      lowerHandTitle: null | string;
      /** The host's own "Unmute" button name. */
      micOffTitle: null | string;
      /** The host's own "Mute" button name, to tell muted from unmuted. */
      micOnTitle: null | string;
      name: string;
      on: boolean;
      /** How Zoom marks a raised hand (learned): a raised-hand row is only
       * read when the "Lower hand" button's name is known too. */
      phrase: null | string;
      type: 'set-participant-mic';
    }
  | {
      /** Where M³'s main window goes, and its window handle. */
      m3?: ZoomScreenRect;
      m3Handle?: number;
      /** Where Zoom's participants list goes, in a window of its own while sharing. */
      participants?: ZoomScreenRect;
      /** Where Zoom's second window goes (with "Use dual monitors" on). */
      second?: ZoomScreenRect;
      /** Snap Zoom and M³ side by side with Windows first. */
      snap?: 'zoom-left' | 'zoom-right' | null;
      type: 'place-windows';
      zoom?: ZoomScreenRect;
    }
  | { allowSelfUnmute: boolean; type: 'mute-all' }
  | { assumeAudioJoined?: boolean; type: 'toggle-mic' }
  | { echo?: string; type: 'ping' }
  | { name: string; type: 'inspect-participant' }
  | { names: string[]; type: 'admit' }
  | {
      offTitle: null | string;
      on: boolean;
      onTitle: null | string;
      type: 'set-mic';
    }
  | {
      offTitle: null | string;
      on: boolean;
      onTitle: null | string;
      type: 'set-video';
    }
  | { phrase: null | string; type: 'raised-hands' }
  | { reactButtonTitle: null | string; type: 'learn-hand-raised' }
  | { reveal?: boolean; type: 'meeting' }
  | {
      shareButtonTitle: null | string;
      type: 'start-share';
      windowTitle: string;
    }
  | {
      shareButtonTitle: null | string;
      type: 'test-share-picker';
      windowTitle: string;
    }
  | { title: string; type: 'test-mute-all-entry' }
  | { title: string; type: 'test-stop-share-entry' }
  | { type: 'ask-all-to-unmute' }
  | { type: 'diagnose' }
  /**
   * `reveal` brings the meeting window back from Zoom's mini view to read
   * the audio and video states (Zoom's toolbar is read even while hidden);
   * without it, nothing on screen changes.
   */
  | { type: 'join-audio' }
  | { type: 'leave-audio' }
  | { type: 'mic-title' }
  | { type: 'panel-entries' }
  | { type: 'participants' }
  | { type: 'share-entries' }
  | { type: 'share-participants' }
  | { type: 'share-toolbar-entries' }
  | { type: 'stop-share' }
  | { type: 'toggle-video' }
  | { type: 'video-title' }
  | { type: 'window-layout' };
