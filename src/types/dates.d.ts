import type { MediaItem, MediaSection } from './media';

export interface DateInfo {
  complete: boolean;
  date: Date;
  error: boolean;
  mediaSections: MediaSectionWithConfig[];
  meeting: 'mw' | 'we' | false;
  today: boolean;
}

export interface MediaSectionWithConfig {
  config: MediaSection;
  items?: MediaItem[];
}
