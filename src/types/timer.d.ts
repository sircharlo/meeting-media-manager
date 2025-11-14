export type MeetingPart =
  | 'abbreviated-wt'
  | 'ayfm-1'
  | 'ayfm-2'
  | 'ayfm-3'
  | 'ayfm-4'
  | 'ayfm-5'
  | 'bible-reading'
  | 'cbs'
  | 'co-final-talk'
  | 'co-service-talk'
  | 'concluding-comments'
  | 'gems'
  | 'introduction'
  | 'lac-1'
  | 'lac-2'
  | 'lac-3'
  | 'public-talk'
  | 'song-and-optional-prayer'
  | 'treasures'
  | 'wt';

export interface MeetingPartTimings {
  endTime: null | number;
  startTime: null | number;
}

// Timer data from main dialog
export interface TimerData {
  aheadBehindMinutes?: null | number;
  enableMeetingCountdown?: boolean;
  meetingCountdownMinutes?: number;
  meetingStartTime?: string;
  mode: 'countdown' | 'countup';
  mwDay?: null | string;
  mwStartTime?: null | string;
  paused: boolean;
  running: boolean;
  time: string;
  timerBackgroundColor?: string;
  timerTextColor?: string;
  timerTextSize?: string;
  weDay?: null | string;
  weStartTime?: null | string;
}
