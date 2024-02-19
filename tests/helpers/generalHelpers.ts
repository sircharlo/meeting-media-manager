/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-named-as-default-member */
import dayjs from 'dayjs'
import { basename, extname, join } from 'upath'
import updateLocale from 'dayjs/plugin/updateLocale'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import prefs from './../mocks/prefs/prefsOld.json'
import { MAX_BYTES_IN_FILENAME } from './../../src/renderer/constants/general'
const { DAYJS_LOCALES, LOCALES } =
  require('./../../src/renderer/constants/lang') as {
    LOCALES: { code: string; dayjs?: string }[]
    DAYJS_LOCALES: string[]
  }

dayjs.extend(updateLocale)
dayjs.extend(isSameOrBefore)
DAYJS_LOCALES.forEach((l) => {
  require(`dayjs/locale/${l}`)
  dayjs.updateLocale(l, { weekStart: 1 })
})

const locale =
  LOCALES.find((l) => l.code === prefs.localAppLang)?.dayjs ??
  prefs.localAppLang
dayjs.locale(locale)

export function getDate(type = 'now'): string {
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

export function mwDayPresent(): boolean {
  return (
    dayjs().day() ===
    dayjs().startOf('week').add(parseInt(prefs.mwDay), 'days').day()
  )
}

export function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

export function strip(value: string, type = 'file') {
  switch (type) {
    case 'id':
      return value.replace(/[^a-zA-Z0-9\-:_]/g, '')
    case 'file':
      return (
        value
          // Common separators
          .replace(/ *[—?;:|.!?] */gu, ' - ')
          // Breaking space
          .replace(/\u00A0/gu, ' ')
          // Illegal filename characters
          .replace(
            // eslint-disable-next-line no-control-regex
            /['"»“”‘’«(){}№+[\]$<>,/\\:*\x00-\x1F\x80-\x9F\u0000-\u001F]/gu,
            ''
          )
          .trim()
          .replace(/[ -]+$/g, '')
      )
    case 'html':
      return value.substring(0, value.indexOf('<em>'))
    default:
      throw new Error('Invalid type: ' + type)
  }
}

export function sanitize(name: string, mediaPath?: string, isFile = false) {
  const ext = isFile ? extname(name).toLowerCase() : ''

  // Remove special characters from filename
  name = strip(basename(name, ext), 'file') + ext

  if (isFile && mediaPath) {
    // Cutoff filename if path is longer than 245 characters
    const maxCharactersInPath = 245
    const projectedPathCharLength = join(
      mediaPath,
      '9999-99-99 - AAAAAAAAAA AAAAAAAAAA',
      name
    ).length
    if (projectedPathCharLength > maxCharactersInPath) {
      name =
        basename(name, ext)
          .slice(0, -(projectedPathCharLength - maxCharactersInPath))
          .trim() + ext
    }

    // Cutoff filename until path is smaller than 200 bytes
    let currentBytes = Buffer.byteLength(name, 'utf8')
    while (currentBytes > MAX_BYTES_IN_FILENAME) {
      name = basename(name, ext).slice(0, -1).trim() + ext
      currentBytes = Buffer.byteLength(name, 'utf8')
    }
  }

  return name
}
