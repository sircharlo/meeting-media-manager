import type { MediaSectionIdentifier } from './media';

export type BuiltInMeetingPart =
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

export type CustomMeetingPart = `custom-${string}`;

export interface CustomTimerPart {
  duration: number;
  id: CustomMeetingPart;
  label: string;
}

export type MeetingPart = BuiltInMeetingPart | CustomMeetingPart;

/** One entry of the timer's list of parts for the selected day. */
export interface MeetingPartOption {
  icon?: string;
  label: string;
  section?: 'custom-timer-parts' | MediaSectionIdentifier;
  value: MeetingPart;
  /** The section's parts don't add up to the time allotted to it. */
  warning?: boolean;
}

export interface MeetingPartTimings {
  endTime: null | number;
  startTime: null | number;
}

export type TimerCountdownDisplay =
  'analog' | 'analog-clock' | 'analog-digital' | 'digital';

// Timer data from main dialog
export interface TimerData {
  aheadBehindMinutes?: null | number;
  /** The main window's UI language, for formatting the time of day. */
  locale?: string;
  meetingStartTime?: string;
  mode: 'countdown' | 'countup';
  mwDay?: null | string;
  mwStartTime?: null | string;
  paused: boolean;
  running: boolean;
  time: string;
  timerBackgroundColor?: string;
  timerCountdownDisplay?: TimerCountdownDisplay;
  timerCountdownTargetSeconds?: number;
  timerCountdownWarningIndicator?: boolean;
  /** The part being timed, in the main window's language. */
  timerCurrentPartLabel?: string;
  timerElapsedSeconds?: number;
  timerEnableMeetingCountdown?: boolean;
  timerHourFormat?: '12h' | '24h';
  timerMeetingCountdownMinutes?: number;
  timerOvertimeAnimation?: boolean;
  timerOvertimeBackgroundColor?: string;
  timerOvertimeIndicator?: boolean;
  timerOvertimeShowAmountOnly?: boolean;
  timerOvertimeTextColor?: string;
  /** The planned length of the part being timed, in both timer modes. */
  timerPartTargetSeconds?: number;
  timerTextColor?: string;
  timerTextSize?: string;
  timerTimeOfDayDisplay?: TimerTimeOfDayDisplay;
  weDay?: null | string;
  weStartTime?: null | string;
}

/** How many Apply Yourself and Living as Christians parts a meeting has. */
export interface TimerPartCounts {
  ayfm: number;
  lac: number;
}

export type TimerTimeOfDayDisplay = 'analog' | 'analog-digital' | 'digital';
