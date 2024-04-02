import { MutationTree, ActionTree, GetterTree } from 'vuex'
import dayjs, { Dayjs } from 'dayjs'
import { MediaStore, MeetingFile, ShortJWLang } from '~/types'

const defaultState: MediaStore = {
  songPub: 'sjjm', // The song publication (sjj for sign language)
  nrOfSongs: 158, // The number of songs in the song publication
  ffMpeg: false, // Whether FFmpeg has been initialized
  musicFadeOut: '', // The fade out time for shuffle music
  mediaLang: null, // The media language object
  fallbackLang: null, // The fallback language object
  meetings: new Map(), // A map of meetings and their media
  progress: new Map(), // A map with downloadIfRequired() calls. If a file is already downloading, it will be returned from the map
}

export const state = () => Object.assign({}, defaultState)

export const mutations: MutationTree<MediaStore> = {
  setSongPub(state, pub: string) {
    state.songPub = pub
  },
  setNrOfSongs(state, nr: number) {
    state.nrOfSongs = nr
  },
  setMediaLang(state, lang: ShortJWLang | null) {
    state.mediaLang = lang
  },
  setFallbackLang(state, lang: ShortJWLang | null) {
    state.fallbackLang = lang
  },
  setProgress(
    state,
    { key, promise }: { key: string; promise: Promise<string> }
  ) {
    state.progress.set(key, promise)
  },
  setFFmpeg(state, ffMpeg: boolean) {
    state.ffMpeg = ffMpeg
  },
  setMusicFadeOut(state, musicFadeOut: Dayjs | string) {
    state.musicFadeOut = musicFadeOut
  },
  setHidden(
    state,
    {
      date,
      par,
      mediaName,
      hidden,
    }: { date: string; par: number; mediaName: string; hidden: boolean }
  ) {
    const media = state.meetings.get(date)?.get(par)
    if (media) {
      const newMedia = [...media]
      const index = newMedia.findIndex(({ safeName }) => safeName === mediaName)
      if (index !== -1) {
        newMedia[index].hidden = hidden
        state.meetings.get(date)?.set(par, newMedia)
        state.meetings = new Map(state.meetings)
      }
    }
  },
  set(
    state,
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
    state,
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
    state,
    { date, map }: { date: string; map: Map<number, MeetingFile[]> }
  ) {
    state.meetings.set(date, map)
  },
  deleteDate(state, date: string) {
    state.meetings.delete(date)
  },
  clear(state) {
    state.meetings = new Map()
    state.progress = new Map()
  },
  clearProgress(state) {
    state.progress = new Map()
  },
}

export const actions: ActionTree<MediaStore, MediaStore> = {
  get({ state }, { date, par }: { date: string; par: number }) {
    const dateMap = state.meetings.get(date)
    const media = dateMap?.get(par)
    if (media) return media
    return []
  },
  updateDateFormat(
    { state, commit },
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

export const getters: GetterTree<MediaStore, MediaStore> = {
  songPub: (state) => state.songPub,
  meetings: (state) => state.meetings,
}
