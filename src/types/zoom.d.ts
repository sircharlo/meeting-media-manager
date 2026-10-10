/**
 * One complete Zoom action, performed by the UI Automation helper
 * (uia_helper.py) that the Zoom Meeting Manager runs alongside M³.
 */
export type ZoomCommand =
  | { allowSelfUnmute: boolean; type: 'mute-all' }
  | { echo?: string; type: 'ping' }
  | { name: string; type: 'press-participant-mic' }
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
  | { type: 'ask-all-to-unmute' }
  | { type: 'diagnose' }
  | { type: 'join-audio' }
  | { type: 'learn-hand-raised' }
  | { type: 'leave-audio' }
  | { type: 'mic-title' }
  /**
   * `reveal` brings Zoom's auto-hidden toolbar back (moving the mouse over
   * the meeting) to read the audio and video states; without it, nothing
   * on screen changes.
   */
  | { type: 'participants' }
  | { type: 'share-entries' }
  | { type: 'stop-share' }
  | { type: 'toggle-mic' }
  | { type: 'toggle-video' }
  | { type: 'video-title' };

export interface ZoomCommandResult {
  admitted?: string[];
  /** `toggle-mic`/`toggle-video`: the button's name after switching. */
  after?: string;
  /** `toggle-mic`/`toggle-video`: the button's name before switching. */
  before?: string;
  /** Whether the action changed anything (false: already in that state). */
  changed?: boolean;
  diagnosis?: ZoomDiagnosis;
  /** The `ping` command's echo, to check the helper's text encoding. */
  echo?: null | string;
  /** `share-entries`: Share candidates from Zoom's toolbar. */
  entries?: string[];
  /** A short machine-readable reason, e.g. `meeting-not-found`. */
  error?: string;
  meeting?: ZoomMeetingState;
  /** `share-entries`: Share candidates from the toolbar's "More" menu. */
  moreEntries?: string[];
  ok: boolean;
  /** `test-share-picker`: whether Zoom's share picker opened. */
  opened?: boolean;
  participants?: ZoomParticipantRow[];
  /** `learn-hand-raised`: how Zoom marks a raised hand, in its language. */
  phrase?: null | string;
  /** `raised-hands`: who in the meeting has their hand raised. */
  raisedHands?: string[];
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
  /** Whether the microphone shortcut is Zoom's default (null: unknown). */
  audioShortcutDefault?: boolean | null;
  /** The mute-everyone button: only for the meeting's host and co-hosts. */
  hostControls?: boolean;
  meeting: boolean;
  participantsPanel?: boolean;
  toolbar?: boolean;
  videoButton?: boolean;
  videoShortcutDefault?: boolean;
  videoTitle?: null | string;
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

export interface ZoomMeetingState {
  /** Unknown (null) while Zoom has its toolbar hidden. */
  audioJoined?: boolean | null;
  found: boolean;
  handle?: number;
  /**
   * The microphone button's name, in the user's Zoom language (null until
   * computer audio is joined, or while Zoom has its toolbar hidden).
   */
  micTitle?: null | string;
  participantsPanelOpen?: boolean;
  sharing: boolean;
  title?: string;
  /** Zoom hides its toolbar a few seconds after the mouse leaves it. */
  toolbarVisible?: boolean;
  /** The video button's name, in the user's Zoom language. */
  videoTitle?: null | string;
}

export interface ZoomParticipantRow {
  /** Everything Zoom says about the row, in the user's Zoom language. */
  details: string;
  name: string;
  section: 'meeting' | 'waiting';
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
