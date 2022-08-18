import { WebDAVClient, createClient, FileStat } from 'webdav/web'
/* eslint-disable import/named */
import { Context } from '@nuxt/types'
import { basename, dirname, extname, join } from 'upath'
import { Dayjs } from 'dayjs'
import { statSync } from 'fs-extra'
import {
  ObsPrefs,
  AppPrefs,
  CongPrefs,
  MediaPrefs,
  MeetingPrefs,
} from './../types/prefs'
import { CongFile, MeetingFile } from '~/types'

export default function (
  {
    store,
    $log,
    $dayjs,
    $migrate2290,
    $findOne,
    $mediaPath,
    $warn,
    $write,
    $getPrefs,
    $rename,
    $setAllPrefs,
    i18n,
    $error,
  }: Context,
  inject: (argument0: string, argument1: unknown) => void
) {
  async function connect(
    host: string,
    username: string,
    password: string,
    dir: string = '/'
  ) {
    try {
      const client = createClient('https://' + host, {
        username,
        password,
      })
      const contents = (await client.getDirectoryContents(dir, {
        deep: true,
      })) as FileStat[]
      contents
        .filter(({ type }) => type === 'directory')
        .forEach((dir) => {
          const date = $dayjs(
            dir.basename,
            $getPrefs('app.outputFolderDateFormat') as string
          )
          if (date.isValid() && date.isBefore($dayjs().subtract(1, 'day'))) {
            client.deleteFile(dir.filename)
          }
        })
      store.commit('cong/setContents', contents)
      store.commit('cong/setClient', client)
      return 'success'
    } catch (e: any) {
      store.commit('cong/clear')
      $log.error(e)
      if (e.message === 'Network Error') {
        return 'host'
      } else if (e.message === 'Invalid response: 401 Unauthorized') {
        return 'credentials'
      } else if (
        e.message === 'Invalid response: 405 Method Not Allowed' ||
        e.message === 'Invalid response: 404 Not Found'
      ) {
        return 'dir'
      } else {
        $error(i18n.t('errorGetCongMedia') as string)
        return null
      }
    }
  }
  inject('connect', connect)

  inject('updateContent', async () => {
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

  inject('forcePrefs', async (refresh: boolean = false) => {
    if (!refresh && store.state.cong.prefs) {
      return store.state.cong.prefs
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
          cong: Object.assign($getPrefs('cong') as CongPrefs, prefs.cong ?? {}),
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
    } catch (e) {
      $log.error(e)
      $error(i18n.t('errorForcedSettingsEnforce') as string)
    }
  })

  function getContentsTree() {
    if (store.state.cong.contentsTree.length > 0) {
      return store.state.cong.contentsTree
    } else {
      const tree: CongFile[] = []
      const root = $getPrefs('cong.dir')
      const contents = [...store.state.cong.contents] as FileStat[]
      const dirs = [
        ...contents.filter(({ type }) => type === 'directory'),
      ] as CongFile[]
      const files = [
        ...contents.filter(({ type }) => type === 'file'),
      ] as CongFile[]
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
      dirs
        .filter(({ filename }) => dirname(filename) === root)
        .forEach((dir) => {
          tree.push(dir)
        })
      store.commit('cong/setContentsTree', tree)
      return tree
    }
  }
  inject('getContentsTree', getContentsTree)

  inject('getCongMedia', (baseDate: Dayjs, now: Dayjs) => {
    store.commit('stats/startPerf', {
      func: 'getCongMedia',
      start: performance.now(),
    })
    const tree = getContentsTree() as CongFile[]
    const mediaFolder = tree.find(({ basename }) => basename === 'Media')
    const hiddenFolder = tree.find(({ basename }) => basename === 'Hidden')

    if (mediaFolder?.children) {
      for (const date of mediaFolder.children) {
        if (date.children) {
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
            const media = date.children.map((mediaFile) => {
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
            })
          }
        }
      }
    }
    if (hiddenFolder?.children) {
      const meetings = store.state.media.meetings as Map<
        string,
        Map<number, MeetingFile[]>
      >
      for (const date of hiddenFolder.children) {
        if (date.children) {
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
            for (const hiddenFile of date.children) {
              for (const [par, media] of mediaMap.entries()) {
                const result = media.find(
                  ({ safeName }) => safeName === hiddenFile.basename
                )
                if (result) {
                  store.commit('media/setHidden', {
                    date,
                    par,
                    mediaName: hiddenFile.basename,
                    hidden: true,
                  })
                  $log.info(
                    '%c[hiddenMedia] [' +
                      date.basename +
                      '] ' +
                      hiddenFile.basename,
                    'background-color: #fff3cd; color: #856404;'
                  )
                  break
                }
              }
            }
          }
        }
      }
    }
    store.commit('stats/stopPerf', {
      func: 'getCongMedia',
      stop: performance.now(),
    })
  })

  inject('syncCongMedia', async (baseDate: Dayjs, setProgress: Function) => {
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

    let progress = 0
    for (const [date, parts] of meetings.entries()) {
      for (const [, media] of parts.entries()) {
        for (const item of media) {
          if (!item.hidden && !item.isLocal) {
            if (item.filesize) {
              $log.info(
                `%c[congMedia] [${date}] ${item.safeName}`,
                'background-color: #d1ecf1; color: #0c5460'
              )
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
                  /* client
                    .createReadStream(item.url as string)
                    .pipe(
                      createWriteStream(
                        join(
                          $mediaPath(),
                          item.folder as string,
                          item.safeName as string
                        )
                      )
                    ) */
                  const perf: any = {
                    start: performance.now(),
                    bytes: item.filesize,
                    name: item.safeName,
                  }
                  const file = (await client.getFileContents(
                    item.url as string,
                    {
                      onDownloadProgress: (progress) => {
                        setProgress(progress.loaded, progress.total)
                      },
                    }
                  )) as ArrayBuffer
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
              $warn(i18n.t('warnFileNotAvailable') as string)
              $log.warn(
                [
                  item.queryInfo?.KeySymbol,
                  item.queryInfo?.Track,
                  item.queryInfo?.IssueTagNumber,
                ]
                  .filter(Boolean)
                  .join('_')
              )
            }
          }
          progress++
          setProgress(progress, total, true)
        }
      }
    }
    store.commit('stats/stopPerf', {
      func: 'syncCongMedia',
      stop: performance.now(),
    })
  })
}
