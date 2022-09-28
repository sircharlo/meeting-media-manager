import { Plugin } from '@nuxt/types'
import { LocaleObject } from '@nuxtjs/i18n'
import cloneDeep from 'lodash.clonedeep'

const plugin: Plugin = ({ $getPrefs, i18n }, inject) => {
  inject('clone', (value: any) => {
    return cloneDeep(value)
  })
  inject('strip', (value: string, type: string = 'id'): string => {
    if (!value) return ''
    switch (type) {
      case 'id':
        return value.replace(/[^a-zA-Z0-9\-:_]/g, '')
      case 'file':
        return (
          value
            // Common seperators
            .replace(/ *[—?;:|.!?] */g, ' - ')
            // Breaking space
            .replace(/\u00A0\t/g, ' ')
            // Illegal filename characters
            .replace(
              // eslint-disable-next-line no-control-regex
              /["»“”‘’«(){}№+[\]$<>,/\\:*\x00-\x1F\x80-\x9F\u0000-\u001F]/g,
              ''
            )
            .trim()
            .replace(/[ -]+$/g, '')
        )
      default:
        throw new Error('Invalid type: ' + type)
    }
  })

  inject('translate', (word: string, fallback?: string) => {
    const mediaLang = $getPrefs('media.lang') as string
    const langs = i18n.locales as LocaleObject[]
    const locale =
      langs.find((l) => l.jw === mediaLang)?.code ?? fallback ?? i18n.locale

    return i18n.t(word, locale) as string
  })
}

export default plugin
