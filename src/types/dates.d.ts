import type { MediaItem, MediaSection } from './media';
import type {
  CustomTimerPart,
  MeetingPart,
  MeetingPartTimings,
  TimerPartCounts,
} from './timer';

/**
 * How a day is shown in the header's date picker: `ready` once its meeting
 * media was fetched, `pending` before that, `error` if fetching failed, and
 * `added` for a day that only has media the user added.
 */
export type CalendarDayStatus = 'added' | 'error' | 'pending' | 'ready';

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
