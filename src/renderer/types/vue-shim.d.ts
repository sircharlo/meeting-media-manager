/* eslint-disable import/named */
import { NuxtAxiosInstance } from '@nuxtjs/axios'
import { Options } from 'fast-glob'
import { Database } from 'sql.js'
import { Dayjs } from 'dayjs'
import Vue from 'vue'
import {
  MeetingFile,
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
  $clone: (value: any) => any
  $connect: (
    host: string,
    username: string,
    password: string,
    dir: string = '/'
  ) => Promise<string | null>
  $convertToMP4: (
    baseDate: Dayjs,
    now: Dayjs,
    setProgress: Function
  ) => Promise<void>
  $convertToVLC: () => void
  $convertUnusableFiles: (dir: string) => Promise<void>
  $copy: (src: string, dest: string) => void
  $createMediaNames: () => void
  $downloadIfRequired: (
    file: VideoFile,
    setProgress?: Function
  ) => Promise<string>
  $error: (message: string, error: Error, identifier?: string) => void
  $escapeHTML: (str: string) => string
  $extractAllTo: (zip: string, file: string, dest: string) => void
  $findAll: (path: string | string[], options?: Options) => string[]
  $findOne: (path: string | string[], options?: Options) => string
  $flash: (message: string, type?: string) => void
  $forcePrefs: (refresh: boolean = false) => Promise<ElectronStore | undefined>
  $getAllPrefs: () => ElectronStore
  $getCongMedia: (baseDate: Dayjs, now: Dayjs) => void
  $getCongPrefs: () => Promise<{ name: string; path: string }[]>
  $getAllPrefs: () => ElectronStore
  $getDb: ({
    file,
    pub,
    issue,
  }: {
    file?: Buffer
    pub?: string
    issue?: string
  }) => Promise<Database | null>
  $getDbFromJWPUB: (
    pub?: string,
    issue?: string,
    setProgess?: Function,
    localPath: string = ''
  ) => Promise<Database | null>
  $getDocumentMultiMedia: (
    db: Database,
    docId: number | null,
    mepsId?: number,
    memOnly?: boolean,
    silent?: boolean
  ) => Promise<MeetingFile[]>
  $getLocalJWLangs: () => ShortJWLang[]
  $getJWLangs: (forceReload: boolean = false) => Promise<ShortJWLang[]>
  $getPrefs: (key: string) => unknown
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
  $getMwMedia: (date: string, setProgress?: Function) => Promise<void>
  $getScenes: (current: boolean = false) => Promise<string[] | string>
  $getWeMedia: (date: string, setProgress?: Function) => Promise<void>
  $getYearText: (force: boolean = false) => Promise<string | null>
  $getZipContentsByExt: (zip: string, ext: string) => Buffer | null
  $getZipContentsByName: (zip: string, name: string) => Buffer | null
  $ghApi: NuxtAxiosInstance
  $initStore: (name: string) => void
  $isAudio: (filepath: string) => boolean
  $isImage: (filepath: string) => boolean
  $isLocked: (key: string) => boolean
  $isShortcutAvailable: (shortcut: string) => boolean
  $isShortcutValid: (shortcut: string) => boolean
  $isVideo: (filepath: string) => boolean
  $log: {
    debug: (msg: any, ...args: any[]) => void
    info: (msg: any, ...args: any[]) => void
    warn: (msg: any, ...args: any[]) => void
    error: (msg: any, ...args: any[]) => void
  }
  $mediaItems: NuxtAxiosInstance
  $mediaPath: (file?: MeetingFile) => string
  $migrate2290: (key: string, newVal: any) => { key: string; val: unknown }
  $notify: (
    message: string,
    props?: {
      action?: NotifyAction
      dismiss?: boolean
      identifier?: string
      persistent?: boolean
      type?: string
    },
    error?: any
  ) => void
  $prefsInitialized: () => boolean
  $printStats: () => void
  $pubMedia: NuxtAxiosInstance
  $pubPath: (file?: MeetingFile) => string
  $query: (db: Database, query: string) => unknown[]
  $refreshBackgroundImgPreview: (force: boolean = false) => Promise<string>
  $removeCong: (path: string) => void
  $rename: (
    path: string,
    oldName: string,
    newName: string,
    action: string = 'rename',
    type: string = 'string'
  ) => void
  $renameAll: (
    dir: string,
    search: string,
    newName: string,
    action: string = 'rename',
    type: string = 'string'
  ) => void
  $renamePubs: (oldVal: string, newVal: string) => Promise<void>
  $resetOBS: () => Promise<void>
  $resetPrefs: () => void
  $rm: (files: string | string[]) => void
  $sanitize: (name: string, isFile: boolean = false) => string
  $strip: (value: string, type: string = 'id') => string
  $sentry: typeof import('@sentry/vue')
  $setAllPrefs: (settings: ElectronStore) => void
  $setDb: (pub: string, issue: string, db: Database) => void
  $setPrefs: (key: string, value: unknown) => void
  $setScene: (scene: string) => Promise<void>
  $setShortcut: (
    shortcut: string,
    fn: string,
    domain: string = 'mediaWindow'
  ) => Promise<void>
  $shuffleMusic: (
    stop: boolean = false,
    immediately: boolean = false
  ) => Promise<void>
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
  $syncCongMedia: (baseDate: Dayjs, setProgress: Function) => Promise<void>
  $syncJWMedia: (
    dryrun: boolean,
    baseDate: Dayjs,
    setProgress: Function
  ) => Promise<void>
  $syncLocalRecurringMedia: (baseDate: Dayjs) => void
  $toggleMediaWindow: (action?: string) => Promise<void>
  $translate: (word: string, fallback?: string) => string
  $unsetPrefs: (key: keyof ElectronStore) => void
  $unsetShortcut: (shortcut: string) => void
  $unsetShortcuts: (filter: string = 'all') => void
  $updateContent: () => Promise<void>
  $updateContentsTree: () => CongFile[]
  $warn: (
    message: string,
    props?: {
      dismiss?: boolean
      identifier?: string
      persistent?: boolean
    },
    error?: any
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
