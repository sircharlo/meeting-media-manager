import type { MediaItem, MediaSection } from './media';

export interface DateInfo {
  complete: boolean;
  date: Date;
  error: boolean;
  mediaSections: MediaSectionWithConfig[];
}

export interface MediaSectionWithConfig {
  config: MediaSection;
  items?: MediaItem[];
}
