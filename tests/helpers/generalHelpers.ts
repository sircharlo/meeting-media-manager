/* eslint-disable import/no-named-as-default-member */
import dayjs from 'dayjs'
import updateLocale from 'dayjs/plugin/updateLocale'
import prefs from './../mocks/prefs/prefsOld.json'
const { LOCAL_LANGS } = require('./../../src/renderer/constants/lang') as {
  LOCAL_LANGS: string[]
}

dayjs.extend(updateLocale)
LOCAL_LANGS.forEach((l) => {
  require(`dayjs/locale/${l}`)
  dayjs.updateLocale(l, { weekStart: 1 })
})

const locale = prefs.localAppLang.split('-')[0]
dayjs.locale(locale)

export function getDate(type: string = 'now'): string {
  switch (type) {
    case 'now':
      return dayjs().format(prefs.outputFolderDateFormat)
    case 'mw':
    case 'we':
      return dayjs()
        .startOf('week')
        .add(parseInt(prefs[`${type}Day`]), 'days')
        .format(prefs.outputFolderDateFormat)
    default:
      throw new Error('invalid type: ' + type)
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}
