import type { DynamicMediaObject, MediaSection } from './media';

export interface DateInfo {
  complete: boolean;
  customSections?: MediaSection[];
  date: Date;
  dynamicMedia: DynamicMediaObject[];
  error: boolean;
  meeting: 'mw' | 'we' | false;
  today: boolean;
}
