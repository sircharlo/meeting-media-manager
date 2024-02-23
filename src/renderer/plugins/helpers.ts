import { Plugin } from '@nuxt/types'
import { Dayjs } from 'dayjs'
import { LocaleObject } from '@nuxtjs/i18n'
import cloneDeep from 'lodash.clonedeep'
import { MS_IN_SEC } from './../constants/general'

const plugin: Plugin = ({ $getPrefs, $dayjs, i18n }, inject) => {
  // Clone an object, so that the two objects are not linked
  inject('clone', (value: unknown) => {
    return cloneDeep(value)
  })

  // Strip a string to make it compatible with the desired format
  inject('strip', (value: string, type = 'id'): string => {
    if (!value) return ''
    switch (type) {
      case 'id':
        return value.replace(/[^a-zA-Z0-9\-:_]/g, '')
      case 'file':
        return (
          value
            // Common separators
            .replace(/ *[—?;:|.!] */gu, ' - ')
            // Breaking space
            .replace(/\u00A0\t/gu, ' ')
            // Illegal filename characters
            .replace(
              // eslint-disable-next-line no-control-regex
              /['"»“”‘’«(){}№+[\]$<>,/\\:*\x00-\x1F\x80-\x9F\u0000-\u001F]/gu,
              ''
            )
            .trim()
            .replace(/[ -]+$/g, '')
        )
      default:
        throw new Error('Invalid type: ' + type)
    }
  })

  function isCoWeek(baseDate: Dayjs = $dayjs().startOf('week')) {
    const coWeek = $getPrefs('meeting.coWeek') as string
    return (
      coWeek &&
      $dayjs(coWeek, 'YYYY-MM-DD').isBetween(
        baseDate,
        baseDate.add(6, 'days'),
        null,
        '[]'
      )
    )
  }
  inject('isCoWeek', isCoWeek)

  function isMeetingDay(date?: Dayjs) {
    const dateToCheck = date ?? $dayjs()
    if (!dateToCheck.isValid() || $getPrefs('meeting.specialCong')) return false
    const mwDay = getMwDay(dateToCheck.startOf('week'))
    const weDay = $getPrefs('meeting.weDay') as number
    const day = dateToCheck.day() === 0 ? 6 : dateToCheck.day() - 1 // Day is 0 indexed and starts with Sunday
    if (day === mwDay) return 'mw'
    if (day === weDay) return 'we'
    return ''
  }
  inject('isMeetingDay', isMeetingDay)

  function getMwDay(baseDate: Dayjs = $dayjs().startOf('week')) {
    if (isCoWeek(baseDate)) {
      return 1 // return Tuesday
    }
    return $getPrefs('meeting.mwDay') as number // return original meeting day
  }
  inject('getMwDay', getMwDay)

  const intervals: { [key: string]: NodeJS.Timer } = {}

  inject(
    'executeBeforeMeeting',
    (name: string, mins: number, action: () => void) => {
      if (!intervals[name]) {
        const day = isMeetingDay()
        if (!day) return
        const startTime = $getPrefs(`meeting.${day}StartTime`) as string
        const meetingStarts = startTime?.split(':') ?? ['0', '0']
        const timeToStop = $dayjs()
          .hour(+meetingStarts[0])
          .minute(+meetingStarts[1])
          .second(0)
          .millisecond(0)
          .subtract(mins, 'm')
        intervals[name] = setInterval(() => {
          const timeLeft = $dayjs
            .duration(timeToStop.diff($dayjs()), 'ms')
            .asSeconds()
          if (timeLeft.toFixed(0) === '0' || timeLeft.toFixed(0) === '-0') {
            action()
            clearInterval(intervals[name] as NodeJS.Timeout)
          } else if (timeLeft < 0) {
            clearInterval(intervals[name] as NodeJS.Timeout)
          }
        }, MS_IN_SEC) as NodeJS.Timeout
      }
    }
  )

  // Translate something in another language than the current one
  inject('translate', (word: string, fallback?: string) => {
    const mediaLang = $getPrefs('media.lang') as string
    const langs = i18n.locales as LocaleObject[]
    const locale =
      langs.find((l) => l.jw === mediaLang)?.code ?? fallback ?? i18n.locale

    return i18n.t(word, locale) as string
  })
}

export default plugin
