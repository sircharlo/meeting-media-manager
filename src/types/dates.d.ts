import type { MediaItem, MediaSection } from './media';
import type {
  CustomTimerPart,
  MeetingPart,
  MeetingPartTimings,
  TimerPartCounts,
} from './timer';

/**
 * How a day is shown in the header's date picker: `ready` once its meeting
 * media was fetched, `pending` before that, `error` if fetching failed,
 * `added` for a day that only has media the user added, and the week's kind
 * for a meeting day of the circuit overseer's visit or the Memorial week.
 */
export type CalendarDayStatus =
  'added' | 'error' | 'pending' | 'ready' | SpecialWeekKind;

export interface DateInfo {
  date: Date;
  mediaSections: MediaSectionWithConfig[];
  status: 'complete' | 'error' | null;
  /** The meeting timer's number of Apply Yourself and Living as Christians parts. */
  timerPartCounts?: TimerPartCounts;
  /** The meeting timer's part durations the user changed, in minutes. */
  timerPartDurations?: Partial<Record<MeetingPart, number>>;
  /** The meeting timer's custom parts. */
  timerParts?: CustomTimerPart[];
  /** When each part was actually started and stopped with the meeting timer. */
  timerPartTimings?: Partial<Record<MeetingPart, MeetingPartTimings>>;
}

export interface MediaSectionWithConfig {
  config: MediaSection;
  items?: MediaItem[];
}

/**
 * What a day of a special week is:
 * - `co-midweek`: the CO's Tuesday, where the midweek meeting moved.
 * - `co-weekend`: the weekend meeting during the visit.
 * - `co-moved`: the usual midweek day, whose meeting moved to the Tuesday.
 * - `memorial`: the Memorial.
 * - `memorial-replaced`: the usual meeting day the Memorial replaces.
 * - `co-other` / `memorial-other`: any other day of the week.
 */
export type SpecialDayRole =
  | 'co-midweek'
  | 'co-moved'
  | 'co-other'
  | 'co-weekend'
  | 'memorial'
  | 'memorial-other'
  | 'memorial-replaced';

/** The circuit overseer's visit or the Memorial week. */
export interface SpecialWeek {
  /** The day that makes the week special: the CO's Tuesday, or the Memorial. */
  keyDate: Date;
  kind: SpecialWeekKind;
  /** The week's Monday. */
  monday: Date;
  /** For the Memorial: the meeting it replaces, in its own half of the week. */
  replacedMeeting?: 'mw' | 'we';
}

/** A week whose meetings differ from the usual schedule. */
export type SpecialWeekKind = 'co' | 'memorial';
