import { WebDAVClient, createClient, FileStat } from 'webdav/web'
import { Plugin } from '@nuxt/types'
import { basename, dirname, extname, join } from 'upath'
import { Dayjs } from 'dayjs'
// eslint-disable-next-line import/named
import { statSync } from 'fs-extra'
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

const plugin: Plugin = (
  {
    store,
    $log,
    $dayjs,
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
  async function connect(
    host: string,
    username: string,
    password: string,
    dir: string = '/'
  ): Promise<string | null> {
    try {
      const client = createClient('https://' + host, {
        username,
        password,
      })
      const contents = (await client.getDirectoryContents(dir, {
        deep: true,
      })) as FileStat[]

      // Clean up old dates
      const promises: Promise<void>[] = []
      contents
        .filter(({ type }) => type === 'directory')
        .forEach((dir) => {
          promises.push(removeOldDate(client, dir))
        })

      const bg = contents.find(({ basename }) =>
        basename.startsWith('media-window-background-image')
      )

      // If bg on cong server, force it to be used
      if (bg) {
        $rm($findAll(join($appPath(), 'media-window-background-image*')))
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

      const unsupportedHosts = ['4shared']

      if (unsupportedHosts.find((h) => host.includes(h))) {
        $warn(`errorWebdavNotSupported`, { identifier: host })
      }

      return 'success'
    } catch (e: any) {
      store.commit('cong/clear')

      // Return error message
      if (e.message === 'Network Error') {
        return 'host'
      } else if (e.message === 'Invalid response: 401 Unauthorized') {
        return 'credentials'
      } else if (
        e.message === 'Invalid response: 403 Forbidden' ||
        e.message === 'Invalid response: 404 Not Found' ||
        e.message === 'Invalid response: 405 Method Not Allowed'
      ) {
        return 'dir'
      } else {
        $error('errorWebdavLs', e, dir)
        return null
      }
    }
  }
  inject('connect', connect)

  async function removeOldDate(
    client: WebDAVClient,
    dir: FileStat
  ): Promise<void> {
    const date = $dayjs(
      dir.basename,
      $getPrefs('app.outputFolderDateFormat') as string
    )
    if (date.isValid() && date.isBefore($dayjs().subtract(1, 'day'))) {
      console.log('Removing old date', dir.filename)
      try {
        await client.deleteFile(dir.filename)
      } catch (e: any) {
        if (e.status !== 404) {
          $error('errorWebdavRm', e, dir.filename)
        }
      }
    }
  }

  inject('updateContent', async (): Promise<void> => {
    if (store.state.cong.client) {
      const contents = (await store.state.cong.client.getDirectoryContents(
        $getPrefs('cong.dir'),
        {
          deep: true,
        }
      )) as FileStat[]
      store.commit('cong/setContents', contents)
    }
  })

  inject(
    'forcePrefs',
    async (refresh: boolean = false): Promise<ElectronStore | undefined> => {
      if (!refresh && store.state.cong.prefs) {
        return store.state.cong.prefs as ElectronStore
      }
      try {
        const client = store.state.cong.client as WebDAVClient
        const path = join($getPrefs('cong.dir'), 'forcedPrefs.json')
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
              key === 'meeting'
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

          store.commit('cong/setPrefs', JSON.parse(JSON.stringify(prefs)))
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
        }
      } catch (e: any) {
        $error('errorForcedSettingsEnforce', e)
      }
    }
  )

  function updateContentsTree(): CongFile[] {
    const tree: CongFile[] = []
    let root = $getPrefs('cong.dir') as string
    if (root.length > 1 && root.endsWith('/')) root = root.slice(0, -1)
    const contents = $clone(store.state.cong.contents) as FileStat[]

    // Get directories
    const dirs = [
      ...contents.filter(({ type }) => type === 'directory'),
    ] as CongFile[]

    // Get files
    const files = [
      ...contents.filter(({ type }) => type === 'file'),
    ] as CongFile[]

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

  function increaseProgress(setProgress: Function): void {
    progress++
    setProgress(progress, total, true)
  }

  inject(
    'syncCongMedia',
    async (baseDate: Dayjs, setProgress: Function): Promise<void> => {
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
          .map((meeting) => {
            meeting[1] = new Map(
              Array.from(meeting[1]).filter((part) => {
                part[1] = part[1].filter(({ congSpecific }) => congSpecific)
                return part
              })
            )
            return meeting
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

  async function syncCongMediaItem(
    date: string,
    item: MeetingFile,
    setProgress: Function
  ): Promise<void> {
    if (!item.hidden && !item.isLocal) {
      if (item.filesize) {
        $log.info(
          `%c[congMedia] [${date}] ${item.safeName}`,
          'background-color: #d1ecf1; color: #0c5460'
        )

        // Prevent duplicates
        const duplicate = $findOne(
          join(
            $mediaPath(),
            item.folder as string,
            '*' + item.safeName?.substring(8).replace('.svg', '.png')
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
            perf.bits = perf.bytes * 8
            perf.ms = perf.end - perf.start
            perf.s = perf.ms / 1000
            perf.bps = perf.bits / perf.s
            perf.MBps = perf.bps / 1000000
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
