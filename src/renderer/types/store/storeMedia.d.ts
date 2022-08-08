import { Dayjs } from 'dayjs'
import { SmallMediaFile, MultiMediaImage } from '~/types'

export interface MediaStore {
  songPub: string
  ffMpeg: boolean
  musicFadeOut: Dayjs | string
  meetings: Map<string, Map<number, (SmallMediaFile | MultiMediaImage)[]>>
}
