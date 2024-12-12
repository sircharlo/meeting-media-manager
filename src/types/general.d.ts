export interface Announcement {
  actions?: AnnouncementAction[];
  icon?: string;
  id: string;
  maxVersion?: string;
  message: string;
  minVersion?: string;
  persistent?: boolean;
  platform?: ('linux' | 'mac' | 'win')[];
  scope?: 'obs'[];
  type?: 'error' | 'info' | 'warning';
}
export type AnnouncementAction = 'docs' | 'repo' | 'translate' | 'update';

export interface CacheList<T = unknown> {
  list: T[];
  updated: Date;
}

export type FontName = 'JW-Icons' | 'Wt-ClearText-Bold';

export interface UrlVariables {
  base: string;
  mediator: string;
  pubMedia: string;
}
