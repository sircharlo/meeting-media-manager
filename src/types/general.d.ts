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

/**
 * Identifies an OS/architecture combination that Electron is dropping
 * prebuilt support for in an upcoming major version.
 */
export type OsSupportWarning = 'mac-legacy' | 'win32-ia32';

export interface UrlVariables {
  base: string;
  mediator: string;
  pubMedia: string;
}
