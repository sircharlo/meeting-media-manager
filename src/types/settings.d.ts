import type { MessageSchema } from 'boot/i18n';
import type { LanguageValue } from 'src/constants/locales';
import type { RESOLUTIONS } from 'src/constants/settings';

import type { JwLangCode } from './jw/lang';

export type MaxRes = (typeof RESOLUTIONS)[number];

export interface OldAppConfig {
  __internal__: {
    migrations: {
      version: string;
    };
  };
  app: {
    autoOpenFolderWhenDone: boolean;
    autoQuitWhenDone: boolean;
    autoRunAtBoot: boolean;
    autoStartSync: boolean;
    betaUpdates: boolean;
    congregationName: string;
    customCachePath: null | string;
    disableAutoUpdate: boolean;
    disableHardwareAcceleration: boolean;
    localAppLang: string;
    localOutputPath: string;
    obs: {
      cameraScene: null | string;
      enable: boolean;
      imageScene: null | string;
      mediaScene: null | string;
      password: null | string;
      port: null | number;
      useV4: boolean;
      zoomScene: null | string;
    };
    offline: boolean;
    outputFolderDateFormat: string;
    theme: string;
    zoom: {
      autoRename: string[];
      autoStartMeeting: boolean;
      autoStartTime: number;
      enable: boolean;
      hideComponent: boolean;
      id: null | string;
      name: null | string;
      password: null | string;
      spotlight: boolean;
    };
  };
  cong: {
    dir: null | string;
    password: null | string;
    port: null | number;
    server: null | string;
    user: null | string;
  };
  media: {
    autoPlayFirst: boolean;
    autoPlayFirstTime: number;
    enableMediaDisplayButton: boolean;
    enableMp4Conversion: boolean;
    enablePp: boolean;
    enableSubtitles: boolean;
    enableVlcPlaylistCreation: boolean;
    excludeFootnotes: boolean;
    excludeLffImages: boolean;
    excludeTh: boolean;
    hideMediaLogo: boolean;
    hideWinAfterMedia: boolean;
    includePrinted: boolean;
    keepOriginalsAfterConversion: boolean;
    lang: JwLangCode;
    langFallback: JwLangCode | null;
    langSubs: JwLangCode | null;
    langUpdatedLast: string;
    maxRes: MaxRes;
    mediaWinShortcut: string;
    ppBackward: null | string;
    ppForward: null | string;
    preferredOutput: string;
    presentShortcut: string;
  };
  meeting: {
    autoStartMusic: boolean;
    coWeek: null | string;
    enableMusicButton: boolean;
    enableMusicFadeOut: boolean;
    musicFadeOutTime: number;
    musicFadeOutType: string;
    musicVolume: number;
    mwDay: number;
    mwStartTime: string;
    shuffleShortcut: string;
    specialCong: boolean;
    weDay: number;
    weStartTime: string;
  };
}

export interface ScreenPreferences {
  preferredScreenNumber: number | undefined;
  preferWindowed: boolean | undefined;
}

export interface SettingsGroup {
  description: keyof MessageSchema;
  hidden?: boolean;
  icon: string;
  name: keyof MessageSchema;
  order?: number;
}
export type SettingsGroupKey =
  | 'advanced'
  | 'app'
  | 'congregationMeetings'
  | 'integrations'
  | 'mediaRetrievalPlayback';
export type SettingsGroups = Record<SettingsGroupKey, SettingsGroup>;

export interface SettingsItem {
  actions?: SettingsItemAction[];
  beta?: true;
  depends?: (keyof SettingsValues)[] | keyof SettingsValues;
  group: SettingsGroupKey;
  icon?: string;
  list?: SettingsItemListKey;
  max?: number;
  min?: number;
  options?: SettingsItemOption[];
  order?: number;
  rules?: SettingsItemRule[];
  step?: number;
  subgroup?: string;
  type: SettingsItemType;
  unless?: (keyof SettingsValues)[] | keyof SettingsValues;
}

export type SettingsItemAction = 'obsConnect' | 'setBackgroundMusicVolume';

export type SettingsItemListKey =
  | 'appLanguages'
  | 'darkModes'
  | 'days'
  | 'jwLanguages'
  | 'obsAllScenes'
  | 'obsScenes'
  | 'resolutions';

export type SettingsItemOption = 'coTuesdays' | 'futureDate' | 'meetingTime';
export type SettingsItemRule = 'notEmpty' | 'portNumber' | 'regular';

export type SettingsItems = Record<keyof SettingsValues, SettingsItem>;

export type SettingsItemType =
  | 'date'
  | 'list'
  | 'path'
  | 'shortcut'
  | 'slider'
  | 'text'
  | 'time'
  | 'toggle';

export interface SettingsValues {
  autoStartAtLogin: boolean;
  autoStartMusic: boolean;
  baseUrl: string;
  cacheFolder: null | string;
  congregationName: null | string;
  convertFilesToMp4: boolean;
  coWeek: `${number}/${number}/${number}` | null;
  darkMode: 'auto' | boolean;
  disableMediaFetching: boolean;
  enableCacheAutoClear: boolean;
  enableExtraCache: boolean;
  enableFolderWatcher: boolean;
  enableKeyboardShortcuts: boolean;
  enableMediaAutoExport: boolean;
  // disableHardwareAcceleration: boolean;
  enableMediaDisplayButton: boolean;
  enableMusicButton: boolean;
  enableSubtitles: boolean;
  excludeFootnotes: boolean;
  excludeTh: boolean;
  firstDayOfWeek: number;
  folderToWatch: string;
  hideMediaLogo: boolean;
  includePrinted: boolean;
  lang: JwLangCode;
  langFallback: JwLangCode | null;
  langSubtitles: JwLangCode | null;
  localAppLang: LanguageValue;
  maxRes: MaxRes;
  mediaAutoExportFolder: string;
  meetingScheduleChangeDate: `${number}/${number}/${number}` | null;
  meetingScheduleChangeMwDay: `${number}` | null;
  meetingScheduleChangeMwStartTime: `${number}:${number}` | null;
  meetingScheduleChangeOnce: boolean;
  meetingScheduleChangeWeDay: `${number}` | null;
  meetingScheduleChangeWeStartTime: `${number}:${number}` | null;
  meetingStopBufferSeconds: number;
  memorialDate: `${number}/${number}/${number}` | null;
  meteredConnection: boolean;
  musicVolume: number;
  mwDay: `${number}` | null;
  mwStartTime: `${number}:${number}` | null;
  obsCameraScene: null | string;
  obsEnable: boolean;
  obsHideIcons: boolean;
  obsImageScene: null | string;
  obsMediaScene: null | string;
  obsPassword: null | string;
  obsPort: null | string;
  obsPostponeImages: boolean;
  obsQuickToggle: boolean;
  obsRememberPreviouslyUsedScene: boolean;
  obsSwitchSceneAfterMedia: boolean;
  shortcutMediaNext: null | string;
  shortcutMediaPauseResume: null | string;
  shortcutMediaPrevious: null | string;
  shortcutMediaStop: null | string;
  shortcutMediaWindow: null | string;
  shortcutMusic: null | string;
  weDay: `${number}` | null;
  weStartTime: `${number}:${number}` | null;
  zoomEnable: boolean;
  zoomScreenShareShortcut: null | string;
}
