/* eslint-disable @typescript-eslint/no-unused-vars */
import { Context } from '@nuxt/types'

const { LOCAL_LANGS } = require('~/constants/lang') as { LOCAL_LANGS: string[] }

export default function ({ $dayjs }: Context) {
  // Always start the week on Monday
  LOCAL_LANGS.forEach((l) => {
    $dayjs.updateLocale(l, { weekStart: 1 })
  })
}
