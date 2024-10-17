import type { MessageSchema } from 'src/boot/i18n';

export interface SettingsValues {
  autoStartAtLogin: boolean;
  autoStartMusic: boolean;
  congregationName: string;
  coWeek: string;
  darkMode: string;
  disableMediaFetching: boolean;
  // enablePp: boolean;
  enableExtraCache: boolean;
  enableKeyboardShortcuts: boolean;
  // disableHardwareAcceleration: boolean;
  enableMediaDisplayButton: boolean;
  enableMusicButton: boolean;
  enableSubtitles: boolean;
  excludeFootnotes: boolean;
  excludeTh: boolean;
  hideMediaLogo: boolean;
  includePrinted: boolean;
  lang: string;
  langFallback: string;
  langSubtitles: string;
  localAppLang: string;
  maxRes: string;
  musicVolume: number;
  mwDay: string;
  mwStartTime: string;
  obsCameraScene: string;
  obsEnable: boolean;
  obsImageScene: string;
  obsMediaScene: string;
  obsPassword: string;
  obsPort: string;
  // shortcutMediaNext: string;
  // shortcutMediaPrevious: string;
  shortcutMediaWindow: string;
  shortcutMusic: string;
  weDay: string;
  weStartTime: string;
}

export type SettingsItemType =
  | 'date'
  | 'list'
  | 'shortcut'
  | 'slider'
  | 'text'
  | 'time'
  | 'toggle';

export type SettingsItemAction = 'obsConnect' | 'setBackgroundMusicVolume';
export type SettingsItemOption = 'coTuesdays' | 'meetingTime';
export type SettingsItemRule = 'notEmpty' | 'portNumber' | 'regular';

export interface SettingsItem {
  actions?: SettingsItemAction[];
  depends?: keyof SettingsValues;
  group: SettingsGroupKey;
  icon?: string;
  list?: string;
  max?: number;
  min?: number;
  options?: SettingsItemOption[];
  order?: number;
  rules?: SettingsItemRule[];
  step?: number;
  subgroup?: string;
  type: SettingsItemType;
}

export type SettingsItems = Record<keyof SettingsValues, SettingsItem>;

export type SettingsGroupKey =
  | 'advanced'
  | 'app'
  | 'congregationMeetings'
  | 'integrations'
  | 'mediaRetrievalPlayback';
export type SettingsGroups = Record<SettingsGroupKey, SettingsGroup>;

export interface ScreenPreferences {
  preferredScreenNumber: number;
  preferWindowed: boolean;
}

export interface SettingsGroup {
  description: keyof MessageSchema;
  hidden?: boolean;
  icon: string;
  name: keyof MessageSchema;
  order?: number;
}

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
    lang: string;
    langFallback: null | string;
    langSubs: null | string;
    langUpdatedLast: string;
    maxRes: string;
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
