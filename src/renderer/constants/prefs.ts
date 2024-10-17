const PREFS = {
  app: {
    autoOpenFolderWhenDone: false,
    autoQuitWhenDone: false,
    autoRunAtBoot: false,
    autoStartSync: false,
    betaUpdates: false,
    congregationName: null,
    customCachePath: null,
    disableAutoUpdate: false,
    disabledUpdateCheck: false,
    disableHardwareAcceleration: false,
    localAppLang: null,
    localOutputPath: null,
    obs: {
      enable: false,
      port: null,
      password: null,
      mediaScene: null,
      imageScene: null,
      cameraScene: null,
      zoomScene: null,
      useV4: false,
    },
    offline: false,
    outputFolderDateFormat: 'YYYY-MM-DD',
    theme: 'system',
    zoom: {
      enable: false,
      name: null,
      id: null,
      password: null,
      spotlight: false,
      hideComponent: false,
      autoRename: [],
      autoStartMeeting: false,
      autoStartTime: 1,
    },
  },
  cong: {
    server: null,
    port: null,
    user: null,
    password: null,
    dir: null,
  },
  media: {
    autoPlayFirst: false,
    autoPlayFirstTime: 5,
    enableMediaDisplayButton: false,
    enableMp4Conversion: false,
    enablePp: false,
    enableSubtitles: false,
    enableVlcPlaylistCreation: false,
    excludeLffImages: false,
    excludeTh: false,
    excludeFootnotes: false,
    hideMediaLogo: false,
    hideWinAfterMedia: false,
    includePrinted: false,
    keepOriginalsAfterConversion: false,
    lang: null,
    langFallback: null,
    langSubs: null,
    langUpdatedLast: null,
    maxRes: '720p',
    mediaWinShortcut: 'Alt+Z',
    ppBackward: null,
    ppForward: null,
    preferredOutput: 'window',
    presentShortcut: 'Alt+D',
  },
  meeting: {
    autoStartMusic: false,
    enableMusicButton: false,
    enableMusicFadeOut: false,
    coWeek: null,
    musicFadeOutTime: 5,
    musicFadeOutType: 'smart',
    musicVolume: 100,
    mwDay: null,
    mwStartTime: null,
    shuffleShortcut: 'Alt+K',
    specialCong: false,
    weDay: null,
    weStartTime: null,
  },
}

const ENUMS = {
  theme: ['system', 'light', 'dark'],
  musicFadeOutType: ['smart', 'timer'],
  outputFolderDateFormat: [
    'YYYY-MM-DD',
    'YYYY-MM-DD - dddd',
    'DD-MM-YYYY',
    'DD-MM-YYYY - dddd',
  ],
  maxRes: ['240p', '360p', '480p', '720p'],
}

const FORCABLE = [
  'app.congregationName',
  'app.obs.cameraScene',
  'app.obs.enable',
  'app.obs.imageScene',
  'app.obs.mediaScene',
  'app.obs.password',
  'app.obs.port',
  'app.outputFolderDateFormat',
  'app.zoom.autoRename',
  'app.zoom.autoStartMeeting',
  'app.zoom.autoStartTime',
  'app.zoom.enable',
  'app.zoom.hideComponent',
  'app.zoom.id',
  'app.zoom.name',
  'app.zoom.password',
  'app.zoom.spotlight',
  'media.autoPlayFirst',
  'media.autoPlayFirstTime',
  'media.enableMediaDisplayButton',
  'media.enableMp4Conversion',
  'media.enablePp',
  'media.enableSubtitles',
  'media.enableVlcPlaylistCreation',
  'media.excludeLffImages',
  'media.excludeTh',
  'media.hideMediaLogo',
  'media.hideWinAfterMedia',
  'media.includePrinted',
  'media.keepOriginalsAfterConversion',
  'media.lang',
  'media.langFallback',
  'media.langSubs',
  'media.maxRes',
  'media.ppBackward',
  'media.ppForward',
  'media.preferredOutput',
  'meeting.autoStartMusic',
  'meeting.coWeek',
  'meeting.enableMusicButton',
  'meeting.enableMusicFadeOut',
  'meeting.musicFadeOutTime',
  'meeting.musicFadeOutType',
  'meeting.musicVolume',
  'meeting.mwDay',
  'meeting.mwStartTime',
  'meeting.specialCong',
  'meeting.weDay',
  'meeting.weStartTime',
]

module.exports = {
  PREFS,
  ENUMS,
  FORCABLE,
}
