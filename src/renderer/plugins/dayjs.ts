import { Plugin } from '@nuxt/types'

const { LANGS_WITH_DAYJS_LOCALE } = require('~/constants/lang') as {
  LANGS_WITH_DAYJS_LOCALE: string[]
}

const plugin: Plugin = ({ $dayjs }) => {
  // Always start the week on Monday
  LANGS_WITH_DAYJS_LOCALE.forEach((l) => {
    $dayjs.updateLocale(l, { weekStart: 1 })
  })
}

export default plugin
