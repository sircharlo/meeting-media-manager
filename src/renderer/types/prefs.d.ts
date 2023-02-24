export interface ObsPrefs {
  enable: boolean
  port: string | null
  password: string | null
  mediaScene: string | null
  cameraScene: string | null
  zoomScene: string | null
  useV4: boolean
}

export interface ZoomPrefs {
  enable: boolean
  name: string | null
  id: string | null
  password: string | null
  spotlight: boolean
  hideComponent: boolean
  autoRename: string[]
  autoStartMeeting: boolean
  autoStartTime: number | null
}

export const dateFormats = [
  'DD-MM-YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY - dddd',
  'YYYY-MM-DD - dddd',
] as const
export type DateFormat = (typeof dateFormats)[number]

export interface AppPrefs {
  autoOpenFolderWhenDone: boolean
  autoQuitWhenDone: boolean
  autoRunAtBoot: boolean
  autoStartSync: boolean
  betaUpdates: boolean
  congregationName: string | null
  customCachePath: string | null
  disableAutoUpdate: boolean
  disableHardwareAcceleration: boolean
  localAppLang: string | null
  localOutputPath: string | null
  obs: ObsPrefs
  offline: boolean
  outputFolderDateFormat: DateFormat
  theme: 'light' | 'dark' | 'system'
  zoom: ZoomPrefs
}

export interface CongPrefs {
  server: string | null
  port: string | null
  user: string | null
  password: string | null
  dir: string | null
}

export const resolutions = ['240p', '360p', '480p', '720p'] as const
export type Res = (typeof resolutions)[number]

export interface MediaPrefs {
  autoPlayFirst: boolean
  autoPlayFirstTime: number | null
  enableMediaDisplayButton: boolean
  enableMp4Conversion: boolean
  enablePp: boolean
  enableSubtitles: boolean
  enableVlcPlaylistCreation: boolean
  excludeLffImages: boolean
  excludeTh: boolean
  hideMediaLogo: boolean
  hideWinAfterMedia: boolean
  includePrinted: boolean
  keepOriginalsAfterConversion: boolean
  lang: string | null
  langFallback: string | null
  langSubs: string | null
  langUpdatedLast: string | null
  maxRes: Res
  mediaWinShortcut: string | null
  ppBackward: string | null
  ppForward: string | null
  preferredOutput: 'window' | number
  presentShortcut: string | null
}

export const enum MeetingDay {
  MO = 0,
  TU = 1,
  WE = 2,
  TH = 3,
  FR = 4,
  SA = 5,
  SU = 6,
}

export interface MeetingPrefs {
  autoStartMusic: boolean
  enableMusicButton: boolean
  enableMusicFadeOut: boolean
  coWeek: string | null
  musicFadeOutTime: number | null
  musicFadeOutType: 'smart' | 'timer'
  musicVolume: number | null
  mwDay: MeetingDay | null
  mwStartTime: string | null
  shuffleShortcut: string | null
  specialCong: boolean
  weDay: MeetingDay | null
  weStartTime: string | null
}

export interface ElectronStore {
  app: AppPrefs
  cong: CongPrefs
  media: MediaPrefs
  meeting: MeetingPrefs
}
