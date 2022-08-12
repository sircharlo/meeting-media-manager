import { Dayjs } from 'dayjs'
import { MeetingFile } from '~/types'

export interface MediaStore {
  songPub: string
  ffMpeg: boolean
  musicFadeOut: Dayjs | string
  meetings: Map<string, Map<number, MeetingFile[]>>
}
