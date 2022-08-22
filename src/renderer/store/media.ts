import { ActionContext } from 'vuex'
import dayjs, { Dayjs } from 'dayjs'
import { MediaStore, MeetingFile } from '~/types'

const defaultState: MediaStore = {
  songPub: 'sjjm',
  ffMpeg: false,
  musicFadeOut: '',
  meetings: new Map(),
}

export const state = () => Object.assign({}, defaultState)

export const mutations = {
  setSongPub(state: MediaStore, pub: string) {
    state.songPub = pub
  },
  setFFmpeg(state: MediaStore, ffMpeg: boolean) {
    state.ffMpeg = ffMpeg
  },
  setMusicFadeOut(state: MediaStore, musicFadeOut: Dayjs | string) {
    state.musicFadeOut = musicFadeOut
  },
  setHidden(
    state: MediaStore,
    {
      date,
      par,
      mediaName,
      hidden,
    }: { date: string; par: number; mediaName: string; hidden: boolean }
  ) {
    console.log('try to hide', { date, par, mediaName, hidden })
    const media = state.meetings.get(date)?.get(par)
    console.log('media', media)
    if (media) {
      const newMedia = [...media]
      const index = newMedia.findIndex(({ safeName }) => safeName === mediaName)
      console.log(index)
      if (index !== -1) {
        console.log('hide')
        newMedia[index].hidden = hidden
        state.meetings.get(date)?.set(par, newMedia)
        state.meetings = new Map(state.meetings)
      }
    }
  },
  set(
    state: MediaStore,
    {
      date,
      par,
      media,
    }: {
      date: string
      par: number
      media: MeetingFile
    }
  ) {
    let dateMap = state.meetings.get(date)
    if (!dateMap) {
      state.meetings.set(date, new Map())
      dateMap = state.meetings.get(date) as Map<number, MeetingFile[]>
    }
    let mediaList = dateMap.get(par)
    if (!mediaList) dateMap.set(par, [])
    mediaList = dateMap.get(par) as MeetingFile[]
    mediaList.push(media)
    const parMap = new Map(dateMap.set(par, mediaList))
    state.meetings = new Map(state.meetings.set(date, parMap))
  },
  setMultiple(
    state: MediaStore,
    {
      date,
      par,
      media,
      overwrite,
    }: {
      date: string
      par: number
      media: MeetingFile[]
      overwrite?: boolean
    }
  ) {
    let dateMap = state.meetings.get(date)
    if (!dateMap) {
      state.meetings.set(date, new Map())
      dateMap = state.meetings.get(date) as Map<number, MeetingFile[]>
    }
    let mediaList = dateMap.get(par)
    if (!mediaList) dateMap.set(par, [])
    mediaList = dateMap.get(par) as MeetingFile[]
    if (overwrite) {
      mediaList = [...media]
    } else {
      mediaList = mediaList.concat(media)
    }
    const parMap = new Map(dateMap.set(par, mediaList))
    state.meetings = new Map(state.meetings.set(date, parMap))
  },
  addDate(
    state: MediaStore,
    { date, map }: { date: string; map: Map<number, MeetingFile[]> }
  ) {
    state.meetings.set(date, map)
  },
  deleteDate(state: MediaStore, date: string) {
    state.meetings.delete(date)
  },
  clear(state: MediaStore) {
    state.meetings = new Map()
  },
}

export const actions = {
  get(
    { state }: ActionContext<MediaStore, MediaStore>,
    { date, par }: { date: string; par: number }
  ) {
    const dateMap = state.meetings.get(date)
    const media = dateMap?.get(par)
    if (media) return media
    return []
  },
  updateDateFormat(
    { state, commit }: ActionContext<MediaStore, MediaStore>,
    {
      locale,
      oldFormat,
      newFormat,
    }: { locale: string; oldFormat: string; newFormat: string }
  ) {
    const dates = state.meetings.keys()
    for (const date of dates) {
      const day = dayjs(date, oldFormat, locale)
      if (day.isValid()) {
        const newDate = day.locale(locale).format(newFormat)
        if (newDate !== date) {
          commit('addDate', {
            date: newDate,
            map: state.meetings.get(date),
          })
          commit('deleteDate', date)
        }
      }
    }
  },
}

export const getters = {
  songPub: (state: MediaStore) => state.songPub,
  meetings: (state: MediaStore) => state.meetings,
}
