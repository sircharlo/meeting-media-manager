/* eslint-disable import/named */
import { NuxtAxiosInstance } from '@nuxtjs/axios'
import { Options } from 'fast-glob'
import { Database } from 'sql.js'
import { Dayjs } from 'dayjs'
import Vue from 'vue'
import { Entry } from 'fast-glob/out/types'
import {
  MeetingFile,
  MediaItem,
  SmallMediaFile,
  ElectronStore,
  ShortJWLang,
  NotifyAction,
  VideoFile,
  CongFile,
} from '~/types'

interface CustomProps {
  $appPath: () => string
  $appVersion: () => Promise<string>
  $bugURL: () => string
  $clone: (value: unknown) => any
  $connect: (
    host: string,
    username: string,
    password: string,
    dir = '/'
  ) => Promise<string | null>
  $convertToMP4: (
    baseDate: Dayjs,
    now: Dayjs,
    setProgress: (loaded: number, total: number, global?: boolean) => void
  ) => Promise<void>
  $convertToVLC: () => void
  $convertUnusableFiles: (
    dir: string,
    setProgress?: (loaded: number, total: number, global?: boolean) => void
  ) => Promise<void>
  $copy: (src: string, dest: string) => void
  $createCongDir: (dir: string) => Promise<void>
  $createMediaNames: () => void
  $downloadIfRequired: (
    file: VideoFile,
    setProgress?: (loaded: number, total: number, global?: boolean) => void
  ) => Promise<string>
  $error: (message: string, error: unknown, identifier?: string) => void
  $escapeHTML: (str: string) => string
  $executeBeforeMeeting: (
    name: string,
    mins: number,
    action: () => void
  ) => void
  $extractAllTo: (zip: string, dest: string) => Promise<void>
  $findAll: (path: string | string[], options?: Options) => string[]
  $findAllStats: (path: string | string[], options?: Options) => Entry[]
  $findOne: (path: string | string[], options?: Options) => string
  $flash: (message: string, type?: string) => void
  $forcePrefs: (refresh = false) => Promise<ElectronStore | undefined>
  $getAllPrefs: () => ElectronStore
  $getCongMedia: (baseDate: Dayjs, now: Dayjs) => void
  $getCongPrefs: () => Promise<{ name: string; path: string }[]>
  $getAllPrefs: () => ElectronStore
  $getDb: ({
    file,
    pub,
    issue,
    lang,
  }: {
    file?: Buffer
    pub?: string
    issue?: string
    lang?: string
  }) => Promise<Database | null>
  $getDbFromJWPUB: (
    pub?: string,
    issue?: string,
    setProgress?: (loaded: number, total: number, global?: boolean) => void,
    lang?: string,
    localPath = ''
  ) => Promise<Database | null>
  $getDocumentMultiMedia: (
    db: Database,
    docId: number | null,
    mepsId?: number,
    lang?: string,
    memOnly?: boolean,
    silent?: boolean
  ) => Promise<MeetingFile[]>
  $getFirstDayOfWeek: (lang: string) => number
  $getJWLangs: (forceReload = false) => Promise<ShortJWLang[]>
  $getLatestJWMedia: () => Promise<MediaItem[]>
  $getPrefs: (key: string) => unknown
  $getPubAvailability: (
    lang: string,
    reload?: boolean
  ) => Promise<{ lang: string; mwb: boolean; w: boolean }>
  $getMediaLinks: (
    mediaItem: {
      docId?: number
      track?: number
      pubSymbol: string
      issue?: string
      format?: string
      lang?: string
    },
    silent?: boolean
  ) => Promise<SmallMediaFile[]>
  $getMediaWindowDestination: () => Promise<{
    destination: number
    type: 'window' | 'fullscreen'
  }>
  $getMwDay: (baseDate?: Dayjs) => number
  $getMwMedia: (
    date: string,
    setProgress?: (loaded: number, total: number, global?: boolean) => void
  ) => Promise<void>
  $getScenes: (current = false) => Promise<string[] | string>
  $getSongs: () => Promise<VideoFile[]>
  $getWeMedia: (
    date: string,
    setProgress?: (loaded: number, total: number, global?: boolean) => void
  ) => Promise<void>
  $getYearText: (force = false, lang?: string) => Promise<string | null>
  $getZipContentsByExt: (zip: string, ext: string) => Promise<Buffer | null>
  $getZipContentsByName: (zip: string, name: string) => Promise<Buffer | null>
  $ghApi: NuxtAxiosInstance
  $initStore: (name: string) => void
  $isAudio: (filepath: string) => boolean
  $isCoWeek: (baseDate?: Dayjs) => boolean
  $isImage: (filepath: string) => boolean
  $isLocked: (key: string) => boolean
  $isMeetingDay: (date?: Dayjs) => string
  $isShortcutAvailable: (shortcut: string, func: string) => boolean
  $isShortcutValid: (shortcut: string) => boolean
  $isVideo: (filepath: string) => boolean
  $localFontPath: (font: string) => string
  $log: {
    debug: (msg: any, ...args: any[]) => void
    info: (msg: any, ...args: any[]) => void
    warn: (msg: any, ...args: any[]) => void
    error: (msg: any, ...args: any[]) => void
  }
  $mediaCategories: NuxtAxiosInstance
  $mediaItems: NuxtAxiosInstance
  $mediaPath: (file?: MeetingFile) => string | undefined
  $migrate2290: (key: string, newVal: any) => { key: string; val: unknown }
  $move: (src: string, dest: string, overwrite = false) => void
  $notify: (
    message: string,
    props?: {
      action?: NotifyAction
      dismiss?: boolean
      identifier?: string
      persistent?: boolean
      type?: string
    },
    error?: unknown
  ) => void
  $prefsInitialized: () => boolean
  $printStats: () => void
  $pubMedia: NuxtAxiosInstance
  $pubPath: (file?: MeetingFile) => string | undefined
  $query: (db: Database, query: string) => unknown[]
  $refreshBackgroundImgPreview: (force = false) => Promise<string>
  $removeCong: (path: string) => void
  $rename: (
    path: string,
    oldName: string,
    newName: string,
    action = 'rename',
    type = 'string'
  ) => void
  $renameAll: (
    dir: string,
    search: string,
    newName: string,
    action = 'rename',
    type = 'string'
  ) => void
  $renamePubs: (oldVal: string, newVal: string) => Promise<void>
  $resetOBS: () => Promise<void>
  $resetPrefs: () => void
  $rm: (files: string | string[]) => void
  $sanitize: (name: string, isFile = false) => string
  $strip: (value: string, type = 'id') => string
  $sentry: typeof import('@sentry/vue')
  $setAllPrefs: (settings: ElectronStore) => void
  $setDb: (pub: string, issue: string, db: Database) => void
  $setPrefs: (key: string, value: unknown) => void
  $setScene: (scene: string) => Promise<void>
  $setShortcut: (
    shortcut: string,
    fn: string,
    domain = 'mediaWindow'
  ) => Promise<void>
  $shuffleMusic: (stop = false, immediately = false) => Promise<void>
  $storePath: () => string | undefined
  $success: (
    message: string,
    props?: {
      action?: NotifyAction
      dismiss?: boolean
      identifier?: string
      persistent?: boolean
    }
  ) => void
  $switchCong: (path: string) => void
  $syncCongMedia: (
    baseDate: Dayjs,
    setProgress: (loaded: number, total: number, global?: boolean) => void
  ) => Promise<void>
  $syncJWMedia: (
    dryrun: boolean,
    baseDate: Dayjs,
    setProgress: (loaded: number, total: number, global?: boolean) => void
  ) => Promise<void>
  $syncLocalRecurringMedia: (baseDate: Dayjs) => void
  $toggleMediaWindow: (action?: string) => Promise<void>
  $translate: (word: string, fallback?: string) => string
  $unsetPrefs: (key: keyof ElectronStore) => void
  $unsetShortcut: (shortcut: string) => void
  $unsetShortcuts: (filter = 'all') => void
  $updateContent: () => Promise<void>
  $updateContentsTree: () => CongFile[]
  $warn: (
    message: string,
    props?: {
      dismiss?: boolean
      identifier?: string
      persistent?: boolean
    },
    error?: unknown
  ) => void
  $write: (file: string, data: string | NodeJS.ArrayBufferView) => void
  $wtFontPath: () => Promise<string>
  $ytPath: (lang?: string) => string
}

declare module 'vue/types/vue' {
  interface Vue extends CustomProps {}
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Store<S> extends CustomProps {}
}

declare module '@nuxt/types' {
  interface Context extends CustomProps {}
  interface NuxtAppOptions extends CustomProps {}
}

declare module '*.vue' {
  export default Vue
}
