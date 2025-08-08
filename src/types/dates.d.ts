import type { MediaItem, MediaSection, MediaSectionIdentifier } from './media';

export interface DateInfo {
  complete: boolean;
  date: Date;
  error: boolean;
  mediaSections: Record<MediaSectionIdentifier, MediaSectionWithConfig>;
  meeting: 'mw' | 'we' | false;
  today: boolean;
}

export interface MediaSectionWithConfig {
  config?: MediaSection;
  items?: MediaItem[];
}
