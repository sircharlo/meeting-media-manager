import { Context } from '@nuxt/types'
// eslint-disable-next-line import/named
import { NuxtAxiosInstance } from '@nuxtjs/axios'

export default function (
  { $axios, $log }: Context,
  inject: (arg0: string, arg1: any) => void
) {
  $axios.onError((err: unknown) => {
    $log.error(err)
    return Promise.reject(err)
  })

  const pubMedia = $axios.create({
    baseURL: 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS',
  }) as NuxtAxiosInstance

  pubMedia.onRequest((config) => {
    config.params = {
      ...config.params,
      output: 'json',
    }
  })
  inject('pubMedia', pubMedia)

  const mediaItems = $axios.create({
    baseURL: 'https://b.jw-cdn.org/apis/mediator/v1/media-items/',
  }) as NuxtAxiosInstance
  inject('mediaItems', mediaItems)

  const yeartext = $axios.create({
    baseURL: 'https://wol.jw.org/wol/finder',
  }) as NuxtAxiosInstance

  yeartext.onRequest((config) => {
    config.params = {
      ...config.params,
      docid: '1102022800',
      format: 'json',
      snip: 'yes',
    }
  })
  inject('ytApi', yeartext)
}
