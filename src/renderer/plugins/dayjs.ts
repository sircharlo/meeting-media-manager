import { Plugin } from '@nuxt/types'

const { DAYJS_LOCALES } = require('~/constants/lang') as {
  DAYJS_LOCALES: string[]
}

const plugin: Plugin = ({ $dayjs }) => {
  // Always start the week on Monday
  DAYJS_LOCALES.forEach((l) => {
    $dayjs.updateLocale(l, { weekStart: 1 })
  })
}

export default plugin
