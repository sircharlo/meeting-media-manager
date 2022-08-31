import { Plugin } from '@nuxt/types'
// eslint-disable-next-line import/named
import { NuxtAxiosInstance } from '@nuxtjs/axios'

const plugin: Plugin = ({ $axios, $config }, inject) => {
  // Get media links from publication
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

  // Get media item
  const mediaItems = $axios.create({
    baseURL: 'https://b.jw-cdn.org/apis/mediator/v1/media-items/',
  }) as NuxtAxiosInstance
  inject('mediaItems', mediaItems)

  // Get GitHub information
  const ghApi = $axios.create({
    baseURL: `https://api.github.com/repos/${$config.author}/${$config.name}/`,
  })

  inject('ghApi', ghApi)
}

export default plugin
