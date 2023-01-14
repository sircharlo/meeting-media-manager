// eslint-disable-next-line import/named
import { statSync } from 'fs-extra'
import { WebDAVClient, createClient, FileStat } from 'webdav/web'
import { Plugin } from '@nuxt/types'
import { basename, dirname, extname, join, resolve } from 'upath'
import { Dayjs } from 'dayjs'
import { XMLParser } from 'fast-xml-parser'
import {
  ObsPrefs,
  AppPrefs,
  CongPrefs,
  MediaPrefs,
  MeetingPrefs,
  CongFile,
  MeetingFile,
  ElectronStore,
} from '~/types'
import {
  BITS_IN_BYTE,
  BYTES_IN_MB,
  LOCKED,
  MS_IN_SEC,
  NOT_FOUND,
} from '~/constants/general'

import { HOSTS, UNSUPPORTED } from '~/constants/cong'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { FORCABLE } = require('~/constants/prefs') as { FORCABLE: string[] }

const plugin: Plugin = (
  {
    store,
    $log,
    $dayjs,
    $axios,
    $migrate2290,
    $findOne,
    $mediaPath,
    $clone,
    $warn,
    $write,
    $rm,
    $appPath,
    $findAll,
    $getPrefs,
    $rename,
    $setAllPrefs,
    $error,
  },
  inject
) => {
  // Try to connect to the cong server and get a list of files in the given directory
  async function connect(
    host: string,
    username: string,
    password: string,
    dir = '/'
  ): Promise<string | null> {
    if ($getPrefs('app.offline')) return 'offline'
    try {
      const client = createClient('https://' + host, {
        username,
        password,
      })

      const contents: FileStat[] = await getCongDirectory(
        client,
        host,
        username,
        password,
        dir
      )

      // Clean up old dates
      const promises: Promise<void>[] = []
      contents
        .filter(({ type }) => type === 'directory')
        .forEach((dir) => {
          promises.push(removeOldDate(client, dir))
        })

      const bg = contents.find(({ basename }) =>
        basename.startsWith(
          `custom-background-image-${$getPrefs('app.congregationName')}`
        )
      )

      // If bg on cong server, force it to be used
      if (bg) {
        $rm(
          $findAll(
            join(
              $appPath(),
              `custom-background-image-${$getPrefs('app.congregationName')}*`
            )
          )
        )
        $write(
          join($appPath(), bg.basename),
          Buffer.from(
            new Uint8Array(
              (await client.getFileContents(bg.filename)) as ArrayBuffer
            )
          )
        )
      }

      await Promise.allSettled(promises)

      store.commit('cong/setContents', contents)
      store.commit('cong/setClient', client)

      if (UNSUPPORTED.find((h) => host.includes(h))) {
        $warn(`errorWebdavNotSupported`, { identifier: host })
      }

      return 'success'
    } catch (e: any) {
      store.commit('cong/clear')
      console.debug('error:', e.message)

      // Return error message
      if (e.message === 'Network Error') {
        return 'host'
      } else if (
        e.message.includes('401') // Unauthorized
      ) {
        return 'credentials'
      } else if (
        e.message.includes('403') || // Forbidden
        e.message.includes('404') || // Not Found
        e.message.includes('405') // Method not Allowed
      ) {
        return 'dir'
      } else if (e.message.includes('429')) {
        $warn('errorWebdavTooManyRequests')
        return null
      } else {
        const match = HOSTS.find((h) => h.server === host)
        if (match && !dir.startsWith(match.dir)) {
          return 'dir'
        } else {
          $error('errorWebdavLs', e, dir)
          return null
        }
      }
    }
  }
  inject('connect', connect)

  // Get the immediate contents of a directory
  async function getFolderContent(
    host: string,
    username: string,
    password: string,
    dir = '/'
  ): Promise<FileStat[]> {
    const result = await $axios.$request({
      // @ts-ignore: PROPFIND is not a valid method
      method: 'PROPFIND',
      url: `https://${host}${dir}`,
      auth: {
        username,
        password,
      },
      responseType: 'text',
      headers: {
        Accept: 'text/plain',
        Depth: '1',
      },
    })

    const parsed = new XMLParser({ removeNSPrefix: true }).parse(result)
    if (Array.isArray(parsed?.multistatus?.response)) {
      const items: FileStat[] = parsed.multistatus.response
        .filter((item: any) => {
          return resolve(decodeURIComponent(item.href)) !== resolve(dir)
        })
        .map((item: any) => {
          const href = decodeURIComponent(item.href)
          return {
            filename: href.endsWith('/') ? href.slice(0, -1) : href,
            basename: basename(href),
            lastmod: item.propstat.prop.getlastmodified,
            type:
              typeof item.propstat.prop.resourcetype === 'object' &&
              'collection' in item.propstat.prop.resourcetype
                ? 'directory'
                : 'file',
            size: item.propstat.prop.getcontentlength ?? 0,
          } as FileStat
        })
      return items
    } else if (
      parsed?.multistatus?.response.propstat?.status?.includes('200')
    ) {
      return []
    } else {
      $log.debug('result', result)
      $log.debug('parsed:', JSON.stringify(parsed))
      throw new TypeError('Invalid response')
    }
  }

  // Fallback to get the entire directory contents of the cong server
  async function getCongDirectory(
    client: WebDAVClient,
    host: string,
    username: string,
    password: string,
    dir = '/'
  ): Promise<FileStat[]> {
    const brokenServers = ['4shared', 'cloudwise']
    if (!brokenServers.some((s) => host.includes(s))) {
      return (await client.getDirectoryContents(dir, {
        deep: true,
      })) as FileStat[]
    } else {
      let contents: FileStat[] = []

      // Get root content
      const rootFiles = await getFolderContent(host, username, password, dir)
      contents = contents.concat(rootFiles)

      // Get date folders
      let dateFolders: FileStat[] = []
      const datePromises: Promise<FileStat[]>[] = []
      rootFiles
        .filter(({ type }) => type === 'directory')
        .forEach((dir) => {
          datePromises.push(
            getFolderContent(host, username, password, dir.filename)
          )
        })

      const dateFolderResult = await Promise.allSettled(datePromises)
      dateFolderResult.forEach((dateDirs) => {
        if (dateDirs.status === 'fulfilled') {
          dateFolders = dateFolders.concat(dateDirs.value)
        }
      })

      // Get media files
      let mediaFiles: FileStat[] = []
      const mediaPromises: Promise<FileStat[]>[] = []
      dateFolders
        .filter(({ type }) => type === 'directory')
        .forEach((dir) => {
          mediaPromises.push(
            getFolderContent(host, username, password, dir.filename)
          )
        })

      const mediaFolderResult = await Promise.allSettled(mediaPromises)
      mediaFolderResult.forEach((media) => {
        if (media.status === 'fulfilled') {
          mediaFiles = mediaFiles.concat(media.value)
        }
      })

      // Return all files and directories
      return contents.concat(dateFolders, mediaFiles)
    }
  }

  // Remove old date folders that are not used any more
  async function removeOldDate(
    client: WebDAVClient,
    dir: FileStat
  ): Promise<void> {
    const date = $dayjs(
      dir.basename,
      $getPrefs('app.outputFolderDateFormat') as string
    )
    if (date.isValid() && date.isBefore($dayjs().subtract(1, 'day'))) {
      try {
        await client.deleteFile(dir.filename)
      } catch (e: any) {
        if (e.message.includes(LOCKED.toString())) {
          $warn('errorWebdavLocked', { identifier: dir.filename })
        } else if (e.status !== NOT_FOUND) {
          $error('errorWebdavRm', e, dir.filename)
        }
      }
    }
  }

  inject('createCongDir', async (dir: string) => {
    const contents = store.state.cong.contents as FileStat[]
    if (!contents.find(({ filename }) => filename === dir)) {
      const client = store.state.cong.client as WebDAVClient
      try {
        await client.createDirectory(dir)
      } catch (e: unknown) {
        if (await client.exists(dir)) {
          return
        }
        throw e
      }
    }
  })

  // Update the local contents of the cong server
  async function updateContent(): Promise<void> {
    if (!store.state.cong.client) return

    const { server, user, password, dir } = $getPrefs('cong') as CongPrefs
    let contents: FileStat[] = []
    contents = await getCongDirectory(
      store.state.cong.client,
      server as string,
      user as string,
      password as string,
      dir as string
    )
    store.commit('cong/setContents', contents)
  }
  inject('updateContent', updateContent)

  // Check if a specific preference/setting is locked according to the cong server
  inject('isLocked', (key: string): boolean => {
    // If no forced prefs, don't lock
    if (!store.state.cong.prefs) return false

    // If pref is not forcable, don't lock
    if (!FORCABLE.includes(key)) return false

    const keys = key.split('.')

    // If app key is not in forcedPrefs, don't lock
    if (!store.state.cong.prefs[keys[0] as keyof ElectronStore]) return false

    if (keys.length === 2) {
      return store.state.cong.prefs[keys[0]][keys[1]] !== undefined
    }
    // If pref is in a sub object (e.g. app.obs.enable)
    else if (keys.length === 3) {
      if (!store.state.cong.prefs[keys[0]][keys[1]]) {
        return false
      }
      return store.state.cong.prefs[keys[0]][keys[1]][keys[2]] !== undefined
    } else {
      throw new Error('Invalid key')
    }
  })

  // Force the specified preferences/settings according to the cong server for the current user
  inject(
    'forcePrefs',
    async (refresh = false): Promise<ElectronStore | undefined> => {
      if (!refresh && store.state.cong.prefs) {
        return store.state.cong.prefs as ElectronStore
      }

      const dir = $getPrefs('cong.dir') as string
      if (!dir) return undefined

      try {
        const client = store.state.cong.client as WebDAVClient
        const path = join(dir, 'forcedPrefs.json')
        if (
          (store.state.cong.contents as FileStat[]).find(
            ({ filename }) => filename === path
          )
        ) {
          const json = await client.getFileContents(path, {
            format: 'text',
          })

          const prefs = JSON.parse(json as string)

          // Migration of old pref structures
          for (const key of Object.keys(prefs)) {
            // Skip root keys
            if (
              key === 'app' ||
              key === 'cong' ||
              key === 'media' ||
              key === 'meeting' ||
              key === '__internal__'
            ) {
              continue
            }

            const newProp = $migrate2290(key, prefs[key])
            delete prefs[key]

            const keys = newProp.key.split('.')
            if (!prefs[keys[0]]) prefs[keys[0]] = {}
            if (keys.length === 2) {
              prefs[keys[0]][keys[1]] = newProp.val
            } else if (keys.length === 3) {
              if (!prefs[keys[0]][keys[1]]) prefs[keys[0]][keys[1]] = {}
              prefs[keys[0]][keys[1]][keys[2]] = newProp.val
            }
          }

          if (prefs.media?.excludeLffi !== undefined) {
            delete prefs.media.excludeLffi
          }

          if (prefs.media?.excludeLffiImages !== undefined) {
            prefs.media.excludeLffImages = $clone(prefs.media.excludeLffiImages)
            delete prefs.media.excludeLffiImages
          }

          const forcedPrefs = $clone(prefs)

          if (!prefs.app) prefs.app = {}
          prefs.app.obs = Object.assign(
            $getPrefs('app.obs') as ObsPrefs,
            prefs.app.obs ?? {}
          )
          const newPrefs = {
            app: Object.assign($getPrefs('app') as AppPrefs, prefs.app ?? {}),
            cong: Object.assign(
              $getPrefs('cong') as CongPrefs,
              prefs.cong ?? {}
            ),
            media: Object.assign(
              $getPrefs('media') as MediaPrefs,
              prefs.media ?? {}
            ),
            meeting: Object.assign(
              $getPrefs('meeting') as MeetingPrefs,
              prefs.meeting ?? {}
            ),
          }

          $setAllPrefs(newPrefs)
          store.commit('cong/setPrefs', JSON.parse(JSON.stringify(forcedPrefs)))
        }
      } catch (e: any) {
        $error('errorForcedSettingsEnforce', e)
      }
    }
  )

  // Update the contents tree of the cong server
  function updateContentsTree(): CongFile[] {
    const tree: CongFile[] = []
    let root = $getPrefs('cong.dir') as string
    if (!root) return []
    if (root.length > 1 && root.endsWith('/')) root = root.slice(0, -1)
    const contents = $clone(store.state.cong.contents) as FileStat[]

    // Get directories
    const dirs = [...contents.filter(({ type }) => type === 'directory')].sort(
      (a, b) => a.basename.localeCompare(b.basename)
    ) as CongFile[]

    // Get files
    const files = [...contents.filter(({ type }) => type === 'file')].sort(
      (a, b) => a.basename.localeCompare(b.basename)
    ) as CongFile[]
    // Add each file to its directory
    files.forEach((file) => {
      const fileDir = dirname(file.filename)
      if (fileDir === root) {
        tree.push(file)
      } else {
        const dir = dirs.find(({ filename }) => filename === fileDir)
        if (dir) {
          if (!dir.children) {
            dir.children = []
          }
          dir.children.push(file)
        }
      }
    })

    // Add subdirectories to their parent
    dirs.forEach((dir) => {
      const dirName = dirname(dir.filename)
      if (dirName !== root) {
        const parent = dirs.find(({ filename }) => filename === dirName)
        if (parent) {
          if (!parent.children) {
            parent.children = []
          }
          parent.children.push(dir)
        }
      }
    })

    // Add root directories to root
    dirs
      .filter(({ filename }) => dirname(filename) === root)
      .forEach((dir) => {
        tree.push(dir)
      })
    store.commit('cong/setContentsTree', tree)
    return tree
  }
  inject('updateContentsTree', updateContentsTree)

  // Get the required cong media for a specific week
  inject('getCongMedia', (baseDate: Dayjs, now: Dayjs): void => {
    store.commit('stats/startPerf', {
      func: 'getCongMedia',
      start: performance.now(),
    })
    const tree = updateContentsTree() as CongFile[]
    const mediaFolder = tree.find(({ basename }) => basename === 'Media')
    const hiddenFolder = tree.find(({ basename }) => basename === 'Hidden')
    const dates = [
      'Recurring',
      now.format($getPrefs('app.outputFolderDateFormat') as string),
    ]
    let day = now.add(1, 'day')
    while (day.isBetween(baseDate, baseDate.add(6, 'days'), null, '[]')) {
      dates.push(day.format($getPrefs('app.outputFolderDateFormat') as string))
      day = day.add(1, 'day')
    }

    dates.forEach((date) => {
      store.commit('media/setMultiple', {
        date,
        par: -1,
        media: [],
        overwrite: true,
      })
    })

    // Get cong media
    if (mediaFolder?.children) {
      let recurringMedia: MeetingFile[] = []
      mediaFolder.children
        .filter((date) => !!date.children)
        .forEach((date) => {
          const day = $dayjs(
            date.basename,
            $getPrefs('app.outputFolderDateFormat') as string
          )
          const isRecurring = date.basename === 'Recurring'
          const isMeetingDay =
            day.isValid() &&
            day.isBetween(baseDate, baseDate.add(6, 'days'), null, '[]') &&
            now.isSameOrBefore(day)

          if (isRecurring || isMeetingDay) {
            const media = date.children?.map((mediaFile) => {
              return {
                safeName: mediaFile.basename,
                congSpecific: true,
                filesize: mediaFile.size,
                folder: date.basename,
                url: mediaFile.filename,
              }
            })
            store.commit('media/setMultiple', {
              date: date.basename,
              par: -1,
              media,
              overwrite: true,
            })
            if (isRecurring) {
              recurringMedia = $clone(media)
            }
          }
        })

      // Set recurring media for each date
      dates.forEach((date) => {
        store.commit('media/setMultiple', {
          date,
          par: -1,
          media: $clone(recurringMedia)
            .map((m: MeetingFile) => {
              m.folder = date
              m.recurring = true
              return m
            })
            .filter((m: MeetingFile) => {
              const media = store.state.media.meetings.get(date)?.get(-1)
              if (media) {
                return !media.find(
                  ({ safeName }: MeetingFile) => safeName === m.safeName
                )
              } else {
                return true
              }
            }),
        })
      })
    }

    // Set hidden media
    if (hiddenFolder?.children) {
      const meetings = store.state.media.meetings as Map<
        string,
        Map<number, MeetingFile[]>
      >

      hiddenFolder.children
        .filter((date) => !!date.children)
        .forEach((date) => {
          const mediaMap = meetings.get(date.basename)
          const day = $dayjs(
            date.basename,
            $getPrefs('app.outputFolderDateFormat') as string
          )
          const isMeetingDay =
            day.isValid() &&
            day.isBetween(baseDate, baseDate.add(6, 'days'), null, '[]') &&
            now.isSameOrBefore(day)

          if (isMeetingDay && mediaMap) {
            date.children?.forEach((hiddenFile) => {
              let found = false
              mediaMap.forEach((media, par) => {
                if (found) return
                const result = media.find(
                  ({ safeName }) => safeName === hiddenFile.basename
                )
                if (result) {
                  store.commit('media/setHidden', {
                    date: date.basename,
                    par,
                    mediaName: hiddenFile.basename,
                    hidden: true,
                  })

                  // Remove hidden media if it was already downloaded
                  $rm(join($mediaPath(), date.basename, hiddenFile.basename))
                  $log.info(
                    '%c[hiddenMedia] [' +
                      date.basename +
                      '] ' +
                      hiddenFile.basename,
                    'background-color: #fff3cd; color: #856404;'
                  )
                  found = true
                }
              })
            })
          }
        })
    }
    store.commit('stats/stopPerf', {
      func: 'getCongMedia',
      stop: performance.now(),
    })
  })

  let progress = 0
  let total = 0

  function initProgress(amount: number): void {
    progress = 0
    total = amount
  }

  function increaseProgress(
    setProgress: (loaded: number, total: number, global?: boolean) => void
  ): void {
    progress++
    setProgress(progress, total, true)
  }

  // Sync the cong media to the local disk
  inject(
    'syncCongMedia',
    async (
      baseDate: Dayjs,
      setProgress: (loaded: number, total: number, global?: boolean) => void
    ): Promise<void> => {
      store.commit('stats/startPerf', {
        func: 'syncCongMedia',
        start: performance.now(),
      })
      const meetings = new Map(
        Array.from(
          store.getters['media/meetings'] as Map<
            string,
            Map<number, MeetingFile[]>
          >
        )
          .filter(([date, _parts]) => {
            if (date === 'Recurring') return true
            const dateObj = $dayjs(
              date,
              $getPrefs('app.outputFolderDateFormat') as string
            ) as Dayjs
            return (
              dateObj.isValid() &&
              dateObj.isBetween(baseDate, baseDate.add(6, 'days'), null, '[]')
            )
          })
          .map(([date, parts]) => {
            const newParts = new Map(
              Array.from(parts).map(([part, media]) => {
                const newMedia = media.filter(
                  ({ congSpecific }) => !!congSpecific
                )
                return [part, newMedia]
              })
            )
            return [date, newParts]
          })
      )

      let total = 0
      meetings.forEach((parts) =>
        parts.forEach((media) => (total += media.length))
      )

      initProgress(total)
      const promises: Promise<void>[] = []

      meetings.forEach((parts, date) => {
        parts.forEach((media) => {
          media.forEach((item) => {
            promises.push(syncCongMediaItem(date, item, setProgress))
          })
        })
      })

      await Promise.allSettled(promises)

      store.commit('stats/stopPerf', {
        func: 'syncCongMedia',
        stop: performance.now(),
      })
    }
  )

  // Sync a single media item to the local disk
  async function syncCongMediaItem(
    date: string,
    item: MeetingFile,
    setProgress: (loaded: number, total: number, global?: boolean) => void
  ): Promise<void> {
    if (!item.hidden && !item.isLocal) {
      if (item.filesize) {
        $log.info(
          `%c[congMedia] [${date}] ${item.safeName}`,
          'background-color: #d1ecf1; color: #0c5460'
        )

        // Prevent duplicates
        const PREFIX_MAX_LENGTH = 9
        const duplicate = $findOne(
          join(
            $mediaPath(),
            item.folder as string,
            '*' +
              item.safeName
                ?.substring(PREFIX_MAX_LENGTH)
                .replace('.svg', '.png')
          )
        )
        if (
          duplicate &&
          (statSync(duplicate).size === item.filesize ||
            extname(item.safeName as string) === '.svg')
        ) {
          if (basename(duplicate) !== item.safeName) {
            $rename(
              duplicate,
              basename(duplicate),
              (item.safeName as string).replace('.svg', '.png')
            )
          }
          store.commit('stats/setDownloads', {
            origin: 'cong',
            source: 'cache',
            file: item,
          })
        } else {
          const client = store.state.cong.client as WebDAVClient
          if (client) {
            const perf: any = {
              start: performance.now(),
              bytes: item.filesize,
              name: item.safeName,
            }
            const file = (await client.getFileContents(item.url as string, {
              onDownloadProgress: (progress) => {
                setProgress(progress.loaded, progress.total)
              },
            })) as ArrayBuffer

            perf.end = performance.now()
            perf.bits = perf.bytes * BITS_IN_BYTE
            perf.ms = perf.end - perf.start
            perf.s = perf.ms / MS_IN_SEC
            perf.bps = perf.bits / perf.s
            perf.MBps = perf.bps / BYTES_IN_MB
            perf.dir = 'down'
            $log.debug(perf)

            $write(
              join(
                $mediaPath(),
                item.folder as string,
                item.safeName as string
              ),
              Buffer.from(new Uint8Array(file))
            )
            store.commit('stats/setDownloads', {
              origin: 'cong',
              source: 'live',
              file: item,
            })
          }
        }
      } else {
        $warn('warnFileNotAvailable', {
          identifier: [
            item.queryInfo?.KeySymbol,
            item.queryInfo?.Track,
            item.queryInfo?.IssueTagNumber,
          ]
            .filter(Boolean)
            .join('_'),
        })
      }
    }
    increaseProgress(setProgress)
  }
}

export default plugin
