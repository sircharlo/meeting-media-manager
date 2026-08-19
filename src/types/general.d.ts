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

/**
 * Progress data emitted by electron-updater's `download-progress` event.
 * All fields are optional because they are relayed as-is over IPC.
 */
export interface UpdaterProgressInfo {
  bytesPerSecond?: number;
  delta?: number;
  percent?: number;
  total?: number;
  transferred?: number;
}

/**
 * The auto-updater lifecycle state, as tracked by the main process.
 * Lets the renderer catch up on an in-flight update (e.g. after the
 * window mounts late and missed the `update-available` event).
 */
export interface UpdaterState {
  phase: 'downloaded' | 'downloading' | null;
  progress: null | UpdaterProgressInfo;
}

export interface UrlVariables {
  base: string;
  mediator: string;
  pubMedia: string;
}
