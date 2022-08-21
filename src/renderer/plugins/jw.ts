/* eslint-disable import/named */
import { join } from 'upath'
import { Context } from '@nuxt/types'
import { ipcRenderer } from 'electron'
import { existsSync, readFileSync } from 'fs-extra'
import { JWLang, ShortJWLang } from '~/types'

export default function (
  {
    $appPath,
    $write,
    $getPrefs,
    $ytPath,
    $log,
    $setPrefs,
    $dayjs,
    store,
  }: Context,
  inject: (argument0: string, argument1: unknown) => void
) {
  inject('getJWLangs', async (forceReload: boolean = false) => {
    const langPath = join($appPath(), 'langs.json')
    const lastUpdate = $getPrefs('media.langUpdatedLast') as string
    const recentlyUpdated =
      !!lastUpdate || $dayjs(lastUpdate).isAfter($dayjs().subtract(3, 'months'))

    if (forceReload || !existsSync(langPath) || !recentlyUpdated) {
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
      } catch (e: any) {
        $log.error(e)
      }
    }

    const langs = JSON.parse(
      readFileSync(langPath, 'utf8') ?? '[]'
    ) as ShortJWLang[]
    const langPrefInLangs = langs.find(
      (lang) => lang.langcode === $getPrefs('media.lang')
    )

    store.commit(
      'media/setSongPub',
      langPrefInLangs?.isSignLanguage ? 'sjj' : 'sjjm'
    )

    return langs
  })
  inject('getYearText', async (force: boolean = false) => {
    let yeartext = null
    if (force || !existsSync($ytPath())) {
      try {
        const result = await ipcRenderer.invoke('getFromJWOrg', {
          url: 'https://wol.jw.org/wol/finder',
          params: {
            docid: '1102022800',
            wtlocale: $getPrefs('media.lang'),
            format: 'json',
            snip: 'yes',
          },
        })
        if (result.content) {
          yeartext = JSON.parse(JSON.stringify(result.content))
          $write($ytPath(), yeartext)
        }
      } catch (e: any) {
        $log.error(e)
      }
    } else {
      yeartext = readFileSync($ytPath(), 'utf8')
    }
    return yeartext
  })
  inject('getLocalJWLangs', () => {
    try {
      const langs = JSON.parse(
        readFileSync(join($appPath(), 'langs.json'), 'utf8') ?? '[]'
      ) as ShortJWLang[]
      const langPrefInLangs = langs.find(
        (lang) => lang.langcode === $getPrefs('media.lang')
      )

      store.commit(
        'media/setSongPub',
        langPrefInLangs?.isSignLanguage ? 'sjj' : 'sjjm'
      )
      return langs
    } catch (e: any) {
      return []
    }
  })
}
