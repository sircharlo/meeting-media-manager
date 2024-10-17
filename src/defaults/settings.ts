import type { SettingsGroups, SettingsItems, SettingsValues } from 'src/types';

/* eslint-disable perfectionist/sort-objects */
export const settingsGroups: SettingsGroups = {
  app: {
    description: 'applicationConfigurationDescription',
    icon: 'mmm-configuration',
    name: 'applicationConfiguration',
  },
  congregationMeetings: {
    description: 'congregationMeetingsDescription',
    icon: 'mmm-lectern',
    name: 'congregationMeetings',
  },
  mediaRetrievalPlayback: {
    description: 'mediaRetrievalAndPlaybackDescription',
    icon: 'mmm-media-settings',
    name: 'mediaRetrievalAndPlayback',
  },
  integrations: {
    description: 'integrationsDescription',
    icon: 'mmm-integrations',
    name: 'integrations',
  },
  advanced: {
    description: 'advancedDescription',
    icon: 'mmm-advanced-settings',
    name: 'advanced',
  },
};

export const settingsDefinitions: SettingsItems = {
  // App
  localAppLang: {
    group: 'app',
    list: 'appLanguages',
    type: 'list',
  },
  darkMode: {
    group: 'app',
    list: 'darkModes',
    type: 'list',
  },
  autoStartAtLogin: {
    group: 'app',
    type: 'toggle',
  },
  // Congregation Meetings
  congregationName: {
    group: 'congregationMeetings',
    rules: ['notEmpty'],
    type: 'text',
  },
  lang: {
    group: 'congregationMeetings',
    list: 'jwLanguages',
    type: 'list',
  },
  langFallback: {
    group: 'congregationMeetings',
    list: 'jwLanguages',
    type: 'list',
  },
  mwDay: {
    group: 'congregationMeetings',
    list: 'days',
    rules: ['notEmpty', 'regular'],
    type: 'list',
  },
  mwStartTime: {
    group: 'congregationMeetings',
    options: ['meetingTime'],
    rules: ['notEmpty', 'regular'],
    type: 'time',
  },
  weDay: {
    group: 'congregationMeetings',
    list: 'days',
    rules: ['notEmpty', 'regular'],
    type: 'list',
  },
  weStartTime: {
    group: 'congregationMeetings',
    options: ['meetingTime'],
    rules: ['notEmpty', 'regular'],
    type: 'time',
  },
  coWeek: {
    group: 'congregationMeetings',
    options: ['coTuesdays'],
    type: 'date',
  },
  // Media Retrieval and Playback
  enableMediaDisplayButton: {
    group: 'mediaRetrievalPlayback',
    type: 'toggle',
  },
  enableMusicButton: {
    group: 'mediaRetrievalPlayback',
    subgroup: 'setupWizard.backgroundMusic',
    type: 'toggle',
  },
  autoStartMusic: {
    depends: 'enableMusicButton',
    group: 'mediaRetrievalPlayback',
    subgroup: 'setupWizard.backgroundMusic',
    type: 'toggle',
  },

  // Integrations
  obsEnable: {
    actions: ['obsConnect'],
    group: 'integrations',
    subgroup: 'obsStudio',
    type: 'toggle',
  },
  obsPassword: {
    actions: ['obsConnect'],
    depends: 'obsEnable',
    group: 'integrations',
    subgroup: 'obsStudio',
    type: 'text',
  },
  obsPort: {
    actions: ['obsConnect'],
    depends: 'obsEnable',
    group: 'integrations',
    rules: ['portNumber'],
    subgroup: 'obsStudio',
    type: 'text',
  },
  obsCameraScene: {
    depends: 'obsEnable',
    group: 'integrations',
    list: 'obsAllScenes',
    subgroup: 'obsStudio',
    type: 'list',
  },
  obsMediaScene: {
    depends: 'obsEnable',
    group: 'integrations',
    list: 'obsAllScenes',
    subgroup: 'obsStudio',
    type: 'list',
  },
  obsImageScene: {
    depends: 'obsEnable',
    group: 'integrations',
    list: 'obsAllScenes',
    subgroup: 'obsStudio',
    type: 'list',
  },

  // Advanced

  enableKeyboardShortcuts: {
    group: 'advanced',
    subgroup: 'keyboardShortcuts',
    type: 'toggle',
  },
  shortcutMediaWindow: {
    depends: 'enableKeyboardShortcuts',
    group: 'advanced',
    subgroup: 'keyboardShortcuts',
    type: 'shortcut',
  },
  // shortcutMediaPrevious: {
  //   depends: 'enableKeyboardShortcuts',
  //   group: 'advanced',
  //   subgroup: 'keyboardShortcuts',
  //   type: 'shortcut',
  // },
  // shortcutMediaNext: {
  //   depends: 'enableKeyboardShortcuts',
  //   group: 'advanced',
  //   subgroup: 'keyboardShortcuts',
  //   type: 'shortcut',
  // },
  shortcutMusic: {
    depends: 'enableKeyboardShortcuts',
    group: 'advanced',
    subgroup: 'keyboardShortcuts',
    type: 'shortcut',
  },
  hideMediaLogo: {
    depends: 'enableMediaDisplayButton',
    group: 'advanced',
    subgroup: 'media-display',
    type: 'toggle',
  },
  maxRes: {
    depends: 'enableMediaDisplayButton',
    group: 'advanced',
    list: 'resolutions',
    subgroup: 'media-display',
    type: 'list',
  },
  includePrinted: {
    depends: 'enableMediaDisplayButton',
    group: 'advanced',
    subgroup: 'media-display',
    type: 'toggle',
  },
  excludeFootnotes: {
    depends: 'enableMediaDisplayButton',
    group: 'advanced',
    subgroup: 'media-display',
    type: 'toggle',
  },
  excludeTh: {
    depends: 'enableMediaDisplayButton',
    group: 'advanced',
    subgroup: 'media-display',
    type: 'toggle',
  },
  enableSubtitles: {
    depends: 'enableMediaDisplayButton',
    group: 'advanced',
    subgroup: 'subtitles',
    type: 'toggle',
  },
  langSubtitles: {
    depends: 'enableSubtitles',
    group: 'advanced',
    list: 'jwLanguages',
    subgroup: 'subtitles',
    type: 'list',
  },
  enableExtraCache: {
    depends: 'enableMediaDisplayButton',
    group: 'advanced',
    subgroup: 'cache',
    type: 'toggle',
  },
  musicVolume: {
    actions: ['setBackgroundMusicVolume'],
    depends: 'enableMusicButton',
    group: 'advanced',
    max: 100,
    min: 1,
    step: 1,
    subgroup: 'setupWizard.backgroundMusic',
    type: 'slider',
  },
  disableMediaFetching: {
    group: 'advanced',
    subgroup: 'dangerZone',
    type: 'toggle',
  },
};
/* eslint-enable perfectionist/sort-objects */

export const defaultSettings: SettingsValues = {
  autoStartAtLogin: false,
  autoStartMusic: true,
  congregationName: '',
  coWeek: '',
  darkMode: 'auto',
  disableMediaFetching: false,
  enableExtraCache: false,
  enableKeyboardShortcuts: false,
  enableMediaDisplayButton: false,
  enableMusicButton: true,
  enableSubtitles: false,
  excludeFootnotes: false,
  excludeTh: true,
  hideMediaLogo: false,
  includePrinted: true,
  lang: 'E',
  langFallback: '',
  langSubtitles: '',
  localAppLang: 'en',
  maxRes: '720p',
  musicVolume: 100,
  mwDay: '',
  mwStartTime: '',
  obsCameraScene: '',
  obsEnable: false,
  obsImageScene: '',
  obsMediaScene: '',
  obsPassword: '',
  obsPort: '',
  // shortcutMediaNext: '',
  // shortcutMediaPrevious: '',
  shortcutMediaWindow: '',
  shortcutMusic: '',
  weDay: '',
  weStartTime: '',
};
