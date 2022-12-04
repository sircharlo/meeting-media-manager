import { existsSync, readFileSync } from 'fs'
import { join } from 'upath'
import { Plugin } from '@nuxt/types'
import { ipcRenderer } from 'electron'
import { Filter, JWLang, ShortJWLang } from '~/types'

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

    if (forceReload || !existsSync(langPath) || !recentlyUpdated) {
      try {
        const result = await ipcRenderer.invoke('getFromJWOrg', {
          url: 'https://www.jw.org/en/languages',
        })

        if (result.languages) {
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
        } else {
          $log.error(result)
        }
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

    const mediaLang = $getPrefs('media.lang') as string
    const fallbackLang = $getPrefs('media.fallbackLang') as string
    const langPrefInLangs = langs.find((lang) => lang.langcode === mediaLang)
    const fallbackLangObj = langs.find((lang) => lang.langcode === fallbackLang)

    // Check current lang if it hasn't been checked yet
    if (
      mediaLang &&
      langPrefInLangs &&
      (langPrefInLangs.mwbAvailable === undefined ||
        langPrefInLangs.mwbAvailable === undefined)
    ) {
      const availability = await getPubAvailability(mediaLang)
      langPrefInLangs.wAvailable = availability.w
      langPrefInLangs.mwbAvailable = availability.mwb
    }

    if (
      fallbackLang &&
      fallbackLangObj &&
      (fallbackLangObj.mwbAvailable === undefined ||
        fallbackLangObj.mwbAvailable === undefined)
    ) {
      const availability = await getPubAvailability(fallbackLang)
      fallbackLangObj.wAvailable = availability.w
      fallbackLangObj.mwbAvailable = availability.mwb
    }

    store.commit('media/setMediaLang', langPrefInLangs ?? null)
    store.commit('media/setFallbackLang', fallbackLangObj ?? null)
    store.commit(
      'media/setSongPub',
      langPrefInLangs?.isSignLanguage ? 'sjj' : 'sjjm'
    )

    $write(langPath, JSON.stringify(langs, null, 2))

    return langs
  })

  async function getPubAvailability(
    lang: string,
    refresh = false
  ): Promise<{ lang: string; w?: boolean; mwb?: boolean }> {
    let mwb
    let w

    $log.debug(`Checking availability of ${lang}`)

    const url = (cat: string, filter: string, lang: string) =>
      `https://www.jw.org/en/library/${cat}/json/filters/${filter}/?contentLanguageFilter=${lang}`

    try {
      const langPath = join($appPath(), 'langs.json')
      const langs = JSON.parse(
        readFileSync(langPath, 'utf8') ?? '[]'
      ) as ShortJWLang[]

      const langObject = langs.find((l) => l.langcode === lang)
      if (!langObject) return { lang, w, mwb }
      if (
        !refresh &&
        langObject.mwbAvailable !== undefined &&
        langObject.wAvailable !== undefined
      ) {
        return { lang, w: langObject.wAvailable, mwb: langObject.mwbAvailable }
      }

      const wAvailabilityEndpoint = url(
        'magazines',
        'MagazineViewsFilter',
        langObject.symbol
      )
      const mwbAvailabilityEndpoint = url(
        'jw-meeting-workbook',
        'IssueYearViewsFilter',
        langObject.symbol
      )

      const result = await Promise.allSettled([
        ipcRenderer.invoke('getFromJWOrg', {
          url: mwbAvailabilityEndpoint,
        }) as Promise<Filter>,
        ipcRenderer.invoke('getFromJWOrg', {
          url: wAvailabilityEndpoint,
        }) as Promise<Filter>,
      ])

      const mwbResult = result[0]
      const wResult = result[1]

      if (mwbResult.status === 'fulfilled') {
        if (mwbResult.value.choices) {
          mwb = !!mwbResult.value.choices.find(
            (c) => c.optionValue === new Date().getFullYear()
          )
        } else {
          $log.error(mwbResult.value)
        }
      }
      if (wResult.status === 'fulfilled') {
        if (wResult.value.choices) {
          w = !!wResult.value.choices.find((c) => c.optionValue === 'w')
        } else {
          $log.error(wResult.value)
        }
      }

      langObject.mwbAvailable = mwb
      langObject.wAvailable = w
      $write(langPath, JSON.stringify(langs, null, 2))
    } catch (e: unknown) {
      $log.error(e)
    }

    return { lang, mwb, w }
  }

  inject('getPubAvailability', getPubAvailability)

  // Get yeartext from WT online library
  async function getYearText(
    force = false,
    lang?: string
  ): Promise<string | null> {
    let yeartext = null
    const ytPath = $ytPath(lang)
    const wtlocale = lang ?? ($getPrefs('media.lang') as string | null) ?? 'E'
    if (force || !existsSync(ytPath)) {
      $log.debug('Fetching yeartext', wtlocale)
      try {
        const result = await ipcRenderer.invoke('getFromJWOrg', {
          url: 'https://wol.jw.org/wol/finder',
          params: {
            docid: `110${new Date().getFullYear()}800`,
            wtlocale,
            format: 'json',
            snip: 'yes',
          },
        })
        if (result.content) {
          yeartext = JSON.parse(JSON.stringify(result.content)) as string
          $write(ytPath, yeartext)
        } else if (
          wtlocale !== 'E' &&
          result.message === 'Request failed with status code 404'
        ) {
          $log.warn(`Yeartext not found for ${wtlocale}`)
          return await getYearText(force, 'E')
        } else {
          $log.error(result)
        }
      } catch (e: any) {
        if (
          wtlocale !== 'E' &&
          e.message === 'Request failed with status code 404'
        ) {
          $log.warn(`Yeartext not found for ${wtlocale}`)
          return await getYearText(force, 'E')
        } else {
          $log.error(e)
        }
      }
    } else {
      try {
        yeartext = readFileSync(ytPath, 'utf8')
      } catch (e: unknown) {
        $warn('errorOffline')
      }
    }
    return yeartext
  }
  inject('getYearText', getYearText)
}

export default plugin
