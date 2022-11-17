import { Plugin } from '@nuxt/types'

// eslint-disable-next-line @typescript-eslint/no-var-requires
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
