import { WebDAVClient, createClient, FileStat } from 'webdav/web'
/* eslint-disable import/named */
import { Context } from '@nuxt/types'
import { join } from 'upath'

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
}
