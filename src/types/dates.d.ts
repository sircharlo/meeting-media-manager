import type { DynamicMediaObject } from './media';

export interface DateInfo {
  complete: boolean;
  date: Date;
  dynamicMedia: DynamicMediaObject[];
  error: boolean;
  meeting: boolean | string;
  today: boolean;
}
