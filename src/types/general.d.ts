export interface Announcement {
  actions?: AnnouncementAction[];
  icon?: string;
  id: string;
  maxVersion?: string;
  message: string;
  minVersion?: string;
  persistent?: boolean;
  platform?: 'all' | 'none' | ('linux' | 'mac' | 'win')[];
  scope?: 'obs'[];
  type?: 'error' | 'info' | 'warning';
}
export type AnnouncementAction = 'docs' | 'repo' | 'translate' | 'update';

export interface CacheList<T = unknown> {
  list: T[];
  updated: Date | null | undefined;
}

export type FontName =
  | 'AbyssinicaSIL'
  | 'jw-icons-all'
  | 'NotoNaskhArabic'
  | 'NotoNastaliqUrdu'
  | 'NotoSans'
  | 'NotoSansBengali'
  | 'NotoSansGurmukhi'
  | 'NotoSansMalayalam'
  | 'NotoSansOriya'
  | 'NotoSansSC'
  | 'NotoSansTamil'
  | 'NotoSansTC'
  | 'NotoSansTelugu'
  | 'NotoSerifArmenian'
  | 'NotoSerifDevanagari'
  | 'NotoSerifGujarati'
  | 'NotoSerifHebrew'
  | 'NotoSerifKannada'
  | 'NotoSerifKhmer'
  | 'NotoSerifSinhala'
  | 'Wt-BaeumMyungjo'
  | 'Wt-ClearText-Bold'
  | 'WTClearTextGeorgian'
  | 'WTClearTextJapanese'
  | 'WTMannaSansKaren'
  | 'WTMannaSansMongolian'
  | 'WTMannaSansMyanmar'
  | 'WTMannaSansTibetan'
  | 'WTSetthaSpecial'
  | 'WTTextNew'
  | 'WTXBZSpecial';

export interface UrlVariables {
  base: string;
  mediator: string;
  pubMedia: string;
}
