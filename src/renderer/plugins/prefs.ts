/* eslint-disable import/named */
import { readFileSync, removeSync } from 'fs-extra'
import { Context } from '@nuxt/types'
import { ipcRenderer } from 'electron'
import Store, { Schema } from 'electron-store'
import { basename, dirname, join, normalize } from 'upath'
import { sync } from 'fast-glob'
import {
  AppPrefs,
  MeetingPrefs,
  MediaPrefs,
  CongPrefs,
  ObsPrefs,
} from './../types/prefs'
import { ElectronStore } from '~/types'

const { PREFS } = require('~/constants/prefs') as { PREFS: ElectronStore }

// Define your schema per the ajv/JSON spec
// But you also need to create a mirror of that spec in TS
// And use the type here
const schema: Schema<ElectronStore> = {
  app: {
    type: 'object',
    properties: {
      theme: {
        type: 'string',
        default: PREFS.app.theme,
      },
      disableHardwareAcceleration: {
        type: 'boolean',
        default: PREFS.app.disableHardwareAcceleration,
      },
      localAppLang: {
        type: 'string',
        default: PREFS.app.localAppLang,
      },
      localOutputPath: {
        type: ['string', 'null'],
        default: PREFS.app.localOutputPath,
      },
      congregationName: {
        type: ['string', 'null'],
        default: PREFS.app.congregationName,
      },
      outputFolderDateFormat: {
        type: 'string',
        default: PREFS.app.outputFolderDateFormat,
      },
      autoStartSync: {
        type: 'boolean',
        default: PREFS.app.autoStartSync,
      },
      autoRunAtBoot: {
        type: 'boolean',
        default: PREFS.app.autoRunAtBoot,
      },
      autoQuitWhenDone: {
        type: 'boolean',
        default: PREFS.app.autoQuitWhenDone,
      },
      autoOpenFolderWhenDone: {
        type: 'boolean',
        default: PREFS.app.autoOpenFolderWhenDone,
      },
      obs: {
        type: 'object',
        properties: {
          enable: {
            type: 'boolean',
            default: PREFS.app.obs.enable,
          },
          port: {
            type: ['string', 'null'],
            default: PREFS.app.obs.port,
          },
          password: {
            type: ['string', 'null'],
            default: PREFS.app.obs.password,
          },
          mediaScene: {
            type: ['string', 'null'],
            default: PREFS.app.obs.mediaScene,
          },
          cameraScene: {
            type: ['string', 'null'],
            default: PREFS.app.obs.cameraScene,
          },
        },
      },
    },
  },
  cong: {
    type: 'object',
    properties: {
      server: {
        type: ['string', 'null'],
        default: PREFS.cong.server,
      },
      user: {
        type: ['string', 'null'],
        default: PREFS.cong.user,
      },
      password: {
        type: ['string', 'null'],
        default: PREFS.cong.password,
      },
      port: {
        type: ['string', 'null'],
        default: PREFS.cong.port,
      },
      dir: {
        type: ['string', 'null'],
        default: PREFS.cong.dir,
      },
    },
  },
  media: {
    type: 'object',
    properties: {
      lang: {
        type: ['string', 'null'],
        default: PREFS.media.lang,
      },
      langUpdatedLast: {
        type: ['string', 'null'],
        default: PREFS.media.langUpdatedLast,
      },
      maxRes: {
        type: 'string',
        default: PREFS.media.maxRes,
      },
      enablePp: {
        type: 'boolean',
        default: PREFS.media.enablePp,
      },
      enableMp4Conversion: {
        type: 'boolean',
        default: PREFS.media.enableMp4Conversion,
      },
      keepOriginalsAfterConversion: {
        type: 'boolean',
        default: PREFS.media.keepOriginalsAfterConversion,
      },
      enableVlcPlaylistCreation: {
        type: 'boolean',
        default: PREFS.media.enableVlcPlaylistCreation,
      },
      enableMediaDisplayButton: {
        type: 'boolean',
        default: PREFS.media.enableMediaDisplayButton,
      },
      hideMediaLogo: {
        type: 'boolean',
        default: PREFS.media.hideMediaLogo,
      },
      excludeTh: {
        type: 'boolean',
        default: PREFS.media.excludeTh,
      },
      excludeLffi: {
        type: 'boolean',
        default: PREFS.media.excludeLffi,
      },
      excludeLffiImages: {
        type: 'boolean',
        default: PREFS.media.excludeLffiImages,
      },
      ppBackward: {
        type: ['string', 'null'],
        default: PREFS.media.ppBackward,
      },
      ppForward: {
        type: ['string', 'null'],
        default: PREFS.media.ppForward,
      },
      preferredOutput: {
        type: ['string', 'number'],
        default: PREFS.media.preferredOutput,
      },
    },
  },
  meeting: {
    type: 'object',
    properties: {
      enableMusicButton: {
        type: 'boolean',
        default: PREFS.meeting.enableMusicButton,
      },
      enableMusicFadeOut: {
        type: 'boolean',
        default: PREFS.meeting.enableMusicFadeOut,
      },
      mwDay: {
        type: ['number', 'null'],
        default: PREFS.meeting.mwDay,
      },
      weDay: {
        type: ['number', 'null'],
        default: PREFS.meeting.weDay,
      },
      musicFadeOutType: {
        type: 'string',
        default: PREFS.meeting.musicFadeOutType,
      },
      musicFadeOutTime: {
        type: 'number',
        default: PREFS.meeting.musicFadeOutTime,
      },
      musicVolume: {
        type: 'number',
        default: PREFS.meeting.musicVolume,
      },
      mwStartTime: {
        type: ['string', 'null'],
        default: PREFS.meeting.mwStartTime,
      },
      weStartTime: {
        type: ['string', 'null'],
        default: PREFS.meeting.weStartTime,
      },
    },
  },
}

