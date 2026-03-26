import type { MediaItem, MediaSection } from './media';
import type { CustomTimerPart } from './timer';

export interface DateInfo {
  date: Date;
  mediaSections: MediaSectionWithConfig[];
  status: 'complete' | 'error' | null;
  timerParts?: CustomTimerPart[];
}

export interface MediaSectionWithConfig {
  config: MediaSection;
  items?: MediaItem[];
}
