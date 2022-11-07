import { join } from 'upath'
import { Plugin } from '@nuxt/types'
import { ipcRenderer } from 'electron'
// eslint-disable-next-line import/named
import { existsSync, readFileSync } from 'fs-extra'
import { JWLang, ShortJWLang } from '~/types'

const plugin: Plugin = (
  {
    $appPath,
    $write,
    $getPrefs,
    $ytPath,
    $log,
    $warn,
    $setPrefs,
    $dayjs,
    store,
  },
  inject
) => {
  inject('getJWLangs', async (forceReload = false): Promise<ShortJWLang[]> => {
    const langPath = join($appPath(), 'langs.json')
    const lastUpdate = $getPrefs('media.langUpdatedLast') as string
    const recentlyUpdated =
      lastUpdate && $dayjs(lastUpdate).isAfter($dayjs().subtract(3, 'months'))

    if (
      store.state.stats.online &&
      (forceReload || !existsSync(langPath) || !recentlyUpdated)
    ) {
      try {
        const result = await ipcRenderer.invoke('getFromJWOrg', {
          url: 'https://www.jw.org/en/languages',
        })
        const langs = (result.languages as JWLang[])
          .filter((lang) => lang.hasWebContent)
          .map((lang) => {
            return {
              name: lang.name,
              langcode: lang.langcode,
              symbol: lang.symbol,
              vernacularName: lang.vernacularName,
              isSignLanguage: lang.isSignLanguage,
            } as ShortJWLang
          })
        $write(langPath, JSON.stringify(langs, null, 2))
        $setPrefs('media.langUpdatedLast', $dayjs().toISOString())
      } catch (e: unknown) {
        if (!store.state.stats.online) {
          $warn('errorOffline')
        } else {
          $log.error(e)
        }
      }
    }

    let langs: ShortJWLang[] = []

    try {
      langs = JSON.parse(
        readFileSync(langPath, 'utf8') ?? '[]'
      ) as ShortJWLang[]
    } catch (e: unknown) {
      $log.error(e)
    }

    const langPrefInLangs = langs.find(
      (lang) => lang.langcode === $getPrefs('media.lang')
    )

    store.commit('media/setMediaLang', langPrefInLangs ?? null)
    store.commit(
      'media/setSongPub',
      langPrefInLangs?.isSignLanguage ? 'sjj' : 'sjjm'
    )

    return langs
  })

  // Get yeartext from WT online library
  inject('getYearText', async (force = false): Promise<string | null> => {
    let yeartext = null
    if (store.state.stats.online && (force || !existsSync($ytPath()))) {
      try {
        const result = await ipcRenderer.invoke('getFromJWOrg', {
          url: 'https://wol.jw.org/wol/finder',
          params: {
            docid: `110${new Date().getFullYear()}800`,
            wtlocale: $getPrefs('media.lang') ?? 'E',
            format: 'json',
            snip: 'yes',
          },
        })
        if (result.content) {
          yeartext = JSON.parse(JSON.stringify(result.content)) as string
          $write($ytPath(), yeartext)
        }
      } catch (e: unknown) {
        $log.error(e)
      }
    } else {
      try {
        yeartext = readFileSync($ytPath(), 'utf8')
      } catch (e: unknown) {
        $warn('errorOffline')
      }
    }
    return yeartext
  })
}

export default plugin
