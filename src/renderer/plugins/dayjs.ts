import { Plugin } from '@nuxt/types'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DAYJS_LOCALES } = require('~/constants/lang') as {
  DAYJS_LOCALES: string[]
}

const originalStarts = DAYJS_LOCALES.map((l) => {
  return { lang: l, start: 1 }
})

const plugin: Plugin = ({ $dayjs }, inject) => {
  // Always start the week on Monday
  DAYJS_LOCALES.forEach((l) => {
    const original = originalStarts.find((o) => o.lang === l)
    if (original) {
      original.start = $dayjs().locale(l).localeData().firstDayOfWeek()
    }
    $dayjs.updateLocale(l, { weekStart: 1 })
  })

  inject('getFirstDayOfWeek', (lang: string) => {
    const original = originalStarts.find((o) => o.lang === lang)
    if (original) {
      return original.start
    }
    return 1
  })
}

export default plugin
