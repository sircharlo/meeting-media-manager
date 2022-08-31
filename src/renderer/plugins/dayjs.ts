import { Plugin } from '@nuxt/types'

const { LOCAL_LANGS } = require('~/constants/lang') as { LOCAL_LANGS: string[] }

const plugin: Plugin = ({ $dayjs }) => {
  // Always start the week on Monday
  LOCAL_LANGS.forEach((l) => {
    $dayjs.updateLocale(l, { weekStart: 1 })
  })
}

export default plugin
