import { Context } from '@nuxt/types'
// eslint-disable-next-line import/named
import { NuxtAxiosInstance } from '@nuxtjs/axios'

export default function (
  { $axios, $config }: Context,
  inject: (arg0: string, arg1: any) => void
) {
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

  const ghApi = $axios.create({
    baseURL: `https://api.github.com/repos/${$config.author}/${$config.name}/`,
  })

  inject('ghApi', ghApi)
}
