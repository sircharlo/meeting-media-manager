/**
 * One complete Zoom action, performed by the UI Automation helper
 * (uia_helper.py) that the Zoom Meeting Manager runs alongside M³.
 */
export type ZoomCommand =
  | { allowSelfUnmute: boolean; type: 'mute-all' }
  | { names: string[]; type: 'admit' }
  | {
      offTitle: null | string;
      on: boolean;
      onTitle: null | string;
      type: 'set-video';
    }
  | {
      shareButtonTitle: null | string;
      type: 'start-share';
      windowTitle: string;
    }
  | { type: 'ask-all-to-unmute' }
  | { type: 'join-audio' }
  | { type: 'leave-audio' }
  | { type: 'meeting' }
  | { type: 'participants' }
  | { type: 'share-entries' }
  | { type: 'stop-share' }
  | { type: 'video-title' };

export interface ZoomCommandResult {
  admitted?: string[];
  /** Whether the action changed anything (false: already in that state). */
  changed?: boolean;
  /** Share entry candidates from the toolbar and its "More" menu. */
  entries?: string[];
  /** A short machine-readable reason, e.g. `meeting-not-found`. */
  error?: string;
  meeting?: ZoomMeetingState;
  ok: boolean;
  participants?: ZoomParticipantRow[];
  title?: null | string;
}

export type ZoomCommandType = ZoomCommand['type'];

export interface ZoomMeetingState {
  audioJoined?: boolean;
  found: boolean;
  handle?: number;
  participantsPanelOpen?: boolean;
  sharing: boolean;
  title?: string;
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