// We define the keys we'll be using to access the store
// This is basically the top-level properties in the object
// But electron-store supports dot notation, so feel free to set deeper keys

// We set the type like this so when we use `store.get()`
// It'll use the actual keys from store and infer the data type
export const STORE_KEYS: { [key: string]: keyof ElectronStore } = {
  APP: 'app',
  CONG: 'cong',
  MEDIA: 'media',
  MEETING: 'meeting',
}

let store: Store<ElectronStore>

function storeOptions(name: string = 'prefs') {
  return {
    name,
    schema,
    defaults: PREFS,
    beforeEachMigration: (_store, context) => {
      console.debug(
        `[main-config] migrate from ${context.fromVersion} → ${context.toVersion}`
      )
      console.debug(`[main-config] final version: ${context.finalVersion}`)
      console.debug(`[main-config] versions: ${context.versions}`)
    },
    migrations: {
      '<=22.9.0': (store) => {
        for (const key of Object.keys(store.store)) {
          // Skip root keys
          if (
            key === 'app' ||
            key === 'cong' ||
            key === 'media' ||
            key === 'meeting'
          ) {
            continue
          }

          const newProp = migrate2290(key, store.get(key))

          // Set new key and value and delete old one
          store.set(newProp.key, newProp.val)
          store.delete(key as keyof ElectronStore)
        }
      },
    },
  } as Store.Options<ElectronStore>
}

function migrate2290(key: string, newVal: any) {
  let isObsPref = false
  let isMeetingPref = false
  let isMediaPref = false
  let isCongPref = false

  let root: keyof ElectronStore = 'app'
  let newKey:
    | keyof AppPrefs
    | keyof MeetingPrefs
    | keyof MediaPrefs
    | keyof CongPrefs
    | keyof ObsPrefs = key as any

  // Get correct values for root, newKey and newVal
  if (key === 'enableObs') {
    isObsPref = true
    newKey = 'enable'
  } else if (key.startsWith('obs')) {
    isObsPref = true
    newKey = key.replace('obs', '') as keyof ObsPrefs
    newKey = (newKey.charAt(0).toLowerCase() +
      newKey.slice(1)) as keyof ObsPrefs
  } else if (key.startsWith('congServer')) {
    root = 'cong'
    isCongPref = true
    newKey = key
      .replace('congServer', 'server')
      .replace('serverDir', 'dir')
      .replace('serverPass', 'password')
      .replace('serverPort', 'port')
      .replace('serverUser', 'user') as keyof CongPrefs
  } else if (PREFS.media[key as keyof MediaPrefs] !== undefined) {
    root = 'media'
    isMediaPref = true
  } else if (PREFS.meeting[key as keyof MeetingPrefs] !== undefined) {
    root = 'meeting'
    isMeetingPref = true
  }

  // Convert null values to (new) default values
  if (isObsPref) {
    if (!newVal) {
      newVal = PREFS.app.obs[newKey as keyof ObsPrefs]
    }
  } else if (isMeetingPref) {
    if (!newVal) {
      newVal = PREFS.meeting[newKey as keyof MeetingPrefs]
    }
  } else if (isMediaPref) {
    if (!newVal) {
      newVal = PREFS.media[newKey as keyof MediaPrefs]
    }
  } else if (isCongPref) {
    if (!newVal) {
      newVal = PREFS.cong[newKey as keyof CongPrefs]
    }
  } else if (!newVal) {
    newVal = PREFS.app[newKey as keyof AppPrefs]
  }

  // Values that were converted from string to number
  if (
    key === 'musicFadeOutTime' ||
    key === 'musicVolume' ||
    key === 'mwDay' ||
    key === 'weDay'
  ) {
    if (typeof newVal === 'string') newVal = parseInt(newVal)
  }

  if (isObsPref) {
    return { key: `${root}.obs.${newKey}`, val: newVal }
  } else {
    return { key: `${root}.${newKey}`, val: newVal }
  }
}

export default function (
  _context: Context,
  inject: (argument0: string, argument1: unknown) => void
) {
  inject('prefsInitialized', () => !!store)
  inject('getCongPrefs', async () => {
    return sync(join(await ipcRenderer.invoke('userData'), 'prefs-*.json'))
      .map((file) => {
        const prefs = JSON.parse(readFileSync(file, 'utf8'))
        return {
          name: prefs?.app?.congregationName ?? prefs?.congregationName,
          path: file,
        }
      })
      .filter((cong) => cong.name)
      .sort((a, b) => b.name.localeCompare(a.name))
  })
  function initStore(name: string) {
    store = new Store<ElectronStore>(storeOptions(name))
  }
  inject('initStore', initStore)
  inject('storePath', () => (store?.path ? normalize(store.path) : undefined))
  inject('appPath', () => {
    return dirname(normalize(store?.path ?? ''))
  })
  inject('appVersion', async () => {
    return await ipcRenderer.invoke('appVersion')
  })
  inject('switchCong', (path: string) => {
    initStore(basename(path, '.json'))
  })
  inject('removeCong', (path: string) => {
    removeSync(path)
  })
  inject('getPrefs', (key: string) => {
    return store?.get(key)
  })
  inject('getAllPrefs', () => JSON.parse(readFileSync(store.path, 'utf8')))

  inject('setPrefs', (key: string, value: unknown) => {
    return store.set(key, value)
  })

  inject('setAllPrefs', (settings: ElectronStore) => {
    return store.set(settings)
  })

  inject('unsetPrefs', (key: keyof ElectronStore) => {
    return store.delete(key)
  })

  inject('resetPrefs', () => {
    return store.clear()
  })
  inject('migrate2290', migrate2290)
}
