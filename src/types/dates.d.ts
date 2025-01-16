import type { DynamicMediaObject } from './media';

export interface DateInfo {
  complete: boolean;
  customSections?: DynamicMediaSection[];
  date: Date;
  dynamicMedia: DynamicMediaObject[];
  error: boolean;
  meeting: 'mw' | 'we' | boolean;
  today: boolean;
}
