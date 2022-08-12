import { WebDAVClient, createClient, FileStat } from 'webdav/web'
/* eslint-disable import/named */
import { Context } from '@nuxt/types'
import { dirname, join } from 'upath'
import { Dayjs } from 'dayjs'
import { CongFile } from '~/types'

export default function (
  {
    store,
    $log,
    $dayjs,
    $migrate2280,
    $getPrefs,
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

  inject('forcePrefs', async () => {
    try {
      const client = store.state.cong.client as WebDAVClient
      const path = join($getPrefs('cong.dir'), 'forcedPrefs.json')
      if (await client.exists(path)) {
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

          const newProp = $migrate2280(key, prefs[key])
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
          $getPrefs('app.obs') as any,
          prefs.app.obs ?? {}
        )
        const newPrefs = {
          app: Object.assign($getPrefs('app') as any, prefs.app ?? {}),
          cong: Object.assign($getPrefs('cong') as any, prefs.cong ?? {}),
          media: Object.assign($getPrefs('media') as any, prefs.media ?? {}),
          meeting: Object.assign(
            $getPrefs('meeting') as any,
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
    const tree = getContentsTree() as CongFile[]
    const mediaFolder = tree.find(({ filename }) => filename === 'Media')
    // const hiddenFolder = tree.find(({ filename }) => filename === 'Hidden')
    let recurringMedia: any[] = []

    if (mediaFolder?.children) {
      const recurring = mediaFolder.children.find(
        ({ basename }) => basename === 'Recurring'
      )
      if (recurring?.children) {
        recurringMedia = recurring.children.map((file) => {
          return {
            safeName: file.basename,
            congSpecific: true,
            filesize: file.size,
            recurring: true,
          }
        })
      }
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
              media: isRecurring
                ? media
                : media.concat(
                    recurringMedia.map((media) => {
                      return { ...media, folder: date.basename }
                    })
                  ),
            })
          }
        }
      }
    }
    // TODO: add hidden to media
    /* if (hiddenFolder.children) {
      for (const )
    } */
  })

  inject('syncCongMedia', async () => {})
}
