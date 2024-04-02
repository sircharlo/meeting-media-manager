import { Dayjs } from 'dayjs'
import { MeetingFile, ShortJWLang } from '~/types'

export interface MediaStore {
  songPub: string
  nrOfSongs: number
  ffMpeg: boolean
  mediaLang: ShortJWLang | null
  fallbackLang: ShortJWLang | null
  musicFadeOut: Dayjs | string
  meetings: Map<string, Map<number, MeetingFile[]>>
  progress: Map<string, Promise<string>>
}
