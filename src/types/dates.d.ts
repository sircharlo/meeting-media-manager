import type { MediaItem, MediaSection } from './media';

export interface DateInfo {
  date: Date;
  mediaSections: MediaSectionWithConfig[];
  status: 'complete' | 'error' | null;
}

export interface MediaSectionWithConfig {
  config: MediaSection;
  items?: MediaItem[];
}
