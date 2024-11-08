export type FontName = 'JW-Icons' | 'WT-ClearText-Bold';
export interface UrlVariables {
  base: string;
  mediator: string;
  pubMedia: string;
}

export type AnnouncementAction = 'docs' | 'repo' | 'update';

export interface Announcement {
  actions?: AnnouncementAction[];
  id: string;
  maxVersion?: string;
  message: string;
  minVersion?: string;
  persistent?: boolean;
  platform?: ('linux' | 'mac' | 'win')[];
  type?: 'error' | 'info' | 'warning';
}

export interface CacheList<T = unknown> {
  list: T[];
  updated: Date;
}
