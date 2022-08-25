export interface ObsPrefs {
  enable: boolean
  port: string | null
  password: string | null
  mediaScene: string | null
  cameraScene: string | null
}

export enum DateFormat {
  DMY = 'DD-MM-YYYY',
  DMYd = 'DD-MM-YYYY - dddd',
  YMD = 'YYYY-MM-DD',
  YMDd = 'YYYY-MM-DD - dddd',
}

export interface AppPrefs {
  theme: 'light' | 'dark' | 'system'
  autoOpenFolderWhenDone: boolean
  autoQuitWhenDone: boolean
  autoRunAtBoot: boolean
  autoStartSync: boolean
  congregationName: string | null
  disableHardwareAcceleration: boolean
  localAppLang: string
  localOutputPath: string | null
  obs: ObsPrefs
  outputFolderDateFormat: DateFormat
}

export interface CongPrefs {
  server: string | null
  port: string | null
  user: string | null
  password: string | null
  dir: string | null
}

export enum Res {
  '240p' = '240p',
  '360p' = '360p',
  '480p' = '480p',
  '720p' = '720p',
}

export interface MediaPrefs {
  enableMediaDisplayButton: boolean
  enableMp4Conversion: boolean
  enablePp: boolean
  enableVlcPlaylistCreation: boolean
  excludeLffi: boolean
  excludeLffiImages: boolean
  excludeTh: boolean
  hideMediaLogo: boolean
  keepOriginalsAfterConversion: boolean
  lang: string | null
  langUpdatedLast: string | null
  maxRes: Res
  ppBackward: string | null
  ppForward: string | null
  preferredOutput: 'window' | number
}

export enum FadeOutType {
  SMART = 'smart',
  TIMER = 'timer',
}

export enum MeetingDay {
  MO = 0,
  TU = 1,
  WE = 2,
  TH = 3,
  FR = 4,
  SA = 5,
  SU = 6,
}

export interface MeetingPrefs {
  enableMusicButton: boolean
  enableMusicFadeOut: boolean
  musicFadeOutTime: number | null
  musicFadeOutType: FadeOutType
  musicVolume: number | null
  mwDay: MeetingDay | null
  mwStartTime: string | null
  weDay: MeetingDay | null
  weStartTime: string | null
}

export interface ElectronStore {
  app: AppPrefs
  cong: CongPrefs
  media: MediaPrefs
  meeting: MeetingPrefs
}
